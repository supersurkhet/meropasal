/**
 * Convex auth configuration for WorkOS JWT verification.
 * WorkOS AuthKit JWTs have:
 *   iss: https://api.workos.com/user_management/{clientId}
 *   sub: user_{userId}
 *   No 'aud' claim
 *
 * The applicationID must match the JWT audience, but WorkOS
 * doesn't set one. Use the client ID as a workaround.
 */
export default {
	providers: [
		{
			domain: 'https://api.workos.com/user_management/client_01KKYG4JJK79BPD8C3QHRPKVS9',
			applicationID: 'client_01KKYG4JJK79BPD8C3QHRPKVS9',
		},
	],
};
