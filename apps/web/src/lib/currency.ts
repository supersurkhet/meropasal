/**
 * NPR currency formatting utilities.
 */

const nprFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'NPR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const nprFormatterCompact = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'NPR',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export function formatNPR(amount: number, compact = false): string {
	if (!Number.isFinite(amount)) return 'Rs. 0.00';
	return (compact ? nprFormatterCompact : nprFormatter).format(amount);
}

export function formatNumber(amount: number): string {
	if (!Number.isFinite(amount)) return '0.00';
	return new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}
