import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { workos, COOKIE_NAME, WORKOS_COOKIE_PASSWORD } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionCookie = cookies.get(COOKIE_NAME);
	cookies.delete(COOKIE_NAME, { path: '/' });

	// End the WorkOS AuthKit session so the user isn't silently re-authenticated
	if (sessionCookie) {
		try {
			const result = await workos.userManagement.authenticateWithSessionCookie({
				sessionData: sessionCookie,
				cookiePassword: WORKOS_COOKIE_PASSWORD,
			});
			if (result.authenticated && result.sessionId) {
				const logoutUrl = workos.userManagement.getLogoutUrl({
					sessionId: result.sessionId,
				});
				redirect(302, logoutUrl);
			}
		} catch (err) {
			// Re-throw redirects
			if (err && typeof err === 'object' && 'status' in err) throw err;
			// Session already expired — just redirect to login
		}
	}

	redirect(302, '/login');
};
