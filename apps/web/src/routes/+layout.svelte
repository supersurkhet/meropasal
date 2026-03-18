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

	import { Toaster } from 'svelte-sonner';
	import { MetaTags } from 'svelte-meta-tags';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<MetaTags
	title="MeroPasal"
	titleTemplate="%s — MeroPasal"
	description="Modern retail management for Nepal"
/>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster richColors position="bottom-right" />

{@render children()}
