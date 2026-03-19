/**
 * NPR currency formatting utilities.
 * Locale-aware: shows "रु." in Nepali, "NPR" in English.
 * Uses Indian number grouping (lakhs/crores) for both locales.
 */
import { currentLanguage } from '$lib/t.svelte'

export function formatNPR(amount: number, compact = false): string {
	if (!Number.isFinite(amount)) return compact ? 'रु. 0' : 'रु. 0.00'
	const formatted = new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: compact ? 0 : 2,
		maximumFractionDigits: compact ? 0 : 2,
	}).format(amount)
	const prefix = currentLanguage.value === 'ne' ? 'रु.' : 'NPR'
	return `${prefix} ${formatted}`
}

export function formatNumber(amount: number): string {
	if (!Number.isFinite(amount)) return '0.00'
	return new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount)
}
