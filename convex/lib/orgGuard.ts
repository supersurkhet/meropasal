import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireOrg(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const orgId = identity.orgId as string | undefined;
  if (!orgId) throw new Error("No organization context");
  return orgId;
}
