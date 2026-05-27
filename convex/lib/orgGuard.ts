import { QueryCtx, MutationCtx } from "../_generated/server";
import { PERMISSIONS, type Role, type Permission } from "./permissions";

/**
 * Try to get orgId. Returns null if not authenticated.
 * Use for queries that should gracefully return empty data when unauthenticated.
 *
 * Resolution: `org_id` claim from Clerk JWT (requires active org selected
 * client-side and `"org_id": "{{org.id}}"` in the `convex` JWT template).
 * Clerk is the single source of truth for org membership.
 */
export async function getOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const claims = identity as Record<string, unknown>;
  const orgId = (claims.org_id as string | undefined)
    || (claims.orgId as string | undefined);
  return orgId ?? null;
}

/**
 * Map Clerk's `org_role` claim (e.g. `org:admin`, `org:member`) to an
 * application role. Defaults to `admin` when no role claim is present
 * (single-user fallback when no org context is attached to the token).
 */
function mapClerkRole(clerkRole: string | undefined): Role {
  if (!clerkRole) return 'admin';
  const r = clerkRole.replace(/^org:/, '');
  return r === 'admin' ? 'admin' : 'member';
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

  const claims = (identity ?? {}) as Record<string, unknown>;
  const clerkRole = (claims.org_role as string | undefined)
    ?? (claims.role as string | undefined);
  const role: Role = mapClerkRole(clerkRole);

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
): Promise<'admin' | 'member' | null> {
  const orgId = await getOrg(ctx);
  if (!orgId) return null;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const claims = identity as Record<string, unknown>;
  const clerkRole = (claims.org_role as string | undefined)
    ?? (claims.role as string | undefined);
  return mapClerkRole(clerkRole);
}
