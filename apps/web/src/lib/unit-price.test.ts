import { describe, it, expect } from 'vitest'
import { parseUnit, formatUnit, deriveUnitPrice, getAvailableUnits } from './unit-price'

describe('parseUnit', () => {
	it('defaults empty to piece x1', () => {
		expect(parseUnit('')).toEqual({ baseUnit: 'piece', piecesPerUnit: 1 })
	})

	it('parses compound box:12', () => {
		expect(parseUnit('box:12')).toEqual({ baseUnit: 'box', piecesPerUnit: 12 })
	})

	it('ignores invalid count', () => {
		expect(parseUnit('box:0').piecesPerUnit).toBe(1)
	})
})

describe('deriveUnitPrice', () => {
	it('returns base for simple unit', () => {
		expect(deriveUnitPrice(100, 'piece', 'piece')).toBe(100)
	})

	it('returns full box price when selected unit is box', () => {
		expect(deriveUnitPrice(1200, 'box:12', 'box')).toBe(1200)
	})

	it('divides by pieces when piece selected on compound unit', () => {
		expect(deriveUnitPrice(1200, 'box:12', 'piece')).toBe(100)
	})
})

describe('getAvailableUnits', () => {
	it('returns base only for simple unit', () => {
		expect(getAvailableUnits('kg')).toEqual(['kg'])
	})

	it('returns box and piece for compound', () => {
		expect(getAvailableUnits('box:20')).toEqual(['box', 'piece'])
	})
})

describe('formatUnit', () => {
	it('formats compound for display', () => {
		expect(formatUnit('box:12')).toContain('12')
	})
})
