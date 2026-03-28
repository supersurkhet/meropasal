import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getOrg, requirePermission } from "../lib/orgGuard";
import { tripProductValidator } from "../lib/validators";
import { calculateFiscalYear } from "../lib/nepaliCalendar";
import { validateTripProducts } from "../lib/validation";
import {
  aggregateStockBookEntries,
  getProductPartyAvailability,
} from "../lib/stockAggregation";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("trips")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return null;
    const trip = await ctx.db.get(id);
    if (!trip || trip.orgId !== orgId) return null;
    return trip;
  },
});

export const listByVehicle = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, { vehicleId }) => {
    const orgId = await getOrg(ctx);
    if (!orgId) return [];
    return await ctx.db
      .query("trips")
      .withIndex("by_orgId_vehicle", (q) =>
        q.eq("orgId", orgId).eq("vehicleId", vehicleId)
      )
      .collect();
  },
});

export const dispatch = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    dispatchTime: v.string(),
    destination: v.optional(v.string()),
    products: v.array(tripProductValidator),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'trips:dispatch');
    validateTripProducts(args.products);

    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.orgId !== orgId)
      throw new Error("Vehicle not found");

    const fiscalYear = calculateFiscalYear(args.dispatchTime);

    // Validate stock availability
    const allEntries = await ctx.db
      .query("stockBookEntries")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
    const aggregate = aggregateStockBookEntries(allEntries);

    for (const item of args.products) {
      const product = await ctx.db.get(item.productId);
      if (!product || product.orgId !== orgId)
        throw new Error(`Product not found: ${item.productId}`);

      const available = getProductPartyAvailability(
        aggregate,
        item.productId,
        product.purchasePartyId,
      );
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.productTitle}: available ${available}, requested ${item.quantity}`
        );
      }
    }

    // Create trip
    const tripId = await ctx.db.insert("trips", {
      orgId,
      vehicleId: args.vehicleId,
      dispatchTime: args.dispatchTime,
      destination: args.destination,
      status: "dispatched",
      products: args.products,
      returnedProducts: [],
    });

    // Create stock book entries (tripDispatch, out)
    for (const item of args.products) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: args.dispatchTime,
        transactionType: "sale",
        movementType: "tripDispatch",
        direction: "out",
        productId: item.productId,
        quantityIn: 0,
        quantityOut: item.quantity,
        quantity: item.quantity,
        unitRate: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
        particulars: `Trip dispatch to ${args.destination || "N/A"}`,
        sourceTable: "trip",
        sourceId: tripId,
        counterpartyId: undefined,
        originPartyId: product.purchasePartyId,
        fiscalYear,
      });
    }

    return tripId;
  },
});

export const returnTrip = mutation({
  args: {
    tripId: v.id("trips"),
    returnTime: v.string(),
    returnedProducts: v.array(tripProductValidator),
  },
  handler: async (ctx, args) => {
    const orgId = await requirePermission(ctx, 'trips:return');
    const trip = await ctx.db.get(args.tripId);
    if (!trip || trip.orgId !== orgId) throw new Error("Trip not found");
    if (trip.status !== "dispatched")
      throw new Error("Trip is not in dispatched status");

    const fiscalYear = calculateFiscalYear(args.returnTime);

    // Update trip
    await ctx.db.patch(args.tripId, {
      returnTime: args.returnTime,
      returnedProducts: args.returnedProducts,
      status: "returned",
    });

    // Create stock book entries for returned items (tripReturn, in)
    for (const item of args.returnedProducts) {
      if (item.quantity <= 0) continue;
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: args.returnTime,
        transactionType: "sale",
        movementType: "tripReturn",
        direction: "in",
        productId: item.productId,
        quantityIn: item.quantity,
        quantityOut: 0,
        quantity: item.quantity,
        unitRate: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
        particulars: `Trip return from ${trip.destination || "N/A"}`,
        sourceTable: "trip",
        sourceId: args.tripId,
        counterpartyId: undefined,
        originPartyId: product.purchasePartyId,
        fiscalYear,
      });
    }

    // Calculate sold items (dispatched - returned)
    const soldItems: Array<{
      productId: typeof trip.products[0]["productId"];
      productTitle: string;
      quantity: number;
      rate: number;
      total: number;
      unit?: string;
    }> = [];

    for (const dispatched of trip.products) {
      const returned = args.returnedProducts.find(
        (r) => r.productId === dispatched.productId
      );
      const returnedQty = returned?.quantity ?? 0;
      const soldQty = dispatched.quantity - returnedQty;
      if (soldQty > 0) {
        soldItems.push({
          productId: dispatched.productId,
          productTitle: dispatched.productTitle,
          quantity: soldQty,
          rate: dispatched.unitPrice,
          total: soldQty * dispatched.unitPrice,
          unit: dispatched.unit,
        });
      }
    }

    // Auto-create sale invoice for sold items
    if (soldItems.length > 0) {
      const subTotal = soldItems.reduce((sum, i) => sum + i.total, 0);

      // Get or create invoice counter
      let counter = await ctx.db
        .query("invoiceCounters")
        .withIndex("by_orgId_fiscal_type", (q) =>
          q.eq("orgId", orgId).eq("fiscalYear", fiscalYear).eq("type", "sale")
        )
        .first();

      if (!counter) {
        const counterId = await ctx.db.insert("invoiceCounters", {
          orgId,
          fiscalYear,
          type: "sale",
          count: 0,
        });
        counter = (await ctx.db.get(counterId))!;
      }

      const nextCount = counter.count + 1;
      await ctx.db.patch(counter._id, { count: nextCount });
      const invoiceNumber = `SAL-${fiscalYear}-${String(nextCount).padStart(5, "0")}`;

      const invoiceId = await ctx.db.insert("invoices", {
        orgId,
        type: "sale",
        invoiceNumber,
        issuedAt: args.returnTime,
        items: soldItems,
        subTotal,
        tax: 0,
        totalAmount: subTotal,
        payments: [],
        paidAmount: 0,
        paymentStatus: "pending",
        fiscalYear,
        description: `Trip sale — ${trip.destination || "N/A"}`,
        vehicleId: trip.vehicleId,
        tripId: args.tripId,
      });

      await ctx.db.patch(args.tripId, { invoiceIds: [invoiceId] });
    }
  },
});

export const cancel = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => {
    const orgId = await requirePermission(ctx, 'trips:dispatch');
    const trip = await ctx.db.get(tripId);
    if (!trip || trip.orgId !== orgId) throw new Error("Trip not found");
    if (trip.status !== "dispatched")
      throw new Error("Can only cancel dispatched trips");

    await ctx.db.patch(tripId, { status: "cancelled" });

    // Reverse stock book entries — add back dispatched stock
    const fiscalYear = calculateFiscalYear(trip.dispatchTime);
    for (const item of trip.products) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;
      await ctx.db.insert("stockBookEntries", {
        orgId,
        entryDate: new Date().toISOString(),
        transactionType: "sale",
        movementType: "adjustment",
        direction: "in",
        productId: item.productId,
        quantityIn: item.quantity,
        quantityOut: 0,
        quantity: item.quantity,
        unitRate: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
        particulars: `Trip cancelled — stock restored`,
        sourceTable: "trip",
        sourceId: tripId,
        counterpartyId: undefined,
        originPartyId: product.purchasePartyId,
        fiscalYear,
      });
    }
  },
});
