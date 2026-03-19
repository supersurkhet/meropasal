/**
 * Temporary seed script for populating demo data.
 * Remove after seeding is complete.
 */
import { mutation, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

import { query } from "../_generated/server";

export const debugAuth = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return { error: "no identity" };
		const subject = identity.subject;
		const orgId = (identity as Record<string, unknown>).org_id as string | undefined
			|| (identity as Record<string, unknown>).orgId as string | undefined;
		const mapping = subject ? await ctx.db.query("userOrgMappings")
			.withIndex("by_subject", (q) => q.eq("subject", subject))
			.first() : null;
		return {
			subject,
			orgId,
			tokenIdentifier: identity.tokenIdentifier,
			mappingFound: !!mapping,
			mappingOrgId: mapping?.orgId ?? null,
			allClaims: Object.keys(identity),
		};
	},
});

export const createUserOrgMapping = mutation({
	args: { subject: v.string(), orgId: v.string() },
	handler: async (ctx, { subject, orgId }) => {
		const existing = await ctx.db.query("userOrgMappings")
			.withIndex("by_subject", (q) => q.eq("subject", subject))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, { orgId });
			return { updated: true, orgId };
		}
		await ctx.db.insert("userOrgMappings", { subject, orgId });
		return { created: true, orgId };
	},
});

export const clearAll = mutation({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		// Don't delete orgSettings or accounts — those are user-configured, not demo data
		const tables = ["parties", "customers", "products", "invoices", "stockBookEntries", "trips", "vehicles", "notifications", "ledgerEntries", "billTemplates"] as const;
		let total = 0;
		for (const table of tables) {
			const rows = await ctx.db
				.query(table)
				.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
				.collect();
			for (const row of rows) {
				await ctx.db.delete(row._id);
				total++;
			}
		}
		// invoiceCounters doesn't have by_orgId index
		const counters = await ctx.db.query("invoiceCounters").collect();
		for (const c of counters) {
			if (c.orgId === orgId) { await ctx.db.delete(c._id); total++; }
		}
		return { deleted: total };
	},
});

