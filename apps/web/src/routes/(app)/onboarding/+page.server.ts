import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { clerk } from '$lib/server/auth'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '$lib/api'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || process.env.VITE_CONVEX_URL || 'https://dapper-pig-289.convex.cloud'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.userId) {
		redirect(302, '/sign-in')
	}

	if (!locals.orgId) {
		return { hasOrg: false }
	}

	try {
		const convex = new ConvexHttpClient(CONVEX_URL)
		if (locals.convexToken) convex.setAuth(locals.convexToken)
		const settings = await convex.query(api.functions.organizations.getSettings, {})
		if (settings) redirect(302, '/dashboard')
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err
	}

	return { hasOrg: true }
}

export const actions: Actions = {
	createBusiness: async ({ request, locals }) => {
		if (!locals.userId) redirect(302, '/sign-in')
		if (!locals.orgId) return fail(400, { error: 'No active organization' })

		const formData = await request.formData()
		const businessName = (formData.get('businessName') as string)?.trim()
		const businessType = formData.get('businessType') as string
		const currentFiscalYear = (formData.get('currentFiscalYear') as string)?.trim()
		const location = (formData.get('location') as string)?.trim() || undefined
		const phone = (formData.get('phone') as string)?.trim() || undefined
		const panNumber = (formData.get('panNumber') as string)?.trim() || undefined

		if (!businessName) return fail(400, { error: 'Business name is required' })
		if (!['retail', 'wholesale', 'service'].includes(businessType)) return fail(400, { error: 'Invalid business type' })
		if (!currentFiscalYear) return fail(400, { error: 'Fiscal year is required' })

		try {
			const existing = await clerk.organizations.getOrganization({ organizationId: locals.orgId })
			await clerk.organizations.updateOrganization(locals.orgId, {
				name: businessName,
				publicMetadata: {
					...(existing.publicMetadata ?? {}),
					businessType,
					location: location || '',
					phone: phone || '',
					panNumber: panNumber || '',
					currency: 'NPR',
					taxRate: '13',
				},
			})

			const convex = new ConvexHttpClient(CONVEX_URL)
			if (locals.convexToken) convex.setAuth(locals.convexToken)
			await convex.mutation(api.functions.organizations.savePendingOnboarding, {
				clerkUserId: locals.userId,
				currentFiscalYear,
			})

			redirect(302, '/dashboard')
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 302) throw err
			const message = err instanceof Error ? err.message : 'Failed to save business details'
			return fail(500, { error: message })
		}
	},
}
