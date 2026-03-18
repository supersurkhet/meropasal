import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";
import { invoiceItemValidator } from "../lib/validators";
import { calculateFiscalYear } from "../lib/nepaliCalendar";

export const create = mutation({
  args: {
    partyId: v.id("parties"),
    importDate: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productTitle: v.string(),
        quantity: v.number(),
        rate: v.number(),
        unit: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    // Validate party belongs to org
    const party = await ctx.db.get(args.partyId);
    if (!party || party.orgId !== orgId) throw new Error("Party not found");

    const fiscalYear = calculateFiscalYear(args.importDate);

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

    // Get or create invoice counter
    let counter = await ctx.db
      .query("invoiceCounters")
      .withIndex("by_orgId_fiscal_type", (q) =>
        q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "purchase")
      )
      .first();

    if (!counter) {
      const counterId = await ctx.db.insert("invoiceCounters", {
        orgId,
        fiscalYear,
        type: "purchase",
        count: 0,
      });
      counter = (await ctx.db.get(counterId))!;
    }

    const nextCount = counter.count + 1;
    await ctx.db.patch(counter._id, { count: nextCount });
    const invoiceNumber = `PUR-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

    // Create purchase invoice
    const invoiceId = await ctx.db.insert("invoices", {
      orgId,
      type: "purchase",
      invoiceNumber,
      partyId: args.partyId,
      partyType: "supplier",
      issuedAt: args.importDate,
      items: invoiceItems,
      subTotal,
      tax: 0,
      totalAmount: subTotal,
      payments: [],
      paidAmount: 0,
      paymentStatus: "pending",
      fiscalYear,
    });

    // Create stock book entries for each item
    for (const item of args.items) {
      const total = item.quantity * item.rate;
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: args.importDate,
        transactionType: "purchase",
        movementType: "purchase",
        direction: "in",
        productId: item.productId,
        quantityIn: item.quantity,
        quantityOut: 0,
        quantity: item.quantity,
        unitRate: item.rate,
        totalAmount: total,
        particulars: `Purchase from ${party.name}`,
        sourceTable: "stockImport",
        sourceId: invoiceId,
        counterpartyId: args.partyId,
        originPartyId: args.partyId,
        fiscalYear,
      });
    }

    return invoiceId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await requireOrg(ctx);
    return await ctx.db
      .query("invoices")
      .withIndex("by_orgId_type", (q) =>
        q.eq("orgId", orgId).eq("type", "purchase")
      )
      .collect();
  },
});
