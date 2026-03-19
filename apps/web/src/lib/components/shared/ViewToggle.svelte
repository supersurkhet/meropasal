<script lang="ts">
	import { LayoutGrid, Columns2, List, Table } from '@lucide/svelte'
	import type { ViewMode } from '$lib/view-preference.svelte'

	let {
		mode = 'table',
		onchange,
	}: {
		mode: ViewMode
		onchange: (mode: ViewMode) => void
	} = $props()

	const views: { value: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
		{ value: 'grid-3', icon: LayoutGrid, label: '3-column grid' },
		{ value: 'grid-2', icon: Columns2, label: '2-column grid' },
		{ value: 'list', icon: List, label: 'List' },
		{ value: 'table', icon: Table, label: 'Table' },
	]
</script>

<div class="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
	{#each views as view}
		<button
			type="button"
			aria-label={view.label}
			aria-pressed={mode === view.value}
			class="rounded-md p-1.5 transition-all {mode === view.value
				? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
				: 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}"
			onclick={() => onchange(view.value)}
		>
			<view.icon class="size-4" />
		</button>
	{/each}
</div>
