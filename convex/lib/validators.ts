import { v } from "convex/values";

export const paymentMethodValidator = v.union(
  v.literal("cash"),
  v.literal("card"),
  v.literal("bankTransfer"),
  v.literal("credit"),
  v.literal("online"),
  v.literal("check")
);

export const paymentValidator = v.object({
  paidAt: v.string(),
  paidAmount: v.number(),
  paymentMethod: paymentMethodValidator,
  bankVoucherNumber: v.optional(v.string()),
});

export const invoiceItemValidator = v.object({
  productId: v.id("products"),
  productTitle: v.string(),
  quantity: v.number(),
  rate: v.number(),
  total: v.number(),
  unit: v.optional(v.string()),
});

export const tripProductValidator = v.object({
  productId: v.id("products"),
  productTitle: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  unit: v.optional(v.string()),
});
