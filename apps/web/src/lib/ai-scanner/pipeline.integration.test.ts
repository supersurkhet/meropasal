import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { scanResultSchema } from '$lib/ai-schemas'
import { buildBillLineItemsFromExtracted } from './bill-line-items'
import {
	findCatalogProduct,
	lineFromMatchedStockImport,
	lineFromUnmatchedStockSale,
} from './merge-scanned-lines'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('scan fixture to stock-import lines', () => {
	it('parses fixture builds bill lines and merges into stock row shape', () => {
		const raw = readFileSync(
			join(__dirname, '__fixtures__/scan-result-valid.json'),
			'utf-8',
		)
		const parsed = scanResultSchema.parse(JSON.parse(raw))
		const extracted = parsed.products.map((p) => ({
			title: p.title,
			openingStock: p.openingStock,
			costPrice: p.costPrice,
			sellingPrice: p.sellingPrice,
			unit: p.unit,
			supplierName: p.supplierName,
		}))
		const existing: Array<{
			_id: string
			title: string
			unit?: string
			costPrice: number
			sellingPrice?: number
		}> = []
		const { lineItems } = buildBillLineItemsFromExtracted('stock-import', extracted, existing)
		expect(lineItems).toHaveLength(1)
		expect(lineItems[0]?.unit).toBe('piece')
		expect(lineItems[0]?.quantity).toBe(120)
		expect(lineItems[0]?.productTitle).toBe('Sample Biscuit')
		expect(lineItems[0]?.unitStr).toContain('box')
		const unmatched = lineFromUnmatchedStockSale(
			{
				productTitle: lineItems[0]!.productTitle,
				quantity: lineItems[0]!.quantity,
				unit: lineItems[0]!.unit,
				unitStr: lineItems[0]!.unitStr,
				rate: lineItems[0]!.rate,
			},
			() => 'row-1',
		)
		expect(unmatched.productTitle).toBe('Sample Biscuit')
		expect(unmatched.rate).toBe(lineItems[0]!.rate)
	})
})

describe('preview line to catalog merge', () => {
	it('round-trips scanner line with productId onto catalog row', () => {
		const catalog = [
			{
				_id: 'pid99',
				title: 'Canonical Title',
				unit: 'box:10',
				costPrice: 500,
				sellingPrice: 600,
			},
		]
		const { lineItems } = buildBillLineItemsFromExtracted(
			'stock-import',
			[
				{
					title: 'Canonical Title',
					openingStock: 3,
					costPrice: 500,
					_existingId: 'pid99',
				},
			],
			catalog,
		)
		const si = {
			productTitle: lineItems[0]!.productTitle,
			productId: lineItems[0]!.productId,
			quantity: lineItems[0]!.quantity,
			unit: lineItems[0]!.unit,
			unitStr: lineItems[0]!.unitStr,
			rate: lineItems[0]!.rate,
		}
		const prod = findCatalogProduct(si, catalog)
		expect(prod?._id).toBe('pid99')
		const row = lineFromMatchedStockImport(si, prod!, () => 'g1')
		expect(row.productId).toBe('pid99')
		expect(row.unit).toBe('piece')
		expect(row.quantity).toBe(30)
	})
})
