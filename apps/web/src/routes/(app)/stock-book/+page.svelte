<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import StockAggregation from '$lib/components/modules/stock-book/StockAggregation.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title={t('nav_stock_book')} />

<div class="p-6 lg:p-8">
	<StockAggregation />
</div>
