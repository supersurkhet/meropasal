import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";
import { paymentValidator } from "../lib/validators";
import { computePaidAmount, computePaymentStatus } from "../lib/paymentStatus";
import { validatePayments } from "../lib/validation";

const AMOUNT_EPS = 0.005;

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("purchase"), v.literal("sale"))),
    fiscalYear: v.optional(v.string()),
    paymentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("partial"),
        v.literal("overpaid")
      )
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];

    let invoices;
    if (args.type) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_orgId_type", (q) =>
          q.eq("orgId", orgId).eq("type", args.type!)
        )
        .collect();
    } else if (args.fiscalYear) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_orgId_fiscal", (q) =>
          q.eq("orgId", orgId).eq("fiscalYear", args.fiscalYear!)
        )
        .collect();
    } else {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    if (args.paymentStatus) {
      invoices = invoices.filter((i) => i.paymentStatus === args.paymentStatus);
    }
    if (args.fiscalYear && args.type) {
      invoices = invoices.filter((i) => i.fiscalYear === args.fiscalYear);
    }

    return invoices;
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, { id }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const invoice = await ctx.db.get(id);
    if (!invoice || invoice.orgId !== orgId) return null;
    return invoice;
  },
});

export const getByParty = query({
  args: { partyId: v.string() },
  handler: async (ctx, { partyId }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("invoices")
      .withIndex("by_orgId_party", (q) =>
        q.eq("orgId", orgId).eq("partyId", partyId)
      )
      .collect();
  },
});

export const addPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    payment: paymentValidator,
  },
  handler: async (ctx, { invoiceId, payment }) => {
    const orgId = await requirePermission(ctx, "invoices:recordPayment");
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.orgId !== orgId) {
      throw new Error("Invoice not found");
    }
    const currentPaid = computePaidAmount(invoice.payments);
    const remaining = invoice.totalAmount - currentPaid;
    if (remaining <= AMOUNT_EPS) {
      throw new Error("Invoice is already fully paid");
    }
    if (payment.paidAmount <= 0) {
      throw new Error("Payment amount must be positive");
    }
    if (payment.paidAmount > remaining + AMOUNT_EPS) {
      throw new Error("Payment exceeds balance due");
    }
    validatePayments([payment]);
    const payments = [...invoice.payments, payment];
    const paidAmount = computePaidAmount(payments);
    const paymentStatus = computePaymentStatus(paidAmount, invoice.totalAmount);
    await ctx.db.patch(invoiceId, {
      payments,
      paidAmount,
      paymentStatus: paymentStatus as
        | "pending"
        | "paid"
        | "partial"
        | "overpaid",
    });
  },
});
