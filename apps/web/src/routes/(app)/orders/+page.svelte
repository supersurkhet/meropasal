<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import OrderList from '$lib/components/modules/orders/OrderList.svelte';
	import OrderForm from '$lib/components/modules/orders/OrderForm.svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	let showNewOrder = $state(false);

	function onOrderCreated() {
		showNewOrder = false;
		// Toast handled by OrderForm component
	}
</script>

<MetaTags title="Orders" />

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Orders</h1>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage orders and track payments</p>
		</div>
		<Button
			onclick={() => (showNewOrder = true)}
			class="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus class="mr-1.5 size-4" />
			New Order
		</Button>
	</div>

	<OrderList />
</div>

<Dialog.Root bind:open={showNewOrder}>
	<Dialog.Content class="max-h-[90vh] max-w-4xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>New Order</Dialog.Title>
			<Dialog.Description>Create a new order with optional initial payments</Dialog.Description>
		</Dialog.Header>
		<div class="py-4">
			<OrderForm onSuccess={onOrderCreated} oncancel={() => (showNewOrder = false)} />
		</div>
	</Dialog.Content>
</Dialog.Root>
