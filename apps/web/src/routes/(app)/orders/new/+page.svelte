<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import OrderForm from '$lib/components/modules/orders/OrderForm.svelte';
	import AiScannerButton from '$lib/components/shared/AiScannerButton.svelte';
	import { t } from '$lib/t.svelte';

	let formRef = $state<{ addScannedItems: (items: any[], partyName?: string) => void } | null>(null)
</script>

<MetaTags title={t('order_create')} />

<div class="p-6">
	<div class="mb-4 flex items-center justify-between">
		<Button href="/orders" variant="ghost" size="sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
			<ArrowLeft class="mr-1.5 size-4" />
			{t('nav_orders')}
		</Button>
		<AiScannerButton
			targetTable="orders"
			onlineitems={(items, partyName) => formRef?.addScannedItems(items, partyName)}
		/>
	</div>

	<OrderForm bind:this={formRef} onSuccess={() => goto('/orders')} oncancel={() => goto('/orders')} />
</div>
