import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await requireOrg(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    return products.filter((p) => p.isActive);
  },
});

export const listByParty = query({
  args: { purchasePartyId: v.id("parties") },
  handler: async (ctx, { purchasePartyId }) => {
    const orgId = await requireOrg(ctx);
    const products = await ctx.db
      .query("products")
      .withIndex("by_orgId_party", (q) =>
        q.eq("orgId", orgId).eq("purchasePartyId", purchasePartyId)
      )
      .collect();
    return products.filter((p) => p.isActive);
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const orgId = await requireOrg(ctx);
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_title", (q) =>
        q.search("title", searchTerm).eq("orgId", orgId)
      )
      .collect();
    return results.filter((p) => p.isActive);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    purchasePartyId: v.id("parties"),
    hsCode: v.optional(v.string()),
    unit: v.optional(v.string()),
    costPrice: v.number(),
    sellingPrice: v.optional(v.number()),
    openingStock: v.number(),
    barcode: v.optional(v.string()),
    reorderLevel: v.optional(v.number()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);
    const sellingPrice =
      args.sellingPrice ?? Math.round(args.costPrice * 1.1 * 100) / 100;
    const reorderLevel =
      args.reorderLevel ?? Math.ceil(args.openingStock * 0.1);
    return await ctx.db.insert("products", {
      orgId,
      ...args,
      sellingPrice,
      reorderLevel,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    title: v.optional(v.string()),
    purchasePartyId: v.optional(v.id("parties")),
    hsCode: v.optional(v.string()),
    unit: v.optional(v.string()),
    costPrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
    openingStock: v.optional(v.number()),
    barcode: v.optional(v.string()),
    reorderLevel: v.optional(v.number()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { id, ...fields }) => {
    const orgId = await requireOrg(ctx);
    const product = await ctx.db.get(id);
    if (!product || product.orgId !== orgId)
      throw new Error("Product not found");
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const product = await ctx.db.get(id);
    if (!product || product.orgId !== orgId)
      throw new Error("Product not found");
    await ctx.db.patch(id, { isActive: false });
  },
});
