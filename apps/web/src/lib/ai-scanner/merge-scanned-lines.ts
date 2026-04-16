import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price'
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

export function lineFromMatchedStockImport<T extends CatalogProductForScan>(
	si: ScannedLineInput,
	product: T,
	genId: () => string,
): BillLineItem {
	const units = getAvailableUnits(product.unit)
	const defaultUnit = units[0] || 'piece'
	const ref =
		Math.round(deriveUnitPrice(product.costPrice ?? 0, product.unit, defaultUnit) * 100) / 100
	const rawRate =
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : ref
	const s = syncFromRate(ref, rawRate)
	return {
		id: genId(),
		productId: product._id,
		productTitle: product.title,
		quantity: si.quantity || 1,
		unitStr: product.unit || '',
		unit: defaultUnit,
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
	const units = getAvailableUnits(product.unit)
	const defaultUnit = units[0] || 'piece'
	const ref =
		Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, defaultUnit) * 100) / 100
	const rawRate =
		si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : ref
	const s = syncFromRate(ref, rawRate)
	return {
		id: genId(),
		productId: product._id,
		productTitle: product.title,
		quantity: si.quantity || 1,
		unitStr: product.unit || '',
		unit: defaultUnit,
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
	const units = getAvailableUnits(product.unit)
	const defaultUnit = units[0] || 'piece'
	const derived =
		Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, defaultUnit) * 100) / 100
	return {
		id: genId(),
		productId: product._id,
		productTitle: product.title,
		quantity: si.quantity || 1,
		unitStr: product.unit || '',
		unit: defaultUnit,
		rate: si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : derived,
	}
}

export function lineFromUnmatchedScan(
	si: ScannedLineInput,
	genId: () => string,
): SimpleLineItem {
	return {
		id: genId(),
		productId: '',
		productTitle: si.productTitle,
		quantity: si.quantity || 1,
		unitStr: si.unitStr || '',
		unit: si.unit || 'piece',
		rate: si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : 0,
	}
}

export function lineFromUnmatchedStockSale(
	si: ScannedLineInput,
	genId: () => string,
): BillLineItem {
	return {
		id: genId(),
		productId: '',
		productTitle: si.productTitle,
		quantity: si.quantity || 1,
		unitStr: si.unitStr || '',
		unit: si.unit || 'piece',
		rate: si.rate != null && Number.isFinite(Number(si.rate)) ? Number(si.rate) : 0,
		referenceRate: 0,
		discountPercent: 0,
	}
}
