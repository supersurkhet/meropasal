<script lang="ts">
	import type { Snippet } from 'svelte'

	let {
		children,
		inline = false,
		class: className = '',
	}: {
		children: Snippet
		inline?: boolean
		class?: string
	} = $props()
</script>

{#if inline}
	<div class="flex items-center gap-3 pt-2 justify-end {className}">
		{@render children()}
	</div>
{:else}
	<div class="fab-group fixed bottom-8 right-0 z-30 flex items-stretch rounded-l-2xl bg-white dark:bg-zinc-900 {className}">
		{@render children()}
	</div>
{/if}

<style>
	.fab-group {
		box-shadow:
			/* outer depth — big soft spread */
			-10px 10px 30px rgba(0, 0, 0, 0.12),
			-4px 4px 12px rgba(0, 0, 0, 0.08),
			/* tight edge shadow for crispness */
			-1px 1px 3px rgba(0, 0, 0, 0.06),
			/* top inset highlight — neumorphic lift */
			inset 0 2px 0 rgba(255, 255, 255, 0.7),
			/* left inset highlight */
			inset 2px 0 0 rgba(255, 255, 255, 0.4);
	}
	:global(.dark) .fab-group {
		box-shadow:
			-10px 10px 35px rgba(0, 0, 0, 0.55),
			-4px 4px 14px rgba(0, 0, 0, 0.35),
			-1px 1px 3px rgba(0, 0, 0, 0.25),
			inset 0 2px 0 rgba(255, 255, 255, 0.07),
			inset 2px 0 0 rgba(255, 255, 255, 0.04);
	}
	.fab-group :global([data-slot="button"]) {
		background: transparent;
		border: none;
		box-shadow: none;
		border-radius: 0;
		color: oklch(0.21 0.006 285.885);
		height: auto;
		padding: 0.75rem 1.25rem;
		border-right: 1px solid rgba(0, 0, 0, 0.08);
		font-weight: 600;
	}
	.fab-group :global([data-slot="button"]:last-child) {
		border-right: none;
	}
	:global(.dark) .fab-group :global([data-slot="button"]) {
		color: oklch(0.985 0.002 286.067);
		border-right-color: rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .fab-group :global([data-slot="button"]:last-child) {
		border-right: none;
	}
	.fab-group :global([data-slot="button"]:first-child) {
		border-radius: 1rem 0 0 1rem;
	}
	.fab-group :global([data-slot="button"]:only-child) {
		border-radius: 1rem 0 0 1rem;
	}
	.fab-group :global([data-slot="button"]:hover:not(:disabled)) {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .fab-group :global([data-slot="button"]:hover:not(:disabled)) {
		background: rgba(255, 255, 255, 0.06);
	}
</style>
