/**
 * Admin maintenance functions.
 * Internal-only — callable from `npx convex run` / dashboard, not from the web app.
 */
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { TableNames } from "../_generated/dataModel";

const TABLES: TableNames[] = [
	"orgSettings",
	"parties",
	"customers",
	"products",
	"invoices",
	"invoiceCounters",
	"stockBookEntries",
	"ledgerEntries",
	"accounts",
	"vehicles",
	"trips",
	"notifications",
	"pendingOnboarding",
	"staffFeedback",
	"billTemplates",
];

const BATCH = 500;

export const wipeTableBatch = internalMutation({
	args: { table: v.string() },
	handler: async (ctx, { table }) => {
		const rows = await ctx.db
			.query(table as TableNames)
			.take(BATCH);
		for (const r of rows) await ctx.db.delete(r._id);
		return rows.length;
	},
});

export const countTable = internalQuery({
	args: { table: v.string() },
	handler: async (ctx, { table }) => {
		const rows = await ctx.db.query(table as TableNames).collect();
		return rows.length;
	},
});

export const wipeAll = internalAction({
	args: {},
	handler: async (ctx): Promise<Record<string, number>> => {
		const result: Record<string, number> = {};
		for (const table of TABLES) {
			let total = 0;
			while (true) {
				const deleted: number = await ctx.runMutation(
					internal.functions.admin.wipeTableBatch,
					{ table },
				);
				total += deleted;
				if (deleted < BATCH) break;
			}
			result[table] = total;
		}
		return result;
	},
});

export const countAll = internalQuery({
	args: {},
	handler: async (ctx) => {
		const result: Record<string, number> = {};
		for (const table of TABLES) {
			const rows = await ctx.db.query(table).collect();
			result[table] = rows.length;
		}
		return result;
	},
});
