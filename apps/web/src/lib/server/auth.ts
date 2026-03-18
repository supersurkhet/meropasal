import { WorkOS } from '@workos-inc/node';
import { WORKOS_API_KEY, WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD } from '$env/static/private';

export const workos = new WorkOS(WORKOS_API_KEY, {
	clientId: WORKOS_CLIENT_ID,
});

export const COOKIE_NAME = 'wos-session';

export { WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD };
