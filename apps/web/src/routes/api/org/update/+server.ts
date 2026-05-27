import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { clerk } from '$lib/server/auth'

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.userId) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (!locals.orgId) {
		return json({ error: 'No active organization' }, { status: 400 })
	}

	const body = await request.json()
	const { name, location, phone, panNumber, businessType, currency, taxRate } = body

	if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
		return json({ error: 'Organization name cannot be empty' }, { status: 400 })
	}

	try {
		const updatePayload: { name?: string; publicMetadata?: Record<string, string> } = {}

		if (name !== undefined) {
			updatePayload.name = name.trim()
		}

		// Build metadata patch
		const metadata: Record<string, string> = {}
		if (location !== undefined) metadata.location = String(location?.trim?.() ?? '')
		if (phone !== undefined) metadata.phone = String(phone?.trim?.() ?? '')
		if (panNumber !== undefined) metadata.panNumber = String(panNumber?.trim?.() ?? '')
		if (businessType !== undefined) metadata.businessType = String(businessType)
		if (currency !== undefined) metadata.currency = String(currency)
		if (taxRate !== undefined) metadata.taxRate = String(taxRate)

		if (Object.keys(metadata).length > 0) {
			// Merge with existing publicMetadata
			const existing = await clerk.organizations.getOrganization({ organizationId: locals.orgId })
			updatePayload.publicMetadata = {
				...((existing.publicMetadata ?? {}) as Record<string, string>),
				...metadata,
			}
		}

		const org = await clerk.organizations.updateOrganization(locals.orgId, updatePayload)

		return json({ name: org.name, metadata: org.publicMetadata })
	} catch (err) {
		const e = err as { errors?: Array<{ message?: string }>; message?: string }
		const message = e?.errors?.[0]?.message ?? e?.message ?? 'Failed to update organization'
		return json({ error: message }, { status: 500 })
	}
}
