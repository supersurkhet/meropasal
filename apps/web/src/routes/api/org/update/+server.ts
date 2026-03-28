import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { workos } from '$lib/server/auth'

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
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
		const updatePayload: Record<string, unknown> = {}

		if (name !== undefined) {
			updatePayload.name = name.trim()
		}

		// Build metadata from provided fields
		const metadata: Record<string, unknown> = {}
		if (location !== undefined) metadata.location = location?.trim() || ''
		if (phone !== undefined) metadata.phone = phone?.trim() || ''
		if (panNumber !== undefined) metadata.panNumber = panNumber?.trim() || ''
		if (businessType !== undefined) metadata.businessType = businessType
		if (currency !== undefined) metadata.currency = currency
		if (taxRate !== undefined) metadata.taxRate = taxRate

		if (Object.keys(metadata).length > 0) {
			// Merge with existing metadata to avoid overwriting unrelated keys
			const existingOrg = await workos.organizations.getOrganization(locals.orgId)
			updatePayload.metadata = { ...(existingOrg.metadata ?? {}), ...metadata }
		}

		const org = await workos.organizations.updateOrganization({
			organization: locals.orgId,
			...updatePayload,
		})

		return json({ name: org.name, metadata: org.metadata })
	} catch (err: any) {
		const message = err?.rawData?.message ?? err?.message ?? 'Failed to update organization'
		return json({ error: message }, { status: 500 })
	}
}
