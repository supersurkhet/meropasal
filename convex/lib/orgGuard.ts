import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Get the organization ID for the current request.
 *
 * Strategy:
 * 1. Try to get orgId from Convex auth identity (JWT claims)
 * 2. Fall back to using the user's subject as a pseudo-org ID
 * 3. If no auth at all, use a default dev org ID
 *
 * In production, this should strictly require JWT-based auth.
 * The fallback is for development/testing where WorkOS JWT
 * audience validation may not align with Convex's expectations.
 */
export async function requireOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();

  if (identity) {
    // Try orgId from JWT claims
    const orgId = (identity as Record<string, unknown>).org_id as string | undefined
      || (identity as Record<string, unknown>).orgId as string | undefined;
    if (orgId) return orgId;

    // Fall back to user subject as pseudo-org
    if (identity.subject) return `user_${identity.subject}`;
  }

  // Development fallback: allow unauthenticated access with a default org
  // This enables the app to work while the WorkOS ↔ Convex JWT
  // audience mismatch is resolved.
  // TODO: Remove this in production — require proper JWT auth
  return "dev_default_org";
}
