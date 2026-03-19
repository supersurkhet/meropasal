import { query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg } from "../lib/orgGuard";
import { aggregateStockBookEntries } from "../lib/stockAggregation";

export const listEntries = query({
  args: {
    fiscalYear: v.optional(v.string()),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];

    if (args.productId) {
      return await ctx.db
        .query("stockBookEntries")
        .withIndex("by_orgId_product", (q) =>
          q.eq("orgId", orgId).eq("productId", args.productId!)
        )
        .collect();
    }

    if (args.fiscalYear) {
      return await ctx.db
        .query("stockBookEntries")
        .withIndex("by_orgId_fiscal", (q) =>
          q.eq("orgId", orgId).eq("fiscalYear", args.fiscalYear!)
        )
        .collect();
    }

    return await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const getAggregation = query({
  args: { fiscalYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return { products: {}, productTotalAvailable: {} };

    let entries;
    if (args.fiscalYear) {
      entries = await ctx.db
        .query("stockBookEntries")
        .withIndex("by_orgId_fiscal", (q) =>
          q.eq("orgId", orgId).eq("fiscalYear", args.fiscalYear!)
        )
        .collect();
    } else {
      entries = await ctx.db
        .query("stockBookEntries")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    return aggregateStockBookEntries(entries);
  },
});

export const getBySource = query({
  args: {
    sourceTable: v.union(
      v.literal("product"),
      v.literal("stockImport"),
      v.literal("sale"),
      v.literal("order"),
      v.literal("trip"),
      v.literal("manual"),
      v.literal("fiscalClose")
    ),
    sourceId: v.string(),
  },
  handler: async (ctx, { sourceTable, sourceId }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId_source", (q) =>
        q.eq("orgId", orgId).eq("sourceTable", sourceTable).eq("sourceId", sourceId)
      )
      .collect();
  },
});
