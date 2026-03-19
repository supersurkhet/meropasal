import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { workos, COOKIE_NAME, WORKOS_CLIENT_ID, sessionCookieOptions } from '$lib/server/auth'
import { WORKOS_COOKIE_PASSWORD } from '$env/static/private'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '$lib/api'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || process.env.VITE_CONVEX_URL || 'https://dapper-pig-289.convex.cloud'

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code')
	if (!code) {
		redirect(302, '/login')
	}

	const authResult = await workos.userManagement.authenticateWithCode({
		code,
		clientId: WORKOS_CLIENT_ID,
		session: {
			sealSession: true,
			cookiePassword: WORKOS_COOKIE_PASSWORD,
		},
	})

	const { user, sealedSession, accessToken } = authResult

	if (sealedSession) {
		cookies.set(COOKIE_NAME, sealedSession, sessionCookieOptions(url))
	}

	const convex = new ConvexHttpClient(CONVEX_URL)
	convex.setAuth(accessToken)

	// Check if there's pending onboarding data in Convex
	try {
		const pendingData = await convex.mutation(
			api.functions.organizations.consumePendingOnboarding,
			{ workosUserId: user.id }
		)

		if (pendingData) {
			// Initialize the org in Convex with the stored business data
			try {
				await convex.mutation(api.functions.organizations.initializeOrg, {
					businessName: pendingData.businessName,
					businessType: pendingData.businessType,
					currentFiscalYear: pendingData.currentFiscalYear,
					location: pendingData.location || undefined,
					phone: pendingData.phone || undefined,
					panNumber: pendingData.panNumber || undefined,
				})
			} catch (err) {
				console.error('Failed to initialize org in Convex:', err)
			}
			redirect(302, '/dashboard')
		}
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err
		console.error('Failed to check pending onboarding:', err)
	}

	// No pending onboarding — check if user has an org membership
	try {
		const memberships = await workos.userManagement.listOrganizationMemberships({
			userId: user.id,
		})

		if (memberships.data.length > 0) {
			const orgId = memberships.data[0].organizationId

			// Ensure user→org mapping exists in Convex
			try {
				await convex.mutation(api.functions.organizations.ensureUserOrgMapping, { orgId })
			} catch {
				// Non-fatal — mapping may already exist
			}

			redirect(302, '/dashboard')
		}
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err
	}

	// No org — send to onboarding
	redirect(302, '/onboarding')
}
