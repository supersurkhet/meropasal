import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg, requirePermission, getOrg } from "../lib/orgGuard";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    // Return defaults if org has no settings yet (e.g. onboarding failed silently)
    if (!settings) {
      return {
        _id: null,
        orgId,
        businessName: '',
        businessType: 'retail' as const,
        currentFiscalYear: '',
        currency: 'NPR',
        taxRate: 13,
        features: { invoicing: true, stockBook: true, logistics: false, ledger: true },
        logoUrl: null,
      };
    }
    const logoUrl = settings.logoStorageId
      ? await ctx.storage.getUrl(settings.logoStorageId)
      : null;
    return { ...settings, logoUrl };
  },
});

export const getMultiOrgInfo = query({
  args: { orgIds: v.array(v.string()) },
  handler: async (ctx, { orgIds }) => {
    const results: Record<string, { businessName: string; location?: string; logoUrl: string | null }> = {};
    for (const orgId of orgIds) {
      const settings = await ctx.db
        .query("orgSettings")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .first();
      if (settings) {
        const logoUrl = settings.logoStorageId
          ? await ctx.storage.getUrl(settings.logoStorageId)
          : null;
        results[orgId] = {
          businessName: settings.businessName,
          location: settings.location,
          logoUrl,
        };
      }
    }
    return results;
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
    const orgId = await requirePermission(ctx, 'settings:edit');
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (settings) {
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined) updates[key] = value;
      }
      await ctx.db.patch(settings._id, updates);
    } else {
      // Create orgSettings if it doesn't exist (recovery from failed onboarding)
      await ctx.db.insert("orgSettings", {
        orgId,
        businessName: args.businessName ?? '',
        businessType: args.businessType ?? 'retail',
        currentFiscalYear: args.currentFiscalYear ?? '',
        location: args.location,
        phone: args.phone,
        panNumber: args.panNumber,
        currency: args.currency ?? 'NPR',
        taxRate: args.taxRate ?? 13,
        features: args.features ?? {
          invoicing: true,
          stockBook: true,
          logistics: false,
          ledger: true,
        },
      });
    }
  },
});

/**
 * Ensure a user→org mapping exists. Called after login when the server
 * knows the orgId from WorkOS memberships but the JWT may not contain it.
 */
export const ensureUserOrgMapping = mutation({
  args: {
    orgId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const existing = await ctx.db
      .query("userOrgMappings")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .first();

    if (!existing) {
      await ctx.db.insert("userOrgMappings", {
        subject: identity.subject,
        orgId: args.orgId,
      });
    }
  },
});

/**
 * Store onboarding form data before the OAuth redirect.
 * Called from the server without auth (user doesn't have org-scoped JWT yet).
 */
export const savePendingOnboarding = mutation({
  args: {
    workosUserId: v.string(),
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
    // Delete any existing pending onboarding for this user
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
      businessName: pending.businessName,
      businessType: pending.businessType,
      currentFiscalYear: pending.currentFiscalYear,
      location: pending.location,
      phone: pending.phone,
      panNumber: pending.panNumber,
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

    // Create user→org mapping so non-org-scoped JWTs can resolve the org
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject) {
      const existingMapping = await ctx.db
        .query("userOrgMappings")
        .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
        .first();
      if (!existingMapping) {
        await ctx.db.insert("userOrgMappings", {
          subject: identity.subject,
          orgId,
        });
      }
    }

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
