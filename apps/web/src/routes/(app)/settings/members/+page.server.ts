import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { workos } from '$lib/server/auth'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login')
	if (!locals.orgId) redirect(302, '/onboarding')

	const { token } = await workos.widgets.createToken({
		userId: locals.user.id,
		organizationId: locals.orgId,
		scopes: ['widgets:users-table:manage'],
	})

	return { widgetToken: token }
}
