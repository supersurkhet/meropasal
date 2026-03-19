<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Checkbox as CheckboxPrimitive } from "bits-ui";

	export type CheckboxProps = WithElementRef<
		CheckboxPrimitive.RootProps
	> & {
		class?: string;
	};
</script>

<script lang="ts">
	import { Checkbox } from "bits-ui";
	import { Check, Minus } from "@lucide/svelte";

	let {
		class: className,
		checked = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: CheckboxProps = $props();
</script>

<Checkbox.Root
	bind:checked
	bind:ref
	data-slot="checkbox"
	class={cn(
		"peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
		className,
	)}
	{...restProps}
>
	{#snippet children({ checked: isChecked, indeterminate })}
		<div
			class="flex items-center justify-center text-current transition-none"
		>
			{#if indeterminate}
				<Minus class="size-3.5" />
			{:else if isChecked}
				<Check class="size-3.5" />
			{/if}
		</div>
	{/snippet}
</Checkbox.Root>
