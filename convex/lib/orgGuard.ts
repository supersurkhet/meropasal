import { QueryCtx, MutationCtx } from "../_generated/server";
import { PERMISSIONS, ROLES, type Role, type Permission } from "./permissions";

/**
 * Try to get orgId. Returns null if not authenticated.
 * Use for queries that should gracefully return empty data when unauthenticated.
 *
 * Resolution: org_id / orgId from JWT claims (org-scoped session).
 * WorkOS is the single source of truth for org membership.
 */
export async function getOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const orgId = (identity as Record<string, unknown>).org_id as string | undefined
    || (identity as Record<string, unknown>).orgId as string | undefined;
  return orgId ?? null;
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

  // Get role from JWT claims, falling back to 'owner' if absent or not
  // a recognized app role (e.g. WorkOS defaults to "member"/"admin")
  const jwtRole = (identity as Record<string, unknown>).role as string | undefined;
  const role: Role = (jwtRole && (ROLES as readonly string[]).includes(jwtRole))
    ? jwtRole as Role
    : 'owner';

  const allowed = PERMISSIONS[permission];
  if (!allowed?.includes(role)) {
    throw new Error(
      `Insufficient permissions: ${permission} requires one of ${allowed?.join(', ') ?? 'none'}`
    );
  }

  return orgId;
}

/**
 * Resolve the current user's effective role.
 * Returns null if not authenticated or no org.
 */
export async function getEffectiveRole(
  ctx: QueryCtx | MutationCtx
): Promise<Role | null> {
  const orgId = await getOrg(ctx);
  if (!orgId) return null;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const jwtRole = (identity as Record<string, unknown>).role as string | undefined;
  return (jwtRole && (ROLES as readonly string[]).includes(jwtRole))
    ? jwtRole as Role
    : 'owner';
}
