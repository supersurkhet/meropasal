import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/login')
	}

	// Users without an org must complete onboarding first
	if (!locals.orgId && !url.pathname.startsWith('/onboarding')) {
		redirect(302, '/onboarding')
	}

	return {
		user: locals.user,
		orgId: locals.orgId,
		convexToken: locals.convexToken,
	}
}
