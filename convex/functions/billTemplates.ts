import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getOrg } from "../lib/orgGuard";

const layoutValidator = v.object({
  headerFields: v.array(v.string()),
  showLogo: v.boolean(),
  logoPosition: v.union(
    v.literal("left"),
    v.literal("center"),
    v.literal("right")
  ),
  columnOrder: v.array(v.string()),
  showTax: v.boolean(),
  showDiscount: v.boolean(),
  footerText: v.optional(v.string()),
  paperSize: v.union(
    v.literal("a4"),
    v.literal("a5"),
    v.literal("thermal-80mm"),
    v.literal("thermal-58mm")
  ),
  fontSize: v.union(
    v.literal("small"),
    v.literal("medium"),
    v.literal("large")
  ),
  showPaymentDetails: v.boolean(),
  customFields: v.array(
    v.object({
      label: v.string(),
      value: v.string(),
    })
  ),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("billTemplates")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const templates = await ctx.db
      .query("billTemplates")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    return templates.find((t) => t.isDefault) ?? templates[0] ?? null;
  },
});

export const getById = query({
  args: { id: v.id("billTemplates") },
  handler: async (ctx, { id }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const template = await ctx.db.get(id);
    if (!template || template.orgId !== orgId) return null;
    return template;
  },
});

export const create = mutation({
  args: {
    templateName: v.string(),
    isDefault: v.optional(v.boolean()),
    layout: layoutValidator,
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);
    const isDefault = args.isDefault ?? false;

    // If setting as default, unset other defaults
    if (isDefault) {
      const existing = await ctx.db
        .query("billTemplates")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
      for (const t of existing) {
        if (t.isDefault) {
          await ctx.db.patch(t._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("billTemplates", {
      orgId,
      templateName: args.templateName,
      isDefault,
      layout: args.layout,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("billTemplates"),
    templateName: v.optional(v.string()),
    layout: v.optional(layoutValidator),
  },
  handler: async (ctx, { id, ...fields }) => {
    const orgId = await requireOrg(ctx);
    const template = await ctx.db.get(id);
    if (!template || template.orgId !== orgId)
      throw new Error("Template not found");
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const setDefault = mutation({
  args: { id: v.id("billTemplates") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const template = await ctx.db.get(id);
    if (!template || template.orgId !== orgId)
      throw new Error("Template not found");

    // Unset all other defaults
    const all = await ctx.db
      .query("billTemplates")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    for (const t of all) {
      if (t.isDefault && t._id !== id) {
        await ctx.db.patch(t._id, { isDefault: false });
      }
    }

    await ctx.db.patch(id, { isDefault: true });
  },
});

export const remove = mutation({
  args: { id: v.id("billTemplates") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const template = await ctx.db.get(id);
    if (!template || template.orgId !== orgId)
      throw new Error("Template not found");
    await ctx.db.delete(id);
  },
});
