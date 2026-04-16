import { namesMatch } from '$lib/name-match'
import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price'
import {
	syncFromRate,
	impliedDiscountPercentRaw,
	MAX_LINE_DISCOUNT_PERCENT,
	DISCOUNT_MAX_EPSILON,
	isDiscountAtOrAboveMax,
} from '$lib/line-discount'

export type BillTargetTable = 'stock-import' | 'orders' | 'sales' | 'trips'

export type ExtractedLineItem = {
	productTitle: string
	productId: string
	quantity: number
	unit: string
	unitStr: string
	rate: number
	supplierName?: string
}

export type ExistingProductForBill = {
	_id: string
	title: string
	barcode?: string
	sku?: string
	unit?: string
	costPrice: number
	sellingPrice?: number
}

export function buildBillLineItemsFromExtracted(
	targetTable: BillTargetTable,
	extractedProducts: any[],
	existingProducts: ExistingProductForBill[],
): { lineItems: ExtractedLineItem[]; anyRawExceeds: boolean; anyAtMax: boolean } {
	const rows = extractedProducts
	let anyRawExceeds = false
	let anyAtMax = false
	const lineItems: ExtractedLineItem[] = rows.map((p) => {
		const existingProduct =
			existingProducts.find((ep) => namesMatch(ep.title, p.title))
			?? (p._existingId ? existingProducts.find((ep) => ep._id === p._existingId) : undefined)
		const unitStr = existingProduct?.unit ?? p.unit ?? ''
		const units = getAvailableUnits(unitStr)
		const rawUnit = p.unit != null && String(p.unit).trim() !== '' ? String(p.unit).trim() : ''
		const unit = rawUnit && units.includes(rawUnit) ? rawUnit : units[0] || 'piece'

		let referenceRate = 0
		let rawRate = 0

		if (existingProduct) {
			if (targetTable === 'stock-import') {
				referenceRate =
					Math.round(
						deriveUnitPrice(existingProduct.costPrice, existingProduct.unit, unit) * 100,
					) / 100
				const explicitRated = Number(p.rate)
				const fromCost = Number(p.costPrice)
				if (Number.isFinite(explicitRated) && explicitRated >= 0) rawRate = explicitRated
				else if (Number.isFinite(fromCost) && fromCost >= 0) rawRate = fromCost
				else rawRate = referenceRate
			} else {
				referenceRate =
					Math.round(
						deriveUnitPrice(
							existingProduct.sellingPrice ?? 0,
							existingProduct.unit,
							unit,
						) * 100,
					) / 100
				const explicitRated = Number(p.rate)
				const fromSell = Number(p.sellingPrice)
				const fromCost = Number(p.costPrice)
				if (Number.isFinite(explicitRated) && explicitRated >= 0) rawRate = explicitRated
				else if (Number.isFinite(fromSell) && fromSell >= 0) rawRate = fromSell
				else if (Number.isFinite(fromCost) && fromCost >= 0) rawRate = fromCost
				else rawRate = referenceRate
			}
		} else {
			const explicitRated = Number(p.rate)
			if (Number.isFinite(explicitRated) && explicitRated >= 0) rawRate = explicitRated
			else if (targetTable === 'stock-import') rawRate = Number(p.costPrice) || 0
			else rawRate = Number(p.sellingPrice) || Number(p.costPrice) || 0
		}

		if (referenceRate > 0) {
			if (
				impliedDiscountPercentRaw(referenceRate, rawRate) >
				MAX_LINE_DISCOUNT_PERCENT + DISCOUNT_MAX_EPSILON
			) {
				anyRawExceeds = true
			}
		}

		let finalRate = rawRate
		if (referenceRate > 0) {
			const s = syncFromRate(referenceRate, rawRate)
			finalRate = s.rate
			if (isDiscountAtOrAboveMax(s.discountPercent)) anyAtMax = true
		} else {
			finalRate = Math.round(rawRate * 100) / 100
		}

		return {
			productTitle: p.title,
			productId: existingProduct?._id ?? (typeof p._existingId === 'string' ? p._existingId : ''),
			quantity: Number(p.openingStock) || 1,
			unit,
			unitStr: unitStr || unit,
			rate: finalRate,
			supplierName: p.supplierName || undefined,
		}
	})

	return { lineItems, anyRawExceeds, anyAtMax }
}
