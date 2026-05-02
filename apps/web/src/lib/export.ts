/**
 * Export helpers for CSV and JSON downloads.
 */

export function downloadFile(content: string, filename: string, type: string) {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function toCSV(rows: (string | number | undefined)[][]): string {
	return rows
		.map((row) =>
			row
				.map((cell) => {
					const v = cell === undefined || cell === null ? '' : String(cell);
					// Escape quotes and wrap in quotes if contains comma/newline/quote
					if (/[",\n\r]/.test(v)) {
						return `"${v.replace(/"/g, '""')}"`;
					}
					return v;
				})
				.join(','),
		)
		.join('\n');
}

export function exportCSV(filename: string, rows: (string | number | undefined)[][]) {
	downloadFile(toCSV(rows), filename, 'text/csv');
}

export function exportJSON(filename: string, data: unknown) {
	downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}
