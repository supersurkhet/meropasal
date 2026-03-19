/**
 * Temporary seed script for populating demo data.
 * Remove after seeding is complete.
 */
import { mutation, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const clearAll = mutation({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const tables = ["parties", "customers", "products", "invoices", "stockBookEntries", "trips", "vehicles", "notifications", "orgSettings", "accounts", "ledgerEntries", "billTemplates"] as const;
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

		// 0. Create OrgSettings if missing
		const existingSettings = await ctx.db
			.query("orgSettings")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.first();
		if (!existingSettings) {
			await ctx.db.insert("orgSettings", {
				orgId,
				businessName: "MeroPasal Demo",
				businessType: "retail",
				currentFiscalYear: fiscalYear,
				location: "Kathmandu, Nepal",
				phone: "01-4567890",
				panNumber: "123456789",
				currency: "NPR",
				taxRate: 13,
				features: {
					invoicing: true,
					stockBook: true,
					logistics: true,
					ledger: true,
				},
			});

			// Create default chart of accounts
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

			// Create invoice counters
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

export const listOrgIds = internalQuery({
	args: {},
	handler: async (ctx) => {
		const settings = await ctx.db.query("orgSettings").collect();
		return settings.map((s) => ({ orgId: s.orgId, businessName: s.businessName }));
	},
});

export const fixOrgSettings = internalMutation({
	args: { orgId: v.string() },
	handler: async (ctx, { orgId }) => {
		const settings = await ctx.db
			.query("orgSettings")
			.withIndex("by_orgId", (q) => q.eq("orgId", orgId))
			.first();
		if (settings) {
			await ctx.db.patch(settings._id, {
				businessName: "MeroPasal Demo",
				businessType: "retail",
				currentFiscalYear: "82/83",
				location: "Kathmandu, Nepal",
				phone: "01-4567890",
				panNumber: "123456789",
				currency: "NPR",
				taxRate: 13,
				features: {
					invoicing: true,
					stockBook: true,
					logistics: true,
					ledger: true,
				},
			});
			return { status: "updated" };
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
