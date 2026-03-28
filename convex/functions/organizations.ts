import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg, requirePermission, getOrg, getEffectiveRole } from "../lib/orgGuard";
import { PERMISSIONS } from "../lib/permissions";
import { validateFiscalYear } from "../lib/validation";

export const getMyPermissions = query({
  args: {},
  handler: async (ctx) => {
    const role = await getEffectiveRole(ctx);
    if (!role) return { role: null, permissions: [] as string[] };
    const permissions = Object.entries(PERMISSIONS)
      .filter(([, roles]) => roles.includes(role))
      .map(([perm]) => perm);
    return { role, permissions };
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (!settings) {
      return {
        _id: null,
        orgId,
        currentFiscalYear: '',
        logoUrl: null,
      };
    }
    const logoUrl = settings.logoStorageId
      ? await ctx.storage.getUrl(settings.logoStorageId)
      : null;
    return { ...settings, logoUrl };
  },
});

export const updateSettings = mutation({
  args: {
    logoStorageId: v.optional(v.id("_storage")),
    removeLogo: v.optional(v.boolean()),
    currentFiscalYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'settings:edit');
    if (args.currentFiscalYear) validateFiscalYear(args.currentFiscalYear);
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (settings) {
      const { removeLogo, ...rest } = args;
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) updates[key] = value;
      }
      if (removeLogo) {
        if (settings.logoStorageId) {
          await ctx.storage.delete(settings.logoStorageId);
        }
        updates.logoStorageId = undefined;
      }
      await ctx.db.patch(settings._id, updates);
    } else {
      await ctx.db.insert("orgSettings", {
        orgId,
        currentFiscalYear: args.currentFiscalYear ?? '',
      });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, 'settings:edit');
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Delete all Convex data for an organization.
 * Called after the org is deleted from WorkOS.
 */
export const deleteOrgData = mutation({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const tablesWithOrgIndex = [
      "orgSettings",
      "parties",
      "customers",
      "products",
      "invoices",
      "stockBookEntries",
      "ledgerEntries",
      "accounts",
      "vehicles",
      "trips",
      "notifications",
      "billTemplates",
    ] as const;

    let totalDeleted = 0;
    for (const table of tablesWithOrgIndex) {
      const docs = await ctx.db
        .query(table)
        .withIndex("by_orgId", (q: any) => q.eq("orgId", orgId))
        .collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      totalDeleted += docs.length;
    }

    // invoiceCounters uses by_orgId_fiscal_type (no plain by_orgId)
    const counters = await ctx.db
      .query("invoiceCounters")
      .withIndex("by_orgId_fiscal_type", (q: any) => q.eq("orgId", orgId))
      .collect();
    for (const doc of counters) {
      await ctx.db.delete(doc._id);
    }
    totalDeleted += counters.length;

    return { totalDeleted };
  },
});

/**
 * Store onboarding fiscal year before the OAuth redirect.
 * Business metadata (name, type, location, etc.) is stored in WorkOS org metadata.
 */
export const savePendingOnboarding = mutation({
  args: {
    workosUserId: v.string(),
    currentFiscalYear: v.string(),
  },
  handler: async (ctx, args) => {
    validateFiscalYear(args.currentFiscalYear);
    const existing = await ctx.db
      .query("pendingOnboarding")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", args.workosUserId))
      .first();
    if (existing) await ctx.db.delete(existing._id);

    await ctx.db.insert("pendingOnboarding", args);
  },
});

/**
 * Retrieve and delete pending onboarding data after OAuth redirect.
 */
export const consumePendingOnboarding = mutation({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingOnboarding")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", args.workosUserId))
      .first();
    if (!pending) return null;
    await ctx.db.delete(pending._id);
    return {
      currentFiscalYear: pending.currentFiscalYear,
    };
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
    currentFiscalYear: v.string(),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    // Check if org already initialized
    const existing = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (existing) throw new Error("Organization already initialized");

    // Create org settings (only Convex-specific fields)
    await ctx.db.insert("orgSettings", {
      orgId,
      currentFiscalYear: args.currentFiscalYear,
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
