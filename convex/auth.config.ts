/**
 * Convex auth configuration for WorkOS JWT verification.
 * The accessToken from WorkOS AuthKit is passed as the Convex auth token.
 */
export default {
	providers: [
		{
			// WorkOS issues JWTs with this domain
			domain: 'https://api.workos.com/',
			applicationID: 'convex',
		},
	],
};
