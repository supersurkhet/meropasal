import type { Handle } from '@sveltejs/kit';
import { workos, COOKIE_NAME, WORKOS_COOKIE_PASSWORD, sessionCookieOptions } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Default to unauthenticated
	event.locals.user = null;
	event.locals.orgId = null;
	event.locals.convexToken = null;

	const sessionCookie = event.cookies.get(COOKIE_NAME);

	if (sessionCookie) {
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
			event.locals.convexToken = accessToken;

			// Get orgId: from session → dedicated cookie → membership fallback
			let resolvedOrgId = organizationId ?? null;
			if (!resolvedOrgId) {
				resolvedOrgId = event.cookies.get('wos-org-id') ?? null;
			}
			if (!resolvedOrgId) {
				try {
					const memberships = await workos.userManagement.listOrganizationMemberships({
						userId: user.id,
					});
					if (memberships.data.length > 0) {
						resolvedOrgId = memberships.data[0].organizationId;
					}
				} catch {
					// Membership lookup failed — continue without orgId
				}
			}
			event.locals.orgId = resolvedOrgId;

			// Refresh the sealed session if WorkOS returned a new one
			if ('sealedSession' in result && result.sealedSession) {
				event.cookies.set(COOKIE_NAME, result.sealedSession as string, sessionCookieOptions(event.url));
			}
		} else {
			// Session invalid or JWT expired — attempt refresh
			try {
				const session = workos.userManagement.loadSealedSession({
					sessionData: sessionCookie,
					cookiePassword: WORKOS_COOKIE_PASSWORD,
				});
				const refreshResult = await session.refresh();

				if (refreshResult.authenticated) {
					// Update the cookie with the refreshed session
					event.cookies.set(COOKIE_NAME, refreshResult.sealedSession as string, sessionCookieOptions(event.url));

					// Re-authenticate with the new session to populate locals
					const freshResult = await workos.userManagement.authenticateWithSessionCookie({
						sessionData: refreshResult.sealedSession as string,
						cookiePassword: WORKOS_COOKIE_PASSWORD,
					});

					if (freshResult.authenticated) {
						const { user, organizationId, accessToken } = freshResult;
						event.locals.user = {
							id: user.id,
							email: user.email,
							firstName: user.firstName,
							lastName: user.lastName,
							profilePictureUrl: user.profilePictureUrl,
						};
						event.locals.convexToken = accessToken;

						let resolvedOrgId = organizationId ?? null;
						if (!resolvedOrgId) {
							resolvedOrgId = event.cookies.get('wos-org-id') ?? null;
						}
						if (!resolvedOrgId) {
							try {
								const memberships = await workos.userManagement.listOrganizationMemberships({
									userId: user.id,
								});
								if (memberships.data.length > 0) {
									resolvedOrgId = memberships.data[0].organizationId;
								}
							} catch {
								// continue without orgId
							}
						}
						event.locals.orgId = resolvedOrgId;
					}
				} else {
					// Refresh failed — clear session
					event.cookies.delete(COOKIE_NAME, { path: '/' });
				}
			} catch {
				// Refresh threw — clear session
				event.cookies.delete(COOKIE_NAME, { path: '/' });
			}
		}
	}

	return resolve(event);
};
