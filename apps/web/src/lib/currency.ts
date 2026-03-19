/**
 * NPR currency formatting utilities.
 * Locale-aware: shows "रु." with Devanagari numerals in Nepali, "NPR" with Arabic in English.
 * Uses Indian number grouping (lakhs/crores) for both locales.
 */
import { currentLanguage } from '$lib/t.svelte'

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

function toDevanagari(str: string): string {
	return str.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[parseInt(d)])
}

export function formatNPR(amount: number, compact = false): string {
	if (!Number.isFinite(amount)) return compact ? 'रु. 0' : 'रु. 0.00'
	const formatted = new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: compact ? 0 : 2,
		maximumFractionDigits: compact ? 0 : 2,
	}).format(amount)
	if (currentLanguage.value === 'ne') {
		return `रु. ${toDevanagari(formatted)}`
	}
	return `NPR ${formatted}`
}

export function formatNumber(amount: number): string {
	if (!Number.isFinite(amount)) return '0.00'
	const formatted = new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount)
	return currentLanguage.value === 'ne' ? toDevanagari(formatted) : formatted
}

/**
 * Format a count/integer for display. Uses Devanagari numerals in Nepali mode.
 */
export function formatCount(n: number): string {
	const s = String(n)
	return currentLanguage.value === 'ne' ? toDevanagari(s) : s
}
