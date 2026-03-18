/**
 * Client-side stock aggregation — tracks available stock per product per supplier bucket.
 * Ported from supersurkhet/apps/site/src/lib/stock-book-aggregation.ts
 */

export const UNASSIGNED_STOCK_BUCKET = '__UNASSIGNED__'

type StockBucketKey = string

export type StockBookEntry = {
	entryDate?: string
	fiscalYear?: string
	movementType?: string
	direction?: 'in' | 'out'
	productId?: string
	quantity?: number
	quantityIn?: number
	quantityOut?: number
	counterpartyId?: string
	originPartyId?: string
}

export type StockAggregation = {
	productTotalAvailable: Record<string, number>
	productPartyAvailable: Record<string, Record<StockBucketKey, number>>
}

function toFiniteNumber(input: unknown): number {
	const value = Number(input ?? 0)
	return Number.isFinite(value) ? value : 0
}

function resolveInboundBucket(entry: StockBookEntry): StockBucketKey {
	if (entry.movementType === 'purchase') {
		return entry.counterpartyId || UNASSIGNED_STOCK_BUCKET
	}
	return entry.originPartyId || entry.counterpartyId || UNASSIGNED_STOCK_BUCKET
}

function resolveOutboundBucket(entry: StockBookEntry): StockBucketKey {
	return entry.originPartyId || UNASSIGNED_STOCK_BUCKET
}

export function aggregateStockBookEntries(
	entries: StockBookEntry[] | undefined,
): StockAggregation {
	const productTotalAvailable: Record<string, number> = {}
	const productPartyAvailable: Record<string, Record<StockBucketKey, number>> = {}

	for (const entry of entries ?? []) {
		const productId = entry.productId
		if (!productId) continue

		const direction = entry.direction
		if (!direction) continue

		const qty =
			direction === 'in'
				? toFiniteNumber(entry.quantityIn ?? entry.quantity)
				: toFiniteNumber(entry.quantityOut ?? entry.quantity)
		if (!qty) continue

		const bucket =
			direction === 'in' ? resolveInboundBucket(entry) : resolveOutboundBucket(entry)

		productPartyAvailable[productId] ||= {}
		productPartyAvailable[productId][bucket] ||= 0
		productTotalAvailable[productId] ||= 0

		const delta = direction === 'in' ? qty : -qty
		productPartyAvailable[productId][bucket] += delta
		productTotalAvailable[productId] += delta
	}

	return { productTotalAvailable, productPartyAvailable }
}

export function getProductPartyAvailability(
	aggregate: StockAggregation,
	productId: string | undefined,
	partyId: string | undefined,
): number {
	if (!productId || !partyId) return 0
	return Number(aggregate.productPartyAvailable[productId]?.[partyId] || 0)
}

export function getProductTotalAvailable(
	aggregate: StockAggregation,
	productId: string | undefined,
): number {
	if (!productId) return 0
	return Number(aggregate.productTotalAvailable[productId] || 0)
}
