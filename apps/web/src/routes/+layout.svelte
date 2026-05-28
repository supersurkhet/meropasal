<script lang="ts">
	import '@fontsource/inter/400.css'
	import '@fontsource/inter/500.css'
	import '@fontsource/inter/600.css'
	import '@fontsource/inter/700.css'
	import '@fontsource/mukta/400.css'
	import '@fontsource/mukta/500.css'
	import '@fontsource/mukta/600.css'
	import '@fontsource/mukta/700.css'
	import '@fontsource-variable/geist'
	import '../app.css'

	import { browser } from '$app/environment'
	import { Toaster } from 'svelte-sonner'
	import { MetaTags } from 'svelte-meta-tags'
	import { ClerkProvider } from 'svelte-clerk'
	import favicon from '$lib/assets/favicon.svg'
	import AgentationSync from '$lib/components/shared/AgentationSync.svelte'
	import ClerkConvexBridge from '$lib/components/shared/ClerkConvexBridge.svelte'
	import { dark } from '@clerk/ui/themes'

	let { children, data } = $props()

	let isDark = $state(false)

	$effect(() => {
		if (!browser) return
		isDark = document.documentElement.classList.contains('dark')
		const observer = new MutationObserver(() => {
			isDark = document.documentElement.classList.contains('dark')
		})
		observer.observe(document.documentElement, { attributeFilter: ['class'] })
		return () => observer.disconnect()
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ClerkProvider {...data} appearance={{ theme: isDark ? dark : undefined }}>
	<ClerkConvexBridge />

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
