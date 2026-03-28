/**
 * Shared runtime validation helpers for Convex mutations.
 * Convex validators (v.*) only do type checking — these add business rules.
 */

const NEPALI_PHONE_REGEX = /^(9[6-9]\d{8}|0\d{1,2}-?\d{6,7})$/;
const PAN_REGEX = /^\d{9}$/;
const FISCAL_YEAR_REGEX = /^\d{2}\/\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(phone: string | undefined): void {
  if (phone && !NEPALI_PHONE_REGEX.test(phone)) {
    throw new Error("Invalid phone number format (e.g. 9841234567 or 083-520123)");
  }
}

export function validatePanNumber(panNumber: string | undefined): void {
  if (panNumber && !PAN_REGEX.test(panNumber)) {
    throw new Error("PAN must be exactly 9 digits");
  }
}

export function validateEmail(email: string | undefined): void {
  if (email && !EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email address");
  }
}

export function validateFiscalYear(fiscalYear: string): void {
  if (!FISCAL_YEAR_REGEX.test(fiscalYear)) {
    throw new Error("Fiscal year must be in YY/YY format (e.g. 82/83)");
  }
}

export function validateCreditLimit(creditLimit: number | undefined): void {
  if (creditLimit !== undefined && creditLimit < 0) {
    throw new Error("Credit limit must be non-negative");
  }
}

export function validateInvoiceItems(
  items: Array<{ quantity: number; rate: number }>
): void {
  for (let i = 0; i < items.length; i++) {
    if (items[i].quantity < 1) {
      throw new Error(`Item ${i + 1}: Quantity must be at least 1`);
    }
    if (items[i].rate < 0) {
      throw new Error(`Item ${i + 1}: Rate must be non-negative`);
    }
  }
}

export function validateTripProducts(
  products: Array<{ quantity: number; unitPrice: number }>
): void {
  for (let i = 0; i < products.length; i++) {
    if (products[i].quantity < 1) {
      throw new Error(`Product ${i + 1}: Quantity must be at least 1`);
    }
    if (products[i].unitPrice < 0) {
      throw new Error(`Product ${i + 1}: Unit price must be non-negative`);
    }
  }
}

export function validatePayments(
  payments: Array<{
    paidAmount: number;
    paymentMethod: string;
    bankVoucherNumber?: string;
  }>
): void {
  for (let i = 0; i < payments.length; i++) {
    if (payments[i].paidAmount < 0) {
      throw new Error(`Payment ${i + 1}: Amount must be non-negative`);
    }
    const method = payments[i].paymentMethod;
    if (
      (method === "bankTransfer" || method === "check") &&
      !payments[i].bankVoucherNumber?.trim()
    ) {
      throw new Error(
        `Payment ${i + 1}: Voucher number is required for ${method}`
      );
    }
  }
}
