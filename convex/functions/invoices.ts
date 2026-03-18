import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("purchase"), v.literal("sale"))),
    fiscalYear: v.optional(v.string()),
    paymentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("partial"),
        v.literal("overpaid")
      )
    ),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);

    let invoices;
    if (args.type) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_orgId_type", (q) =>
          q.eq("orgId", orgId).eq("type", args.type!)
        )
        .collect();
    } else if (args.fiscalYear) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_orgId_fiscal", (q) =>
          q.eq("orgId", orgId).eq("fiscalYear", args.fiscalYear!)
        )
        .collect();
    } else {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    if (args.paymentStatus) {
      invoices = invoices.filter((i) => i.paymentStatus === args.paymentStatus);
    }
    if (args.fiscalYear && args.type) {
      invoices = invoices.filter((i) => i.fiscalYear === args.fiscalYear);
    }

    return invoices;
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const invoice = await ctx.db.get(id);
    if (!invoice || invoice.orgId !== orgId) return null;
    return invoice;
  },
});

export const getByParty = query({
  args: { partyId: v.string() },
  handler: async (ctx, { partyId }) => {
    const orgId = await requireOrg(ctx);
    return await ctx.db
      .query("invoices")
      .withIndex("by_orgId_party", (q) =>
        q.eq("orgId", orgId).eq("partyId", partyId)
      )
      .collect();
  },
});
