import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    const parties = await ctx.db
      .query("parties")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    return parties.filter((p) => p.isActive);
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    const results = await ctx.db
      .query("parties")
      .withSearchIndex("search_name", (q) =>
        q.search("name", searchTerm).eq("orgId", orgId)
      )
      .collect();
    return results.filter((p) => p.isActive);
  },
});

export const getById = query({
  args: { id: v.id("parties") },
  handler: async (ctx, { id }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const party = await ctx.db.get(id);
    if (!party || party.orgId !== orgId) return null;
    return party;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    panNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'parties:manage');
    return await ctx.db.insert("parties", {
      orgId,
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("parties"),
    name: v.optional(v.string()),
    panNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const orgId = await requirePermission(ctx, 'parties:manage');
    const party = await ctx.db.get(id);
    if (!party || party.orgId !== orgId) throw new Error("Party not found");
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("parties") },
  handler: async (ctx, { id }) => {
    const orgId = await requirePermission(ctx, 'parties:manage');
    const party = await ctx.db.get(id);
    if (!party || party.orgId !== orgId) throw new Error("Party not found");
    await ctx.db.patch(id, { isActive: false });
  },
});
