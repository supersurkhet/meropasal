import { WorkOS } from '@workos-inc/node';
import { WORKOS_API_KEY, WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD } from '$env/static/private';

export const workos = new WorkOS(WORKOS_API_KEY, {
	clientId: WORKOS_CLIENT_ID,
});

export const COOKIE_NAME = 'wos-session';

export function sessionCookieOptions(url: URL) {
	return {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax' as const,
		maxAge: 60 * 60 * 24 * 30, // 30 days
	}
}

export function shortCookieOptions(url: URL, maxAge: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax' as const,
		maxAge,
	}
}

export { WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD };
