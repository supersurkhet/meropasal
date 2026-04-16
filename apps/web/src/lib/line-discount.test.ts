import { describe, it, expect } from 'vitest'
import {
	MAX_LINE_DISCOUNT_PERCENT,
	impliedDiscountPercentRaw,
	syncFromRate,
	minRateAtMaxDiscount,
	exceedsMaxDiscount,
	isDiscountAtOrAboveMax,
} from './line-discount'

describe('impliedDiscountPercentRaw', () => {
	it('returns 0 when rate >= reference', () => {
		expect(impliedDiscountPercentRaw(100, 100)).toBe(0)
		expect(impliedDiscountPercentRaw(100, 120)).toBe(0)
	})

	it('computes percent when discounted', () => {
		expect(impliedDiscountPercentRaw(100, 85)).toBe(15)
	})
})

describe('syncFromRate', () => {
	it('clamps below min allowed rate', () => {
		const ref = 100
		const min = minRateAtMaxDiscount(ref)
		const s = syncFromRate(ref, 50)
		expect(s.rate).toBeGreaterThanOrEqual(min - 0.01)
	})

	it('passes through small discount', () => {
		const s = syncFromRate(100, 90)
		expect(s.rate).toBe(90)
		expect(s.discountPercent).toBe(10)
	})
})

describe('exceedsMaxDiscount', () => {
	it('true when raw discount over max', () => {
		expect(exceedsMaxDiscount(100, 80)).toBe(true)
	})

	it('false at boundary', () => {
		const min = minRateAtMaxDiscount(100)
		expect(exceedsMaxDiscount(100, min)).toBe(false)
	})
})

describe('isDiscountAtOrAboveMax', () => {
	it('true at max line discount', () => {
		expect(isDiscountAtOrAboveMax(MAX_LINE_DISCOUNT_PERCENT)).toBe(true)
	})
})
