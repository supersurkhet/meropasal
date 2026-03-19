import { PERMISSIONS, type Role } from '../../../../convex/lib/permissions'

export { ROLES, PERMISSIONS, type Role, type Permission } from '../../../../convex/lib/permissions'

export function createPermissions(role: string) {
	function can(permission: string): boolean {
		return PERMISSIONS[permission]?.includes(role as Role) ?? false
	}
	return { can, role }
}
