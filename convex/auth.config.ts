/**
 * Convex auth configuration for Clerk JWT verification.
 *
 * Uses Clerk's `convex` JWT template. The template's `aud` claim must equal
 * `applicationID` below. Custom claims (`org_id`, `org_role`, `org_slug`)
 * surface as top-level properties on the Convex identity object.
 */
export default {
	providers: [
		{
			domain: 'https://teaching-adder-25.clerk.accounts.dev',
			applicationID: 'convex',
		},
	],
};
