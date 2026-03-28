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

	const { name } = await request.json()
	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Organization name is required' }, { status: 400 })
	}

	try {
		const org = await workos.organizations.updateOrganization({
			organization: locals.orgId,
			name: name.trim(),
		})
		return json({ name: org.name })
	} catch (err: any) {
		const message = err?.rawData?.message ?? err?.message ?? 'Failed to rename organization'
		return json({ error: message }, { status: 500 })
	}
}
