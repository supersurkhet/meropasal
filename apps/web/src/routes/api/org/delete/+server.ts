import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { clerk } from '$lib/server/auth'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '$lib/api'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || process.env.VITE_CONVEX_URL || 'https://dapper-pig-289.convex.cloud'

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.userId) {
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

		// 2. Delete the Clerk organization (cascades memberships server-side)
		await clerk.organizations.deleteOrganization(organizationId)

		// 3. Determine next destination based on remaining memberships
		const remaining = await clerk.users.getOrganizationMembershipList({ userId: locals.userId })
		if (remaining.data.length > 0) {
			// Client will call setActive to switch into another org; just send to dashboard.
			return json({ redirectUrl: '/dashboard', nextOrgId: remaining.data[0].organization.id })
		}

		return json({ redirectUrl: '/onboarding' })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to delete organization'
		return json({ error: message }, { status: 500 })
	}
}
