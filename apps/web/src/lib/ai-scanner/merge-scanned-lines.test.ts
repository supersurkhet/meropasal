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
	{
		_id: 'b1',
		title: 'Weird Pack',
		unit: 'pack:3',
		costPrice: 1000,
		sellingPrice: 999,
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
		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(60)
		expect(line.referenceRate).toBeGreaterThan(0)
		expect(line.rate).toBeGreaterThan(0)
	})

	it('converts to per-piece when scanner requests piece on compound product', () => {
		let n = 0
		const line = lineFromMatchedStockImport(
			{ productTitle: 'Tea Box', quantity: 5, unit: 'piece' },
			catalog[0]!,
			() => `id-${++n}`,
		)
		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(5)
		expect(line.referenceRate).toBe(100)
	})

	it('converts box quantity and rate to per-piece', () => {
		let n = 0
		const line = lineFromMatchedStockImport(
			{ productTitle: 'Tea Box', quantity: 2, unit: 'box', rate: 2000 },
			catalog[0]!,
			() => `id-${++n}`,
		)
		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(40)
		expect(line.referenceRate).toBe(100)
		expect(line.rate).toBe(100)
	})

	it('ignores scanner unit not in catalog unit set', () => {
		let n = 0
		const line = lineFromMatchedStockImport(
			{ productTitle: 'Tea Box', unit: 'carton' },
			catalog[0]!,
			() => `id-${++n}`,
		)
		expect(line.unit).toBe('piece')
		expect(line.referenceRate).toBe(100)
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

	it('uses piece-level selling when scanner requests piece', () => {
		let n = 0
		const line = lineFromMatchedSaleBill(
			{ productTitle: 'Tea Box', unit: 'piece' },
			catalog[0]!,
			() => `s-${++n}`,
		)
		expect(line.unit).toBe('piece')
		expect(line.referenceRate).toBe(120)
	})

	it('converts selling box rate to per-piece', () => {
		let n = 0
		const line = lineFromMatchedSaleBill(
			{ productTitle: 'Tea Box', unit: 'box', quantity: 1, rate: 2400 },
			catalog[0]!,
			() => `s-${++n}`,
		)
		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(20)
		expect(line.referenceRate).toBe(120)
		expect(line.rate).toBe(120)
	})
})

describe('lineFromMatchedOrderTrip', () => {
	it('uses explicit rate when provided', () => {
		let n = 0
		const line = lineFromMatchedOrderTrip(
			{ productTitle: 'Tea Box', unit: 'piece', rate: 99 },
			catalog[0]!,
			() => `o-${++n}`,
		)
		expect(line.rate).toBe(99)
	})

	it('derives rate when si.rate omitted', () => {
		let n = 0
		const line = lineFromMatchedOrderTrip({ productTitle: 'Tea Box' }, catalog[0]!, () => `o-${++n}`)
		expect(line.rate).toBe(120)
		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(20)
	})

	it('derives per-piece selling when unit is piece', () => {
		let n = 0
		const line = lineFromMatchedOrderTrip(
			{ productTitle: 'Tea Box', unit: 'piece' },
			catalog[0]!,
			() => `o-${++n}`,
		)
		expect(line.unit).toBe('piece')
		expect(line.rate).toBe(120)
	})
})

describe('lineFromUnmatchedScan', () => {
	it('preserves title quantity and optional rate', () => {
		const line = lineFromUnmatchedScan(
			{ productTitle: 'Unknown', quantity: 7, unit: 'pack', unitStr: 'pack:6', rate: 12.5 },
			() => 'u1',
		)
		expect(line.productId).toBe('')
		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(42)
		expect(line.rate).toBeCloseTo(2.08, 2)
	})
})

describe('lineFromUnmatchedStockSale', () => {
	it('zeros discount fields', () => {
		const line = lineFromUnmatchedStockSale({ productTitle: 'X', quantity: 1 }, () => 'u2')
		expect(line.referenceRate).toBe(0)
		expect(line.discountPercent).toBe(0)
	})
})

describe('base-unit normalization', () => {
	it('normalizes mixed units so they can be merged safely', () => {
		let n = 0
		const genId = () => `m-${++n}`

		const fromBox = lineFromMatchedSaleBill(
			{ productTitle: 'Tea Box', unit: 'box', quantity: 1, rate: 2400 },
			catalog[0]!,
			genId,
		)
		const fromPiece = lineFromMatchedSaleBill(
			{ productTitle: 'Tea Box', unit: 'piece', quantity: 5, rate: 120 },
			catalog[0]!,
			genId,
		)

		expect(fromBox.unit).toBe('piece')
		expect(fromPiece.unit).toBe('piece')
		expect(fromBox.rate).toBe(120)
		expect(fromPiece.rate).toBe(120)

		const mergedQty = fromBox.quantity + fromPiece.quantity
		expect(mergedQty).toBe(25)
	})

	it('rounds converted per-piece rate to 2 decimals', () => {
		let n = 0
		const line = lineFromMatchedStockImport(
			{ productTitle: 'Weird Pack', unit: 'pack', quantity: 1, rate: 1000 },
			catalog[1]!,
			() => `r-${++n}`,
		)

		expect(line.unit).toBe('piece')
		expect(line.quantity).toBe(3)
		expect(line.rate).toBeCloseTo(333.33, 2)
		expect(line.referenceRate).toBeCloseTo(333.33, 2)
	})

	it('does not treat malformed unitStr as compound (no conversion)', () => {
		const line = lineFromUnmatchedScan(
			{ productTitle: 'Malformed', quantity: 2, unit: 'box', unitStr: 'box:0', rate: 100 },
			() => 'mal-1',
		)
		expect(line.unit).toBe('box')
		expect(line.quantity).toBe(2)
		expect(line.rate).toBe(100)
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

