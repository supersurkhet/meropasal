import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await requireOrg(ctx);
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    return vehicles.filter((v) => v.isActive);
  },
});

export const getById = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const vehicle = await ctx.db.get(id);
    if (!vehicle || vehicle.orgId !== orgId) return null;
    return vehicle;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    licensePlate: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);
    return await ctx.db.insert("vehicles", {
      orgId,
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("vehicles"),
    name: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const orgId = await requireOrg(ctx);
    const vehicle = await ctx.db.get(id);
    if (!vehicle || vehicle.orgId !== orgId)
      throw new Error("Vehicle not found");
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const vehicle = await ctx.db.get(id);
    if (!vehicle || vehicle.orgId !== orgId)
      throw new Error("Vehicle not found");
    await ctx.db.patch(id, { isActive: false });
  },
});
