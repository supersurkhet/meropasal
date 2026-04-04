import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { streamText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { env } from '$env/dynamic/private'
import { scanResultSchema, SYSTEM_PROMPT } from '$lib/ai-schemas'

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Authentication required')
	}

	const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY
	if (!apiKey) {
		error(500, 'GOOGLE_GENERATIVE_AI_API_KEY not configured')
	}

	const body = await request.json()
	const { textContent, fileUrl, fileData, mimeType } = body as {
		textContent?: string
		fileUrl?: string
		fileData?: string
		mimeType: string
	}

	const google = createGoogleGenerativeAI({ apiKey })

	// Build content parts
	const contentParts: Array<
		| { type: 'text'; text: string }
		| { type: 'image'; image: Uint8Array; mimeType: string }
		| { type: 'file'; data: Uint8Array; mediaType: string }
	> = []

	// Handle file data (base64-encoded, sent directly)
	if (fileData) {
		const binary = atob(fileData)
		const buffer = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			buffer[i] = binary.charCodeAt(i)
		}

		if (mimeType.startsWith('image/')) {
			contentParts.push({ type: 'image', image: buffer, mimeType })
		} else if (mimeType === 'application/pdf') {
			contentParts.push({ type: 'file', data: buffer, mediaType: 'application/pdf' })
		} else if (mimeType.startsWith('audio/')) {
			contentParts.push({ type: 'file', data: buffer, mediaType: mimeType })
		}
	}

	// Handle file URL (fetched server-side)
	if (!fileData && fileUrl) {
		const response = await fetch(fileUrl)
		const buffer = new Uint8Array(await response.arrayBuffer())

		if (mimeType.startsWith('image/')) {
			contentParts.push({ type: 'image', image: buffer, mimeType })
		} else if (mimeType === 'application/pdf') {
			contentParts.push({ type: 'file', data: buffer, mediaType: 'application/pdf' })
		} else if (mimeType.startsWith('audio/')) {
			contentParts.push({ type: 'file', data: buffer, mediaType: mimeType })
		}
	}
	// Add text instruction
	const hasFile = contentParts.length > 0
	if (textContent && hasFile) {
		// Both file + text context: combine
		contentParts.push({
			type: 'text',
			text: `Extract all business data (products, suppliers/parties, customers) from the above. Additional context from the user:\n\n${textContent}`,
		})
	} else if (textContent) {
		// Text only
		contentParts.push({
			type: 'text',
			text: `Extract all business data (products, suppliers/parties, customers) from this content:\n\n${textContent}`,
		})
	} else if (hasFile) {
		// File only — add generic extraction instruction
		contentParts.push({
			type: 'text',
			text: 'Extract all business data (products, suppliers/parties, customers) from the above.',
		})
	} else {
		error(400, 'Either textContent, fileUrl, or fileData must be provided')
	}

	const result = streamText({
		model: google('gemini-2.0-flash'),
		system: SYSTEM_PROMPT,
		messages: [{ role: 'user', content: contentParts }],
		output: Output.object({ schema: scanResultSchema }),
	})

	// Stream partial objects as SSE
	const encoder = new TextEncoder()
	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const partial of result.partialOutputStream) {
					const chunk = `data: ${JSON.stringify(partial)}\n\n`
					controller.enqueue(encoder.encode(chunk))
				}
				// Send a done event
				controller.enqueue(encoder.encode('data: [DONE]\n\n'))
				controller.close()
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Stream error'
				controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
				controller.close()
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	})
}
