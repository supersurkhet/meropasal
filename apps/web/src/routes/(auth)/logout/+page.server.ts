import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	cookies.delete(COOKIE_NAME, { path: '/' });
	redirect(302, '/login');
};
