import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg, getOrg } from "../lib/orgGuard";
import { buildFiscalCloseRows } from "../lib/stockAggregation";
import { getNextFiscalYear } from "../lib/nepaliCalendar";
import { Id } from "../_generated/dataModel";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    return settings?.currentFiscalYear ?? null;
  },
});

export const closeFiscalYear = mutation({
  args: {
    fiscalYear: v.string(),
    closeDate: v.string(),
    openingDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    // Verify this is the current fiscal year
    const settings = await ctx.db
      .query("orgSettings")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .first();
    if (!settings) throw new Error("Organization settings not found");
    if (settings.currentFiscalYear !== args.fiscalYear) {
      throw new Error(
        `Can only close current fiscal year (${settings.currentFiscalYear})`
      );
    }

    // Check if already closed (look for existing closing entries)
    const existingCloseEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId_fiscal", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", args.fiscalYear)
      )
      .collect();
    const hasClosingEntries = existingCloseEntries.some(
      (e) => e.movementType === "closing" && e.sourceTable === "fiscalClose"
    );
    if (hasClosingEntries) {
      throw new Error(`Fiscal year ${args.fiscalYear} already closed`);
    }

    // Get all stock book entries for this fiscal year
    const allEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();

    // Build closing + opening rows
    const { nextFiscalYear, rows } = buildFiscalCloseRows({
      fiscalYear: args.fiscalYear,
      closeDate: args.closeDate,
      openingDate: args.openingDate,
      entries: allEntries,
    });

    // Insert all rows
    for (const row of rows) {
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: row.entryDate,
        transactionType: row.transactionType,
        movementType: row.movementType,
        direction: row.direction,
        productId: row.productId as Id<"products">,
        quantityIn: row.quantityIn,
        quantityOut: row.quantityOut,
        quantity: row.quantity,
        unitRate: row.unitRate,
        totalAmount: row.totalAmount,
        particulars: row.particulars,
        sourceTable: row.sourceTable,
        sourceId: row.sourceId,
        sourceCode: row.sourceCode,
        counterpartyId: row.counterpartyId,
        originPartyId: row.originPartyId,
        fiscalYear: row.fiscalYear,
      });
    }

    // Update org settings to next fiscal year
    await ctx.db.patch(settings._id, {
      currentFiscalYear: nextFiscalYear,
    });

    // Create invoice counters for next fiscal year
    for (const type of ["purchase", "sale"] as const) {
      const existing = await ctx.db
        .query("invoiceCounters")
        .withIndex("by_orgId_fiscal_type", (q) =>
          q
            .eq("orgId", orgId)
            .eq("fiscalYear", nextFiscalYear)
            .eq("type", type)
        )
        .first();
      if (!existing) {
        await ctx.db.insert("invoiceCounters", {
          orgId,
          fiscalYear: nextFiscalYear,
          type,
          count: 0,
        });
      }
    }

    return {
      closedFiscalYear: args.fiscalYear,
      newFiscalYear: nextFiscalYear,
      entriesCreated: rows.length,
    };
  },
});
