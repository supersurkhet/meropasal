/**
 * Centralized date formatting utilities.
 * Automatically switches between Gregorian (AD) and Bikram Sambat (BS)
 * based on the current language setting.
 */
import NepaliDate from 'nepali-datetime'
import { currentLanguage } from '$lib/t.svelte'

// ---------------------------------------------------------------------------
// Nepali month names
// ---------------------------------------------------------------------------

const BS_MONTHS_EN = [
	'Baisakh', 'Jestha', 'Ashadh', 'Shrawan',
	'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
	'Poush', 'Magh', 'Falgun', 'Chaitra',
]

const BS_MONTHS_NE = [
	'बैशाख', 'जेठ', 'असार', 'श्रावण',
	'भदौ', 'असोज', 'कार्तिक', 'मंसिर',
	'पौष', 'माघ', 'फाल्गुण', 'चैत्र',
]

const BS_DAYS_SHORT_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']

// ---------------------------------------------------------------------------
// Devanagari numeral conversion
// ---------------------------------------------------------------------------

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

function toDevanagari(num: number): string {
	return String(num).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)])
}

// ---------------------------------------------------------------------------
// Core formatting
// ---------------------------------------------------------------------------

function isNepali(): boolean {
	return currentLanguage.value === 'ne'
}

/**
 * Format an ISO date string for display.
 * In Nepali mode, converts to BS with Devanagari output.
 */
export function formatDate(iso: string, style: 'short' | 'medium' | 'long' = 'medium'): string {
	if (!iso) return ''
	try {
		if (isNepali()) {
			const nd = new NepaliDate(new Date(iso))
			return formatBsDate(nd, style)
		}
		const date = new Date(iso)
		switch (style) {
			case 'short':
				return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
			case 'medium':
				return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
			case 'long':
				return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
		}
	} catch {
		return iso
	}
}

/**
 * Format a timestamp (like Convex _creationTime) for display.
 */
export function formatTimestamp(ts: number, style: 'short' | 'medium' | 'long' = 'medium'): string {
	if (!ts) return ''
	return formatDate(new Date(ts).toISOString().split('T')[0], style)
}

/**
 * Format an ISO datetime string with time component.
 */
export function formatDateTime(iso: string): string {
	if (!iso) return ''
	try {
		const date = new Date(iso)
		if (isNepali()) {
			const nd = new NepaliDate(date)
			const h = date.getHours()
			const m = date.getMinutes()
			const timeStr = `${toDevanagari(h)}:${toDevanagari(m).padStart(2, '०')}`
			return `${formatBsDate(nd, 'medium')} ${timeStr}`
		}
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	} catch {
		return iso
	}
}

function formatBsDate(nd: NepaliDate, style: 'short' | 'medium' | 'long'): string {
	const y = nd.getYear()
	const m = nd.getMonth()
	const d = nd.getDate()

	switch (style) {
		case 'short':
			return `${toDevanagari(y)}-${toDevanagari(m + 1).padStart(2, '०')}-${toDevanagari(d).padStart(2, '०')}`
		case 'medium':
			return `${BS_MONTHS_NE[m]} ${toDevanagari(d)}, ${toDevanagari(y)}`
		case 'long':
			return `${toDevanagari(d)} ${BS_MONTHS_NE[m]} ${toDevanagari(y)}`
	}
}

// ---------------------------------------------------------------------------
// Calendar helpers (for DatePicker component)
// ---------------------------------------------------------------------------

export interface BsCalendarData {
	year: number
	month: number
	daysInMonth: number
	firstDayOfWeek: number
	monthName: string
	monthNameNe: string
}

/**
 * Get calendar grid data for a given BS year and month.
 */
export function getBsCalendarData(year: number, month: number): BsCalendarData {
	const daysInMonth = NepaliDate.getDaysOfMonth(year, month)
	const firstDay = new NepaliDate(year, month, 1)
	return {
		year,
		month,
		daysInMonth,
		firstDayOfWeek: firstDay.getDay(),
		monthName: BS_MONTHS_EN[month],
		monthNameNe: BS_MONTHS_NE[month],
	}
}

/**
 * Convert BS date components to AD ISO string.
 */
export function bsToAdIso(year: number, month: number, day: number): string {
	const nd = new NepaliDate(year, month, day)
	const ad = nd.getDateObject()
	return ad.toISOString().split('T')[0]
}

/**
 * Convert AD ISO string to BS date components.
 */
export function adToBsComponents(iso: string): { year: number; month: number; day: number } {
	const nd = new NepaliDate(new Date(iso))
	return {
		year: nd.getYear(),
		month: nd.getMonth(),
		day: nd.getDate(),
	}
}

/**
 * Get today's BS date components.
 */
export function getTodayBs(): { year: number; month: number; day: number } {
	const nd = new NepaliDate()
	return {
		year: nd.getYear(),
		month: nd.getMonth(),
		day: nd.getDate(),
	}
}

export { BS_MONTHS_NE, BS_DAYS_SHORT_NE, toDevanagari }
