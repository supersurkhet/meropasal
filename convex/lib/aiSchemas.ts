/**
 * Zod schemas for AI-extracted data.
 * These mirror the Convex table shapes so the AI output
 * maps directly to mutation args — no manual field mapping needed.
 */
import { z } from 'zod'

// ── Party (supplier) ────────────────────────────────────────
export const extractedPartySchema = z.object({
	name: z.string().describe('Supplier/party/vendor name'),
	panNumber: z.string().optional().describe('PAN or VAT number if visible'),
	address: z.string().optional().describe('Address if visible'),
	phone: z.string().optional().describe('Phone number if visible'),
	creditLimit: z.number().optional().describe('Credit limit in NPR if mentioned'),
	paymentTerms: z.string().optional().describe('Payment terms like "30 days", "COD" etc.'),
})

// ── Customer ────────────────────────────────────────────────
export const extractedCustomerSchema = z.object({
	name: z.string().describe('Customer name'),
	panNumber: z.string().optional().describe('PAN or VAT number if visible'),
	address: z.string().optional().describe('Address if visible'),
	phone: z.string().optional().describe('Phone number if visible'),
	email: z.string().optional().describe('Email if visible'),
	creditLimit: z.number().optional().describe('Credit limit in NPR if mentioned'),
})

// ── Product ─────────────────────────────────────────────────
export const extractedProductSchema = z.object({
	title: z.string().describe('Product name/title'),
	supplierName: z.string().optional().describe('Supplier/party name if visible — used to link product to a party'),
	costPrice: z.number().describe('Purchase/cost price in NPR — ALWAYS per container/box, not per piece. If user gives per-piece price and container size, multiply: e.g. "13 per piece, box of 20" → costPrice = 260'),
	sellingPrice: z.number().optional().describe('Selling/retail price in NPR — same rule: always per container if compound unit. e.g. "sells for 20 each, box of 20" → sellingPrice = 400'),
	openingStock: z.number().describe('Current stock quantity, default to 0 if not visible'),
	unit: z.string().optional().describe('ONLY use these exact unit names: "piece", "box", "kg", "liter", "pack", "dozen", "bag". For compound units: "box:12" = box of 12 pieces, "pack:20" = pack of 20. Map synonyms: carton/cartoon/ctn → "box", packet → "pack", litre/l → "liter", pcs/unit/ea → "piece", sack → "bag"'),
	category: z.string().optional().describe('Product category like general, food, beverage, dairy, snacks, household, personal, stationery'),
	barcode: z.string().optional().describe('Barcode number if visible'),
	sku: z.string().optional().describe('SKU code if visible'),
	hsCode: z.string().optional().describe('HS code for customs if visible'),
})

// ── Combined extraction result ──────────────────────────────
export const scanResultSchema = z.object({
	parties: z.array(extractedPartySchema).describe('Suppliers/vendors found in the document'),
	products: z.array(extractedProductSchema).describe('Products found in the document'),
	customers: z.array(extractedCustomerSchema).describe('Customers found in the document'),
})

export type ExtractedParty = z.infer<typeof extractedPartySchema>
export type ExtractedCustomer = z.infer<typeof extractedCustomerSchema>
export type ExtractedProduct = z.infer<typeof extractedProductSchema>
export type ScanResult = z.infer<typeof scanResultSchema>

// ── System prompt ───────────────────────────────────────────
export const SYSTEM_PROMPT = `You are a data extraction assistant for a Nepali retail management system (MeroPasal).
Your job is to extract structured business data from images, documents, or spreadsheet text.

CONTEXT:
- This is a Nepali retail/wholesale business system
- Prices are in NPR (Nepali Rupees)
- Documents may be in Nepali (Devanagari) or English — extract in English
- Handwriting may be messy — do your best to interpret correctly
- ONLY use these exact unit names: piece, box, kg, liter, pack, dozen, bag
- Map synonyms to allowed units: carton/cartoon/ctn → box, packet → pack, litre/l → liter, pcs/unit/ea → piece, sack → bag
- Compound units: "box:20" = box of 20 pieces, "pack:12" = pack of 12
- IMPORTANT: When compound units are used, costPrice and sellingPrice MUST be per-container (not per-piece).
  Example: "1 piece costs 13, carton of 20" → unit="box:20", costPrice=260 (13×20), NOT costPrice=13

EXTRACTION RULES:
- Extract ALL entities you can find: suppliers/parties, products, and customers
- For products: if a supplier name is visible in the same context, include it in "supplierName"
- For prices: always use numbers, no currency symbols. ALWAYS convert to per-container price when compound unit is given.
- For stock quantities: if not explicitly shown, set openingStock to 0
- If a field is not visible or cannot be inferred, omit it (don't guess)
- Contextually map fields: whatever looks like a product name maps to "title", a person/company name to party/customer "name", etc.
- If the document is a product list with a single supplier header, set that as the supplierName for all products
- Nepali text should be transliterated to English (e.g. "वाइ वाइ" → "Wai Wai")

Return data in ALL three arrays (parties, products, customers) — leave arrays empty if no entities of that type are found.`
