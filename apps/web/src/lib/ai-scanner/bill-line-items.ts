import { namesMatch } from '$lib/name-match'
import { deriveUnitPrice, getAvailableUnits, parseUnit } from '$lib/unit-price'
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
		const parsed = parseUnit(unitStr)
		const units = getAvailableUnits(unitStr)
		const rawUnit = p.unit != null && String(p.unit).trim() !== '' ? String(p.unit).trim() : ''
		const selectedUnit = rawUnit && units.includes(rawUnit) ? rawUnit : units[0] || 'piece'
		const unit = parsed.piecesPerUnit > 1 ? 'piece' : parsed.baseUnit || selectedUnit || 'piece'

		let referenceRate = 0
		let rawRate = 0

		if (existingProduct) {
			if (targetTable === 'stock-import') {
				const refSelected =
					Math.round(
						deriveUnitPrice(existingProduct.costPrice, existingProduct.unit, selectedUnit) * 100,
					) / 100
				const refBase =
					Math.round(
						deriveUnitPrice(existingProduct.costPrice, existingProduct.unit, 'piece') * 100,
					) / 100
				referenceRate = unit === 'piece' ? refBase : refSelected
				const explicitRated = Number(p.rate)
				const fromCost = Number(p.costPrice)
				const rawSelected =
					Number.isFinite(explicitRated) && explicitRated >= 0
						? explicitRated
						: Number.isFinite(fromCost) && fromCost >= 0
							? fromCost
							: refSelected

				rawRate =
					unit === 'piece' && selectedUnit !== 'piece' && parsed.piecesPerUnit > 1
						? rawSelected / parsed.piecesPerUnit
						: rawSelected
			} else {
				const refSelected =
					Math.round(
						deriveUnitPrice(
							existingProduct.sellingPrice ?? 0,
							existingProduct.unit,
							selectedUnit,
						) * 100,
					) / 100
				const refBase =
					Math.round(
						deriveUnitPrice(existingProduct.sellingPrice ?? 0, existingProduct.unit, 'piece') *
							100,
					) / 100
				referenceRate = unit === 'piece' ? refBase : refSelected
				const explicitRated = Number(p.rate)
				const fromSell = Number(p.sellingPrice)
				const fromCost = Number(p.costPrice)
				const rawSelected =
					Number.isFinite(explicitRated) && explicitRated >= 0
						? explicitRated
						: Number.isFinite(fromSell) && fromSell >= 0
							? fromSell
							: Number.isFinite(fromCost) && fromCost >= 0
								? fromCost
								: refSelected

				rawRate =
					unit === 'piece' && selectedUnit !== 'piece' && parsed.piecesPerUnit > 1
						? rawSelected / parsed.piecesPerUnit
						: rawSelected
			}
		} else {
			const explicitRated = Number(p.rate)
			const rawSelected =
				Number.isFinite(explicitRated) && explicitRated >= 0
					? explicitRated
					: targetTable === 'stock-import'
						? Number(p.costPrice) || 0
						: Number(p.sellingPrice) || Number(p.costPrice) || 0
			rawRate =
				unit === 'piece' && selectedUnit !== 'piece' && parsed.piecesPerUnit > 1
					? rawSelected / parsed.piecesPerUnit
					: rawSelected
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
			quantity:
				unit === 'piece' && selectedUnit !== 'piece' && parsed.piecesPerUnit > 1
					? (Number(p.openingStock) || 1) * parsed.piecesPerUnit
					: Number(p.openingStock) || 1,
			unit,
			unitStr: unitStr || unit,
			rate: finalRate,
			supplierName: p.supplierName || undefined,
		}
	})

	return { lineItems, anyRawExceeds, anyAtMax }
}
