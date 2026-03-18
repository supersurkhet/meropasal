import type { Handle } from '@sveltejs/kit';
import { workos, COOKIE_NAME, WORKOS_COOKIE_PASSWORD } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Default to unauthenticated
	event.locals.user = null;
	event.locals.orgId = null;
	event.locals.convexToken = null;

	const sessionCookie = event.cookies.get(COOKIE_NAME);

	if (sessionCookie) {
		try {
			const result = await workos.userManagement.authenticateWithSessionCookie({
				sessionData: sessionCookie,
				cookiePassword: WORKOS_COOKIE_PASSWORD,
			});

			if (result.authenticated) {
				const { user, organizationId, accessToken } = result;

				event.locals.user = {
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					profilePictureUrl: user.profilePictureUrl,
				};
				event.locals.orgId = organizationId ?? null;
				event.locals.convexToken = accessToken;

				// Refresh the sealed session if WorkOS returned a new one
				if ('sealedSession' in result && result.sealedSession) {
					event.cookies.set(COOKIE_NAME, result.sealedSession as string, {
						path: '/',
						httpOnly: true,
						secure: true,
						sameSite: 'lax',
						maxAge: 60 * 60 * 24 * 30, // 30 days
					});
				}
			}
		} catch {
			// Invalid/expired session — clear the cookie
			event.cookies.delete(COOKIE_NAME, { path: '/' });
		}
	}

	return resolve(event);
};
