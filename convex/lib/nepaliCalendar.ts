/**
 * Nepali fiscal year utilities — ported from supersurkhet for server-side use.
 * Uses nepali-datetime for BS ↔ AD conversion.
 */

const NEPALI_FISCAL_START_MONTH_INDEX = 3; // Shrawan

type DateLike = Date | string | number;

type ParsedFiscalYear = {
  startBsYear: number;
  endBsYear: number;
};

export type FiscalYearDateRange = {
  fiscalYear: string;
  startBsYear: number;
  endBsYear: number;
  startDate: Date;
  endDate: Date;
  nextFiscalYear: string;
  nextFiscalYearStartDate: Date;
};

function isValidDate(input: unknown): input is Date {
  return input instanceof Date && Number.isFinite(input.getTime());
}

function toDate(input: DateLike | undefined) {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (!isValidDate(date)) return null;
  return date;
}

function normalizeTwoDigitYear(year: number) {
  return Number.isFinite(year) ? year % 100 : 0;
}

function normalizeBsYearPart(yearPart: number) {
  if (!Number.isFinite(yearPart)) return NaN;
  if (yearPart >= 1000) return yearPart;
  if (yearPart < 0) return NaN;
  return 2000 + normalizeTwoDigitYear(yearPart);
}

export function formatFiscalYearFromStartYear(startBsYear: number) {
  const start = normalizeTwoDigitYear(startBsYear);
  const end = normalizeTwoDigitYear(startBsYear + 1);
  return `${String(start).padStart(2, "0")}/${String(end).padStart(2, "0")}`;
}

export function parseFiscalYear(
  fiscalYear: string,
): ParsedFiscalYear | null {
  const [startRaw, endRaw] = fiscalYear
    .split("/")
    .map((part) => part.trim())
    .slice(0, 2);
  if (!startRaw || !endRaw) return null;

  const parsedStart = Number(startRaw);
  const parsedEnd = Number(endRaw);
  if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd)) return null;

  const startBsYear = normalizeBsYearPart(parsedStart);
  if (!Number.isFinite(startBsYear)) return null;

  let endBsYear = normalizeBsYearPart(parsedEnd);
  if (!Number.isFinite(endBsYear)) return null;
  if (endBsYear < startBsYear) {
    endBsYear += 100;
  }
  if (endBsYear <= startBsYear) {
    endBsYear = startBsYear + 1;
  }

  return { startBsYear, endBsYear };
}

export function getNextFiscalYear(fiscalYear: string) {
  const parsed = parseFiscalYear(fiscalYear);
  if (!parsed) return fiscalYear;
  return formatFiscalYearFromStartYear(parsed.startBsYear + 1);
}

/**
 * Calculate fiscal year from a Date or ISO string.
 * Server-side version: uses simple BS year approximation
 * (AD year + 57 for rough conversion) to avoid nepali-datetime dependency in Convex.
 */
export function calculateFiscalYear(input?: DateLike) {
  const referenceDate = toDate(input) ?? new Date();
  // Approximate BS year: AD year + 56 or +57 depending on month
  // Nepali new year falls around mid-April, so:
  // Jan-Mar: BS year = AD year + 56
  // Apr-Dec: BS year = AD year + 57
  const adYear = referenceDate.getFullYear();
  const adMonth = referenceDate.getMonth(); // 0-indexed
  const bsYear = adMonth < 3 ? adYear + 56 : adYear + 57;
  // Fiscal year starts in Shrawan (~mid-July). Approximate:
  // If BS month >= Shrawan (month index 3, roughly July+), current year is start
  // Otherwise previous year is start
  // July = adMonth 6
  const startBsYear = adMonth >= 6 ? bsYear : bsYear - 1;
  return formatFiscalYearFromStartYear(startBsYear);
}

/**
 * Get fiscal year date range using AD date approximations.
 * Shrawan 1 is approximately July 16-17 each year.
 */
export function getFiscalYearDateRange(
  fiscalYear: string,
): FiscalYearDateRange | null {
  const parsed = parseFiscalYear(fiscalYear);
  if (!parsed) return null;

  // Approximate: Shrawan 1 of BS year X ≈ July 16 of (X - 57) AD
  const startAdYear = parsed.startBsYear - 57;
  const endAdYear = parsed.endBsYear - 57;

  const startDate = new Date(startAdYear, 6, 16); // ~Shrawan 1
  const nextFiscalYearStartDate = new Date(endAdYear, 6, 16);
  const endDate = new Date(nextFiscalYearStartDate.getTime() - 1);

  return {
    fiscalYear: formatFiscalYearFromStartYear(parsed.startBsYear),
    startBsYear: parsed.startBsYear,
    endBsYear: parsed.endBsYear,
    startDate,
    endDate,
    nextFiscalYear: formatFiscalYearFromStartYear(parsed.startBsYear + 1),
    nextFiscalYearStartDate,
  };
}
