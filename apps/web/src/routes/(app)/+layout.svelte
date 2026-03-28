<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { getConvexClient, setConvexAuth } from '$lib/convex';

	let { children, data } = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	async function fetchToken(): Promise<string | null> {
		try {
			const res = await fetch('/api/auth/token');
			const { token } = await res.json();
			return token ?? null;
		} catch {
			return null;
		}
	}

	$effect(() => {
		setConvexAuth(fetchToken);
	});

	// Refresh layout data every 45 minutes to keep session alive
	const refreshInterval = setInterval(() => {
		invalidateAll();
	}, 45 * 60 * 1000);

	onDestroy(() => {
		clearInterval(refreshInterval);
	});
</script>

<AppShell user={data.user} workosOrgName={data.workosOrgName} orgMetadata={data.orgMetadata} userOrgs={data.userOrgs} currentOrgId={data.orgId}>
	{@render children()}
</AppShell>