export const seedAll = mutation({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		// Check if already seeded
		const existingParties = await ctx.db
			.query("parties")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.collect();
		if (existingParties.length > 0) {
			return { status: "already_seeded", parties: existingParties.length };
		}

		const fiscalYear = "82/83";
		const today = new Date().toISOString();

		// 0. Ensure OrgSettings and accounts exist (don't overwrite existing settings)
		const existingSettings = await ctx.db
			.query("orgSettings")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.first();
		if (!existingSettings) {
			// Only create minimal settings — user should configure via Settings page
			await ctx.db.insert("orgSettings", {
				orgId,
				businessName: "",
				businessType: "retail",
				currentFiscalYear: fiscalYear,
				currency: "NPR",
				taxRate: 13,
				features: {
					invoicing: true,
					stockBook: true,
					logistics: true,
					ledger: true,
				},
			});
		}

		// Ensure chart of accounts exists
		const existingAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.collect();
		if (existingAccounts.length === 0) {
			const accounts = [
				{ code: "1000", name: "Cash", type: "asset" as const, isSystemAccount: true },
				{ code: "1010", name: "Bank Account", type: "asset" as const, isSystemAccount: true },
				{ code: "1100", name: "Accounts Receivable", type: "asset" as const, isSystemAccount: true },
				{ code: "1200", name: "Inventory", type: "asset" as const, isSystemAccount: true },
				{ code: "2000", name: "Accounts Payable", type: "liability" as const, isSystemAccount: true },
				{ code: "2100", name: "Tax Payable", type: "liability" as const, isSystemAccount: true },
				{ code: "3000", name: "Owner's Equity", type: "equity" as const, isSystemAccount: true },
				{ code: "3100", name: "Retained Earnings", type: "equity" as const, isSystemAccount: true },
				{ code: "4000", name: "Sales Revenue", type: "revenue" as const, isSystemAccount: true },
				{ code: "4100", name: "Service Revenue", type: "revenue" as const, isSystemAccount: true },
				{ code: "5000", name: "Cost of Goods Sold", type: "expense" as const, isSystemAccount: true },
				{ code: "5100", name: "Purchase Expense", type: "expense" as const, isSystemAccount: true },
				{ code: "5200", name: "Transport Expense", type: "expense" as const, isSystemAccount: true },
				{ code: "5300", name: "Office Expense", type: "expense" as const, isSystemAccount: true },
			];
			for (const acct of accounts) {
				await ctx.db.insert("accounts", { orgId, ...acct });
			}
		}

		// Ensure invoice counters exist
		const existingCounters = await ctx.db
			.query("invoiceCounters")
			.withIndex("by_orgId_fiscal_type", (q) =>
				q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "purchase")
			)
			.first();
		if (!existingCounters) {
			for (const type of ["purchase", "sale"] as const) {
				await ctx.db.insert("invoiceCounters", { orgId, fiscalYear, type, count: 0 });
			}
		}

		// 1. Create Parties (10)
		const partyData = [
			{ name: "ABC Distributors", address: "Kalimati, Kathmandu", phone: "01-4234567" },
			{ name: "Himalayan Traders", address: "Asan, Kathmandu", phone: "01-4456789" },
			{ name: "Nepal Food Industries", address: "Balaju, Kathmandu", phone: "01-4312345" },
			{ name: "Pokhara Wholesale", address: "Lakeside, Pokhara", phone: "061-523456" },
			{ name: "Bharatpur Supply Co", address: "Narayanghat, Chitwan", phone: "056-534567" },
			{ name: "Dharan Trading", address: "Dharan Bazaar", phone: "025-523456" },
			{ name: "Biratnagar Imports", address: "Main Road, Biratnagar", phone: "021-534567" },
			{ name: "Chitwan Agro", address: "Bharatpur, Chitwan", phone: "056-545678" },
			{ name: "Butwal Wholesale", address: "Traffic Chowk, Butwal", phone: "071-545678" },
			{ name: "Janakpur Traders", address: "Station Road, Janakpur", phone: "041-523456" },
		];
		const partyIds: Id<"parties">[] = [];
		for (const p of partyData) {
			const id = await ctx.db.insert("parties", { orgId, ...p, isActive: true });
			partyIds.push(id);
		}

		// 2. Create Customers (10)
		const customerData = [
			{ name: "Ram Grocery", address: "Baneshwor, Kathmandu", phone: "01-4789012" },
			{ name: "Sita Mart", address: "Patan, Lalitpur", phone: "01-5534567" },
			{ name: "Krishna General Store", address: "Bhaktapur", phone: "01-6612345" },
			{ name: "Lakshmi Traders", address: "Kirtipur", phone: "01-4890123" },
			{ name: "Ganesh Provision", address: "Thimi, Bhaktapur", phone: "01-6623456" },
			{ name: "Shyam Kirana", address: "Jorpati, Kathmandu", phone: "01-4901234" },
			{ name: "Durga Store", address: "Boudha, Kathmandu", phone: "01-4812345" },
			{ name: "Hari Pasal", address: "Chabahil, Kathmandu", phone: "01-4923456" },
			{ name: "Mohan Enterprises", address: "Kalanki, Kathmandu", phone: "01-4567890" },
			{ name: "Sarita Collection", address: "New Road, Kathmandu", phone: "01-4234890" },
		];
		const customerIds: Id<"customers">[] = [];
		for (const c of customerData) {
			const id = await ctx.db.insert("customers", { orgId, ...c, isActive: true });
			customerIds.push(id);
		}

		// 3. Create Products (15) — linked to parties
		const productData = [
			{ title: "Basmati Rice 25kg", costPrice: 2500, sellingPrice: 2800, openingStock: 100, reorderLevel: 15, partyIdx: 0, unit: "bag:1", category: "Grains" },
			{ title: "Mustard Oil 1L", costPrice: 350, sellingPrice: 400, openingStock: 150, reorderLevel: 20, partyIdx: 1, unit: "bottle:1", category: "Oil" },
			{ title: "Sugar 1kg", costPrice: 120, sellingPrice: 140, openingStock: 200, reorderLevel: 25, partyIdx: 2, unit: "packet:1", category: "Essentials" },
			{ title: "Salt Iodized 1kg", costPrice: 30, sellingPrice: 40, openingStock: 200, reorderLevel: 30, partyIdx: 2, unit: "packet:1", category: "Essentials" },
			{ title: "Dal Masoor 1kg", costPrice: 180, sellingPrice: 210, openingStock: 120, reorderLevel: 15, partyIdx: 3, unit: "packet:1", category: "Pulses" },
			{ title: "Ghee 500g", costPrice: 450, sellingPrice: 520, openingStock: 80, reorderLevel: 10, partyIdx: 0, unit: "jar:1", category: "Dairy" },
			{ title: "Tea Dust 500g", costPrice: 280, sellingPrice: 330, openingStock: 100, reorderLevel: 15, partyIdx: 4, unit: "packet:1", category: "Beverages" },
			{ title: "Turmeric Powder 200g", costPrice: 90, sellingPrice: 110, openingStock: 150, reorderLevel: 20, partyIdx: 5, unit: "packet:1", category: "Spices" },
			{ title: "Red Chili Powder 200g", costPrice: 85, sellingPrice: 105, openingStock: 150, reorderLevel: 20, partyIdx: 5, unit: "packet:1", category: "Spices" },
			{ title: "Soap Bar", costPrice: 45, sellingPrice: 55, openingStock: 200, reorderLevel: 30, partyIdx: 6, unit: "piece:1", category: "Personal Care" },
			{ title: "Toothpaste 100g", costPrice: 80, sellingPrice: 100, openingStock: 120, reorderLevel: 15, partyIdx: 6, unit: "tube:1", category: "Personal Care" },
			{ title: "Shampoo 200ml", costPrice: 160, sellingPrice: 195, openingStock: 90, reorderLevel: 12, partyIdx: 7, unit: "bottle:1", category: "Personal Care" },
			{ title: "Washing Powder 1kg", costPrice: 130, sellingPrice: 160, openingStock: 100, reorderLevel: 15, partyIdx: 8, unit: "packet:1", category: "Household" },
			{ title: "Biscuit Pack", costPrice: 25, sellingPrice: 30, openingStock: 300, reorderLevel: 40, partyIdx: 9, unit: "box:12", category: "Snacks" },
			{ title: "Noodles Pack", costPrice: 20, sellingPrice: 25, openingStock: 250, reorderLevel: 35, partyIdx: 9, unit: "box:30", category: "Snacks" },
		];
		const productIds: Id<"products">[] = [];
		for (const p of productData) {
			const id = await ctx.db.insert("products", {
				orgId,
				title: p.title,
				purchasePartyId: partyIds[p.partyIdx],
				costPrice: p.costPrice,
				sellingPrice: p.sellingPrice,
				openingStock: p.openingStock,
				reorderLevel: p.reorderLevel,
				unit: p.unit,
				category: p.category,
				isActive: true,
			});
			productIds.push(id);

			// Create opening stock entry
			await ctx.db.insert("stockBookEntries", {
				orgId,
				entryDate: today,
				transactionType: "stock",
				movementType: "opening",
				direction: "in",
				productId: id,
				quantityIn: p.openingStock,
				quantityOut: 0,
				quantity: p.openingStock,
				unitRate: p.costPrice,
				totalAmount: p.openingStock * p.costPrice,
				particulars: `Opening stock for ${p.title}`,
				fiscalYear,
				sourceTable: "product",
				sourceId: id,
			});
		}

		// 4. Create Stock Imports (5) with invoices
		const importData = [
			{ partyIdx: 0, items: [{ prodIdx: 0, qty: 50, rate: 2500 }, { prodIdx: 5, qty: 30, rate: 450 }] },
			{ partyIdx: 1, items: [{ prodIdx: 1, qty: 80, rate: 350 }, { prodIdx: 6, qty: 40, rate: 280 }] },
			{ partyIdx: 2, items: [{ prodIdx: 2, qty: 100, rate: 120 }, { prodIdx: 3, qty: 100, rate: 30 }] },
			{ partyIdx: 5, items: [{ prodIdx: 7, qty: 60, rate: 90 }, { prodIdx: 8, qty: 60, rate: 85 }] },
			{ partyIdx: 6, items: [{ prodIdx: 9, qty: 100, rate: 45 }, { prodIdx: 10, qty: 60, rate: 80 }] },
		];

		// Get or create purchase counter
		let purchaseCounter = await ctx.db
			.query("invoiceCounters")
			.withIndex("by_orgId_fiscal_type", (q) =>
				q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "purchase")
			)
			.first();
		if (!purchaseCounter) {
			const cid = await ctx.db.insert("invoiceCounters", { orgId, fiscalYear, type: "purchase", count: 0 });
			purchaseCounter = (await ctx.db.get(cid))!;
		}

		for (const imp of importData) {
			const invoiceItems = imp.items.map((item) => ({
				productId: productIds[item.prodIdx],
				productTitle: productData[item.prodIdx].title,
				quantity: item.qty,
				rate: item.rate,
				total: item.qty * item.rate,
			}));
			const subTotal = invoiceItems.reduce((s, i) => s + i.total, 0);

			const nextCount = purchaseCounter!.count + 1;
			await ctx.db.patch(purchaseCounter!._id, { count: nextCount });
			const invoiceNumber = `PUR-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

			const invoiceId = await ctx.db.insert("invoices", {
				orgId,
				type: "purchase",
				invoiceNumber,
				partyId: partyIds[imp.partyIdx],
				partyType: "supplier",
				issuedAt: today,
				items: invoiceItems,
				subTotal,
				tax: 0,
				totalAmount: subTotal,
				payments: [],
				paidAmount: 0,
				paymentStatus: "pending",
				fiscalYear,
			});

			// Stock book entries
			for (const item of imp.items) {
				await ctx.db.insert("stockBookEntries", {
					orgId,
					entryDate: today,
					transactionType: "purchase",
					movementType: "purchase",
					direction: "in",
					productId: productIds[item.prodIdx],
					quantityIn: item.qty,
					quantityOut: 0,
					quantity: item.qty,
					unitRate: item.rate,
					totalAmount: item.qty * item.rate,
					particulars: `Purchase from ${partyData[imp.partyIdx].name}`,
					sourceTable: "stockImport",
					sourceId: invoiceId,
					counterpartyId: partyIds[imp.partyIdx],
					originPartyId: partyIds[imp.partyIdx],
					fiscalYear,
				});
			}

			purchaseCounter = (await ctx.db.get(purchaseCounter!._id))!;
		}

		// 5. Create Sales (5) with invoices
		let saleCounter = await ctx.db
			.query("invoiceCounters")
			.withIndex("by_orgId_fiscal_type", (q) =>
				q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "sale")
			)
			.first();
		if (!saleCounter) {
			const cid = await ctx.db.insert("invoiceCounters", { orgId, fiscalYear, type: "sale", count: 0 });
			saleCounter = (await ctx.db.get(cid))!;
		}

		const saleData = [
			{ custIdx: 0, items: [{ prodIdx: 0, qty: 5, rate: 2800 }, { prodIdx: 2, qty: 10, rate: 140 }] },
			{ custIdx: 1, items: [{ prodIdx: 1, qty: 8, rate: 400 }, { prodIdx: 4, qty: 5, rate: 210 }] },
			{ custIdx: 2, items: [{ prodIdx: 6, qty: 6, rate: 330 }, { prodIdx: 7, qty: 10, rate: 110 }] },
			{ custIdx: 3, items: [{ prodIdx: 9, qty: 20, rate: 55 }, { prodIdx: 10, qty: 10, rate: 100 }] },
			{ custIdx: 4, items: [{ prodIdx: 13, qty: 15, rate: 30 }, { prodIdx: 14, qty: 20, rate: 25 }] },
		];

		for (const sale of saleData) {
			const invoiceItems = sale.items.map((item) => ({
				productId: productIds[item.prodIdx],
				productTitle: productData[item.prodIdx].title,
				quantity: item.qty,
				rate: item.rate,
				total: item.qty * item.rate,
			}));
			const subTotal = invoiceItems.reduce((s, i) => s + i.total, 0);
			const payments = [{ paidAt: today, paidAmount: subTotal, paymentMethod: "cash" as const }];

			const nextCount = saleCounter!.count + 1;
			await ctx.db.patch(saleCounter!._id, { count: nextCount });
			const invoiceNumber = `SAL-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

			const invoiceId = await ctx.db.insert("invoices", {
				orgId,
				type: "sale",
				invoiceNumber,
				partyId: customerIds[sale.custIdx],
				partyType: "customer",
				issuedAt: today,
				items: invoiceItems,
				subTotal,
				tax: 0,
				totalAmount: subTotal,
				payments,
				paidAmount: subTotal,
				paymentStatus: "paid",
				fiscalYear,
			});

			// Stock book entries (out)
			for (const item of sale.items) {
				await ctx.db.insert("stockBookEntries", {
					orgId,
					entryDate: today,
					transactionType: "sale",
					movementType: "sale",
					direction: "out",
					productId: productIds[item.prodIdx],
					quantityIn: 0,
					quantityOut: item.qty,
					quantity: item.qty,
					unitRate: item.rate,
					totalAmount: item.qty * item.rate,
					particulars: "Sale",
					sourceTable: "sale",
					sourceId: invoiceId,
					counterpartyId: customerIds[sale.custIdx],
					originPartyId: partyIds[productData[item.prodIdx].partyIdx],
					fiscalYear,
				});
			}

			saleCounter = (await ctx.db.get(saleCounter!._id))!;
		}

		// 6. Create Orders (5) — mix of payment statuses
		const orderData = [
			{ custIdx: 5, items: [{ prodIdx: 0, qty: 3, rate: 2800 }, { prodIdx: 1, qty: 5, rate: 400 }], paidPct: 0 },
			{ custIdx: 6, items: [{ prodIdx: 2, qty: 20, rate: 140 }, { prodIdx: 4, qty: 8, rate: 210 }], paidPct: 0.5 },
			{ custIdx: 7, items: [{ prodIdx: 5, qty: 4, rate: 520 }, { prodIdx: 6, qty: 6, rate: 330 }], paidPct: 1 },
			{ custIdx: 8, items: [{ prodIdx: 11, qty: 5, rate: 195 }, { prodIdx: 12, qty: 8, rate: 160 }], paidPct: 0.3 },
			{ custIdx: 9, items: [{ prodIdx: 13, qty: 10, rate: 30 }, { prodIdx: 14, qty: 15, rate: 25 }], paidPct: 0 },
		];

		for (const order of orderData) {
			const invoiceItems = order.items.map((item) => ({
				productId: productIds[item.prodIdx],
				productTitle: productData[item.prodIdx].title,
				quantity: item.qty,
				rate: item.rate,
				total: item.qty * item.rate,
			}));
			const subTotal = invoiceItems.reduce((s, i) => s + i.total, 0);
			const paidAmount = Math.round(subTotal * order.paidPct);
			const payments = paidAmount > 0
				? [{ paidAt: today, paidAmount, paymentMethod: "cash" as const }]
				: [];
			const paymentStatus = paidAmount === 0 ? "pending" as const
				: paidAmount >= subTotal ? "paid" as const
				: "partial" as const;

			await ctx.db.insert("invoices", {
				orgId,
				type: "sale",
				partyId: customerIds[order.custIdx],
				partyType: "customer",
				issuedAt: today,
				items: invoiceItems,
				subTotal,
				tax: 0,
				totalAmount: subTotal,
				payments,
				paidAmount,
				paymentStatus,
				fiscalYear,
			});
		}

		// 7. Create Vehicles (3)
		const vehicleData = [
			{ name: "Tata Truck", licensePlate: "Ba 1 Kha 1234", description: "20-ton cargo truck" },
			{ name: "Mahindra Bolero", licensePlate: "Ba 2 Kha 5678", description: "Pickup for local delivery" },
			{ name: "Honda Dio", licensePlate: "Ba 3 Pa 9012", description: "Scooter for small deliveries" },
		];
		const vehicleIds: Id<"vehicles">[] = [];
		for (const v of vehicleData) {
			const id = await ctx.db.insert("vehicles", { orgId, ...v, isActive: true });
			vehicleIds.push(id);
		}

		// 8. Create Trips (2)
		const tripProducts1 = [
			{ productId: productIds[0], productTitle: "Basmati Rice 25kg", quantity: 10, unitPrice: 2800, unit: "bag:1" },
			{ productId: productIds[2], productTitle: "Sugar 1kg", quantity: 20, unitPrice: 140, unit: "packet:1" },
		];
		await ctx.db.insert("trips", {
			orgId,
			vehicleId: vehicleIds[0],
			dispatchTime: today,
			destination: "Bhaktapur Market",
			status: "dispatched",
			products: tripProducts1,
			returnedProducts: [],
		});

		const tripProducts2 = [
			{ productId: productIds[1], productTitle: "Mustard Oil 1L", quantity: 15, unitPrice: 400, unit: "bottle:1" },
			{ productId: productIds[6], productTitle: "Tea Dust 500g", quantity: 10, unitPrice: 330, unit: "packet:1" },
		];
		await ctx.db.insert("trips", {
			orgId,
			vehicleId: vehicleIds[1],
			dispatchTime: today,
			destination: "Patan Market",
			status: "returned",
			products: tripProducts2,
			returnedProducts: [
				{ productId: productIds[1], productTitle: "Mustard Oil 1L", quantity: 5, unitPrice: 400, unit: "bottle:1" },
				{ productId: productIds[6], productTitle: "Tea Dust 500g", quantity: 3, unitPrice: 330, unit: "packet:1" },
			],
			returnTime: today,
		});

		// 9. Create Notifications
		await ctx.db.insert("notifications", {
			orgId,
			type: "low_stock",
			title: "Low Stock Alert",
			message: "Ghee 500g is running low (10 remaining, reorder level: 10)",
			entityType: "products",
			entityId: productIds[5],
			isRead: false,
			createdAt: today,
		});
		await ctx.db.insert("notifications", {
			orgId,
			type: "order_status",
			title: "Order Fulfilled",
			message: "Order SAL-82/83-00003 has been marked as done",
			entityType: "invoices",
			isRead: false,
			createdAt: today,
		});
		await ctx.db.insert("notifications", {
			orgId,
			type: "low_stock",
			title: "Low Stock Alert",
			message: "Biscuit Pack is running low (15 remaining, reorder level: 40)",
			entityType: "products",
			entityId: productIds[13],
			isRead: true,
			createdAt: today,
		});

		return {
			status: "seeded",
			parties: partyIds.length,
			customers: customerIds.length,
			products: productIds.length,
			imports: importData.length,
			sales: saleData.length,
			orders: orderData.length,
			vehicles: vehicleIds.length,
			trips: 2,
			notifications: 3,
		};
	},
});

