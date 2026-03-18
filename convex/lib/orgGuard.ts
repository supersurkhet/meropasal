import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  // Try to get orgId from the JWT claims
  const orgId = (identity as Record<string, unknown>).orgId as string | undefined;
  if (orgId) return orgId;

  // Fallback: use the user's subject (sub) as a pseudo-org ID.
  // This allows the app to work without a WorkOS Organization
  // configured (common in development/testing).
  // In production with multi-tenant, the orgId from the JWT is required.
  const subject = identity.subject;
  if (subject) return `user_${subject}`;

  throw new Error("No organization context");
}
