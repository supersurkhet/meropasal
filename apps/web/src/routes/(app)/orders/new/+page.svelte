<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import OrderForm from '$lib/components/modules/orders/OrderForm.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title={t('order_create')} />

<div class="p-6">
	<div class="mb-6">
		<Button href="/orders" variant="ghost" size="sm" class="mb-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
			<ArrowLeft class="mr-1.5 size-4" />
			{t('nav_orders')}
		</Button>
		<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('order_create')}</h1>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('page_orders_desc')}</p>
	</div>

	<OrderForm onSuccess={() => { toast.success('Order created successfully'); goto('/orders'); }} oncancel={() => goto('/orders')} />
</div>