export const seedBulk = mutation({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const fiscalYear = "82/83"
		const today = new Date().toISOString()

		// Get existing parties so we can link products to them
		const existingParties = await ctx.db
			.query("parties")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.collect()
		const existingPartyIds = existingParties.map((p) => p._id)

		// 1. Add 40 more parties (suppliers)
		const newPartyData = [
			{ name: "Lumbini Agro Suppliers", address: "Bhairahawa, Rupandehi", phone: "071-523456" },
			{ name: "Sagarmatha Distributors", address: "Namche, Solukhumbu", phone: "038-520123" },
			{ name: "Terai Trading House", address: "Birgunj, Parsa", phone: "051-534567" },
			{ name: "Koshi Wholesale", address: "Itahari, Sunsari", phone: "025-587654" },
			{ name: "Gandaki Provisions", address: "Damauli, Tanahun", phone: "065-560123" },
			{ name: "Mechi Import Export", address: "Kakarbhitta, Jhapa", phone: "023-545678" },
			{ name: "Rapti Traders", address: "Tulsipur, Dang", phone: "082-523456" },
			{ name: "Bagmati Suppliers", address: "Hetauda, Makwanpur", phone: "057-534567" },
			{ name: "Karnali Distribution", address: "Surkhet Bazaar", phone: "083-523456" },
			{ name: "Mahakali Traders", address: "Mahendranagar, Kanchanpur", phone: "099-523456" },
			{ name: "Seti Zone Suppliers", address: "Dhangadhi, Kailali", phone: "091-534567" },
			{ name: "Bheri Wholesale Co", address: "Nepalgunj, Banke", phone: "081-534567" },
			{ name: "Narayani Foods", address: "Parasi, Nawalparasi", phone: "078-523456" },
			{ name: "Lumbini Rice Mills", address: "Kapilvastu Bazaar", phone: "076-560123" },
			{ name: "Saptari Trading", address: "Rajbiraj, Saptari", phone: "031-523456" },
			{ name: "Siraha Distributors", address: "Lahan, Siraha", phone: "033-534567" },
			{ name: "Udayapur Supplies", address: "Gaighat, Udayapur", phone: "035-523456" },
			{ name: "Okhaldhunga Traders", address: "Okhaldhunga Bazaar", phone: "037-520123" },
			{ name: "Dolakha Agro", address: "Charikot, Dolakha", phone: "049-423456" },
			{ name: "Sindhupalchok Trading", address: "Chautara", phone: "011-620123" },
			{ name: "Kavrepalanchok Supply", address: "Dhulikhel, Kavre", phone: "011-490123" },
			{ name: "Nuwakot Distributors", address: "Bidur, Nuwakot", phone: "010-560123" },
			{ name: "Gorkha Trading House", address: "Gorkha Bazaar", phone: "064-420123" },
			{ name: "Lamjung Suppliers", address: "Besisahar, Lamjung", phone: "066-520123" },
			{ name: "Manang Import Co", address: "Chame, Manang", phone: "066-440123" },
			{ name: "Mustang Trading", address: "Jomsom, Mustang", phone: "069-440123" },
			{ name: "Myagdi Wholesale", address: "Beni, Myagdi", phone: "069-520123" },
			{ name: "Parbat Suppliers", address: "Kushma, Parbat", phone: "067-420123" },
			{ name: "Syangja Trading", address: "Putalibazar, Syangja", phone: "063-420123" },
			{ name: "Palpa Distributors", address: "Tansen, Palpa", phone: "075-520123" },
			{ name: "Gulmi Agro Supply", address: "Tamghas, Gulmi", phone: "079-520123" },
			{ name: "Arghakhanchi Traders", address: "Sandhikharka", phone: "077-420123" },
			{ name: "Pyuthan Wholesale", address: "Pyuthan Bazaar", phone: "086-420123" },
			{ name: "Rolpa Trading Co", address: "Liwang, Rolpa", phone: "086-440123" },
			{ name: "Rukum Suppliers", address: "Musikot, Rukum", phone: "088-420123" },
			{ name: "Salyan Distributors", address: "Salyan Bazaar", phone: "088-520123" },
			{ name: "Jajarkot Trading", address: "Khalanga, Jajarkot", phone: "089-420123" },
			{ name: "Dailekh Suppliers", address: "Dailekh Bazaar", phone: "089-520123" },
			{ name: "Jumla Agro Trading", address: "Khalanga, Jumla", phone: "087-520123" },
			{ name: "Kalikot Wholesale", address: "Manma, Kalikot", phone: "087-420123" },
		]
		const newPartyIds: Id<"parties">[] = []
		for (const p of newPartyData) {
			const id = await ctx.db.insert("parties", {
				orgId,
				...p,
				panNumber: `${Math.floor(100000000 + Math.random() * 900000000)}`,
				creditLimit: Math.floor(50000 + Math.random() * 450000),
				isActive: true,
			})
			newPartyIds.push(id)
		}
		const allPartyIds = [...existingPartyIds, ...newPartyIds]

		// 2. Add 40 more customers
		const newCustomerData = [
			{ name: "Annapurna Kirana", address: "Pokhara-6, Kaski", phone: "061-534567" },
			{ name: "Everest General Store", address: "Biratnagar-4, Morang", phone: "021-545678" },
			{ name: "Lhotse Mart", address: "Dharan-7, Sunsari", phone: "025-556789" },
			{ name: "Manaslu Provision", address: "Gorkha-3", phone: "064-423456" },
			{ name: "Dhaulagiri Shop", address: "Baglung-1", phone: "068-520123" },
			{ name: "Machhapuchhre Store", address: "Pokhara-12, Kaski", phone: "061-545678" },
			{ name: "Kanchenjunga Traders", address: "Taplejung Bazaar", phone: "024-420123" },
			{ name: "Makalu Supplies", address: "Khandbari, Sankhuwasabha", phone: "029-520123" },
			{ name: "Cho Oyu Pasal", address: "Namche, Solukhumbu", phone: "038-520456" },
			{ name: "Tilicho Market", address: "Manang Bazaar", phone: "066-440456" },
			{ name: "Rara Lake Store", address: "Mugu Bazaar", phone: "087-440123" },
			{ name: "Phewa Mart", address: "Lakeside, Pokhara", phone: "061-556789" },
			{ name: "Begnas Trading", address: "Lekhnath, Kaski", phone: "061-567890" },
			{ name: "Taudaha Grocery", address: "Kirtipur-5, Kathmandu", phone: "01-4334567" },
			{ name: "Swoyambhu Pasal", address: "Swoyambhu, Kathmandu", phone: "01-4345678" },
			{ name: "Pashupatinath Store", address: "Gaushala, Kathmandu", phone: "01-4356789" },
			{ name: "Boudhanath Traders", address: "Boudha-6, Kathmandu", phone: "01-4367890" },
			{ name: "Durbar Mart", address: "Basantapur, Kathmandu", phone: "01-4245678" },
			{ name: "Thamel Provision", address: "Thamel-26, Kathmandu", phone: "01-4256789" },
			{ name: "Lazimpat Store", address: "Lazimpat, Kathmandu", phone: "01-4267890" },
			{ name: "Baluwatar Grocery", address: "Baluwatar, Kathmandu", phone: "01-4278901" },
			{ name: "Maharajgunj Pasal", address: "Maharajgunj, Kathmandu", phone: "01-4289012" },
			{ name: "Gongabu Traders", address: "Gongabu, Kathmandu", phone: "01-4300123" },
			{ name: "Samakhusi Store", address: "Samakhusi, Kathmandu", phone: "01-4311234" },
			{ name: "Tokha Mart", address: "Tokha-4, Kathmandu", phone: "01-4322345" },
			{ name: "Budhanilkantha Shop", address: "Budhanilkantha-9", phone: "01-4375678" },
			{ name: "Sundarijal Grocery", address: "Sundarijal, Kathmandu", phone: "01-4386789" },
			{ name: "Sankhu Trading", address: "Sankhu-1, Kathmandu", phone: "01-4397890" },
			{ name: "Godavari Pasal", address: "Godavari, Lalitpur", phone: "01-5512345" },
			{ name: "Chapagaun Store", address: "Chapagaun, Lalitpur", phone: "01-5523456" },
			{ name: "Lubhu Mart", address: "Lubhu, Lalitpur", phone: "01-5534567" },
			{ name: "Imadol Traders", address: "Imadol, Lalitpur", phone: "01-5545678" },
			{ name: "Satdobato Shop", address: "Satdobato, Lalitpur", phone: "01-5556789" },
			{ name: "Lagankhel Provision", address: "Lagankhel, Lalitpur", phone: "01-5567890" },
			{ name: "Kupondole Store", address: "Kupondole, Lalitpur", phone: "01-5578901" },
			{ name: "Jawalakhel Mart", address: "Jawalakhel, Lalitpur", phone: "01-5589012" },
			{ name: "Ekantakuna Grocery", address: "Ekantakuna, Lalitpur", phone: "01-5590123" },
			{ name: "Balkumari Pasal", address: "Balkumari, Lalitpur", phone: "01-5601234" },
			{ name: "Thimi Trading", address: "Thimi-3, Bhaktapur", phone: "01-6634567" },
			{ name: "Suryabinayak Store", address: "Suryabinayak, Bhaktapur", phone: "01-6645678" },
		]
		const newCustomerIds: Id<"customers">[] = []
		for (const c of newCustomerData) {
			const id = await ctx.db.insert("customers", {
				orgId,
				...c,
				email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
				creditLimit: Math.floor(10000 + Math.random() * 90000),
				isActive: true,
			})
			newCustomerIds.push(id)
		}

		// Get existing customers
		const existingCustomers = await ctx.db
			.query("customers")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.collect()
		const allCustomerIds = existingCustomers.map((c) => c._id)

		// 3. Add 35 more products
		const newProductData = [
			{ title: "Chana Dal 1kg", costPrice: 160, sellingPrice: 190, openingStock: 80, reorderLevel: 15, category: "Pulses" },
			{ title: "Urad Dal 1kg", costPrice: 200, sellingPrice: 240, openingStock: 60, reorderLevel: 10, category: "Pulses" },
			{ title: "Rajma 1kg", costPrice: 220, sellingPrice: 260, openingStock: 50, reorderLevel: 10, category: "Pulses" },
			{ title: "Maida 1kg", costPrice: 65, sellingPrice: 80, openingStock: 150, reorderLevel: 20, category: "Grains" },
			{ title: "Atta 5kg", costPrice: 280, sellingPrice: 330, openingStock: 80, reorderLevel: 15, category: "Grains" },
			{ title: "Suji 500g", costPrice: 55, sellingPrice: 70, openingStock: 100, reorderLevel: 15, category: "Grains" },
			{ title: "Poha 500g", costPrice: 50, sellingPrice: 65, openingStock: 90, reorderLevel: 12, category: "Grains" },
			{ title: "Sunflower Oil 1L", costPrice: 320, sellingPrice: 370, openingStock: 100, reorderLevel: 15, category: "Oil" },
			{ title: "Coconut Oil 500ml", costPrice: 250, sellingPrice: 300, openingStock: 70, reorderLevel: 10, category: "Oil" },
			{ title: "Soybean Oil 5L", costPrice: 1200, sellingPrice: 1400, openingStock: 40, reorderLevel: 8, category: "Oil" },
			{ title: "Milk Powder 500g", costPrice: 380, sellingPrice: 440, openingStock: 60, reorderLevel: 10, category: "Dairy" },
			{ title: "Cheese 200g", costPrice: 180, sellingPrice: 220, openingStock: 40, reorderLevel: 8, category: "Dairy" },
			{ title: "Butter 500g", costPrice: 350, sellingPrice: 410, openingStock: 30, reorderLevel: 8, category: "Dairy" },
			{ title: "Coffee 200g", costPrice: 320, sellingPrice: 380, openingStock: 60, reorderLevel: 10, category: "Beverages" },
			{ title: "Green Tea 100g", costPrice: 150, sellingPrice: 190, openingStock: 80, reorderLevel: 12, category: "Beverages" },
			{ title: "Juice 1L", costPrice: 120, sellingPrice: 150, openingStock: 100, reorderLevel: 15, category: "Beverages" },
			{ title: "Cumin Powder 100g", costPrice: 75, sellingPrice: 95, openingStock: 120, reorderLevel: 15, category: "Spices" },
			{ title: "Coriander Powder 100g", costPrice: 60, sellingPrice: 80, openingStock: 130, reorderLevel: 15, category: "Spices" },
			{ title: "Garam Masala 100g", costPrice: 110, sellingPrice: 140, openingStock: 80, reorderLevel: 12, category: "Spices" },
			{ title: "Black Pepper 50g", costPrice: 85, sellingPrice: 110, openingStock: 90, reorderLevel: 12, category: "Spices" },
			{ title: "Detergent 1kg", costPrice: 150, sellingPrice: 185, openingStock: 100, reorderLevel: 15, category: "Household" },
			{ title: "Dishwash Liquid 500ml", costPrice: 95, sellingPrice: 120, openingStock: 80, reorderLevel: 12, category: "Household" },
			{ title: "Floor Cleaner 1L", costPrice: 130, sellingPrice: 165, openingStock: 50, reorderLevel: 10, category: "Household" },
			{ title: "Toilet Cleaner 500ml", costPrice: 80, sellingPrice: 105, openingStock: 60, reorderLevel: 10, category: "Household" },
			{ title: "Face Wash 100ml", costPrice: 140, sellingPrice: 175, openingStock: 50, reorderLevel: 8, category: "Personal Care" },
			{ title: "Body Lotion 200ml", costPrice: 180, sellingPrice: 220, openingStock: 40, reorderLevel: 8, category: "Personal Care" },
			{ title: "Hair Oil 200ml", costPrice: 120, sellingPrice: 150, openingStock: 60, reorderLevel: 10, category: "Personal Care" },
			{ title: "Chips 100g", costPrice: 30, sellingPrice: 40, openingStock: 200, reorderLevel: 30, category: "Snacks" },
			{ title: "Namkeen 200g", costPrice: 45, sellingPrice: 60, openingStock: 150, reorderLevel: 20, category: "Snacks" },
			{ title: "Chocolate Bar", costPrice: 35, sellingPrice: 45, openingStock: 180, reorderLevel: 25, category: "Snacks" },
			{ title: "Chowmein Pack", costPrice: 15, sellingPrice: 20, openingStock: 300, reorderLevel: 40, category: "Snacks" },
			{ title: "Tomato Ketchup 500g", costPrice: 110, sellingPrice: 140, openingStock: 70, reorderLevel: 10, category: "Essentials" },
			{ title: "Soy Sauce 200ml", costPrice: 65, sellingPrice: 85, openingStock: 80, reorderLevel: 12, category: "Essentials" },
			{ title: "Vinegar 500ml", costPrice: 55, sellingPrice: 75, openingStock: 60, reorderLevel: 10, category: "Essentials" },
			{ title: "Honey 500g", costPrice: 400, sellingPrice: 480, openingStock: 30, reorderLevel: 8, category: "Essentials" },
		]
		const newProductIds: Id<"products">[] = []
		for (let i = 0; i < newProductData.length; i++) {
			const p = newProductData[i]
			const partyId = allPartyIds[i % allPartyIds.length]
			const id = await ctx.db.insert("products", {
				orgId,
				title: p.title,
				purchasePartyId: partyId,
				costPrice: p.costPrice,
				sellingPrice: p.sellingPrice,
				openingStock: p.openingStock,
				reorderLevel: p.reorderLevel,
				unit: "packet:1",
				category: p.category,
				isActive: true,
			})
			newProductIds.push(id)

			await ctx.db.insert("stockBookEntries", {
				orgId,
				entryDate: today,
				transactionType: "stock",
				movementType: "opening",
				direction: "in",
				productId: id,
				quantityIn: p.openingStock,
				quantityOut: 0,
				quantity: p.openingStock,
				unitRate: p.costPrice,
				totalAmount: p.openingStock * p.costPrice,
				particulars: `Opening stock for ${p.title}`,
				fiscalYear,
				sourceTable: "product",
				sourceId: id,
			})
		}

		// Get all products for invoices
		const allProducts = await ctx.db
			.query("products")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.collect()

		// 4. Add purchase invoices (20 more)
		let purchaseCounter = await ctx.db
			.query("invoiceCounters")
			.withIndex("by_orgId_fiscal_type", (q) =>
				q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "purchase")
			)
			.first()
		if (!purchaseCounter) {
			const cid = await ctx.db.insert("invoiceCounters", { orgId, fiscalYear, type: "purchase", count: 0 })
			purchaseCounter = (await ctx.db.get(cid))!
		}

		for (let i = 0; i < 20; i++) {
			const partyId = allPartyIds[i % allPartyIds.length]
			const prod1 = allProducts[(i * 2) % allProducts.length]
			const prod2 = allProducts[(i * 2 + 1) % allProducts.length]
			const qty1 = 10 + Math.floor(Math.random() * 40)
			const qty2 = 5 + Math.floor(Math.random() * 30)

			const invoiceItems = [
				{ productId: prod1._id, productTitle: prod1.title, quantity: qty1, rate: prod1.costPrice, total: qty1 * prod1.costPrice },
				{ productId: prod2._id, productTitle: prod2.title, quantity: qty2, rate: prod2.costPrice, total: qty2 * prod2.costPrice },
			]
			const subTotal = invoiceItems.reduce((s, it) => s + it.total, 0)
			const tax = Math.round(subTotal * 0.13)

			const nextCount = purchaseCounter!.count + 1
			await ctx.db.patch(purchaseCounter!._id, { count: nextCount })
			const invoiceNumber = `PUR-${fiscalYear}-${String(nextCount).padStart(5, "0")}`

			const paymentMethods = ["cash", "bankTransfer", "check", "credit"] as const
			const paidPct = [0, 0.5, 1, 0.3, 1, 0, 1, 0.7, 1, 1][i % 10]
			const paidAmount = Math.round((subTotal + tax) * paidPct)
			const paymentStatus = paidAmount === 0 ? "pending" as const
				: paidAmount >= subTotal + tax ? "paid" as const
				: "partial" as const
			const payments = paidAmount > 0
				? [{ paidAt: today, paidAmount, paymentMethod: paymentMethods[i % 4] }]
				: []

			const daysAgo = i * 3
			const issuedDate = new Date(Date.now() - daysAgo * 86400000).toISOString()

			await ctx.db.insert("invoices", {
				orgId,
				type: "purchase",
				invoiceNumber,
				partyId,
				partyType: "supplier",
				issuedAt: issuedDate,
				items: invoiceItems,
				subTotal,
				tax,
				totalAmount: subTotal + tax,
				payments,
				paidAmount,
				paymentStatus,
				fiscalYear,
			})

			purchaseCounter = (await ctx.db.get(purchaseCounter!._id))!
		}

		// 5. Add sale invoices (20 more)
		let saleCounter = await ctx.db
			.query("invoiceCounters")
			.withIndex("by_orgId_fiscal_type", (q) =>
				q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "sale")
			)
			.first()
		if (!saleCounter) {
			const cid = await ctx.db.insert("invoiceCounters", { orgId, fiscalYear, type: "sale", count: 0 })
			saleCounter = (await ctx.db.get(cid))!
		}

		for (let i = 0; i < 20; i++) {
			const custId = allCustomerIds[i % allCustomerIds.length]
			const prod1 = allProducts[(i * 3) % allProducts.length]
			const prod2 = allProducts[(i * 3 + 1) % allProducts.length]
			const prod3 = allProducts[(i * 3 + 2) % allProducts.length]
			const qty1 = 2 + Math.floor(Math.random() * 10)
			const qty2 = 1 + Math.floor(Math.random() * 8)
			const qty3 = 3 + Math.floor(Math.random() * 6)

			const invoiceItems = [
				{ productId: prod1._id, productTitle: prod1.title, quantity: qty1, rate: prod1.sellingPrice ?? prod1.costPrice, total: qty1 * (prod1.sellingPrice ?? prod1.costPrice) },
				{ productId: prod2._id, productTitle: prod2.title, quantity: qty2, rate: prod2.sellingPrice ?? prod2.costPrice, total: qty2 * (prod2.sellingPrice ?? prod2.costPrice) },
				{ productId: prod3._id, productTitle: prod3.title, quantity: qty3, rate: prod3.sellingPrice ?? prod3.costPrice, total: qty3 * (prod3.sellingPrice ?? prod3.costPrice) },
			]
			const subTotal = invoiceItems.reduce((s, it) => s + it.total, 0)
			const tax = Math.round(subTotal * 0.13)

			const nextCount = saleCounter!.count + 1
			await ctx.db.patch(saleCounter!._id, { count: nextCount })
			const invoiceNumber = `SAL-${fiscalYear}-${String(nextCount).padStart(5, "0")}`

			const paymentMethods = ["cash", "card", "online", "bankTransfer"] as const
			const paidPct = [1, 1, 0.5, 1, 0, 1, 0.8, 1, 1, 0.6][i % 10]
			const paidAmount = Math.round((subTotal + tax) * paidPct)
			const paymentStatus = paidAmount === 0 ? "pending" as const
				: paidAmount >= subTotal + tax ? "paid" as const
				: "partial" as const
			const payments = paidAmount > 0
				? [{ paidAt: today, paidAmount, paymentMethod: paymentMethods[i % 4] }]
				: []

			const daysAgo = i * 2
			const issuedDate = new Date(Date.now() - daysAgo * 86400000).toISOString()

			await ctx.db.insert("invoices", {
				orgId,
				type: "sale",
				invoiceNumber,
				partyId: custId,
				partyType: "customer",
				issuedAt: issuedDate,
				items: invoiceItems,
				subTotal,
				tax,
				totalAmount: subTotal + tax,
				payments,
				paidAmount,
				paymentStatus,
				fiscalYear,
			})

			saleCounter = (await ctx.db.get(saleCounter!._id))!
		}

		// 6. Add more vehicles (7 more)
		const newVehicleData = [
			{ name: "Ashok Leyland Truck", licensePlate: "Ba 1 Kha 4567", description: "Heavy cargo 16-ton" },
			{ name: "Tata Ace", licensePlate: "Ba 2 Kha 8901", description: "Mini truck for city delivery" },
			{ name: "Mahindra Pickup", licensePlate: "Ba 3 Kha 2345", description: "1-ton pickup" },
			{ name: "Eicher Truck", licensePlate: "Ba 4 Kha 6789", description: "10-ton medium cargo" },
			{ name: "Suzuki Carry", licensePlate: "Ba 5 Pa 1234", description: "Light delivery van" },
			{ name: "Force Traveller", licensePlate: "Ba 6 Kha 5678", description: "Multi-purpose vehicle" },
			{ name: "BharatBenz Truck", licensePlate: "Ba 7 Kha 9012", description: "Heavy 25-ton cargo" },
		]
		const newVehicleIds: Id<"vehicles">[] = []
		for (const v of newVehicleData) {
			const id = await ctx.db.insert("vehicles", { orgId, ...v, isActive: true })
			newVehicleIds.push(id)
		}

		// Get all vehicles
		const allVehicles = await ctx.db
			.query("vehicles")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.collect()

		// 7. Add more trips (8 more)
		const destinations = [
			"Bhaktapur Durbar Square", "Patan Market", "Kirtipur Bazaar",
			"Banepa Market", "Dhulikhel", "Biratnagar City",
			"Pokhara Lakeside", "Butwal Chowk",
		]
		for (let i = 0; i < 8; i++) {
			const vehicle = allVehicles[i % allVehicles.length]
			const prod1 = allProducts[(i * 4) % allProducts.length]
			const prod2 = allProducts[(i * 4 + 1) % allProducts.length]
			const qty1 = 5 + Math.floor(Math.random() * 15)
			const qty2 = 3 + Math.floor(Math.random() * 10)
			const products = [
				{ productId: prod1._id, productTitle: prod1.title, quantity: qty1, unitPrice: prod1.sellingPrice ?? prod1.costPrice, unit: prod1.unit },
				{ productId: prod2._id, productTitle: prod2.title, quantity: qty2, unitPrice: prod2.sellingPrice ?? prod2.costPrice, unit: prod2.unit },
			]
			const isReturned = i % 3 === 0
			const daysAgo = i * 4
			const dispatchDate = new Date(Date.now() - daysAgo * 86400000).toISOString()
			await ctx.db.insert("trips", {
				orgId,
				vehicleId: vehicle._id,
				dispatchTime: dispatchDate,
				returnTime: isReturned ? new Date(Date.now() - (daysAgo - 1) * 86400000).toISOString() : undefined,
				destination: destinations[i],
				status: isReturned ? "returned" : "dispatched",
				products,
				returnedProducts: isReturned
					? [{ productId: prod1._id, productTitle: prod1.title, quantity: Math.floor(qty1 * 0.3), unitPrice: prod1.sellingPrice ?? prod1.costPrice, unit: prod1.unit }]
					: [],
			})
		}

		// 8. Add more notifications (10 more)
		const notifData = [
			{ type: "low_stock" as const, title: "Low Stock: Chana Dal", message: "Chana Dal 1kg stock is low (8 remaining, reorder: 15)" },
			{ type: "payment_due" as const, title: "Payment Due", message: "Payment of NPR 45,000 due to Lumbini Agro Suppliers" },
			{ type: "low_stock" as const, title: "Low Stock: Cheese", message: "Cheese 200g running low (5 remaining, reorder: 8)" },
			{ type: "order_status" as const, title: "New Order Received", message: "Order from Annapurna Kirana for NPR 12,500" },
			{ type: "payment_due" as const, title: "Overdue Payment", message: "Payment of NPR 28,000 overdue from Everest General Store" },
			{ type: "system" as const, title: "Backup Complete", message: "Daily data backup completed successfully" },
			{ type: "low_stock" as const, title: "Low Stock: Butter", message: "Butter 500g critically low (3 remaining, reorder: 8)" },
			{ type: "order_status" as const, title: "Order Dispatched", message: "Order to Lhotse Mart dispatched via Tata Truck" },
			{ type: "payment_due" as const, title: "Payment Received", message: "NPR 35,000 received from Manaslu Provision" },
			{ type: "system" as const, title: "Fiscal Year Reminder", message: "Fiscal year 82/83 closing in 45 days" },
		]
		for (let i = 0; i < notifData.length; i++) {
			const daysAgo = i * 2
			await ctx.db.insert("notifications", {
				orgId,
				...notifData[i],
				isRead: i > 5,
				createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
			})
		}

		return {
			status: "bulk_seeded",
			newParties: newPartyIds.length,
			newCustomers: newCustomerIds.length,
			newProducts: newProductIds.length,
			newPurchaseInvoices: 20,
			newSaleInvoices: 20,
			newVehicles: newVehicleIds.length,
			newTrips: 8,
			newNotifications: 10,
		}
	},
})

