import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ parent }) => {
	const data = await parent();
	if (!data.user) {
		redirect(302, '/login');
	}

	return {};
};
