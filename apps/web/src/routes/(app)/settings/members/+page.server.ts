import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { workos } from '$lib/server/auth'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login')
	if (!locals.orgId) redirect(302, '/onboarding')

	try {
		const memberships = await workos.userManagement.listOrganizationMemberships({
			organizationId: locals.orgId,
		})

		const members = await Promise.all(
			memberships.data.map(async (m) => {
				try {
					const user = await workos.userManagement.getUser(m.userId)
					return {
						id: m.id,
						userId: m.userId,
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName,
						profilePictureUrl: user.profilePictureUrl,
						role: (m.role?.slug as string) ?? 'owner',
						status: m.status ?? 'active',
					}
				} catch {
					return {
						id: m.id,
						userId: m.userId,
						email: null,
						firstName: null,
						lastName: null,
						profilePictureUrl: null,
						role: (m.role?.slug as string) ?? 'owner',
						status: m.status ?? 'active',
					}
				}
			})
		)

		return { members }
	} catch (err) {
		// If WorkOS call fails, return empty list
		console.error('Failed to fetch members:', err)
		return { members: [] }
	}
}

export const actions: Actions = {
	inviteMember: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login')
		if (!locals.orgId) redirect(302, '/onboarding')

		const formData = await request.formData()
		const email = (formData.get('email') as string)?.trim()
		const role = (formData.get('role') as string)?.trim() || 'sales'

		if (!email) {
			return fail(400, { error: 'Email is required' })
		}

		const validRoles = ['owner', 'manager', 'accountant', 'sales', 'warehouse', 'driver']
		if (!validRoles.includes(role)) {
			return fail(400, { error: 'Invalid role' })
		}

		try {
			await workos.userManagement.sendInvitation({
				email,
				organizationId: locals.orgId,
				roleSlug: role,
			})
			return { success: true, message: `Invitation sent to ${email}` }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to send invitation'
			return fail(500, { error: message })
		}
	},

	removeMember: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login')
		if (!locals.orgId) redirect(302, '/onboarding')

		const formData = await request.formData()
		const membershipId = (formData.get('membershipId') as string)?.trim()

		if (!membershipId) {
			return fail(400, { error: 'Membership ID is required' })
		}

		try {
			await workos.userManagement.deleteOrganizationMembership(membershipId)
			return { success: true, message: 'Member removed' }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to remove member'
			return fail(500, { error: message })
		}
	},

	changeRole: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login')
		if (!locals.orgId) redirect(302, '/onboarding')

		const formData = await request.formData()
		const membershipId = (formData.get('membershipId') as string)?.trim()
		const role = (formData.get('role') as string)?.trim()

		if (!membershipId || !role) {
			return fail(400, { error: 'Membership ID and role are required' })
		}

		const validRoles = ['owner', 'manager', 'accountant', 'sales', 'warehouse', 'driver']
		if (!validRoles.includes(role)) {
			return fail(400, { error: 'Invalid role' })
		}

		try {
			await workos.userManagement.updateOrganizationMembership(membershipId, {
				roleSlug: role,
			})
			return { success: true, message: 'Role updated' }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update role'
			return fail(500, { error: message })
		}
	},
}
