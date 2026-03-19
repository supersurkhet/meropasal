/**
 * Client-side Nepali fiscal year utilities.
 * Uses nepali-datetime for accurate BS ↔ AD conversion (unlike the Convex
 * server-side version which uses rough approximations to avoid the dependency).
 */
import NepaliDate from 'nepali-datetime'

const SHRAWAN = 3 // Fiscal year starts in Shrawan (4th month, 0-indexed = 3)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTwoDigitYear(year: number): number {
	return Number.isFinite(year) ? year % 100 : 0
}

function normalizeBsYearPart(yearPart: number): number {
	if (!Number.isFinite(yearPart)) return NaN
	if (yearPart >= 1000) return yearPart
	if (yearPart < 0) return NaN
	return 2000 + normalizeTwoDigitYear(yearPart)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Format a fiscal year string from the BS start year.
 * e.g. 2082 → '82/83'
 */
export function formatFiscalYearFromStartYear(startBsYear: number): string {
	const start = normalizeTwoDigitYear(startBsYear)
	const end = normalizeTwoDigitYear(startBsYear + 1)
	return `${String(start).padStart(2, '0')}/${String(end).padStart(2, '0')}`
}

/**
 * Parse a fiscal year string like '82/83' into full BS years.
 */
export function parseFiscalYear(
	fiscalYear: string,
): { startBsYear: number; endBsYear: number } | null {
	const parts = fiscalYear.split('/').map((p) => p.trim())
	if (parts.length < 2) return null

	const parsedStart = Number(parts[0])
	const parsedEnd = Number(parts[1])
	if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd)) return null

	const startBsYear = normalizeBsYearPart(parsedStart)
	if (!Number.isFinite(startBsYear)) return null

	let endBsYear = normalizeBsYearPart(parsedEnd)
	if (!Number.isFinite(endBsYear)) return null
	if (endBsYear < startBsYear) endBsYear += 100
	if (endBsYear <= startBsYear) endBsYear = startBsYear + 1

	return { startBsYear, endBsYear }
}

/**
 * Calculate the current (or given date's) Nepali fiscal year.
 * Uses nepali-datetime for accurate BS month detection.
 */
export function calculateFiscalYear(date?: Date): string {
	const ref = date ?? new Date()
	const nd = new NepaliDate(ref)
	const bsYear = nd.getYear()
	const bsMonth = nd.getMonth() // 0-indexed: Baisakh=0, Jestha=1, Ashadh=2, Shrawan=3 …

	// If we're in Shrawan or later, this year is the fiscal start; otherwise previous year.
	const startBsYear = bsMonth >= SHRAWAN ? bsYear : bsYear - 1
	return formatFiscalYearFromStartYear(startBsYear)
}

/**
 * Get AD date range for a fiscal year string.
 * Uses nepali-datetime to convert Shrawan 1 of each BS year to AD precisely.
 */
export function getFiscalYearDateRange(
	fiscalYear: string,
): { startDate: Date; endDate: Date } | null {
	const parsed = parseFiscalYear(fiscalYear)
	if (!parsed) return null

	// Shrawan 1 of the start BS year → AD start date
	const startNd = new NepaliDate(parsed.startBsYear, SHRAWAN, 1)
	const startDate = startNd.getDateObject()

	// Shrawan 1 of the end BS year → AD date, minus 1 ms for end of previous day
	const endNd = new NepaliDate(parsed.endBsYear, SHRAWAN, 1)
	const endDate = new Date(endNd.getDateObject().getTime() - 1)

	return { startDate, endDate }
}

/**
 * Get the next fiscal year string.
 * e.g. '82/83' → '83/84'
 */
export function getNextFiscalYear(fiscalYear: string): string {
	const parsed = parseFiscalYear(fiscalYear)
	if (!parsed) return fiscalYear
	return formatFiscalYearFromStartYear(parsed.startBsYear + 1)
}

/**
 * Sort comparator for fiscal year strings in descending order.
 * e.g. ['80/81', '82/83', '81/82'] → ['82/83', '81/82', '80/81']
 */
export function sortFiscalYearsDesc(a: string, b: string): number {
	const pa = parseFiscalYear(a)
	const pb = parseFiscalYear(b)
	if (!pa && !pb) return 0
	if (!pa) return 1
	if (!pb) return -1
	return pb.startBsYear - pa.startBsYear
}
