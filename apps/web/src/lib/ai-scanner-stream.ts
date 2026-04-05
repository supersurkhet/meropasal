import type { ScanResult } from './ai-schemas'

export type StreamScanOptions = {
	textContent?: string
	fileUrl?: string
	fileData?: string
	mimeType: string
	onPartial: (data: Partial<ScanResult>) => void
	onDone: (data: ScanResult) => void
	onError: (error: string) => void
}

/**
 * Stream AI extraction results via SSE.
 * Calls onPartial with each incremental result, then onDone with the final complete result.
 */
export async function streamScan(opts: StreamScanOptions): Promise<void> {
	const response = await fetch('/api/ai-scanner/stream', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			textContent: opts.textContent,
			fileUrl: opts.fileUrl,
			fileData: opts.fileData,
			mimeType: opts.mimeType,
		}),
	})

	if (!response.ok) {
		const text = await response.text()
		opts.onError(text || `HTTP ${response.status}`)
		return
	}

	const reader = response.body?.getReader()
	if (!reader) {
		opts.onError('No response body')
		return
	}

	const decoder = new TextDecoder()
	let buffer = ''
	let lastData: Partial<ScanResult> = {}

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		buffer += decoder.decode(value, { stream: true })

		// Parse SSE events from buffer
		const lines = buffer.split('\n')
		buffer = lines.pop() ?? '' // Keep incomplete line in buffer

		for (const line of lines) {
			if (!line.startsWith('data: ')) continue
			const payload = line.slice(6).trim()

			if (payload === '[DONE]') {
				opts.onDone(lastData as ScanResult)
				return
			}

			try {
				const parsed = JSON.parse(payload)
				if (parsed.error) {
					opts.onError(parsed.error)
					return
				}
				lastData = parsed
				opts.onPartial(parsed)
			} catch {
				// Skip malformed JSON chunks
			}
		}
	}

	// If we exit the loop without [DONE], call onDone with last data
	if (lastData && ((lastData.parties?.length ?? 0) > 0 || (lastData.products?.length ?? 0) > 0 || (lastData.customers?.length ?? 0) > 0)) {
		opts.onDone(lastData as ScanResult)
	} else {
		opts.onError('Stream ended without extracting any data')
	}
}
