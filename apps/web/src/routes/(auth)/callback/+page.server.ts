import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { workos, COOKIE_NAME, WORKOS_CLIENT_ID } from '$lib/server/auth';
import { WORKOS_COOKIE_PASSWORD } from '$env/static/private';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		redirect(302, '/login');
	}

	const { user, sealedSession } = await workos.userManagement.authenticateWithCode({
		code,
		clientId: WORKOS_CLIENT_ID,
		session: {
			sealSession: true,
			cookiePassword: WORKOS_COOKIE_PASSWORD,
		},
	});

	if (sealedSession) {
		cookies.set(COOKIE_NAME, sealedSession, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
	}

	// New users go to onboarding; returning users to dashboard.
	// We can't query Convex server-side easily, so we redirect to /onboarding
	// which checks if the org is already set up and redirects to /dashboard if so.
	redirect(302, '/onboarding');
};
