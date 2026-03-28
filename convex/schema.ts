import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orgSettings: defineTable({
    orgId: v.string(),
    businessType: v.union(
      v.literal("retail"),
      v.literal("wholesale"),
      v.literal("service")
    ),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    panNumber: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    currentFiscalYear: v.string(),
    currency: v.optional(v.string()),
    taxRate: v.optional(v.number()),
  }).index("by_orgId", ["orgId"]),

  parties: defineTable({
    orgId: v.string(),
    name: v.string(),
    panNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_name", ["orgId", "name"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["orgId"],
    }),

  customers: defineTable({
    orgId: v.string(),
    name: v.string(),
    panNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_name", ["orgId", "name"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["orgId"],
    }),

  products: defineTable({
    orgId: v.string(),
    title: v.string(),
    purchasePartyId: v.id("parties"),
    hsCode: v.optional(v.string()),
    unit: v.optional(v.string()),
    costPrice: v.number(),
    sellingPrice: v.optional(v.number()),
    openingStock: v.number(),
    barcode: v.optional(v.string()),
    reorderLevel: v.optional(v.number()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isFeatured: v.optional(v.boolean()),
    isActive: v.boolean(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_party", ["orgId", "purchasePartyId"])
    .index("by_orgId_category", ["orgId", "category"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId"],
    }),

  invoices: defineTable({
    orgId: v.string(),
    type: v.union(v.literal("purchase"), v.literal("sale")),
    invoiceNumber: v.optional(v.string()),
    partyId: v.optional(v.string()),
    partyType: v.optional(
      v.union(v.literal("supplier"), v.literal("customer"))
    ),
    issuedAt: v.string(),
    dueDate: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productTitle: v.string(),
        quantity: v.number(),
        rate: v.number(),
        total: v.number(),
        unit: v.optional(v.string()),
      })
    ),
    subTotal: v.number(),
    tax: v.number(),
    totalAmount: v.number(),
    payments: v.array(
      v.object({
        paidAt: v.string(),
        paidAmount: v.number(),
        paymentMethod: v.union(
          v.literal("cash"),
          v.literal("card"),
          v.literal("bankTransfer"),
          v.literal("credit"),
          v.literal("online"),
          v.literal("check")
        ),
        bankVoucherNumber: v.optional(v.string()),
      })
    ),
    paidAmount: v.number(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("partial"),
      v.literal("overpaid")
    ),
    fiscalYear: v.string(),
    description: v.optional(v.string()),
    vehicleId: v.optional(v.id("vehicles")),
    tripId: v.optional(v.id("trips")),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_type", ["orgId", "type"])
    .index("by_orgId_party", ["orgId", "partyId"])
    .index("by_orgId_fiscal", ["orgId", "fiscalYear"])
    .index("by_orgId_status", ["orgId", "paymentStatus"])
    .searchIndex("search_number", {
      searchField: "invoiceNumber",
      filterFields: ["orgId"],
    }),

  invoiceCounters: defineTable({
    orgId: v.string(),
    fiscalYear: v.string(),
    type: v.union(v.literal("purchase"), v.literal("sale")),
    count: v.number(),
  }).index("by_orgId_fiscal_type", ["orgId", "fiscalYear", "type"]),

  stockBookEntries: defineTable({
    orgId: v.string(),
    entryDate: v.string(),
    transactionType: v.union(
      v.literal("purchase"),
      v.literal("sale"),
      v.literal("stock")
    ),
    movementType: v.union(
      v.literal("opening"),
      v.literal("closing"),
      v.literal("purchase"),
      v.literal("sale"),
      v.literal("order"),
      v.literal("tripDispatch"),
      v.literal("tripReturn"),
      v.literal("adjustment")
    ),
    direction: v.union(v.literal("in"), v.literal("out")),
    productId: v.id("products"),
    quantityIn: v.number(),
    quantityOut: v.number(),
    quantity: v.number(),
    unitRate: v.number(),
    totalAmount: v.number(),
    particulars: v.string(),
    remarks: v.optional(v.string()),
    sourceTable: v.union(
      v.literal("product"),
      v.literal("stockImport"),
      v.literal("sale"),
      v.literal("order"),
      v.literal("trip"),
      v.literal("manual"),
      v.literal("fiscalClose")
    ),
    sourceId: v.optional(v.string()),
    sourceCode: v.optional(v.string()),
    counterpartyId: v.optional(v.string()),
    originPartyId: v.optional(v.string()),
    fiscalYear: v.string(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_product", ["orgId", "productId"])
    .index("by_orgId_fiscal", ["orgId", "fiscalYear"])
    .index("by_orgId_source", ["orgId", "sourceTable", "sourceId"]),

  ledgerEntries: defineTable({
    orgId: v.string(),
    date: v.string(),
    accountCode: v.string(),
    accountName: v.string(),
    debit: v.number(),
    credit: v.number(),
    narration: v.string(),
    invoiceId: v.optional(v.id("invoices")),
    fiscalYear: v.string(),
    voucherType: v.union(
      v.literal("sales"),
      v.literal("purchase"),
      v.literal("receipt"),
      v.literal("payment"),
      v.literal("journal"),
      v.literal("contra")
    ),
    voucherNumber: v.optional(v.string()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_account", ["orgId", "accountCode"])
    .index("by_orgId_invoice", ["orgId", "invoiceId"])
    .index("by_orgId_fiscal", ["orgId", "fiscalYear"]),

  accounts: defineTable({
    orgId: v.string(),
    code: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("revenue"),
      v.literal("expense")
    ),
    parentCode: v.optional(v.string()),
    isSystemAccount: v.boolean(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_code", ["orgId", "code"]),

  vehicles: defineTable({
    orgId: v.string(),
    name: v.string(),
    licensePlate: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_orgId", ["orgId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["orgId"],
    }),

  trips: defineTable({
    orgId: v.string(),
    vehicleId: v.id("vehicles"),
    dispatchTime: v.string(),
    returnTime: v.optional(v.string()),
    destination: v.optional(v.string()),
    status: v.union(
      v.literal("dispatched"),
      v.literal("returned"),
      v.literal("cancelled")
    ),
    products: v.array(
      v.object({
        productId: v.id("products"),
        productTitle: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        unit: v.optional(v.string()),
      })
    ),
    returnedProducts: v.array(
      v.object({
        productId: v.id("products"),
        productTitle: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        unit: v.optional(v.string()),
      })
    ),
    invoiceIds: v.optional(v.array(v.id("invoices"))),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_vehicle", ["orgId", "vehicleId"]),

  notifications: defineTable({
    orgId: v.string(),
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
    isRead: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_unread", ["orgId", "isRead"]),

  // Temporary storage for onboarding data that survives the OAuth redirect.
  // Keyed by WorkOS userId. Consumed and deleted after org initialization.
  pendingOnboarding: defineTable({
    workosUserId: v.string(),
    businessType: v.union(
      v.literal("retail"),
      v.literal("wholesale"),
      v.literal("service")
    ),
    currentFiscalYear: v.string(),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    panNumber: v.optional(v.string()),
  }).index("by_workosUserId", ["workosUserId"]),

  billTemplates: defineTable({
    orgId: v.string(),
    templateName: v.string(),
    isDefault: v.boolean(),
    layout: v.object({
      headerFields: v.array(v.string()),
      showLogo: v.boolean(),
      logoPosition: v.union(
        v.literal("left"),
        v.literal("center"),
        v.literal("right")
      ),
      columnOrder: v.array(v.string()),
      showTax: v.boolean(),
      showDiscount: v.boolean(),
      footerText: v.optional(v.string()),
      paperSize: v.union(
        v.literal("a4"),
        v.literal("a5"),
        v.literal("thermal-80mm"),
        v.literal("thermal-58mm")
      ),
      fontSize: v.union(
        v.literal("small"),
        v.literal("medium"),
        v.literal("large")
      ),
      showPaymentDetails: v.boolean(),
      customFields: v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      ),
    }),
  }).index("by_orgId", ["orgId"]),
});
