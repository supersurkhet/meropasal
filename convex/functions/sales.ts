import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";
import { calculateFiscalYear } from "../lib/nepaliCalendar";
import {
  aggregateStockBookEntries,
  getProductPartyAvailability,
} from "../lib/stockAggregation";

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    saleDate: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productTitle: v.string(),
        quantity: v.number(),
        rate: v.number(),
        unit: v.optional(v.string()),
      })
    ),
    payments: v.optional(
      v.array(
        v.object({
          paidAt: v.string(),
          paidAmount: v.number(),
          paymentMethod: v.union(
            v.literal("cash"),
            v.literal("card"),
            v.literal("bankTransfer"),
            v.literal("credit"),
            v.literal("online"),
            v.literal("check")
          ),
          bankVoucherNumber: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'sales:create');

    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (!customer || customer.orgId !== orgId)
        throw new Error("Customer not found");
    }

    const fiscalYear = calculateFiscalYear(args.saleDate);

    // Validate stock availability
    const allEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const aggregate = aggregateStockBookEntries(allEntries);

    for (const item of args.items) {
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
          `Insufficient stock for ${item.productTitle}: available ${available}, requested ${item.quantity}`
        );
      }
    }

    // Build invoice items
    const invoiceItems = args.items.map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle,
      quantity: item.quantity,
      rate: item.rate,
      total: item.quantity * item.rate,
      unit: item.unit,
    }));

    const subTotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);
    const payments = args.payments ?? [];
    const paidAmount = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const paymentStatus =
      paidAmount === 0
        ? "pending" as const
        : paidAmount >= subTotal
          ? "paid" as const
          : "partial" as const;

    // Get or create invoice counter
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

    // Create sale invoice
    const invoiceId = await ctx.db.insert("invoices", {
      orgId,
      type: "sale",
      invoiceNumber,
      partyId: args.customerId,
      partyType: "customer",
      issuedAt: args.saleDate,
      items: invoiceItems,
      subTotal,
      tax: 0,
      totalAmount: subTotal,
      payments,
      paidAmount,
      paymentStatus,
      fiscalYear,
    });

    // Create stock book entries (out)
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      const total = item.quantity * item.rate;
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: args.saleDate,
        transactionType: "sale",
        movementType: "sale",
        direction: "out",
        productId: item.productId,
        quantityIn: 0,
        quantityOut: item.quantity,
        quantity: item.quantity,
        unitRate: item.rate,
        totalAmount: total,
        particulars: `Sale`,
        sourceTable: "sale",
        sourceId: invoiceId,
        counterpartyId: args.customerId,
        originPartyId: product.purchasePartyId,
        fiscalYear,
      });
    }

    // Check for low stock and create notifications
    // Re-fetch entries after the sale stock book entries were created
    const updatedEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const updatedAggregate = aggregateStockBookEntries(updatedEntries);

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product || !product.reorderLevel) continue;

      const currentStock = getProductPartyAvailability(
        updatedAggregate,
        item.productId,
        product.purchasePartyId,
      );

      if (currentStock <= product.reorderLevel) {
        await ctx.db.insert("notifications", {
          orgId,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${product.title} is low on stock (${currentStock} remaining, reorder level: ${product.reorderLevel})`,
          entityType: "products",
          entityId: item.productId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return invoiceId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("invoices")
      .withIndex("by_orgId_type", (q) =>
        q.eq("orgId", orgId).eq("type", "sale")
      )
      .collect();
  },
});
