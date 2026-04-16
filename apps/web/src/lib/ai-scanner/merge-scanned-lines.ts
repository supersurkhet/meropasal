import { deriveUnitPrice, getAvailableUnits, parseUnit } from '$lib/unit-price'
import { syncFromRate } from '$lib/line-discount'
import type { BillLineItem } from '$lib/bill-line-item'

export type CatalogProductForScan = {
	_id: string
	title: string
	unit?: string
	costPrice?: number
	sellingPrice?: number
}

export type ScannedLineInput = {
	productTitle: string
	productId?: string
	quantity?: number
	unitStr?: string
	unit?: string
	rate?: number
}

export function findCatalogProduct<T extends CatalogProductForScan>(
	si: ScannedLineInput,
	products: readonly T[],
): T | undefined {
	if (si.productId) {
		const byId = products.find((p) => p._id === si.productId)
		if (byId) return byId
	}
	const t = si.productTitle.toLowerCase()
	return products.find((p) => p.title.toLowerCase() === t)
}

function pickLineUnit(productUnit: string | undefined, si: ScannedLineInput): string {
	const units = getAvailableUnits(productUnit)
	const raw = si.unit != null && String(si.unit).trim() !== '' ? String(si.unit).trim() : ''
	if (raw && units.includes(raw)) return raw
	return units[0] || 'piece'
}

function normalizeToBaseUnit(
	unitStr: string | undefined,
	selectedUnit: string,
	quantity: number,
	rate: number,
): { unit: string; quantity: number; rate: number } {
	const parsed = parseUnit(unitStr)
	const q = Number.isFinite(Number(quantity)) ? Number(quantity) : 1
	const r = Number.isFinite(Number(rate)) ? Number(rate) : 0

	if (parsed.piecesPerUnit === 1) {
		return {
			unit: parsed.baseUnit || selectedUnit || 'piece',
			quantity: q || 1,
			rate: r,
		}
	}

	const u = String(selectedUnit || '').trim()
	const isPiece = u === 'piece'
	const baseQty = isPiece ? (q || 1) : (q || 1) * parsed.piecesPerUnit
	const baseRate = isPiece ? r : r / parsed.piecesPerUnit

	return {
		unit: 'piece',
		quantity: baseQty,
		rate: baseRate,
	}
}

export function lineFromMatchedStockImport<T extends CatalogProductForScan>(
	si: ScannedLineInput,
	product: T,
	genId: () => string,
): BillLineItem {
	const selectedUnit = pickLineUnit(product.unit, si)
	const refSelected =
		Math.round(deriveUnitPrice(product.costPrice ?? 0, product.unit, selectedUnit) * 100) / 100
	const rawRateSelected =
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : refSelected

	const normalizedRef = Math.round(deriveUnitPrice(product.costPrice ?? 0, product.unit, 'piece') * 100) / 100
	const normalized = normalizeToBaseUnit(
		product.unit,
		selectedUnit,
		si.quantity || 1,
		rawRateSelected,
	)

	const ref = normalized.unit === 'piece' ? normalizedRef : refSelected
	const rawRate = Math.round(normalized.rate * 100) / 100
	const s = syncFromRate(ref, rawRate)
	return {
		id: genId(),
		productId: product._id,
		productTitle: product.title,
		quantity: normalized.quantity,
		unitStr: product.unit || '',
		unit: normalized.unit,
		referenceRate: ref,
		rate: s.rate,
		discountPercent: s.discountPercent,
	}
}

export function lineFromMatchedSaleBill<T extends CatalogProductForScan>(
	si: ScannedLineInput,
	product: T,
	genId: () => string,
): BillLineItem {
	const selectedUnit = pickLineUnit(product.unit, si)
	const refSelected =
		Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, selectedUnit) * 100) / 100
	const rawRateSelected =
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : refSelected

	const normalizedRef =
		Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, 'piece') * 100) / 100
	const normalized = normalizeToBaseUnit(
		product.unit,
		selectedUnit,
		si.quantity || 1,
		rawRateSelected,
	)

	const ref = normalized.unit === 'piece' ? normalizedRef : refSelected
	const rawRate = Math.round(normalized.rate * 100) / 100
	const s = syncFromRate(ref, rawRate)
	return {
		id: genId(),
		productId: product._id,
		productTitle: product.title,
		quantity: normalized.quantity,
		unitStr: product.unit || '',
		unit: normalized.unit,
		referenceRate: ref,
		rate: s.rate,
		discountPercent: s.discountPercent,
	}
}

export type SimpleLineItem = {
	id: string
	productId: string
	productTitle: string
	quantity: number
	unit: string
	unitStr: string
	rate: number
}

export function lineFromMatchedOrderTrip<T extends CatalogProductForScan>(
	si: ScannedLineInput,
	product: T,
	genId: () => string,
): SimpleLineItem {
	const selectedUnit = pickLineUnit(product.unit, si)
	const derivedSelected =
		Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, selectedUnit) * 100) / 100
	const rawRateSelected =
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : derivedSelected

	const normalizedDerived =
		Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, 'piece') * 100) / 100
	const normalized = normalizeToBaseUnit(
		product.unit,
		selectedUnit,
		si.quantity || 1,
		rawRateSelected,
	)
	return {
		id: genId(),
		productId: product._id,
		productTitle: product.title,
		quantity: normalized.quantity,
		unitStr: product.unit || '',
		unit: normalized.unit,
		rate: Math.round((normalized.unit === 'piece' ? normalized.rate : rawRateSelected) * 100) / 100
			|| (normalized.unit === 'piece' ? normalizedDerived : derivedSelected),
	}
}

export function lineFromUnmatchedScan(
	si: ScannedLineInput,
	genId: () => string,
): SimpleLineItem {
	const selectedUnit = si.unit || 'piece'
	const normalized = normalizeToBaseUnit(
		si.unitStr || '',
		selectedUnit,
		si.quantity || 1,
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : 0,
	)

	return {
		id: genId(),
		productId: '',
		productTitle: si.productTitle,
		quantity: normalized.quantity,
		unitStr: si.unitStr || '',
		unit: normalized.unit,
		rate: Math.round(normalized.rate * 100) / 100,
	}
}

export function lineFromUnmatchedStockSale(
	si: ScannedLineInput,
	genId: () => string,
): BillLineItem {
	const selectedUnit = si.unit || 'piece'
	const normalized = normalizeToBaseUnit(
		si.unitStr || '',
		selectedUnit,
		si.quantity || 1,
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : 0,
	)

	return {
		id: genId(),
		productId: '',
		productTitle: si.productTitle,
		quantity: normalized.quantity,
		unitStr: si.unitStr || '',
		unit: normalized.unit,
		rate: Math.round(normalized.rate * 100) / 100,
		referenceRate: 0,
		discountPercent: 0,
	}
}
