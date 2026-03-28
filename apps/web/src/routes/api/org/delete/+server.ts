import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { workos, WORKOS_CLIENT_ID, shortCookieOptions, COOKIE_NAME } from '$lib/server/auth'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '$lib/api'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || process.env.VITE_CONVEX_URL || 'https://dapper-pig-289.convex.cloud'

export const POST: RequestHandler = async ({ request, locals, url, cookies }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { organizationId } = await request.json()
	if (!organizationId || typeof organizationId !== 'string') {
		return json({ error: 'Missing organizationId' }, { status: 400 })
	}

	if (organizationId !== locals.orgId) {
		return json({ error: 'Can only delete the currently active organization' }, { status: 403 })
	}

	try {
		// 1. Delete all Convex data for this org
		const convex = new ConvexHttpClient(CONVEX_URL)
		if (locals.convexToken) {
			convex.setAuth(locals.convexToken)
		}
		await convex.mutation(api.functions.organizations.deleteOrgData, { orgId: organizationId })

		// 2. Remove user's membership from WorkOS org
		const memberships = await workos.userManagement.listOrganizationMemberships({
			organizationId,
		})
		for (const m of memberships.data) {
			await workos.userManagement.deleteOrganizationMembership(m.id)
		}

		// 3. Delete the org from WorkOS
		await workos.organizations.deleteOrganization(organizationId)

		// 4. Clear org cookie
		cookies.delete('wos-org-id', { path: '/' })

		// 5. Check if user has other orgs
		const remainingMemberships = await workos.userManagement.listOrganizationMemberships({
			userId: locals.user.id,
		})

		if (remainingMemberships.data.length > 0) {
			// Switch to first remaining org
			const nextOrgId = remainingMemberships.data[0].organizationId
			cookies.set('wos-org-id', nextOrgId, shortCookieOptions(url, 60 * 60 * 24 * 30))

			const authorizationUrl = workos.userManagement.getAuthorizationUrl({
				provider: 'authkit',
				clientId: WORKOS_CLIENT_ID,
				redirectUri: `${url.origin}/callback`,
				organizationId: nextOrgId,
			})

			return json({ redirectUrl: authorizationUrl })
		}

		// No orgs left — send to onboarding
		return json({ redirectUrl: '/onboarding' })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to delete organization'
		return json({ error: message }, { status: 500 })
	}
}
