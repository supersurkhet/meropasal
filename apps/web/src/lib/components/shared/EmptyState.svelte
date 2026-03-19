<script lang="ts">
	import type { Component } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		icon: Component<{ class?: string }>;
		title: string;
		description: string;
		actionLabel?: string;
		actionHref?: string;
		actionIcon?: Component<{ class?: string }>;
	};

	let { icon: Icon, title, description, actionLabel, actionHref, actionIcon: ActionIcon }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 px-4 py-16 text-center dark:border-zinc-800">
	<div class="mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
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
		<Button href={actionHref} variant="outline" size="sm" class="mt-4 gap-2 border-zinc-300 shadow-sm dark:border-zinc-700">
			{#if ActionIcon}
				<ActionIcon class="size-3.5" />
			{/if}
			{actionLabel}
		</Button>
	{/if}
</div>
