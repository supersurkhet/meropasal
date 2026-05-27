import { clerkClient } from 'svelte-clerk/server'

// Re-export the pre-instantiated Clerk backend client.
// svelte-clerk constructs it from CLERK_SECRET_KEY / PUBLIC_CLERK_PUBLISHABLE_KEY env vars.
export const clerk = clerkClient

// TODO: WorkOS impersonation flow is dropped — Clerk's impersonation differs.
//       Revisit if downstream features need a parallel pathway.
// TODO: derive isInternalStaff from clerk user publicMetadata.isInternalStaff === true
//       (fetch lazily via clerk.users.getUser(userId) and cache).
