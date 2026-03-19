import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg, getOrg } from "../lib/orgGuard";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .order("desc")
      .take(50);
    return notifications;
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_orgId_unread", (q) =>
        q.eq("orgId", orgId).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const orgId = await requireOrg(ctx);
    const notification = await ctx.db.get(id);
    if (!notification || notification.orgId !== orgId)
      throw new Error("Notification not found");
    await ctx.db.patch(id, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const orgId = await requireOrg(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_orgId_unread", (q) =>
        q.eq("orgId", orgId).eq("isRead", false)
      )
      .collect();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("low_stock"),
      v.literal("payment_due"),
      v.literal("order_status"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = await requireOrg(ctx);
    return await ctx.db.insert("notifications", {
      orgId,
      type: args.type,
      title: args.title,
      message: args.message,
      entityType: args.entityType,
      entityId: args.entityId,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  },
});
