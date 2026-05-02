import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
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
    const orgId = await requirePermission(ctx, 'ledger:edit');

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
    const orgId = await getOrg(ctx);
    if (!orgId) return [];

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
    const orgId = await requirePermission(ctx, 'ledger:edit');
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
    const orgId = await requirePermission(ctx, 'ledger:edit');

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
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
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


export const balanceSheet = query({
  args: { fiscalYear: v.string() },
  handler: async (ctx, { fiscalYear }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return { assets: [], liabilities: [], equity: [] };

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    const entries = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_orgId_fiscal", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const balances: Record<
      string,
      { accountCode: string; accountName: string; type: string; debit: number; credit: number }
    > = {};

    for (const entry of entries) {
      if (!balances[entry.accountCode]) {
        const acc = accounts.find((a) => a.code === entry.accountCode);
        balances[entry.accountCode] = {
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          type: acc?.type ?? 'asset',
          debit: 0,
          credit: 0,
        };
      }
      balances[entry.accountCode].debit += entry.debit;
      balances[entry.accountCode].credit += entry.credit;
    }

    const asset = [] as Array<{ accountCode: string; accountName: string; amount: number }>;
    const liability = [] as Array<{ accountCode: string; accountName: string; amount: number }>;
    const equity = [] as Array<{ accountCode: string; accountName: string; amount: number }>;

    for (const row of Object.values(balances)) {
      const amount = row.debit - row.credit;
      if (row.type === 'asset') {
        asset.push({ accountCode: row.accountCode, accountName: row.accountName, amount });
      } else if (row.type === 'liability') {
        liability.push({ accountCode: row.accountCode, accountName: row.accountName, amount: -amount });
      } else if (row.type === 'equity') {
        equity.push({ accountCode: row.accountCode, accountName: row.accountName, amount: -amount });
      }
    }

    return {
      assets: asset.filter((a) => a.amount !== 0).sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      liabilities: liability.filter((a) => a.amount !== 0).sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      equity: equity.filter((a) => a.amount !== 0).sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
    };
  },
});


export const cashPosition = query({
  args: { fiscalYear: v.string() },
  handler: async (ctx, { fiscalYear }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return { beginning: 0, ending: 0, movements: [] };

    const entries = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_orgId_fiscal", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const cashAccounts = ["1000", "1010"]; // Cash, Bank Account
    let beginning = 0;
    let ending = 0;
    const movements: Array<{ voucherType: string; inflow: number; outflow: number }> = [];
    const byType: Record<string, { inflow: number; outflow: number }> = {};

    for (const entry of entries) {
      if (!cashAccounts.includes(entry.accountCode)) continue;
      const change = entry.debit - entry.credit;
      ending += change;
      if (!byType[entry.voucherType]) {
        byType[entry.voucherType] = { inflow: 0, outflow: 0 };
      }
      if (change > 0) {
        byType[entry.voucherType].inflow += change;
      } else {
        byType[entry.voucherType].outflow += -change;
      }
    }

    // Beginning balance = all prior fiscal years (simplified: we don't have prior year data easily, so set to 0)
    // For a real implementation, we'd sum all prior entries. Here we just show current year movements.
    beginning = 0;

    for (const [voucherType, vals] of Object.entries(byType)) {
      movements.push({ voucherType, inflow: vals.inflow, outflow: vals.outflow });
    }

    movements.sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));

    return { beginning, ending, movements };
  },
});


import { calculateFiscalYear } from "../lib/nepaliCalendar";

export const createJournalEntry = mutation({
  args: {
    date: v.string(),
    narration: v.string(),
    lines: v.array(
      v.object({
        accountCode: v.string(),
        accountName: v.string(),
        debit: v.number(),
        credit: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'ledger:edit');

    if (args.lines.length < 2) {
      throw new Error("Journal entry must have at least 2 lines");
    }

    const totalDebit = args.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = args.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Debits (${totalDebit}) must equal credits (${totalCredit})`);
    }

    if (totalDebit === 0) {
      throw new Error("Journal entry must have a non-zero amount");
    }

    for (const line of args.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new Error(`Line ${line.accountCode} cannot have both debit and credit`);
      }
      if (line.debit < 0 || line.credit < 0) {
        throw new Error(`Line ${line.accountCode} cannot have negative values`);
      }
    }

    const fiscalYear = calculateFiscalYear(args.date);
    const voucherNumber = `JV-${args.date.replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    for (const line of args.lines) {
      await ctx.db.insert("ledgerEntries", {
        orgId,
        date: args.date,
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.debit,
        credit: line.credit,
        narration: args.narration,
        fiscalYear,
        voucherType: "journal" as const,
        voucherNumber,
      });
    }

    return voucherNumber;
  },
});
