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

export const dashboardBreakdowns = query({
  args: {
    fiscalYear: v.optional(v.string()),
    period: v.optional(v.string()), // "all" | "month" | "quarter" | "year"
  },
  handler: async (ctx, args) => {
    const orgId = await getOrg(ctx);
    if (!orgId)
      return {
        revenueBreakdown: [],
        costBreakdown: [],
        receivablesBreakdown: [],
        payablesBreakdown: [],
        topCustomers: [],
        topSuppliers: [],
        paymentMethods: [],
        inventoryStatus: { inStock: 0, lowStock: 0, outOfStock: 0 },
      };

    const allInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    // Period filtering
    const now = new Date();
    let startDate = new Date(0);
    switch (args.period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    let invoices = args.fiscalYear
      ? allInvoices.filter((i) => i.fiscalYear === args.fiscalYear)
      : allInvoices;

    if (args.period && args.period !== "all") {
      invoices = invoices.filter(
        (i) => new Date(i.issuedAt) >= startDate
      );
    }

    const saleInvoices = invoices.filter((i) => i.type === "sale");
    const purchaseInvoices = invoices.filter((i) => i.type === "purchase");

    // Get customers and parties for name resolution
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const customerMap = new Map(customers.map((c) => [c._id, c.name]));

    const parties = await ctx.db
      .query("parties")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const partyMap = new Map(parties.map((p) => [p._id, p.name]));

    // Revenue breakdown by customer
    const revByCustomer: Record<
      string,
      { customer: string; total: number; paid: number; due: number; items: typeof saleInvoices[0]["items"] }
    > = {};
    for (const inv of saleInvoices) {
      const key = inv.partyId ?? "walk-in";
      const name = inv.partyId ? (customerMap.get(inv.partyId as any) ?? partyMap.get(inv.partyId as any) ?? "Unknown") : "Walk-in";
      if (!revByCustomer[key]) {
        revByCustomer[key] = { customer: name, total: 0, paid: 0, due: 0, items: [] };
      }
      revByCustomer[key].total += inv.totalAmount;
      revByCustomer[key].paid += inv.paidAmount;
      revByCustomer[key].due += inv.totalAmount - inv.paidAmount;
      revByCustomer[key].items.push(...inv.items);
    }
    const revenueBreakdown = Object.values(revByCustomer).sort(
      (a, b) => b.total - a.total
    );

    // Cost breakdown by supplier
    const costBySupplier: Record<
      string,
      { supplier: string; total: number; paid: number; due: number; items: typeof purchaseInvoices[0]["items"] }
    > = {};
    for (const inv of purchaseInvoices) {
      const key = inv.partyId ?? "unknown";
      const name = inv.partyId ? (partyMap.get(inv.partyId as any) ?? "Unknown") : "Unknown";
      if (!costBySupplier[key]) {
        costBySupplier[key] = { supplier: name, total: 0, paid: 0, due: 0, items: [] };
      }
      costBySupplier[key].total += inv.totalAmount;
      costBySupplier[key].paid += inv.paidAmount;
      costBySupplier[key].due += inv.totalAmount - inv.paidAmount;
      costBySupplier[key].items.push(...inv.items);
    }
    const costBreakdown = Object.values(costBySupplier).sort(
      (a, b) => b.total - a.total
    );

    // Receivables breakdown (unpaid sale invoices)
    const receivablesBreakdown = saleInvoices
      .filter((i) => i.paymentStatus !== "paid")
      .map((inv) => ({
        customer: inv.partyId ? (customerMap.get(inv.partyId as any) ?? "Unknown") : "Walk-in",
        total: inv.totalAmount,
        paid: inv.paidAmount,
        due: inv.totalAmount - inv.paidAmount,
        date: inv.issuedAt,
        invoiceNumber: inv.invoiceNumber ?? "Order",
      }))
      .sort((a, b) => b.due - a.due);

    // Payables breakdown (unpaid purchase invoices)
    const payablesBreakdown = purchaseInvoices
      .filter((i) => i.paymentStatus !== "paid")
      .map((inv) => ({
        supplier: inv.partyId ? (partyMap.get(inv.partyId as any) ?? "Unknown") : "Unknown",
        total: inv.totalAmount,
        paid: inv.paidAmount,
        due: inv.totalAmount - inv.paidAmount,
        date: inv.issuedAt,
        invoiceNumber: inv.invoiceNumber ?? "—",
      }))
      .sort((a, b) => b.due - a.due);

    // Top customers by total spending
    const topCustomers = Object.values(revByCustomer)
      .map((c) => ({
        name: c.customer,
        totalSpent: c.total,
        purchaseCount: saleInvoices.filter(
          (i) =>
            (i.partyId ? (customerMap.get(i.partyId as any) ?? partyMap.get(i.partyId as any) ?? "Unknown") : "Walk-in") === c.customer
        ).length,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Top suppliers by purchase amount
    const topSuppliers = Object.values(costBySupplier)
      .map((s) => ({ name: s.supplier, totalAmount: s.total }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Payment methods breakdown
    const methodTotals: Record<string, number> = {};
    for (const inv of [...saleInvoices, ...purchaseInvoices]) {
      for (const p of inv.payments) {
        methodTotals[p.paymentMethod] =
          (methodTotals[p.paymentMethod] ?? 0) + p.paidAmount;
      }
    }
    const paymentMethods = Object.entries(methodTotals)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Inventory status
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

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const product of activeProducts) {
      const available = aggregate.productTotalAvailable[product._id] ?? 0;
      if (available <= 0) {
        outOfStock++;
      } else if (available <= (product.reorderLevel ?? 0)) {
        lowStock++;
      } else {
        inStock++;
      }
    }

    return {
      revenueBreakdown,
      costBreakdown,
      receivablesBreakdown: receivablesBreakdown.slice(0, 20),
      payablesBreakdown: payablesBreakdown.slice(0, 20),
      topCustomers,
      topSuppliers,
      paymentMethods,
      inventoryStatus: { inStock, lowStock, outOfStock },
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
