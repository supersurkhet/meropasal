<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		containerRef = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> & { containerRef?: HTMLDivElement | null } = $props();
</script>

<div bind:this={containerRef} data-slot="table-container" class="relative w-full overflow-auto max-h-[calc(100svh-13rem)]">
	<table
		bind:this={ref}
		data-slot="table"
		class={cn("w-full caption-bottom text-sm", className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
