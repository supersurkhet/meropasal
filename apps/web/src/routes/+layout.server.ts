import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		orgId: locals.orgId,
		convexToken: locals.convexToken,
		isInternalStaff: locals.isInternalStaff,
	};
};
