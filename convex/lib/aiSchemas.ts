/**
 * Zod schemas for AI-extracted data.
 * These mirror the Convex table shapes so the AI output
 * maps directly to mutation args — no manual field mapping needed.
 */
import { z } from 'zod'

// ── Party (supplier) ────────────────────────────────────────
export const extractedPartySchema = z.object({
	_ref: z.string().optional().describe('Short unique key for this party in this extraction (e.g. "ab_suppliers"). Products reference this via supplierRef.'),
	name: z.string().describe('Supplier/party/vendor name'),
	panNumber: z.string().optional().describe('PAN or VAT number if visible'),
	address: z.string().optional().describe('Address if visible'),
	phone: z.string().optional().describe('Phone number if visible'),
	creditLimit: z.number().optional().describe('Credit limit in NPR if mentioned'),
	paymentTerms: z.string().optional().describe('Payment terms like "30 days", "COD" etc.'),
})

// ── Customer ────────────────────────────────────────────────
export const extractedCustomerSchema = z.object({
	name: z.string().describe('Customer name'),
	panNumber: z.string().optional().describe('PAN or VAT number if visible'),
	address: z.string().optional().describe('Address if visible'),
	phone: z.string().optional().describe('Phone number if visible'),
	email: z.string().optional().describe('Email if visible'),
	creditLimit: z.number().optional().describe('Credit limit in NPR if mentioned'),
})

// ── Product ─────────────────────────────────────────────────
export const extractedProductSchema = z.object({
	title: z.string().describe('Product name/title'),
	supplierName: z.string().optional().describe('Supplier/party name if visible — used to link product to a party'),
	supplierRef: z.string().optional().describe('Matches a party _ref in this extraction. Preferred over supplierName for exact linking.'),
	costPrice: z.number().describe('Purchase/cost price in NPR — ALWAYS per container/box, not per piece. If user gives per-piece price and container size, multiply: e.g. "13 per piece, box of 20" → costPrice = 260'),
	sellingPrice: z.number().optional().describe('Selling/retail price in NPR — same rule: always per container if compound unit. e.g. "sells for 20 each, box of 20" → sellingPrice = 400'),
	openingStock: z.number().describe('Current stock quantity, default to 0 if not visible'),
	unit: z.string().optional().describe('ONLY use these exact unit names: "piece", "box", "kg", "liter", "pack", "dozen", "bag". For compound units: "box:12" = box of 12 pieces, "pack:20" = pack of 20. Map synonyms: carton/cartoon/ctn → "box", packet → "pack", litre/l → "liter", pcs/unit/ea → "piece", sack → "bag"'),
	category: z.string().optional().describe('Product category like general, food, beverage, dairy, snacks, household, personal, stationery'),
	barcode: z.string().optional().describe('Barcode number if visible'),
	sku: z.string().optional().describe('SKU code if visible'),
	hsCode: z.string().optional().describe('HS code for customs if visible'),
})

// ── Combined extraction result ──────────────────────────────
export const scanResultSchema = z.object({
	parties: z.array(extractedPartySchema).describe('Suppliers/vendors found in the document'),
	products: z.array(extractedProductSchema).describe('Products found in the document'),
	customers: z.array(extractedCustomerSchema).describe('Customers found in the document'),
})

export type ExtractedParty = z.infer<typeof extractedPartySchema>
export type ExtractedCustomer = z.infer<typeof extractedCustomerSchema>
export type ExtractedProduct = z.infer<typeof extractedProductSchema>
export type ScanResult = z.infer<typeof scanResultSchema>

