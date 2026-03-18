import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await requireOrg(ctx);
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    businessName: v.optional(v.string()),
    businessType: v.optional(
      v.union(
        v.literal("retail"),
        v.literal("wholesale"),
        v.literal("service")
      )
    ),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    panNumber: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    currentFiscalYear: v.optional(v.string()),
    currency: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    features: v.optional(
      v.object({
        invoicing: v.boolean(),
        stockBook: v.boolean(),
        logistics: v.boolean(),
        ledger: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (!settings) throw new Error("Organization settings not found");
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(settings._id, updates);
  },
});

const DEFAULT_CHART_OF_ACCOUNTS = [
  // Assets
  { code: "1000", name: "Cash", type: "asset" as const, isSystemAccount: true },
  { code: "1010", name: "Bank Account", type: "asset" as const, isSystemAccount: true },
  { code: "1100", name: "Accounts Receivable", type: "asset" as const, isSystemAccount: true },
  { code: "1200", name: "Inventory", type: "asset" as const, isSystemAccount: true },
  // Liabilities
  { code: "2000", name: "Accounts Payable", type: "liability" as const, isSystemAccount: true },
  { code: "2100", name: "Tax Payable", type: "liability" as const, isSystemAccount: true },
  // Equity
  { code: "3000", name: "Owner's Equity", type: "equity" as const, isSystemAccount: true },
  { code: "3100", name: "Retained Earnings", type: "equity" as const, isSystemAccount: true },
  // Revenue
  { code: "4000", name: "Sales Revenue", type: "revenue" as const, isSystemAccount: true },
  { code: "4100", name: "Service Revenue", type: "revenue" as const, isSystemAccount: true },
  // Expenses
  { code: "5000", name: "Cost of Goods Sold", type: "expense" as const, isSystemAccount: true },
  { code: "5100", name: "Purchase Expense", type: "expense" as const, isSystemAccount: true },
  { code: "5200", name: "Transport Expense", type: "expense" as const, isSystemAccount: true },
  { code: "5300", name: "Office Expense", type: "expense" as const, isSystemAccount: true },
];

export const initializeOrg = mutation({
  args: {
    businessName: v.string(),
    businessType: v.union(
      v.literal("retail"),
      v.literal("wholesale"),
      v.literal("service")
    ),
    currentFiscalYear: v.string(),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    panNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    // Check if org already initialized
    const existing = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (existing) throw new Error("Organization already initialized");

    // Create org settings
    await ctx.db.insert("orgSettings", {
      orgId,
      businessName: args.businessName,
      businessType: args.businessType,
      currentFiscalYear: args.currentFiscalYear,
      location: args.location,
      phone: args.phone,
      panNumber: args.panNumber,
      currency: "NPR",
      taxRate: 13,
      features: {
        invoicing: true,
        stockBook: true,
        logistics: false,
        ledger: true,
      },
    });

    // Create default chart of accounts
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      await ctx.db.insert("accounts", {
        orgId,
        ...account,
      });
    }

    // Create initial invoice counters
    for (const type of ["purchase", "sale"] as const) {
      await ctx.db.insert("invoiceCounters", {
        orgId,
        fiscalYear: args.currentFiscalYear,
        type,
        count: 0,
      });
    }
  },
});
