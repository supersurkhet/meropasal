export const MAX_LINE_DISCOUNT_PERCENT = 15

export const DISCOUNT_MAX_EPSILON = 1e-6

export function roundMoney(n: number) {
	return Math.round(n * 100) / 100
}

export function minRateAtMaxDiscount(referenceRate: number) {
	if (!Number.isFinite(referenceRate) || referenceRate <= 0) return 0
	return roundMoney(referenceRate * (1 - MAX_LINE_DISCOUNT_PERCENT / 100))
}

export function impliedDiscountPercentRaw(referenceRate: number, rate: number) {
	if (!Number.isFinite(referenceRate) || referenceRate <= 0) return 0
	if (!Number.isFinite(rate) || rate >= referenceRate) return 0
	return ((referenceRate - rate) / referenceRate) * 100
}

export function discountPercentFromRates(referenceRate: number, rate: number) {
	if (!Number.isFinite(referenceRate) || referenceRate <= 0) return 0
	if (!Number.isFinite(rate) || rate >= referenceRate) return 0
	const raw = impliedDiscountPercentRaw(referenceRate, rate)
	return roundMoney(Math.min(MAX_LINE_DISCOUNT_PERCENT, Math.max(0, raw)))
}

export function clampRateToMaxDiscount(referenceRate: number, rate: number) {
	if (!Number.isFinite(referenceRate) || referenceRate <= 0) return roundMoney(rate)
	const minAllowed = minRateAtMaxDiscount(referenceRate)
	if (rate < minAllowed) return minAllowed
	return roundMoney(rate)
}

export function syncFromRate(referenceRate: number, rate: number) {
	const r = clampRateToMaxDiscount(referenceRate, rate)
	const discountPercent = discountPercentFromRates(referenceRate, r)
	return { rate: r, discountPercent }
}

export function syncFromDiscount(referenceRate: number, discountPercent: number) {
	if (!Number.isFinite(referenceRate) || referenceRate <= 0) {
		return { rate: roundMoney(0), discountPercent: 0 }
	}
	const d = Math.min(
		MAX_LINE_DISCOUNT_PERCENT,
		Math.max(0, roundMoney(Number(discountPercent) || 0)),
	)
	const rt = roundMoney(referenceRate * (1 - d / 100))
	return { rate: rt, discountPercent: d }
}

export function isDiscountAtOrAboveMax(discountPercent: number) {
	return discountPercent >= MAX_LINE_DISCOUNT_PERCENT - DISCOUNT_MAX_EPSILON
}

export function exceedsMaxDiscount(referenceRate: number, rate: number) {
	return impliedDiscountPercentRaw(referenceRate, rate) > MAX_LINE_DISCOUNT_PERCENT + DISCOUNT_MAX_EPSILON
}
