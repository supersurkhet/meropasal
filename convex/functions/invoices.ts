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


import { calculateFiscalYear } from "../lib/nepaliCalendar";
import { validateInvoiceItems } from "../lib/validation";

export const create = mutation({
  args: {
    type: v.union(v.literal("purchase"), v.literal("sale")),
    partyId: v.optional(v.id("parties")),
    partyType: v.optional(v.union(v.literal("supplier"), v.literal("customer"))),
    issuedAt: v.string(),
    dueDate: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productTitle: v.string(),
        quantity: v.number(),
        rate: v.number(),
        total: v.number(),
        unit: v.optional(v.string()),
      })
    ),
    tax: v.optional(v.number()),
    description: v.optional(v.string()),
    payments: v.optional(v.array(paymentValidator)),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, "invoices:create");
    validateInvoiceItems(args.items);

    const fiscalYear = calculateFiscalYear(args.issuedAt);

    // Get counter for invoice number
    const counterType = args.type;
    let counter = await ctx.db
      .query("invoiceCounters")
      .withIndex("by_orgId_fiscal_type", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", counterType)
      )
      .first();

    if (!counter) {
      const counterId = await ctx.db.insert("invoiceCounters", {
        orgId,
        fiscalYear,
        type: counterType,
        count: 0,
      });
      counter = (await ctx.db.get(counterId))!;
    }

    const nextCount = counter.count + 1;
    await ctx.db.patch(counter._id, { count: nextCount });
    const prefix = args.type === "purchase" ? "PUR" : "SAL";
    const invoiceNumber = `${prefix}-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

    const subTotal = args.items.reduce((sum, i) => sum + i.total, 0);
    const tax = args.tax ?? 0;
    const totalAmount = subTotal + tax;
    const payments = args.payments ?? [];
    const paidAmount = payments.reduce((sum, p) => sum + p.paidAmount, 0);

    let paymentStatus: "pending" | "paid" | "partial" | "overpaid" = "pending";
    if (paidAmount >= totalAmount - 0.005) {
      paymentStatus = "paid";
    } else if (paidAmount > 0.005) {
      paymentStatus = "partial";
    }

    const invoiceId = await ctx.db.insert("invoices", {
      orgId,
      type: args.type,
      invoiceNumber,
      partyId: args.partyId,
      partyType: args.partyType,
      issuedAt: args.issuedAt,
      dueDate: args.dueDate,
      items: args.items,
      subTotal,
      tax,
      totalAmount,
      payments,
      paidAmount,
      paymentStatus,
      fiscalYear,
      description: args.description,
    });

    return invoiceId;
  },
});
