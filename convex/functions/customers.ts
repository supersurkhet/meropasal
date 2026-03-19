import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    return customers.filter((c) => c.isActive);
  },
});

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    const results = await ctx.db
      .query("customers")
      .withSearchIndex("search_name", (q) =>
        q.search("name", searchTerm).eq("orgId", orgId)
      )
      .collect();
    return results.filter((c) => c.isActive);
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const customer = await ctx.db.get(id);
    if (!customer || customer.orgId !== orgId) return null;
    return customer;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    panNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'customers:manage');
    return await ctx.db.insert("customers", {
      orgId,
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.optional(v.string()),
    panNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const orgId = await requirePermission(ctx, 'customers:manage');
    const customer = await ctx.db.get(id);
    if (!customer || customer.orgId !== orgId)
      throw new Error("Customer not found");
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, { id }) => {
    const orgId = await requirePermission(ctx, 'customers:manage');
    const customer = await ctx.db.get(id);
    if (!customer || customer.orgId !== orgId)
      throw new Error("Customer not found");
    await ctx.db.patch(id, { isActive: false });
  },
});
