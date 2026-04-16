import { describe, it, expect } from 'vitest'
import {
	findCatalogProduct,
	lineFromMatchedStockImport,
	lineFromMatchedSaleBill,
	lineFromMatchedOrderTrip,
	lineFromUnmatchedScan,
	lineFromUnmatchedStockSale,
} from './merge-scanned-lines'

const catalog = [
	{
		_id: 'a1',
		title: 'Tea Box',
		unit: 'box:20',
		costPrice: 2000,
		sellingPrice: 2400,
	},
]

describe('findCatalogProduct', () => {
	it('finds by productId when title differs', () => {
		const p = findCatalogProduct(
			{ productTitle: 'Wrong Title', productId: 'a1' },
			catalog,
		)
		expect(p?._id).toBe('a1')
	})

	it('falls back to title match', () => {
		const p = findCatalogProduct({ productTitle: 'Tea Box' }, catalog)
		expect(p?._id).toBe('a1')
	})
})

describe('lineFromMatchedStockImport', () => {
	it('uses cost reference and discount sync', () => {
		let n = 0
		const genId = () => `id-${++n}`
		const line = lineFromMatchedStockImport(
			{ productTitle: 'Tea Box', quantity: 3, rate: 1900 },
			catalog[0]!,
			genId,
		)
		expect(line.productId).toBe('a1')
		expect(line.quantity).toBe(3)
		expect(line.referenceRate).toBeGreaterThan(0)
		expect(line.rate).toBeGreaterThan(0)
	})
})

describe('lineFromMatchedSaleBill', () => {
	it('uses selling reference', () => {
		let n = 0
		const line = lineFromMatchedSaleBill(
			{ productTitle: 'Tea Box', quantity: 1 },
			catalog[0]!,
			() => `s-${++n}`,
		)
		expect(line.referenceRate).toBeGreaterThan(0)
	})
})

describe('lineFromMatchedOrderTrip', () => {
	it('uses explicit rate when provided', () => {
		let n = 0
		const line = lineFromMatchedOrderTrip(
			{ productTitle: 'Tea Box', rate: 99 },
			catalog[0]!,
			() => `o-${++n}`,
		)
		expect(line.rate).toBe(99)
	})

	it('derives rate when si.rate omitted', () => {
		let n = 0
		const line = lineFromMatchedOrderTrip({ productTitle: 'Tea Box' }, catalog[0]!, () => `o-${++n}`)
		expect(line.rate).toBe(2400)
	})
})

describe('lineFromUnmatchedScan', () => {
	it('preserves title quantity and optional rate', () => {
		const line = lineFromUnmatchedScan(
			{ productTitle: 'Unknown', quantity: 7, unit: 'pack', unitStr: 'pack:6', rate: 12.5 },
			() => 'u1',
		)
		expect(line.productId).toBe('')
		expect(line.quantity).toBe(7)
		expect(line.rate).toBe(12.5)
	})
})

describe('lineFromUnmatchedStockSale', () => {
	it('zeros discount fields', () => {
		const line = lineFromUnmatchedStockSale({ productTitle: 'X', quantity: 1 }, () => 'u2')
		expect(line.referenceRate).toBe(0)
		expect(line.discountPercent).toBe(0)
	})
})

describe('lineFromMatchedStockImport discount', () => {
	it('clamps rate to max discount band', () => {
		let n = 0
		const line = lineFromMatchedStockImport(
			{ productTitle: 'Tea Box', rate: 1 },
			catalog[0]!,
			() => `d-${++n}`,
		)
		expect(line.rate).toBeGreaterThan(1)
		expect(line.discountPercent).toBeLessThanOrEqual(15.01)
	})
})