export const listMappings = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("userOrgMappings").collect()
	},
})

export const findPartyByName = internalQuery({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		const all = await ctx.db.query("parties").collect()
		return all.filter((p) => p.name.toLowerCase().includes(name.toLowerCase()))
	},
})

export const listOrgIds = internalQuery({
	args: {},
	handler: async (ctx) => {
		const settings = await ctx.db.query("orgSettings").collect();
		return settings.map((s) => ({ orgId: s.orgId, businessName: s.businessName }));
	},
});

export const fixOrgSettings = internalMutation({
	args: { orgId: v.string(), businessName: v.optional(v.string()) },
	handler: async (ctx, { orgId, businessName }) => {
		const settings = await ctx.db
			.query("orgSettings")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.first();
		if (settings) {
			// Clear fake seed data, preserve user-configured values
			const updates: Record<string, unknown> = {};
			if (settings.businessName === "MeroPasal Demo") {
				updates.businessName = businessName ?? "";
			}
			if (settings.location === "Kathmandu, Nepal") {
				updates.location = undefined;
			}
			if (settings.phone === "01-4567890") {
				updates.phone = undefined;
			}
			if (settings.panNumber === "123456789") {
				updates.panNumber = undefined;
			}
			if (Object.keys(updates).length > 0) {
				await ctx.db.patch(settings._id, updates);
				return { status: "cleaned", updates };
			}
			return { status: "already_clean" };
		}
		return { status: "not_found" };
	},
});

