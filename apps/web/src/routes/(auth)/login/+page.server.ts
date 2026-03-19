import type { PageServerLoad } from './$types';
import { workos, WORKOS_CLIENT_ID } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Already authenticated — redirect to dashboard
	if (locals.user) {
		redirect(302, '/dashboard');
	}

	// Auto-redirect to WorkOS AuthKit — no login UI needed
	const authorizationUrl = workos.userManagement.getAuthorizationUrl({
		provider: 'authkit',
		clientId: WORKOS_CLIENT_ID,
		redirectUri: `${url.origin}/callback`,
	});

	redirect(302, authorizationUrl);
};
