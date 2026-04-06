export function fallbackSellingPrice(costPrice: number): number {
	const normalizedCost = Number.isFinite(costPrice) ? Math.max(0, costPrice) : 0
	return Math.round(normalizedCost * 1.1 * 100) / 100
}

export function normalizeSellingPrice(costPrice: number, sellingPrice?: number | null): number {
	const normalizedCost = Number.isFinite(costPrice) ? Math.max(0, costPrice) : 0
	const normalizedSelling = Number.isFinite(sellingPrice) ? Number(sellingPrice) : NaN

	if (normalizedCost <= 0) {
		return Number.isFinite(normalizedSelling) && normalizedSelling > 0 ? normalizedSelling : 0
	}

	if (!Number.isFinite(normalizedSelling) || normalizedSelling < normalizedCost) {
		return fallbackSellingPrice(normalizedCost)
	}

	return Math.round(normalizedSelling * 100) / 100
}
