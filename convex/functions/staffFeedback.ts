import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrg } from "../lib/orgGuard";

export const listByPage = query({
	args: { pathname: v.string() },
	handler: async (ctx, { pathname }) => {
		const orgId = await requireOrg(ctx);
		return await ctx.db
			.query("staffFeedback")
			.withIndex("by_orgId_pathname", (q) =>
				q.eq("orgId", orgId).eq("pathname", pathname)
			)
			.collect();
	},
});

export const upsert = mutation({
	args: {
		pathname: v.string(),
		noteId: v.string(),
		kind: v.union(
			v.literal("element"),
			v.literal("text"),
			v.literal("group"),
			v.literal("area")
		),
		comment: v.string(),
		inspectorNoteJson: v.string(),
	},
	handler: async (ctx, args) => {
		const orgId = await requireOrg(ctx);
		const identity = await ctx.auth.getUserIdentity();
		const email = identity?.email ?? "unknown";
		const name = identity?.name ?? email;
		const now = new Date().toISOString();

		const existing = await ctx.db
			.query("staffFeedback")
			.withIndex("by_orgId_noteId", (q) =>
				q.eq("orgId", orgId).eq("noteId", args.noteId)
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				comment: args.comment,
				inspectorNoteJson: args.inspectorNoteJson,
				updatedAt: now,
			});
			return existing._id;
		}

		return await ctx.db.insert("staffFeedback", {
			orgId,
			pathname: args.pathname,
			noteId: args.noteId,
			kind: args.kind,
			comment: args.comment,
			authorEmail: email,
			authorName: name,
			inspectorNoteJson: args.inspectorNoteJson,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const remove = mutation({
	args: { noteId: v.string() },
	handler: async (ctx, { noteId }) => {
		const orgId = await requireOrg(ctx);
		const existing = await ctx.db
			.query("staffFeedback")
			.withIndex("by_orgId_noteId", (q) =>
				q.eq("orgId", orgId).eq("noteId", noteId)
			)
			.first();
		if (existing) {
			await ctx.db.delete(existing._id);
		}
	},
});

export const clearPage = mutation({
	args: { pathname: v.string() },
	handler: async (ctx, { pathname }) => {
		const orgId = await requireOrg(ctx);
		const all = await ctx.db
			.query("staffFeedback")
			.withIndex("by_orgId_pathname", (q) =>
				q.eq("orgId", orgId).eq("pathname", pathname)
			)
			.collect();
		for (const entry of all) {
			await ctx.db.delete(entry._id);
		}
	},
});
