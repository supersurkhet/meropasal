<script lang="ts">
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/mukta/400.css';
	import '@fontsource/mukta/500.css';
	import '@fontsource/mukta/600.css';
	import '@fontsource/mukta/700.css';
	import '@fontsource-variable/geist';
	import '../app.css';

	import { browser } from '$app/environment';
	import { Toaster } from 'svelte-sonner';
	import { MetaTags } from 'svelte-meta-tags';
	import { ClerkProvider, useClerkContext } from 'svelte-clerk';
	import { setConvexAuth } from '$lib/convex';
	import favicon from '$lib/assets/favicon.svg';
	import AgentationSync from '$lib/components/shared/AgentationSync.svelte';

	let { children, data } = $props();

	const ctx = useClerkContext();

	async function fetchToken(): Promise<string | null> {
		const session = ctx.session;
		if (!session) return null;
		try {
			return await session.getToken({ template: 'convex' });
		} catch {
			return null;
		}
	}

	// Sync Convex auth token whenever the Clerk session changes
	$effect(() => {
		// Track session identity so the effect re-runs on sign-in/out
		void ctx.session?.id;
		setConvexAuth(fetchToken);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ClerkProvider {...data}>
	<MetaTags
		title="MeroPasal"
		titleTemplate="%s — MeroPasal"
		description="Modern retail management for Nepal"
	/>

	<Toaster richColors position="bottom-right" />

	{@render children()}

	{#if browser && data.isInternalStaff}
		<AgentationSync />
	{/if}
</ClerkProvider>
