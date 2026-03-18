<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import OrderDetail from '$lib/components/modules/orders/OrderDetail.svelte';
</script>

<MetaTags title="Order Detail" />

<div class="p-6">
	<div class="mb-6">
		<Button href="/orders" variant="ghost" size="sm" class="mb-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
			<ArrowLeft class="mr-1.5 size-4" />
			Back to Orders
		</Button>
		<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Order Detail</h1>
	</div>

	<OrderDetail orderId={$page.params.id!} />
</div>
