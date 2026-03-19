import { json, redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { workos, WORKOS_CLIENT_ID } from '$lib/server/auth'

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { organizationId } = await request.json()
	if (!organizationId || typeof organizationId !== 'string') {
		return json({ error: 'Missing organizationId' }, { status: 400 })
	}

	// Already on this org
	if (organizationId === locals.orgId) {
		return json({ redirectUrl: null })
	}

	// Create an auth URL that will re-authenticate with the target org
	const authorizationUrl = workos.userManagement.getAuthorizationUrl({
		provider: 'authkit',
		clientId: WORKOS_CLIENT_ID,
		redirectUri: `${url.origin}/callback`,
		organizationId,
	})

	return json({ redirectUrl: authorizationUrl })
}
