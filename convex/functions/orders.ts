import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requireOrg, requirePermission } from "../lib/orgGuard";
import { paymentValidator } from "../lib/validators";
import { computePaidAmount, computePaymentStatus } from "../lib/paymentStatus";
import { calculateFiscalYear } from "../lib/nepaliCalendar";
import { validateInvoiceItems, validatePayments } from "../lib/validation";
import {
  aggregateStockBookEntries,
  getProductPartyAvailability,
} from "../lib/stockAggregation";

const orderItemValidator = v.object({
  productId: v.id("products"),
  productTitle: v.string(),
  quantity: v.number(),
  rate: v.number(),
  unit: v.optional(v.string()),
});

export const list = query({
  args: {
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
    // Orders are sale invoices without an invoiceNumber (not yet fulfilled)
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId_type", (q) =>
        q.eq("orgId", orgId).eq("type", "sale")
      )
      .collect();

    let orders = invoices.filter((i) => !i.invoiceNumber);
    if (args.paymentStatus) {
      orders = orders.filter((o) => o.paymentStatus === args.paymentStatus);
    }
    return orders;
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

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    orderDate: v.string(),
    items: v.array(orderItemValidator),
    payments: v.optional(v.array(paymentValidator)),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'orders:create');
    validateInvoiceItems(args.items);
    if (args.payments) validatePayments(args.payments);

    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (!customer || customer.orgId !== orgId)
        throw new Error("Customer not found");
    }

    const items = args.items.map((item) => ({
      ...item,
      total: item.quantity * item.rate,
    }));
    const subTotal = items.reduce((sum, i) => sum + i.total, 0);
    const payments = args.payments ?? [];
    const paidAmount = computePaidAmount(payments);
    const paymentStatus = computePaymentStatus(paidAmount, subTotal);
    const fiscalYear = calculateFiscalYear(args.orderDate);

    // Create as a pending sale invoice (no invoiceNumber = order)
    const invoiceId = await ctx.db.insert("invoices", {
      orgId,
      type: "sale",
      partyId: args.customerId,
      partyType: "customer",
      issuedAt: args.orderDate,
      items,
      subTotal,
      tax: 0,
      totalAmount: subTotal,
      payments,
      paidAmount,
      paymentStatus: paymentStatus as
        | "pending"
        | "paid"
        | "partial"
        | "overpaid",
      fiscalYear,
      description: args.notes,
    });

    return invoiceId;
  },
});

export const addPayment = mutation({
  args: {
    orderId: v.id("invoices"),
    payment: paymentValidator,
  },
  handler: async (ctx, { orderId, payment }) => {
    const orgId = await requireOrg(ctx);
    const order = await ctx.db.get(orderId);
    if (!order || order.orgId !== orgId) throw new Error("Order not found");

    const payments = [...order.payments, payment];
    const paidAmount = computePaidAmount(payments);
    const paymentStatus = computePaymentStatus(paidAmount, order.totalAmount);

    await ctx.db.patch(orderId, {
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

export const markDone = mutation({
  args: { orderId: v.id("invoices") },
  handler: async (ctx, { orderId }) => {
    const orgId = await requirePermission(ctx, 'orders:fulfill');
    const order = await ctx.db.get(orderId);
    if (!order || order.orgId !== orgId) throw new Error("Order not found");

    // Validate stock availability
    const allEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const aggregate = aggregateStockBookEntries(allEntries);

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product || product.orgId !== orgId)
        throw new Error(`Product not found: ${item.productId}`);

      const available = getProductPartyAvailability(
        aggregate,
        item.productId,
        product.purchasePartyId,
      );
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productTitle}: available ${available}, requested ${item.quantity}`,
        );
      }
    }

    // Generate invoice number
    const fiscalYear = order.fiscalYear;
    let counter = await ctx.db
      .query("invoiceCounters")
      .withIndex("by_orgId_fiscal_type", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "sale")
      )
      .first();

    if (!counter) {
      const counterId = await ctx.db.insert("invoiceCounters", {
        orgId,
        fiscalYear,
        type: "sale",
        count: 0,
      });
      counter = (await ctx.db.get(counterId))!;
    }

    const nextCount = counter.count + 1;
    await ctx.db.patch(counter._id, { count: nextCount });
    const invoiceNumber = `SAL-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

    await ctx.db.patch(orderId, { invoiceNumber });

    // Create stock book entries (out)
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: order.issuedAt,
        transactionType: "sale",
        movementType: "order",
        direction: "out",
        productId: item.productId,
        quantityIn: 0,
        quantityOut: item.quantity,
        quantity: item.quantity,
        unitRate: item.rate,
        totalAmount: item.total,
        particulars: `Order fulfilled`,
        sourceTable: "order",
        sourceId: orderId,
        counterpartyId: order.partyId,
        originPartyId: product.purchasePartyId,
        fiscalYear,
      });
    }

    // Create order fulfilled notification
    await ctx.db.insert("notifications", {
      orgId,
      type: "order_status",
      title: "Order Fulfilled",
      message: `Order ${invoiceNumber} has been marked as done`,
      entityType: "invoices",
      entityId: orderId,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});

export const cancel = mutation({
  args: { orderId: v.id("invoices") },
  handler: async (ctx, { orderId }) => {
    const orgId = await requirePermission(ctx, 'orders:cancel');
    const order = await ctx.db.get(orderId);
    if (!order || order.orgId !== orgId) throw new Error("Order not found");
    if (order.invoiceNumber)
      throw new Error("Cannot cancel a fulfilled order");

    await ctx.db.delete(orderId);

    // Create order cancelled notification
    await ctx.db.insert("notifications", {
      orgId,
      type: "order_status",
      title: "Order Cancelled",
      message: `An order worth NPR ${order.totalAmount.toLocaleString()} has been cancelled`,
      entityType: "orders",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});
