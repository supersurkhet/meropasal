<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		description = '',
		open = $bindable(false),
		triggerClass = '',
		children,
		oncreated,
	}: {
		title: string;
		description?: string;
		open?: boolean;
		triggerClass?: string;
		children: Snippet;
		oncreated?: (id: string) => void;
	} = $props();
</script>

<Button
	variant="outline"
	size="icon"
	class="size-9 shrink-0 {triggerClass}"
	onclick={() => (open = true)}
>
	<Plus class="size-4" />
</Button>

<Dialog bind:open>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>{title}</DialogTitle>
			{#if description}
				<DialogDescription>{description}</DialogDescription>
			{/if}
		</DialogHeader>
		{@render children()}
	</DialogContent>
</Dialog>
