import { describe, it, expect } from 'vitest'
import { buildBillLineItemsFromExtracted } from './bill-line-items'
import { minRateAtMaxDiscount } from '$lib/line-discount'

describe('buildBillLineItemsFromExtracted', () => {
	const existing = [
		{
			_id: 'p1',
			title: 'Matched Product',
			unit: 'box:12',
			costPrice: 1200,
			sellingPrice: 1500,
		},
	]

	it('includes rows when _existingId set (restock)', () => {
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 5,
				costPrice: 1200,
				unit: 'box:12',
				_existingId: 'p1',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('stock-import', extracted, existing)
		expect(lineItems).toHaveLength(1)
		expect(lineItems[0]?.productId).toBe('p1')
		expect(lineItems[0]?.quantity).toBe(5)
	})

	it('maps new product with empty productId', () => {
		const extracted = [
			{
				title: 'Brand New SKU',
				openingStock: 2,
				costPrice: 100,
				unit: 'piece',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('stock-import', extracted, existing)
		expect(lineItems[0]?.productId).toBe('')
		expect(lineItems[0]?.productTitle).toBe('Brand New SKU')
	})

	it('uses selling path for sales target', () => {
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 1,
				sellingPrice: 1500,
				unit: 'box:12',
				_existingId: 'p1',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('sales', extracted, existing)
		expect(lineItems[0]?.rate).toBeGreaterThan(0)
	})

	it('sets anyRawExceeds when implied discount over max', () => {
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 1,
				costPrice: 500,
				rate: 500,
				unit: 'box',
				_existingId: 'p1',
			},
		]
		const { lineItems, anyRawExceeds } = buildBillLineItemsFromExtracted(
			'stock-import',
			extracted,
			existing,
		)
		expect(anyRawExceeds).toBe(true)
		expect(lineItems[0]?.rate).toBeGreaterThan(0)
	})

	it('uses per-piece rate when unit is piece on box product', () => {
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 12,
				costPrice: 100,
				unit: 'piece',
				_existingId: 'p1',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('stock-import', extracted, existing)
		expect(lineItems[0]?.unit).toBe('piece')
		expect(lineItems[0]?.rate).toBeCloseTo(100, 1)
	})

	it('resolves product by _existingId when title drifted', () => {
		const extracted = [
			{
				title: 'Scanned typo title',
				openingStock: 1,
				costPrice: 1200,
				_existingId: 'p1',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('stock-import', extracted, existing)
		expect(lineItems[0]?.productId).toBe('p1')
		expect(lineItems[0]?.quantity).toBe(1)
	})

	it('orders target uses selling reference for matched line', () => {
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 2,
				sellingPrice: 1500,
				_existingId: 'p1',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('orders', extracted, existing)
		expect(lineItems[0]?.rate).toBeGreaterThan(0)
	})

	it('trips target mirrors orders selling branch', () => {
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 1,
				sellingPrice: 1500,
				_existingId: 'p1',
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted('trips', extracted, existing)
		expect(lineItems[0]?.rate).toBeGreaterThan(0)
	})

	it('flags anyAtMax when clamp hits max discount', () => {
		const ref = 1000
		const minAllowed = minRateAtMaxDiscount(ref)
		const extracted = [
			{
				title: 'Matched Product',
				openingStock: 1,
				costPrice: minAllowed,
				_existingId: 'p1',
			},
		]
		const cat = [{ ...existing[0]!, costPrice: ref }]
		const { anyAtMax, lineItems } = buildBillLineItemsFromExtracted('stock-import', extracted, cat)
		expect(lineItems[0]?.rate).toBeGreaterThanOrEqual(minAllowed - 0.02)
		expect(anyAtMax).toBe(true)
	})
})
