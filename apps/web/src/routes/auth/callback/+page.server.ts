import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

// WorkOS impersonation (and possibly other flows) may redirect to /auth/callback
// instead of /callback. Forward all query params to the canonical callback route.
export const load: PageServerLoad = async ({ url }) => {
	redirect(302, `/callback${url.search}`)
}
