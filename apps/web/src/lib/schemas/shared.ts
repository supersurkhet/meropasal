import { z } from 'zod/v4'

// Nepal phone: mobile (98/97/96xx) or landline (0XX-XXXXXXX)
const nepaliPhoneRegex = /^(9[6-9]\d{8}|0\d{1,2}-?\d{6,7})$/

// Nepal PAN: exactly 9 digits
const panRegex = /^\d{9}$/

// Fiscal year: YY/YY format (e.g. "82/83")
const fiscalYearRegex = /^\d{2}\/\d{2}$/

/**
 * Optional phone field that accepts empty string (from $state(''))
 * and validates Nepal phone format when non-empty.
 */
export const optionalNepaliPhone = z
	.string()
	.transform((v) => v.trim() || undefined)
	.pipe(
		z
			.string()
			.regex(nepaliPhoneRegex, 'Invalid phone number (e.g. 9841234567 or 083-520123)')
			.optional(),
	)

/**
 * Optional PAN field that accepts empty string
 * and validates 9-digit format when non-empty.
 */
export const optionalPanNumber = z
	.string()
	.transform((v) => v.trim() || undefined)
	.pipe(z.string().regex(panRegex, 'PAN must be 9 digits').optional())

/**
 * Required fiscal year in YY/YY format.
 */
export const fiscalYear = z.string().regex(fiscalYearRegex, 'Format must be YY/YY (e.g. 82/83)')

/** Non-negative number for prices, rates, amounts */
export const positiveAmount = z.number().min(0, 'Amount must be 0 or more')

/** Positive integer for quantities (at least 1) */
export const positiveQuantity = z.number().min(1, 'Quantity must be at least 1')

/**
 * Extract field errors from a Zod safeParse result into a flat Record.
 * Handles nested paths like "payments.0.bankVoucherNumber" → "payments.0.bankVoucherNumber".
 */
export function extractErrors(
	issues: z.core.$ZodIssue[],
): Record<string, string> {
	const errors: Record<string, string> = {}
	for (const issue of issues) {
		const path = issue.path.join('.')
		if (!errors[path]) {
			errors[path] = issue.message
		}
	}
	return errors
}
