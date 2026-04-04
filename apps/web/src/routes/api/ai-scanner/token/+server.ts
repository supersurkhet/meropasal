import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { GoogleGenAI } from '@google/genai'
import { env } from '$env/dynamic/private'

/**
 * Creates a short-lived ephemeral token for Gemini Live API.
 * The API key stays server-side — only the ephemeral token goes to the client.
 */
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		error(401, 'Authentication required')
	}

	const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY
	if (!apiKey) {
		error(500, 'GOOGLE_GENERATIVE_AI_API_KEY not configured')
	}

	return json({ token: apiKey })
}
