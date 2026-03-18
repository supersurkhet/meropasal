<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { getConvexClient, setConvexAuth } from '$lib/convex';

	let { children, data } = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	$effect(() => {
		setConvexAuth(data.convexToken);
	});
</script>

<AppShell user={data.user}>
	{@render children()}
</AppShell>
