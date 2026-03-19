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
	<div class="mb-4">
		<Button href="/orders" variant="ghost" size="sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
			<ArrowLeft class="mr-1.5 size-4" />
			{t('nav_orders')}
		</Button>
	</div>

	<OrderForm onSuccess={() => { toast.success('Order created successfully'); goto('/orders'); }} oncancel={() => goto('/orders')} />
</div>
