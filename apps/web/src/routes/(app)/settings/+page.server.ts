import type { PageServerLoad } from './$types'
import { workos } from '$lib/server/auth'

export const load: PageServerLoad = async ({ locals }) => {
	let workosOrg: { name: string } | null = null
	if (locals.orgId) {
		try {
			const org = await workos.organizations.getOrganization(locals.orgId)
			workosOrg = { name: org.name }
		} catch {
			// Org fetch failed — not critical
		}
	}
	return { workosOrg }
}
