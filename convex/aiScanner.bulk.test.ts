import { convexTest } from 'convex-test'
import { describe, test, expect } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'
import { api } from './_generated/api'

const modules = import.meta.glob(
	['./functions/**/*.ts', './_generated/**/*.js', './_generated/**/*.ts'],
	{ eager: false },
)

const orgIdentity = (orgId: string) => ({
	org_id: orgId,
	tokenIdentifier: `test|${orgId}`,
	subject: 'user_ai_scanner_test',
})

describe('aiScanner bulkCreateParties', () => {
	test('creates new party for org', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_pt_${Date.now()}`
		const name = `Party Unique ${orgId}`
		const res = await t
			.withIdentity(orgIdentity(orgId))
			.mutation(internal.functions.aiScanner.bulkCreateParties, {
				parties: [{ name, phone: '9812345678' }],
			})
		expect(res.createdCount).toBe(1)
		expect(res.nameToId[name]).toBeDefined()
	})

	test('dedupes by normalized name match', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_dd_${Date.now()}`
		const base = `Same Name Co ${orgId}`
		const r1 = await t
			.withIdentity(orgIdentity(orgId))
			.mutation(internal.functions.aiScanner.bulkCreateParties, {
				parties: [{ name: base }],
			})
		expect(r1.createdCount).toBe(1)
		const r2 = await t
			.withIdentity(orgIdentity(orgId))
			.mutation(internal.functions.aiScanner.bulkCreateParties, {
				parties: [{ name: `${base} Pvt Ltd` }],
			})
		expect(r2.createdCount).toBe(0)
	})
})

describe('aiScanner bulkCreateProducts', () => {
	test('creates product and stock book when openingStock positive', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_pr_${Date.now()}`
		const asOrg = t.withIdentity(orgIdentity(orgId))
		const partyRes = await asOrg.mutation(internal.functions.aiScanner.bulkCreateParties, {
			parties: [{ name: `Supplier ${orgId}` }],
		})
		const partyId = partyRes.nameToId[`Supplier ${orgId}`]
		expect(partyId).toBeDefined()
		const prodRes = await asOrg.mutation(internal.functions.aiScanner.bulkCreateProducts, {
			products: [
				{
					title: `Widget ${orgId}`,
					purchasePartyId: partyId,
					costPrice: 50,
					openingStock: 4,
					unit: 'box:12',
					category: 'general',
				},
			],
		})
		expect(prodRes.createdCount).toBe(1)
	})

	test('skips invalid cost or negative stock', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_inv_${Date.now()}`
		const asOrg = t.withIdentity(orgIdentity(orgId))
		const partyRes = await asOrg.mutation(internal.functions.aiScanner.bulkCreateParties, {
			parties: [{ name: `S ${orgId}` }],
		})
		const partyId = partyRes.nameToId[`S ${orgId}`]
		const prodRes = await asOrg.mutation(internal.functions.aiScanner.bulkCreateProducts, {
			products: [
				{
					title: 'Bad Cost',
					purchasePartyId: partyId,
					costPrice: 0,
					openingStock: 1,
				},
				{
					title: 'Bad Stock',
					purchasePartyId: partyId,
					costPrice: 10,
					openingStock: -1,
				},
			],
		})
		expect(prodRes.createdCount).toBe(0)
	})
})

describe('aiScanner bulkCreateCustomers', () => {
	test('creates customer', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_cu_${Date.now()}`
		const res = await t
			.withIdentity(orgIdentity(orgId))
			.mutation(internal.functions.aiScanner.bulkCreateCustomers, {
				customers: [{ name: `Walk-in ${orgId}`, phone: '9811111111' }],
			})
		expect(res.createdCount).toBe(1)
	})

	test('skips duplicate name', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_c2_${Date.now()}`
		const asOrg = t.withIdentity(orgIdentity(orgId))
		const name = `Dup Customer ${orgId}`
		const r1 = await asOrg.mutation(internal.functions.aiScanner.bulkCreateCustomers, {
			customers: [{ name, phone: '9822222222' }],
		})
		expect(r1.createdCount).toBe(1)
		const r2 = await asOrg.mutation(internal.functions.aiScanner.bulkCreateCustomers, {
			customers: [{ name, phone: '9833333333' }],
		})
		expect(r2.createdCount).toBe(0)
	})
})

describe('aiScanner bulkImport action', () => {
	test('orchestrates parties products and customers', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_bi_${Date.now()}`
		const asOrg = t.withIdentity(orgIdentity(orgId))
		const ref = `sup_${orgId.slice(-6)}`
		const summary = await asOrg.action(api.functions.aiScanner.bulkImport, {
			parties: [{ name: `Bulk Supplier ${orgId}`, _ref: ref }],
			products: [
				{
					title: `Bulk SKU ${orgId}`,
					supplierRef: ref,
					costPrice: 200,
					openingStock: 2,
					unit: 'piece',
				},
			],
			customers: [{ name: `Bulk Buyer ${orgId}` }],
		})
		expect(summary.parties).toBeGreaterThanOrEqual(1)
		expect(summary.products).toBe(1)
		expect(summary.customers).toBe(1)
	})

	test('throws when product has no resolvable supplier', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_ns_${Date.now()}`
		const asOrg = t.withIdentity(orgIdentity(orgId))
		await expect(
			asOrg.action(api.functions.aiScanner.bulkImport, {
				parties: [],
				products: [
					{
						title: 'Orphan SKU',
						costPrice: 10,
						openingStock: 1,
					},
				],
				customers: [],
			}),
		).rejects.toThrow(/No supplier found/)
	})

	test('uses defaultPartyId when set', async () => {
		const t = convexTest(schema, modules)
		const orgId = `org_dp_${Date.now()}`
		const asOrg = t.withIdentity(orgIdentity(orgId))
		const partyRes = await asOrg.mutation(internal.functions.aiScanner.bulkCreateParties, {
			parties: [{ name: `Default Sup ${orgId}` }],
		})
		const defaultId = partyRes.nameToId[`Default Sup ${orgId}`]
		const summary = await asOrg.action(api.functions.aiScanner.bulkImport, {
			parties: [],
			products: [
				{
					title: `NoRef SKU ${orgId}`,
					costPrice: 15,
					openingStock: 1,
				},
			],
			customers: [],
			defaultPartyId: defaultId,
		})
		expect(summary.products).toBe(1)
	})
})