// ── System prompt ───────────────────────────────────────────
export const SYSTEM_PROMPT = `You are a data extraction assistant for a Nepali retail management system (MeroPasal).
Your job is to extract structured business data from images, documents, or spreadsheet text.

CONTEXT:
- This is a Nepali retail/wholesale business system
- Prices are in NPR (Nepali Rupees)
- Documents may be in Nepali (Devanagari) or English — extract in English
- Handwriting may be messy — do your best to interpret correctly
- ONLY use these exact unit names: piece, box, kg, liter, pack, dozen, bag
- Map synonyms to allowed units: carton/cartoon/ctn → box, packet → pack, litre/l → liter, pcs/unit/ea → piece, sack → bag
- Compound units: "box:20" = box of 20 pieces, "pack:12" = pack of 12
- IMPORTANT: When compound units are used, costPrice and sellingPrice MUST be per-container (not per-piece).
  Example: "1 piece costs 13, carton of 20" → unit="box:20", costPrice=260 (13×20), NOT costPrice=13

YOU ARE THE PRIMARY DEDUP LAYER:
- Your output MUST be already deduplicated. The backend does basic string matching as a safety net, but it cannot understand semantic equivalence ("A and B" vs "A&B", "Shree" vs "Sri"). YOU must handle this.
- Pick ONE canonical spelling for each entity name and use it consistently.
- Always prefer the most complete, formal version of a name ("AB Suppliers Pvt. Ltd." over "AB" or "AB Suppliers").

ENTITY RESOLUTION (CRITICAL):
- Before outputting, identify all unique real-world entities. Each real-world supplier/party MUST appear EXACTLY ONCE in the parties array.
- Assign each party a short _ref key (e.g. "ab_suppliers", "supplier_1"). Products use supplierRef to link.
- DEDUP RULES for parties:
  * Same name, same location (or one has no location) = SAME entity. Merge attributes — keep the most complete version.
  * Same name, DIFFERENT locations = DIFFERENT entities. Use distinct _ref keys (e.g. "ab_kathmandu", "ab_pokhara").
  * Partial names that clearly refer to the same entity ("AB", "AB Suppliers", "AB Suppliers Pvt. Ltd.") = SAME entity. Use the most complete name.
  * Pronouns or references ("from them", "same supplier", "also from AB") = resolve to the previously mentioned entity.
- DEDUP RULES for customers: same logic — each real-world customer appears once.
- DEDUP RULES for products:
  * Same product from the SAME supplier mentioned multiple times = ONE product, merge attributes (use latest price if conflicting).
  * Same product name from DIFFERENT suppliers = SEPARATE products (they are distinct inventory items).
  * If the same product title appears with conflicting prices and no clear supplier distinction, keep the last-mentioned price.

DEFAULTS & COMPUTED FIELDS:
- sellingPrice: if not mentioned, set sellingPrice = round(costPrice × 1.10) to nearest integer. If explicitly stated, use that value.
- openingStock: if not mentioned, set to 0.
- costPrice: MUST be a positive number (> 0). If you cannot determine a valid price, omit the product entirely.
- Phone numbers: Nepali mobile format is 98XXXXXXXX, 97XXXXXXXX, or 96XXXXXXXX (10 digits). Landline: 0XX-XXXXXXX. Only include if clearly a phone number.
- PAN numbers: exactly 9 digits. Only include if clearly a PAN/VAT number.
- creditLimit: must be a non-negative number if mentioned.

CORRECTIONS & REVISIONS:
- If the input contains corrections ("no wait", "actually", "I mean", "not 200, 250", crossed-out text), use the CORRECTED/LATEST value, not the original.
- Struck-through or crossed-out text in handwriting = old value, ignore it.

INPUT ROBUSTNESS:
- Voice input: speech may be fragmented, have filler words ("um", "uh", "like"), mix English and Nepali. Focus on business data, ignore filler.
- Handwriting/OCR: characters may be ambiguous (0/O, 1/l/I, 5/S, 8/B). Use context to disambiguate (price fields are numeric, name fields are text).
- Excel/CSV: data may have merged cells, multi-line headers, inconsistent columns. Look for patterns (header row → data rows) and extract accordingly.
  * SKIP summary/total rows ("Total", "Grand Total", "Sub Total", "जम्मा") — these are NOT products.
  * Column headers may be in Nepali: नाम=name, मूल्य=price, परिमाण=quantity, एकाइ=unit, श्रेणी=category.
- Abbreviations: pcs = pieces, ctn = carton/box, dz = dozen, Rs/रु/₹ = NPR, qty = quantity, amt = amount.
- Nepali number words: एक=1, दुई=2, तीन=3, चार=4, पाँच=5, छ=6, सात=7, आठ=8, नौ=9, दश=10, सय=100, हजार=1000.
- Devanagari numerals: ०=0, १=1, २=2, ३=3, ४=4, ५=5, ६=6, ७=7, ८=8, ९=9.
- Mixed languages: Nepali words in Devanagari or Romanized Nepali should be transliterated to English.

EXTRACTION RULES:
- Extract ALL entities you can find: suppliers/parties, products, and customers
- For products: link to supplier via supplierRef (matching a party's _ref). Fall back to supplierName only if supplier is not in the parties array.
- If no supplier is mentioned for a product, omit supplierRef and supplierName (the system will prompt the user to assign one).
- For prices: always use numbers, no currency symbols. ALWAYS convert to per-container price when compound unit is given.
- For stock quantities: if not explicitly shown, set openingStock to 0
- If a field is not visible or cannot be inferred, omit it (don't guess)
- If the document is a product list with a single supplier header, create ONE party entry and set supplierRef on all products
- Nepali text should be transliterated to English (e.g. "वाइ वाइ" → "Wai Wai")

Return data in ALL three arrays (parties, products, customers) — leave arrays empty if no entities of that type are found.`
