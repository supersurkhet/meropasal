<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import OrderList from '$lib/components/modules/orders/OrderList.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title="{t('nav_orders')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<OrderList />
</div>
