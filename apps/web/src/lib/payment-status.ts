/**
 * Payment status derivation — computes payment status from amounts.
 * Ported from supersurkhet/apps/site/src/config/payment-status-derivation.ts
 */

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overpaid'

export type Payment = {
	paidAmount?: number | null
	amount?: number | null
}

export function computePaymentStatus(paidAmount: number, totalAmount: number): PaymentStatus {
	if (totalAmount <= 0) return 'paid'
	if (paidAmount <= 0) return 'pending'
	if (paidAmount >= totalAmount) {
		return paidAmount > totalAmount ? 'overpaid' : 'paid'
	}
	return 'partial'
}

export function computePaidAmount(payments: Payment[]): number {
	if (!Array.isArray(payments) || !payments.length) return 0
	return payments.reduce((sum, p) => {
		if (!p) return sum
		const amount = Number(p.paidAmount ?? p.amount ?? 0)
		return sum + (Number.isFinite(amount) ? amount : 0)
	}, 0)
}

export function formatPaymentStatus(
	status: PaymentStatus,
	paidAmount: number,
	totalAmount: number,
	locale: string = 'en',
): string {
	const formatter = new Intl.NumberFormat(locale === 'ne' ? 'ne-NP' : 'en-NP', {
		style: 'currency',
		currency: 'NPR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	})

	switch (status) {
		case 'paid':
			return 'Paid'
		case 'pending':
			return 'Pending'
		case 'overpaid':
			return 'Overpaid (invalid)'
		case 'partial': {
			const remaining = formatter.format(totalAmount - paidAmount)
			return `Partial (${remaining} to pay)`
		}
	}
}
