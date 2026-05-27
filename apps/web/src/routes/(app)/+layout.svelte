<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import AppShell from '$lib/components/layout/AppShell.svelte';

	let { children } = $props();

	// Refresh layout data every 45 minutes to keep session alive
	const refreshInterval = setInterval(() => {
		invalidateAll();
	}, 45 * 60 * 1000);

	onDestroy(() => {
		clearInterval(refreshInterval);
	});
</script>

<AppShell>
	{@render children()}
</AppShell>
