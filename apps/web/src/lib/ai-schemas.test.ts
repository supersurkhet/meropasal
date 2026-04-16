import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { scanResultSchema, getScanModeInstruction } from './ai-schemas'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('scanResultSchema', () => {
	it('accepts fixture', () => {
		const raw = readFileSync(
			join(__dirname, 'ai-scanner/__fixtures__/scan-result-valid.json'),
			'utf-8',
		)
		const parsed = scanResultSchema.safeParse(JSON.parse(raw))
		expect(parsed.success).toBe(true)
	})

	it('rejects missing products array', () => {
		const parsed = scanResultSchema.safeParse({ parties: [], customers: [] })
		expect(parsed.success).toBe(false)
	})

	it('rejects product missing title', () => {
		const parsed = scanResultSchema.safeParse({
			parties: [],
			customers: [],
			products: [{ costPrice: 10, openingStock: 1 } as { title?: string; costPrice: number; openingStock: number }],
		})
		expect(parsed.success).toBe(false)
	})

	it('rejects party missing name', () => {
		const parsed = scanResultSchema.safeParse({
			parties: [{} as { name?: string }],
			products: [],
			customers: [],
		})
		expect(parsed.success).toBe(false)
	})
})

describe('getScanModeInstruction', () => {
	it('returns stock-import hint', () => {
		expect(getScanModeInstruction('stock-import')).toContain('Stock import')
	})

	it('returns empty for mixed', () => {
		expect(getScanModeInstruction('mixed')).toBe('')
	})

	it('covers bill modes', () => {
		expect(getScanModeInstruction('sales')).toContain('Sales')
		expect(getScanModeInstruction('orders')).toContain('order')
		expect(getScanModeInstruction('trips')).toContain('Trip')
	})
})
