export function computePaymentStatus(
  paidAmount: number,
  totalAmount: number
): string {
  if (totalAmount === 0) return "paid";
  if (paidAmount === 0) return "pending";
  if (paidAmount === totalAmount) return "paid";
  if (paidAmount > totalAmount) return "overpaid";
  return "partial";
}

export function computePaidAmount(
  payments: { paidAmount: number }[]
): number {
  return payments.reduce((sum, p) => sum + p.paidAmount, 0);
}

export function formatPaymentStatus(
  status: string,
  paidAmount: number,
  totalAmount: number
): string {
  if (status === "partial") {
    const remaining = totalAmount - paidAmount;
    return `partial (${remaining} to pay)`;
  }
  return status;
}
