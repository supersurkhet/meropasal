import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { workos, COOKIE_NAME, WORKOS_COOKIE_PASSWORD, sessionCookieOptions } from '$lib/server/auth'

export const GET: RequestHandler = async ({ cookies, url }) => {
	const sessionCookie = cookies.get(COOKIE_NAME)

	if (!sessionCookie) {
		return json({ token: null })
	}

	try {
		const result = await workos.userManagement.authenticateWithSessionCookie({
			sessionData: sessionCookie,
			cookiePassword: WORKOS_COOKIE_PASSWORD,
		})

		if (!result.authenticated) {
			return json({ token: null })
		}

		// Refresh the sealed session if WorkOS returned a new one
		if ('sealedSession' in result && result.sealedSession) {
			cookies.set(COOKIE_NAME, result.sealedSession as string, sessionCookieOptions(url))
		}

		return json({ token: result.accessToken })
	} catch {
		return json({ token: null })
	}
}
