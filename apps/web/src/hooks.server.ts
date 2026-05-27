import { withClerkHandler, clerkClient } from 'svelte-clerk/server'
import { sequence } from '@sveltejs/kit/hooks'
import type { Handle } from '@sveltejs/kit'

// Populate convenience locals from Clerk's auth() so downstream load/actions
// don't have to re-invoke auth() and getToken() everywhere.
const populateConvex: Handle = async ({ event, resolve }) => {
	const auth = event.locals.auth()
	const userId = auth?.userId ?? null
	const orgId = (auth as { orgId?: string | null } | null)?.orgId ?? null

	event.locals.userId = userId
	event.locals.orgId = orgId
	event.locals.convexToken = userId
		? ((await auth.getToken({ template: 'convex' })) ?? null)
		: null
	event.locals.isInternalStaff = false
	if (userId) {
		try {
			const user = await clerkClient.users.getUser(userId)
			event.locals.isInternalStaff = user.publicMetadata?.isInternalStaff === true
		} catch {
			/* ignore */
		}
	}

	return resolve(event)
}

export const handle = sequence(withClerkHandler(), populateConvex)
