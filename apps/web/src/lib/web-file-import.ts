import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { isSpreadsheet, isWordDoc } from './file-kind'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer)
	let binary = ''
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]!)
	}
	return btoa(binary)
}

export async function parseSpreadsheetFile(file: File): Promise<string> {
	const name = file.name.toLowerCase()
	if (name.endsWith('.csv')) {
		return file.text()
	}
	const buf = await file.arrayBuffer()
	const wb = XLSX.read(buf, { type: 'array' })
	const parts: string[] = []
	for (const sheetName of wb.SheetNames) {
		const sheet = wb.Sheets[sheetName]
		if (!sheet) continue
		const csv = XLSX.utils.sheet_to_csv(sheet)
		parts.push(`## ${sheetName}\n${csv}`)
	}
	return parts.join('\n\n')
}

export async function parseWordDocFile(file: File): Promise<string> {
	const lower = file.name.toLowerCase()
	if (lower.endsWith('.doc') && !lower.endsWith('.docx')) {
		throw new Error('Legacy .doc files are not supported in the browser. Save as .docx or PDF and try again.')
	}
	const ab = await file.arrayBuffer()
	const { value } = await mammoth.extractRawText({ arrayBuffer: ab })
	return value
}

export type WebFileProcessResult =
	| { kind: 'text'; text: string; mimeType: string }
	| { kind: 'binary'; data: string; mimeType: string; size: number }

export async function readFileForScan(file: File): Promise<WebFileProcessResult> {
	const name = file.name
	const mime = file.type || 'application/octet-stream'

	if (isSpreadsheet(name)) {
		const text = await parseSpreadsheetFile(file)
		return { kind: 'text', text, mimeType: 'text/csv' }
	}

	if (isWordDoc(name)) {
		const text = await parseWordDocFile(file)
		return { kind: 'text', text, mimeType: 'text/plain' }
	}

	const buf = await file.arrayBuffer()
	return {
		kind: 'binary',
		data: arrayBufferToBase64(buf),
		mimeType: mime,
		size: buf.byteLength,
	}
}
