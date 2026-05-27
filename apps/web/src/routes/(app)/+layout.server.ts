import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { clerk } from '$lib/server/auth'

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.userId) {
		redirect(302, '/sign-in')
	}

	// Users without an org must complete onboarding first
	if (!locals.orgId && !url.pathname.startsWith('/onboarding')) {
		redirect(302, '/onboarding')
	}

	let currentOrgName = ''
	let orgMetadata: Record<string, unknown> = {}

	if (locals.orgId) {
		try {
			const org = await clerk.organizations.getOrganization({ organizationId: locals.orgId })
			currentOrgName = org.name
			orgMetadata = (org.publicMetadata ?? {}) as Record<string, unknown>
		} catch {
			// Non-critical: server-rendered bill/invoice templates will show fallbacks
		}
	}

	return {
		convexToken: locals.convexToken,
		currentOrgName,
		orgMetadata,
	}
}
