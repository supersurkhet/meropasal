import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { workos, COOKIE_NAME, WORKOS_CLIENT_ID } from '$lib/server/auth'
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
		cookies.set(COOKIE_NAME, sealedSession, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		})
	}

	// Check if this is a return from the onboarding flow
	const onboardingCookie = cookies.get('mp-onboarding')
	if (onboardingCookie) {
		try {
			const data = JSON.parse(onboardingCookie)
			cookies.delete('mp-onboarding', { path: '/' })

			// Initialize the org in Convex using the org-scoped access token
			const convexUrl = CONVEX_URL
			const convex = new ConvexHttpClient(convexUrl)
			convex.setAuth(accessToken)

			await convex.mutation(api.functions.organizations.initializeOrg, {
				businessName: data.businessName,
				businessType: data.businessType,
				currentFiscalYear: data.currentFiscalYear,
				location: data.location || undefined,
				phone: data.phone || undefined,
				panNumber: data.panNumber || undefined,
			})

			redirect(302, '/dashboard')
		} catch (err) {
			// Re-throw redirects
			if (err && typeof err === 'object' && 'status' in err) throw err
			// If Convex init fails, still redirect to dashboard — the user has an org now
			// They can retry setup or it may already exist
			console.error('Failed to initialize org in Convex:', err)
			redirect(302, '/dashboard')
		}
	}

	// Check if user has an org membership
	try {
		const memberships = await workos.userManagement.listOrganizationMemberships({
			userId: user.id,
		})

		if (memberships.data.length > 0) {
			redirect(302, '/dashboard')
		}
	} catch (err) {
		// Re-throw redirects
		if (err && typeof err === 'object' && 'status' in err) throw err
	}

	// No org — send to onboarding
	redirect(302, '/onboarding')
}
