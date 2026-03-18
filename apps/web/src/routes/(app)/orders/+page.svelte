<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import OrderList from '$lib/components/modules/orders/OrderList.svelte';
	import OrderForm from '$lib/components/modules/orders/OrderForm.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/t.svelte';

	let showNewOrder = $state(false);

	function onOrderCreated() {
		showNewOrder = false;
		// Toast handled by OrderForm component
	}
</script>

<MetaTags title={t('nav_orders')} />

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('nav_orders')}</h1>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('page_orders_desc')}</p>
		</div>
		<Button
			onclick={() => (showNewOrder = true)}
			class="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus class="mr-1.5 size-4" />
			{t('order_create')}
		</Button>
	</div>

	<OrderList />
</div>

<Dialog.Root bind:open={showNewOrder}>
	<Dialog.Content class="max-h-[90vh] max-w-4xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{t('order_create')}</Dialog.Title>
			<Dialog.Description>{t('page_orders_desc')}</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<OrderForm onSuccess={onOrderCreated} oncancel={() => (showNewOrder = false)} />
		</div>
	</Dialog.Content>
</Dialog.Root>
