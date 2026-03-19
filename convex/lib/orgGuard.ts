import { QueryCtx, MutationCtx } from "../_generated/server";
import { PERMISSIONS, type Role, type Permission } from "./permissions";

/**
 * Try to get orgId. Returns null if not authenticated.
 * Use for queries that should gracefully return empty data when unauthenticated.
 *
 * Resolution order:
 * 1. org_id / orgId from JWT claims (org-scoped session)
 * 2. userOrgMappings table lookup by subject (non-org-scoped session)
 * 3. null
 */
export async function getOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const orgId = (identity as Record<string, unknown>).org_id as string | undefined
    || (identity as Record<string, unknown>).orgId as string | undefined;
  if (orgId) return orgId;

  // Non-org-scoped JWT — look up the mapping
  if (identity.subject) {
    const mapping = await ctx.db
      .query("userOrgMappings")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .first();
    if (mapping) return mapping.orgId;
  }

  return null;
}

/**
 * Get the organization ID for the current request.
 * Throws if not authenticated. Use for mutations and queries that require auth.
 */
export async function requireOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const orgId = await getOrg(ctx);
  if (!orgId) throw new Error("Authentication required");
  return orgId;
}

/**
 * Require a specific permission for the current user.
 * Internally calls requireOrg and checks the user's role against the permission map.
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: Permission
): Promise<string> {
  const orgId = await requireOrg(ctx);
  const identity = await ctx.auth.getUserIdentity();

  // Get role from JWT claims or default to 'owner' for the org creator
  const role = (identity as Record<string, unknown>).role as Role | undefined ?? 'owner';

  const allowed = PERMISSIONS[permission];
  if (!allowed?.includes(role)) {
    throw new Error(
      `Insufficient permissions: ${permission} requires one of ${allowed?.join(', ') ?? 'none'}`
    );
  }

  return orgId;
}
