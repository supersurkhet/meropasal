import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { workos } from '$lib/server/auth'

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/login')
	}

	// Users without an org must complete onboarding first
	if (!locals.orgId && !url.pathname.startsWith('/onboarding')) {
		redirect(302, '/onboarding')
	}

	// Fetch the current WorkOS org name and all user's org memberships
	let workosOrgName = ''
	let userOrgs: Array<{ id: string; name: string }> = []

	if (locals.user) {
		try {
			const memberships = await workos.userManagement.listOrganizationMemberships({
				userId: locals.user.id,
			})
			// Fetch org details for each membership
			const orgDetails = await Promise.all(
				memberships.data.map(async (m) => {
					try {
						const org = await workos.organizations.getOrganization(m.organizationId)
						return { id: org.id, name: org.name }
					} catch {
						return { id: m.organizationId, name: m.organizationId }
					}
				})
			)
			userOrgs = orgDetails

			// Set current org name
			const currentOrg = orgDetails.find((o) => o.id === locals.orgId)
			workosOrgName = currentOrg?.name ?? ''
		} catch {
			// Fallback: try just the current org
			if (locals.orgId) {
				try {
					const org = await workos.organizations.getOrganization(locals.orgId)
					workosOrgName = org.name
					userOrgs = [{ id: org.id, name: org.name }]
				} catch {
					// Non-critical
				}
			}
		}
	}

	return {
		user: locals.user,
		orgId: locals.orgId,
		convexToken: locals.convexToken,
		workosOrgName,
		userOrgs,
	}
}
