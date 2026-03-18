<script lang="ts">
	import type { Component } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		icon: Component<{ class?: string }>;
		title: string;
		description: string;
		actionLabel?: string;
		actionHref?: string;
	};

	let { icon: Icon, title, description, actionLabel, actionHref }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
	<div class="flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
		<Icon class="size-7 text-zinc-400 dark:text-zinc-500" />
	</div>

	<div class="space-y-1">
		<h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
			{title}
		</h3>
		<p class="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
			{description}
		</p>
	</div>

	{#if actionLabel && actionHref}
		<Button href={actionHref} variant="default" size="sm">
			{actionLabel}
		</Button>
	{/if}
</div>
