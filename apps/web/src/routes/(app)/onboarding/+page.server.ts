import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { workos, COOKIE_NAME, WORKOS_CLIENT_ID } from '$lib/server/auth'
import { WORKOS_COOKIE_PASSWORD } from '$env/static/private'

export const load: PageServerLoad = async ({ parent, locals }) => {
	const data = await parent()
	if (!data.user) {
		redirect(302, '/login')
	}

	// If user already has an org (from session or from WorkOS), go to dashboard
	if (locals.orgId) {
		redirect(302, '/dashboard')
	}

	// Check WorkOS for existing org memberships
	if (locals.user) {
		try {
			const memberships = await workos.userManagement.listOrganizationMemberships({
				userId: locals.user.id,
			})
			if (memberships.data.length > 0) {
				// User has an org but session doesn't include it.
				// Redirect through WorkOS auth to get org-scoped session.
				redirect(302, '/dashboard')
			}
		} catch (err) {
			// Re-throw redirects
			if (err && typeof err === 'object' && 'status' in err) throw err
		}
	}

	return {}
}

export const actions: Actions = {
	createBusiness: async ({ request, locals, cookies, url }) => {
		if (!locals.user) {
			redirect(302, '/login')
		}

		const formData = await request.formData()
		const businessName = (formData.get('businessName') as string)?.trim()
		const businessType = formData.get('businessType') as string
		const currentFiscalYear = (formData.get('currentFiscalYear') as string)?.trim()
		const location = (formData.get('location') as string)?.trim() || undefined
		const phone = (formData.get('phone') as string)?.trim() || undefined
		const panNumber = (formData.get('panNumber') as string)?.trim() || undefined

		if (!businessName) {
			return fail(400, { error: 'Business name is required' })
		}
		if (!['retail', 'wholesale', 'service'].includes(businessType)) {
			return fail(400, { error: 'Invalid business type' })
		}
		if (!currentFiscalYear) {
			return fail(400, { error: 'Fiscal year is required' })
		}

		try {
			// 1. Create WorkOS Organization
			const org = await workos.organizations.createOrganization({
				name: businessName,
			})

			// 2. Add user as admin member
			await workos.userManagement.createOrganizationMembership({
				userId: locals.user.id,
				organizationId: org.id,
				roleSlug: 'owner',
			})

			// 3. Store business setup data in a short-lived cookie
			const onboardingData = JSON.stringify({
				businessName,
				businessType,
				currentFiscalYear,
				location,
				phone,
				panNumber,
			})
			cookies.set('mp-onboarding', onboardingData, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 5, // 5 minutes
			})

			// 4. Redirect through WorkOS OAuth to get org-scoped session
			const authorizationUrl = workos.userManagement.getAuthorizationUrl({
				provider: 'authkit',
				clientId: WORKOS_CLIENT_ID,
				redirectUri: `${url.origin}/callback`,
				organizationId: org.id,
			})

			redirect(302, authorizationUrl)
		} catch (err) {
			// Re-throw redirects
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 302) {
				throw err
			}
			const message = err instanceof Error ? err.message : 'Failed to create organization'
			return fail(500, { error: message })
		}
	},
}
