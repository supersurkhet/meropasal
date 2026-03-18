<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data.user) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
	<div class="flex flex-col items-center gap-2">
		<div class="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"></div>
		<span class="text-sm text-zinc-500">Loading...</span>
	</div>
</div>
