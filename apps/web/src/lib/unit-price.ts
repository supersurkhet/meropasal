/**
 * Unit price derivation for compound units (e.g. "box:12" means 12 pieces per box).
 * Ported from supersurkhet/apps/site/src/config/unit-price-derivation.ts
 */

export type ParsedUnit = {
	baseUnit: string
	piecesPerUnit: number
}

export function parseUnit(unitStr: string | null | undefined): ParsedUnit {
	const raw = String(unitStr ?? '').trim()
	if (!raw) return { baseUnit: 'piece', piecesPerUnit: 1 }

	const [baseUnit, countStr] = raw.split(':')
	if (!countStr) return { baseUnit: baseUnit || 'piece', piecesPerUnit: 1 }

	const piecesPerUnit = Number(countStr)
	if (!Number.isFinite(piecesPerUnit) || piecesPerUnit <= 0) {
		return { baseUnit: baseUnit || 'piece', piecesPerUnit: 1 }
	}

	return { baseUnit, piecesPerUnit }
}

export function formatUnit(unitStr: string | null | undefined): string {
	const parsed = parseUnit(unitStr)
	if (parsed.piecesPerUnit > 1) {
		return `${parsed.baseUnit} of ${parsed.piecesPerUnit} pcs`
	}
	return parsed.baseUnit
}

export function deriveUnitPrice(
	basePrice: number,
	unitStr: string | null | undefined,
	selectedUnit: string | null | undefined,
): number {
	const normalizedBasePrice = Number(basePrice)
	if (!Number.isFinite(normalizedBasePrice)) return 0

	const parsed = parseUnit(unitStr)
	if (parsed.piecesPerUnit === 1) return normalizedBasePrice

	const selected = String(selectedUnit ?? '').trim()

	// If no selection, or selection is the packed unit itself, return base price
	if (!selected || selected.includes(':') || selected === parsed.baseUnit) {
		return normalizedBasePrice
	}

	// If piece is selected, divide base price by pieces per unit
	if (selected === 'piece') {
		return normalizedBasePrice / parsed.piecesPerUnit
	}

	return normalizedBasePrice
}

export function getAvailableUnits(unitStr: string | null | undefined): string[] {
	const parsed = parseUnit(unitStr)
	if (parsed.piecesPerUnit === 1) return [parsed.baseUnit]
	return [parsed.baseUnit, 'piece']
}
