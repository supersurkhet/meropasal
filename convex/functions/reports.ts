import { query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg } from "../lib/orgGuard";
import { aggregateStockBookEntries } from "../lib/stockAggregation";

export const dashboard = query({
  args: { fiscalYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      outstandingReceivables: 0,
      outstandingPayables: 0,
      lowStockCount: 0,
      totalSaleInvoices: 0,
      totalPurchaseInvoices: 0,
    };

    // Get invoices
    const allInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    const invoices = args.fiscalYear
      ? allInvoices.filter((i) => i.fiscalYear === args.fiscalYear)
      : allInvoices;

    const saleInvoices = invoices.filter((i) => i.type === "sale");
    const purchaseInvoices = invoices.filter((i) => i.type === "purchase");

    const totalRevenue = saleInvoices.reduce(
      (sum, i) => sum + i.totalAmount,
      0,
    );
    const totalExpenses = purchaseInvoices.reduce(
      (sum, i) => sum + i.totalAmount,
      0,
    );

    const outstandingReceivables = saleInvoices
      .filter((i) => i.paymentStatus !== "paid")
      .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

    const outstandingPayables = purchaseInvoices
      .filter((i) => i.paymentStatus !== "paid")
      .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

    // Low stock count
    const products = await ctx.db
      .query("products")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const activeProducts = products.filter((p) => p.isActive);

    const stockEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const aggregate = aggregateStockBookEntries(stockEntries);

    let lowStockCount = 0;
    for (const product of activeProducts) {
      const available =
        aggregate.productTotalAvailable[product._id] ?? 0;
      if (available <= (product.reorderLevel ?? 0)) {
        lowStockCount++;
      }
    }

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      outstandingReceivables,
      outstandingPayables,
      lowStockCount,
      totalSaleInvoices: saleInvoices.length,
      totalPurchaseInvoices: purchaseInvoices.length,
    };
  },
});

export const salesByPeriod = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return { invoices: [], totalAmount: 0, totalPaid: 0, totalOutstanding: 0, count: 0 };
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId_type", (q) =>
        q.eq("orgId", orgId).eq("type", "sale")
      )
      .collect();

    const filtered = invoices.filter((i) => {
      return i.issuedAt >= startDate && i.issuedAt <= endDate;
    });

    const totalAmount = filtered.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = filtered.reduce((sum, i) => sum + i.paidAmount, 0);

    return {
      invoices: filtered,
      totalAmount,
      totalPaid,
      totalOutstanding: totalAmount - totalPaid,
      count: filtered.length,
    };
  },
});

export const topProducts = query({
  args: {
    limit: v.optional(v.number()),
    fiscalYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    const limit = args.limit ?? 10;

    const saleInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId_type", (q) =>
        q.eq("orgId", orgId).eq("type", "sale")
      )
      .collect();

    const filtered = args.fiscalYear
      ? saleInvoices.filter((i) => i.fiscalYear === args.fiscalYear)
      : saleInvoices;

    // Aggregate by product
    const productSales: Record<
      string,
      { productId: string; productTitle: string; totalQty: number; totalAmount: number }
    > = {};

    for (const invoice of filtered) {
      for (const item of invoice.items) {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = {
            productId: key,
            productTitle: item.productTitle,
            totalQty: 0,
            totalAmount: 0,
          };
        }
        productSales[key].totalQty += item.quantity;
        productSales[key].totalAmount += item.total;
      }
    }

    return Object.values(productSales)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  },
});
