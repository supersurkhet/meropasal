import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";
import { calculateFiscalYear } from "../lib/nepaliCalendar";

export const create = mutation({
  args: {
    partyId: v.optional(v.id("parties")),
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
    const orgId = await requirePermission(ctx, 'stock:import');
    const fiscalYear = calculateFiscalYear(args.importDate);

    // Resolve supplier for each item — use explicit partyId if given,
    // otherwise look up each product's purchasePartyId
    type ItemWithParty = (typeof args.items)[number] & { resolvedPartyId: string };
    const itemsWithParty: ItemWithParty[] = [];

    for (const item of args.items) {
      let resolvedPartyId: string;
      if (args.partyId) {
        resolvedPartyId = args.partyId;
      } else {
        const product = await ctx.db.get(item.productId);
        if (!product || product.orgId !== orgId) throw new Error(`Product not found: ${item.productTitle}`);
        resolvedPartyId = product.purchasePartyId;
      }
      itemsWithParty.push({ ...item, resolvedPartyId });
    }

    // Validate explicit party if provided
    if (args.partyId) {
      const party = await ctx.db.get(args.partyId);
      if (!party || party.orgId !== orgId) throw new Error("Party not found");
    }

    // Group items by supplier
    const bySupplier = new Map<string, ItemWithParty[]>();
    for (const item of itemsWithParty) {
      const group = bySupplier.get(item.resolvedPartyId) || [];
      group.push(item);
      bySupplier.set(item.resolvedPartyId, group);
    }

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

    const invoiceIds: string[] = [];

    // Create one invoice per supplier
    for (const [supplierId, supplierItems] of bySupplier) {
      const party = await ctx.db.get(supplierId as any) as any;
      const partyName = party?.name ?? "Unknown supplier";

      const nextCount = counter.count + 1;
      await ctx.db.patch(counter._id, { count: nextCount });
      // Re-read counter for next iteration
      counter = (await ctx.db.get(counter._id))!;
      const invoiceNumber = `PUR-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

      const invoiceItems = supplierItems.map((item) => ({
        productId: item.productId,
        productTitle: item.productTitle,
        quantity: item.quantity,
        rate: item.rate,
        total: item.quantity * item.rate,
        unit: item.unit,
      }));

      const subTotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);

      const invoiceId = await ctx.db.insert("invoices", {
        orgId,
        type: "purchase",
        invoiceNumber,
        partyId: supplierId,
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

      invoiceIds.push(invoiceId);

      // Create stock book entries for this supplier's items
      for (const item of supplierItems) {
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
          particulars: `Purchase from ${partyName}`,
          sourceTable: "stockImport",
          sourceId: invoiceId,
          counterpartyId: supplierId,
          originPartyId: supplierId,
          fiscalYear,
        });
      }
    }

    // Return first invoice ID for backward compat (single supplier case)
    return invoiceIds[0];
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
        q.eq("orgId", orgId).eq("type", "purchase")
      )
      .collect();
  },
});
