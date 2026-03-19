import { query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg } from "../lib/orgGuard";

export const search = query({
	args: { searchTerm: v.string() },
	handler: async (ctx, { searchTerm }) => {
		if (!searchTerm.trim()) return [];

		const orgId = await getOrg(ctx);
		if (!orgId) return [];

		const [products, customers, parties, invoices, vehicles] =
			await Promise.all([
				ctx.db
					.query("products")
					.withSearchIndex("search_title", (q) =>
						q.search("title", searchTerm).eq("orgId", orgId)
					)
					.take(5)
					.then((rows) => rows.filter((p) => p.isActive)),
				ctx.db
					.query("customers")
					.withSearchIndex("search_name", (q) =>
						q.search("name", searchTerm).eq("orgId", orgId)
					)
					.take(5)
					.then((rows) => rows.filter((c) => c.isActive)),
				ctx.db
					.query("parties")
					.withSearchIndex("search_name", (q) =>
						q.search("name", searchTerm).eq("orgId", orgId)
					)
					.take(5)
					.then((rows) => rows.filter((p) => p.isActive)),
				ctx.db
					.query("invoices")
					.withSearchIndex("search_number", (q) =>
						q.search("invoiceNumber", searchTerm).eq("orgId", orgId)
					)
					.take(5),
				ctx.db
					.query("vehicles")
					.withSearchIndex("search_name", (q) =>
						q.search("name", searchTerm).eq("orgId", orgId)
					)
					.take(5)
					.then((rows) => rows.filter((v) => v.isActive)),
			]);

		const results: {
			type: "product" | "customer" | "party" | "invoice" | "vehicle";
			id: string;
			label: string;
			subtitle: string | null;
		}[] = [];

		for (const p of products) {
			results.push({
				type: "product",
				id: p._id,
				label: p.title,
				subtitle: p.category ?? null,
			});
		}

		for (const c of customers) {
			results.push({
				type: "customer",
				id: c._id,
				label: c.name,
				subtitle: c.phone ?? null,
			});
		}

		for (const p of parties) {
			results.push({
				type: "party",
				id: p._id,
				label: p.name,
				subtitle: p.phone ?? null,
			});
		}

		for (const inv of invoices) {
			results.push({
				type: "invoice",
				id: inv._id,
				label: inv.invoiceNumber ?? inv._id,
				subtitle: `${inv.type} — NPR ${inv.totalAmount}`,
			});
		}

		for (const v of vehicles) {
			results.push({
				type: "vehicle",
				id: v._id,
				label: v.name,
				subtitle: v.licensePlate,
			});
		}

		return results;
	},
});
