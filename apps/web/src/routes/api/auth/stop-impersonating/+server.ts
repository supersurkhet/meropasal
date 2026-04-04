import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { COOKIE_NAME } from '$lib/server/auth'

export const GET: RequestHandler = async ({ cookies }) => {
	// Clear the impersonation session — delete session and org cookies
	cookies.delete(COOKIE_NAME, { path: '/' })
	cookies.delete('wos-org-id', { path: '/' })

	// Redirect to login — the admin will get their own session back via AuthKit
	redirect(302, '/login')
}
