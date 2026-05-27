<script lang="ts">
	import { useClerkContext } from 'svelte-clerk'
	import { setConvexAuth } from '$lib/convex'

	const ctx = useClerkContext()

	async function fetchToken(): Promise<string | null> {
		const session = ctx.session
		if (!session) return null
		try {
			return await session.getToken({ template: 'convex' })
		} catch {
			return null
		}
	}

	$effect(() => {
		void ctx.session?.id
		setConvexAuth(fetchToken)
	})
</script>
