export function isSpreadsheet(filename: string): boolean {
	const ext = filename.split('.').pop()?.toLowerCase() ?? ''
	return ['xlsx', 'xls', 'csv'].includes(ext)
}

export function isWordDoc(filename: string): boolean {
	const ext = filename.split('.').pop()?.toLowerCase() ?? ''
	return ['docx', 'doc'].includes(ext)
}
