import { describe, it, expect } from 'vitest'
import { parseSpreadsheetFile } from './web-file-import'

describe('parseSpreadsheetFile', () => {
	it('reads csv as text', async () => {
		const csv = 'name,price\nItem,100\n'
		const file = new File([csv], 'test.csv', { type: 'text/csv' })
		const text = await parseSpreadsheetFile(file)
		expect(text).toContain('name')
		expect(text).toContain('Item')
	})

	it('returns empty string for empty first sheet csv', async () => {
		const xlsx = await import('xlsx')
		const wb = xlsx.utils.book_new()
		const ws = xlsx.utils.aoa_to_sheet([] as string[][])
		xlsx.utils.book_append_sheet(wb, ws, 'Empty')
		const buf = xlsx.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
		const file = new File([buf], 'empty.xlsx', {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		})
		const text = await parseSpreadsheetFile(file)
		expect(text).toContain('Empty')
	})

	it('includes sheet name for xlsx', async () => {
		const xlsx = await import('xlsx')
		const wb = xlsx.utils.book_new()
		const ws = xlsx.utils.aoa_to_sheet([
			['Product', 'Qty'],
			['X', 5],
		])
		xlsx.utils.book_append_sheet(wb, ws, 'Sheet1')
		const buf = xlsx.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
		const file = new File([buf], 't.xlsx', {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		})
		const text = await parseSpreadsheetFile(file)
		expect(text).toContain('Sheet1')
		expect(text).toContain('Product')
	})
})
