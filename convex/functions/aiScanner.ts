import { action, internalMutation, internalQuery } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'
import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { scanResultSchema, SYSTEM_PROMPT } from '../lib/aiSchemas'
import { normalizeSellingPrice } from '../lib/pricing'

/** Normalize a name for dedup: lowercase, collapse whitespace, & ↔ and, strip suffixes */
function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b(pvt\.?|ltd\.?|llc|inc\.?|co\.?|corp\.?|private|limited)\b/gi, '')
		.replace(/&/g, ' and ')
		.replace(/\band\b/g, ' and ')
		.replace(/[''`]/g, '')
		.replace(/[.\-,]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function namesMatch(a: string, b: string): boolean {
	const na = normalizeName(a)
	const nb = normalizeName(b)
	if (na === nb) return true
	if (na.length >= 4 && nb.length >= 4) {
		const wordsA = na.split(' ')
		const wordsB = nb.split(' ')
		const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB
		const longer = wordsA.length <= wordsB.length ? wordsB : wordsA
		if (shorter.length > 0 && shorter.every((w, i) => longer[i] === w)) return true
	}
	return false
}

// ── Extraction action (AI only — does NOT write to DB) ──────

export const scanAndExtract = action({
	args: {
		storageId: v.optional(v.id('_storage')),
		textContent: v.optional(v.string()),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
		if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')

		const google = createGoogleGenerativeAI({ apiKey })

		// Build the message content parts
		const contentParts: Array<
			| { type: 'text'; text: string }
			| { type: 'image'; image: Uint8Array; mimeType: string }
			| { type: 'file'; data: Uint8Array; mediaType: string }
		> = []

		if (args.storageId) {
			// Binary file — fetch from Convex storage
			const fileUrl = await ctx.storage.getUrl(args.storageId)
			if (!fileUrl) throw new Error('File not found in storage')

			const response = await fetch(fileUrl)
			const buffer = new Uint8Array(await response.arrayBuffer())

			if (args.mimeType.startsWith('image/')) {
				contentParts.push({
					type: 'image',
					image: buffer,
					mimeType: args.mimeType,
				})
				contentParts.push({
					type: 'text',
					text: 'Extract all business data (products, suppliers/parties, customers) from this image.',
				})
			} else if (args.mimeType === 'application/pdf') {
				contentParts.push({
					type: 'file',
					data: buffer,
					mediaType: 'application/pdf',
				})
				contentParts.push({
					type: 'text',
					text: 'Extract all business data (products, suppliers/parties, customers) from this PDF document.',
				})
			} else if (args.mimeType.startsWith('audio/')) {
				// Audio — Gemini natively handles audio input
				contentParts.push({
					type: 'file',
					data: buffer,
					mediaType: args.mimeType,
				})
				contentParts.push({
					type: 'text',
					text: 'This is a voice recording describing business data. The speaker may use English, Nepali, or a mix. Extract all products, suppliers/parties, and customers mentioned. Listen carefully for product names, prices, quantities, and supplier names.',
				})
			}
		} else if (args.textContent) {
			// Pre-parsed XLSX/CSV text, typed text, or pasted content
			contentParts.push({
				type: 'text',
				text: `Extract all business data (products, suppliers/parties, customers) from this content:\n\n${args.textContent}`,
			})
		} else {
			throw new Error('Either storageId or textContent must be provided')
		}

		const { output } = await generateText({
			model: google('gemini-2.0-flash'),
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: contentParts }],
			output: Output.object({ schema: scanResultSchema }),
		})

		if (!output) {
			throw new Error('AI returned no structured output')
		}

		return output
	},
})

// ── Internal queries for dedup ──────────────────────────────

export const listExistingParties = internalQuery({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const parties = await ctx.db
			.query('parties')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.collect()
		return parties
			.filter((p) => p.isActive)
			.map((p) => ({ _id: p._id, name: p.name }))
	},
})

export const listExistingProducts = internalQuery({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const products = await ctx.db
			.query('products')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.collect()
		return products
			.filter((p) => p.isActive)
			.map((p) => ({ _id: p._id, title: p.title }))
	},
})

export const listExistingCustomers = internalQuery({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const customers = await ctx.db
			.query('customers')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.collect()
		return customers
			.filter((c) => c.isActive)
			.map((c) => ({ _id: c._id, name: c.name }))
	},
})

// ── Bulk create mutations ───────────────────────────────────

export const bulkCreateParties = internalMutation({
	args: {
		parties: v.array(
			v.object({
				name: v.string(),
				panNumber: v.optional(v.string()),
				address: v.optional(v.string()),
				phone: v.optional(v.string()),
				creditLimit: v.optional(v.number()),
				paymentTerms: v.optional(v.string()),
				_ref: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, { parties }) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new Error('Not authenticated')
		const orgId =
			(identity.orgId as string) ??
			(identity.org_id as string) ??
			null
		if (!orgId) throw new Error('No org')

		// Fetch existing parties for dedup (by normalized name + PAN)
		const existing = await ctx.db
			.query('parties')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.collect()
		const activeExisting = existing.filter((p) => p.isActive)

		// Sanitize party data — strip invalid phone/PAN rather than rejecting
		const sanitizedParties = parties.map((p) => ({
			...p,
			name: p.name.trim(),
			phone: p.phone && /^(9[6-9]\d{8}|0\d{1,2}-?\d{6,7})$/.test(p.phone) ? p.phone : undefined,
			panNumber: p.panNumber && /^\d{9}$/.test(p.panNumber) ? p.panNumber : undefined,
			creditLimit: p.creditLimit !== undefined && Number.isFinite(p.creditLimit) && p.creditLimit >= 0 ? p.creditLimit : undefined,
		}))

		const nameToId: Record<string, string> = {}
		const refToId: Record<string, string> = {}
		let createdCount = 0

		for (const party of sanitizedParties) {
			if (!party.name) continue
			// 1. PAN match first (most reliable)
			const panMatch = party.panNumber
				? activeExisting.find((p) => p.panNumber && p.panNumber === party.panNumber)
				: null
			if (panMatch) {
				nameToId[party.name] = panMatch._id
				if (party._ref) refToId[party._ref] = panMatch._id
				continue
			}

			// 2. Normalized name match
			const nameMatch = activeExisting.find((p) => namesMatch(p.name, party.name))
			if (nameMatch) {
				// If both have addresses and they differ → different entities
				if (party.address && nameMatch.address &&
					normalizeName(party.address) !== normalizeName(nameMatch.address)) {
					// Fall through to create as separate entity
				} else {
					nameToId[party.name] = nameMatch._id
					if (party._ref) refToId[party._ref] = nameMatch._id
					// Merge missing fields into existing
					const patches: Record<string, string> = {}
					if (party.address && !nameMatch.address) patches.address = party.address
					if (party.phone && !nameMatch.phone) patches.phone = party.phone
					if (party.panNumber && !nameMatch.panNumber) patches.panNumber = party.panNumber
					if (Object.keys(patches).length > 0) await ctx.db.patch(nameMatch._id, patches)
					continue
				}
			}

			// 3. Also check within this batch (avoid creating "A & B" and "A and B" separately)
			const batchDupe = Object.keys(nameToId).find((k) => namesMatch(k, party.name))
			if (batchDupe) {
				nameToId[party.name] = nameToId[batchDupe]
				if (party._ref) refToId[party._ref] = nameToId[batchDupe]
				continue
			}

			// 4. Create new
			const { _ref, ...partyData } = party
			const id = await ctx.db.insert('parties', {
				orgId,
				...partyData,
				isActive: true,
			})
			nameToId[party.name] = id
			if (party._ref) refToId[party._ref] = id
			activeExisting.push({ ...partyData, _id: id, orgId, isActive: true } as any)
			createdCount++
		}

		return { nameToId, refToId, createdCount }
	},
})

export const bulkCreateProducts = internalMutation({
	args: {
		products: v.array(
			v.object({
				title: v.string(),
				purchasePartyId: v.string(),
				costPrice: v.number(),
				openingStock: v.number(),
				sellingPrice: v.optional(v.number()),
				unit: v.optional(v.string()),
				category: v.optional(v.string()),
				barcode: v.optional(v.string()),
				sku: v.optional(v.string()),
				hsCode: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, { products }) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new Error('Not authenticated')
		const orgId =
			(identity.orgId as string) ??
			(identity.org_id as string) ??
			null
		if (!orgId) throw new Error('No org')

		// Get fiscal year for stock book entries
		const settings = await ctx.db
			.query('orgSettings')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.first()
		const fiscalYear = settings?.currentFiscalYear ?? '82/83'

		// Dedup by normalized title, barcode, or SKU
		const existing = await ctx.db
			.query('products')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.collect()
		const activeExisting = existing.filter((p) => p.isActive)

		// Sanitize and validate product data
		const validProducts = products.filter((p) => {
			if (!p.title?.trim()) return false
			if (!Number.isFinite(p.costPrice) || p.costPrice <= 0) return false
			if (!Number.isFinite(p.openingStock) || p.openingStock < 0) return false
			if (p.sellingPrice !== undefined && !Number.isFinite(p.sellingPrice)) return false
			return true
		})

		let createdCount = 0
		const createdTitles = new Set<string>()

		for (const product of validProducts) {
			// Barcode match
			if (product.barcode && activeExisting.some((p) => p.barcode && p.barcode === product.barcode)) continue
			// SKU match
			if (product.sku && activeExisting.some((p) => p.sku && p.sku === product.sku)) continue
			// Normalized title match
			if (activeExisting.some((p) => namesMatch(p.title, product.title))) continue
			// Batch dedup
			if (createdTitles.has(normalizeName(product.title))) continue

			const sellingPrice = normalizeSellingPrice(product.costPrice, product.sellingPrice)
			const reorderLevel = Math.ceil(product.openingStock * 0.1)

			const id = await ctx.db.insert('products', {
				orgId,
				title: product.title,
				purchasePartyId: product.purchasePartyId as any,
				costPrice: product.costPrice,
				openingStock: product.openingStock,
				sellingPrice,
				reorderLevel,
				unit: product.unit,
				category: product.category,
				barcode: product.barcode,
				sku: product.sku,
				hsCode: product.hsCode,
				isActive: true,
			})

			// Auto-create stock book entry (same as products.create)
			if (product.openingStock > 0) {
				await ctx.db.insert('stockBookEntries', {
					orgId,
					entryDate: new Date().toISOString(),
					transactionType: 'stock',
					movementType: 'opening',
					direction: 'in',
					productId: id,
					quantityIn: product.openingStock,
					quantityOut: 0,
					quantity: product.openingStock,
					unitRate: product.costPrice,
					totalAmount: product.openingStock * product.costPrice,
					particulars: `Opening stock for ${product.title}`,
					fiscalYear,
					sourceTable: 'product',
					sourceId: id,
				})
			}

			createdTitles.add(normalizeName(product.title))
			activeExisting.push({ ...product, _id: id, title: product.title, isActive: true } as any)
			createdCount++
		}

		return { createdCount }
	},
})

export const bulkCreateCustomers = internalMutation({
	args: {
		customers: v.array(
			v.object({
				name: v.string(),
				panNumber: v.optional(v.string()),
				address: v.optional(v.string()),
				phone: v.optional(v.string()),
				email: v.optional(v.string()),
				creditLimit: v.optional(v.number()),
			})
		),
	},
	handler: async (ctx, { customers }) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new Error('Not authenticated')
		const orgId =
			(identity.orgId as string) ??
			(identity.org_id as string) ??
			null
		if (!orgId) throw new Error('No org')

		const existing = await ctx.db
			.query('customers')
			.withIndex('by_orgId', (q) => q.eq('orgId', orgId))
			.collect()
		const activeExisting = existing.filter((c) => c.isActive)

		// Sanitize customer data — strip invalid fields rather than rejecting
		const sanitizedCustomers = customers.map((c) => ({
			...c,
			name: c.name.trim(),
			phone: c.phone && /^(9[6-9]\d{8}|0\d{1,2}-?\d{6,7})$/.test(c.phone) ? c.phone : undefined,
			panNumber: c.panNumber && /^\d{9}$/.test(c.panNumber) ? c.panNumber : undefined,
			email: c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) ? c.email : undefined,
			creditLimit: c.creditLimit !== undefined && Number.isFinite(c.creditLimit) && c.creditLimit >= 0 ? c.creditLimit : undefined,
		}))

		let createdCount = 0

		for (const customer of sanitizedCustomers) {
			if (!customer.name) continue
			// PAN match
			if (customer.panNumber && activeExisting.some((c) => c.panNumber && c.panNumber === customer.panNumber)) continue
			// Phone match (last 10 digits)
			if (customer.phone) {
				const digits = customer.phone.replace(/\D/g, '')
				if (digits.length >= 7 && activeExisting.some((c) => c.phone && c.phone.replace(/\D/g, '').endsWith(digits.slice(-10)))) continue
			}
			// Email match
			if (customer.email && activeExisting.some((c) => c.email && c.email.toLowerCase() === customer.email!.toLowerCase())) continue
			// Normalized name match
			if (activeExisting.some((c) => namesMatch(c.name, customer.name))) continue

			await ctx.db.insert('customers', {
				orgId,
				...customer,
				isActive: true,
			})
			activeExisting.push({ ...customer, _id: '' as any, orgId, isActive: true } as any)
			createdCount++
		}

		return { createdCount }
	},
})

// ── Orchestrated bulk import (action) ───────────────────────
// This action calls the bulk mutations in the right order:
// 1. Create parties first (products need partyId)
// 2. Create products with resolved partyIds
// 3. Create customers

export const bulkImport = action({
	args: {
		parties: v.array(
			v.object({
				name: v.string(),
				panNumber: v.optional(v.string()),
				address: v.optional(v.string()),
				phone: v.optional(v.string()),
				creditLimit: v.optional(v.number()),
				paymentTerms: v.optional(v.string()),
				_ref: v.optional(v.string()),
			})
		),
		products: v.array(
			v.object({
				title: v.string(),
				supplierName: v.optional(v.string()),
				supplierRef: v.optional(v.string()),
				costPrice: v.number(),
				openingStock: v.number(),
				sellingPrice: v.optional(v.number()),
				unit: v.optional(v.string()),
				category: v.optional(v.string()),
				barcode: v.optional(v.string()),
				sku: v.optional(v.string()),
				hsCode: v.optional(v.string()),
			})
		),
		customers: v.array(
			v.object({
				name: v.string(),
				panNumber: v.optional(v.string()),
				address: v.optional(v.string()),
				phone: v.optional(v.string()),
				email: v.optional(v.string()),
				creditLimit: v.optional(v.number()),
			})
		),
		defaultPartyId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const summary = { parties: 0, products: 0, customers: 0 }

		// 1. Collect all unique supplier names from products
		const supplierNames = new Set<string>()
		for (const p of args.products) {
			if (p.supplierName) supplierNames.add(p.supplierName)
		}

		// Merge with explicit parties
		const allParties = [...args.parties]
		for (const name of supplierNames) {
			if (!allParties.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
				allParties.push({ name })
			}
		}

		// 2. Create parties
		let nameToId: Record<string, string> = {}
		let refToId: Record<string, string> = {}
		if (allParties.length > 0) {
			const result = await ctx.runMutation(
				internal.functions.aiScanner.bulkCreateParties,
				{ parties: allParties }
			)
			nameToId = result.nameToId
			refToId = result.refToId ?? {}
			summary.parties = result.createdCount
		}

		// 3. Create products — resolve supplierName to partyId
		if (args.products.length > 0) {
			const resolvedProducts = args.products.map((p) => {
				// 1. Try supplierRef first (exact intra-batch link)
				let partyId = p.supplierRef ? refToId[p.supplierRef] : undefined

				// 2. Fall back to supplierName resolution
				if (!partyId && p.supplierName) {
					partyId = nameToId[p.supplierName]
						?? Object.entries(nameToId).find(
							([k]) => namesMatch(k, p.supplierName!)
						)?.[1]
				}

				// 3. Fall back to default
				partyId = partyId ?? args.defaultPartyId

				if (!partyId) {
					throw new Error(
						`No supplier found for product "${p.title}". Please assign a default supplier.`
					)
				}

				return {
					title: p.title,
					purchasePartyId: partyId,
					costPrice: p.costPrice,
					openingStock: p.openingStock,
					sellingPrice: p.sellingPrice,
					unit: p.unit,
					category: p.category,
					barcode: p.barcode,
					sku: p.sku,
					hsCode: p.hsCode,
				}
			})

			const result = await ctx.runMutation(
				internal.functions.aiScanner.bulkCreateProducts,
				{ products: resolvedProducts }
			)
			summary.products = result.createdCount
		}

		// 4. Create customers
		if (args.customers.length > 0) {
			const result = await ctx.runMutation(
				internal.functions.aiScanner.bulkCreateCustomers,
				{ customers: args.customers }
			)
			summary.customers = result.createdCount
		}

		return summary
	},
})