export const orgDataCount = internalQuery({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const parties = await ctx.db.query("parties").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).collect();
		const customers = await ctx.db.query("customers").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).collect();
		const products = await ctx.db.query("products").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).collect();
		const invoices = await ctx.db.query("invoices").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).collect();
		const vehicles = await ctx.db.query("vehicles").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).collect();
		const trips = await ctx.db.query("trips").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).collect();
		return {
			orgId,
			parties: parties.length,
			customers: customers.length,
			products: products.length,
			invoices: invoices.length,
			vehicles: vehicles.length,
			trips: trips.length,
		};
	},
});

export const verify = internalQuery({
	args: {},
	handler: async (ctx) => {
		const parties = await ctx.db.query("parties").collect();
		const customers = await ctx.db.query("customers").collect();
		const products = await ctx.db.query("products").collect();
		const invoices = await ctx.db.query("invoices").collect();
		const vehicles = await ctx.db.query("vehicles").collect();
		const trips = await ctx.db.query("trips").collect();
		const stockEntries = await ctx.db.query("stockBookEntries").collect();
		const notifications = await ctx.db.query("notifications").collect();

		const purchases = invoices.filter((i) => i.type === "purchase" && i.invoiceNumber);
		const sales = invoices.filter((i) => i.type === "sale" && i.invoiceNumber);
		const orders = invoices.filter((i) => i.type === "sale" && !i.invoiceNumber);

		return {
			parties: parties.length,
			customers: customers.length,
			products: products.length,
			purchases: purchases.length,
			sales: sales.length,
			orders: orders.length,
			vehicles: vehicles.length,
			trips: trips.length,
			stockBookEntries: stockEntries.length,
			notifications: notifications.length,
		};
	},
});
