import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await requireOrg(ctx);
    return await ctx.db
      .query("accounts")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const createAccount = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("revenue"),
      v.literal("expense")
    ),
    parentCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    // Check for duplicate code
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_orgId_code", (q) =>
        q.eq("orgId", orgId).eq("code", args.code)
      )
      .first();
    if (existing) throw new Error(`Account code ${args.code} already exists`);

    return await ctx.db.insert("accounts", {
      orgId,
      ...args,
      isSystemAccount: false,
    });
  },
});

export const listEntries = query({
  args: {
    fiscalYear: v.optional(v.string()),
    accountCode: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    if (args.accountCode) {
      return await ctx.db
        .query("ledgerEntries")
        .withIndex("by_orgId_account", (q) =>
          q.eq("orgId", orgId).eq("accountCode", args.accountCode!)
        )
        .collect();
    }

    if (args.invoiceId) {
      return await ctx.db
        .query("ledgerEntries")
        .withIndex("by_orgId_invoice", (q) =>
          q.eq("orgId", orgId).eq("invoiceId", args.invoiceId!)
        )
        .collect();
    }

    if (args.fiscalYear) {
      return await ctx.db
        .query("ledgerEntries")
        .withIndex("by_orgId_fiscal", (q) =>
          q.eq("orgId", orgId).eq("fiscalYear", args.fiscalYear!)
        )
        .collect();
    }

    return await ctx.db
      .query("ledgerEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const createEntry = mutation({
  args: {
    date: v.string(),
    accountCode: v.string(),
    accountName: v.string(),
    debit: v.number(),
    credit: v.number(),
    narration: v.string(),
    invoiceId: v.optional(v.id("invoices")),
    fiscalYear: v.string(),
    voucherType: v.union(
      v.literal("sales"),
      v.literal("purchase"),
      v.literal("receipt"),
      v.literal("payment"),
      v.literal("journal"),
      v.literal("contra")
    ),
    voucherNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);
    return await ctx.db.insert("ledgerEntries", { orgId, ...args });
  },
});

export const createDoubleEntry = mutation({
  args: {
    date: v.string(),
    debitAccountCode: v.string(),
    debitAccountName: v.string(),
    creditAccountCode: v.string(),
    creditAccountName: v.string(),
    amount: v.number(),
    narration: v.string(),
    invoiceId: v.optional(v.id("invoices")),
    fiscalYear: v.string(),
    voucherType: v.union(
      v.literal("sales"),
      v.literal("purchase"),
      v.literal("receipt"),
      v.literal("payment"),
      v.literal("journal"),
      v.literal("contra")
    ),
    voucherNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    // Debit entry
    await ctx.db.insert("ledgerEntries", {
      orgId,
      date: args.date,
      accountCode: args.debitAccountCode,
      accountName: args.debitAccountName,
      debit: args.amount,
      credit: 0,
      narration: args.narration,
      invoiceId: args.invoiceId,
      fiscalYear: args.fiscalYear,
      voucherType: args.voucherType,
      voucherNumber: args.voucherNumber,
    });

    // Credit entry
    await ctx.db.insert("ledgerEntries", {
      orgId,
      date: args.date,
      accountCode: args.creditAccountCode,
      accountName: args.creditAccountName,
      debit: 0,
      credit: args.amount,
      narration: args.narration,
      invoiceId: args.invoiceId,
      fiscalYear: args.fiscalYear,
      voucherType: args.voucherType,
      voucherNumber: args.voucherNumber,
    });
  },
});

export const trialBalance = query({
  args: { fiscalYear: v.string() },
  handler: async (ctx, { fiscalYear }) => {
    const orgId = await requireOrg(ctx);
    const entries = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_orgId_fiscal", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const balances: Record<
      string,
      { accountCode: string; accountName: string; debit: number; credit: number }
    > = {};

    for (const entry of entries) {
      if (!balances[entry.accountCode]) {
        balances[entry.accountCode] = {
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          debit: 0,
          credit: 0,
        };
      }
      balances[entry.accountCode].debit += entry.debit;
      balances[entry.accountCode].credit += entry.credit;
    }

    return Object.values(balances).sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode)
    );
  },
});
