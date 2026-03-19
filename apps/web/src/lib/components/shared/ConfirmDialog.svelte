<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';

	let {
		open = $bindable(false),
		title = t('confirm_delete_title'),
		description = t('confirm_delete_desc'),
		confirmLabel = t('action_delete'),
		cancelLabel = t('action_cancel'),
		variant = 'destructive',
		loading = false,
		onconfirm,
		oncancel,
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'destructive' | 'warning';
		loading?: boolean;
		onconfirm: () => void;
		oncancel?: () => void;
	} = $props();

	function handleCancel() {
		open = false;
		oncancel?.();
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>{title}</DialogTitle>
			<DialogDescription>{description}</DialogDescription>
		</DialogHeader>

		<DialogFooter class="gap-2 sm:gap-0">
			<Button variant="outline" onclick={handleCancel} disabled={loading}>
				{cancelLabel}
			</Button>
			<Button
				variant={variant === 'destructive' ? 'destructive' : 'default'}
				onclick={onconfirm}
				disabled={loading}
				class={variant === 'warning'
					? 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
					: ''}
			>
				{#if loading}
					<Loader2 class="mr-2 size-4 animate-spin" />
				{/if}
				{confirmLabel}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
