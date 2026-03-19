/**
 * Convex auth configuration for WorkOS JWT verification.
 *
 * WorkOS AuthKit JWTs:
 *   iss: https://api.workos.com/user_management/{clientId}
 *   sub: user_{userId}
 *   No 'aud' claim
 *   JWKS at non-standard path: /sso/jwks/{clientId}
 *
 * Using customJwt type to specify the exact JWKS URL since WorkOS
 * doesn't serve JWKS at the standard /.well-known/jwks.json path.
 */
export default {
	providers: [
		{
			type: 'customJwt' as const,
			issuer: 'https://api.workos.com/user_management/client_01KKYG4JJK79BPD8C3QHRPKVS9',
			jwks: 'https://api.workos.com/sso/jwks/client_01KKYG4JJK79BPD8C3QHRPKVS9',
			algorithm: 'RS256' as const,
		},
	],
};
