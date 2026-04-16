import { describe, it, expect } from 'vitest'
import { stockImportSchema } from './stock-import'

describe('stockImportSchema', () => {
	it('accepts payload shaped like post-scan commit lines', () => {
		const parsed = stockImportSchema.safeParse({
			importDate: '2026-04-16',
			items: [
				{
					productId: 'k17abc',
					productTitle: 'Tea',
					quantity: 3,
					rate: 100,
					unit: 'piece',
				},
			],
		})
		expect(parsed.success).toBe(true)
	})

	it('rejects empty items', () => {
		const parsed = stockImportSchema.safeParse({
			importDate: '2026-04-16',
			items: [],
		})
		expect(parsed.success).toBe(false)
	})

	it('rejects quantity below 1', () => {
		const parsed = stockImportSchema.safeParse({
			importDate: '2026-04-16',
			items: [
				{
					productId: 'x',
					productTitle: 'Y',
					quantity: 0,
					rate: 1,
				},
			],
		})
		expect(parsed.success).toBe(false)
	})
})
