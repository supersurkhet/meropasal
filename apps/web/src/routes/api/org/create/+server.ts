import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { workos, WORKOS_CLIENT_ID } from '$lib/server/auth'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '$lib/api'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || process.env.VITE_CONVEX_URL || 'https://dapper-pig-289.convex.cloud'

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json()
	const { businessName, businessType, currentFiscalYear, location, phone, panNumber } = body

	if (!businessName?.trim()) {
		return json({ error: 'Business name is required' }, { status: 400 })
	}
	if (!['retail', 'wholesale', 'service'].includes(businessType)) {
		return json({ error: 'Invalid business type' }, { status: 400 })
	}
	if (!currentFiscalYear?.trim()) {
		return json({ error: 'Fiscal year is required' }, { status: 400 })
	}

	try {
		// 1. Create WorkOS Organization
		const org = await workos.organizations.createOrganization({
			name: businessName.trim(),
		})

		// 2. Add user as owner member
		await workos.userManagement.createOrganizationMembership({
			userId: locals.user.id,
			organizationId: org.id,
			roleSlug: 'owner',
		})

		// 3. Store business data in Convex (survives OAuth redirect)
		const convex = new ConvexHttpClient(CONVEX_URL)
		await convex.mutation(api.functions.organizations.savePendingOnboarding, {
			workosUserId: locals.user.id,
			businessType,
			currentFiscalYear: currentFiscalYear.trim(),
			location: location?.trim() || undefined,
			phone: phone?.trim() || undefined,
			panNumber: panNumber?.trim() || undefined,
		})

		// 4. Redirect through WorkOS OAuth to get org-scoped session
		const authorizationUrl = workos.userManagement.getAuthorizationUrl({
			provider: 'authkit',
			clientId: WORKOS_CLIENT_ID,
			redirectUri: `${url.origin}/callback`,
			organizationId: org.id,
		})

		return json({ redirectUrl: authorizationUrl })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create organization'
		return json({ error: message }, { status: 500 })
	}
}
