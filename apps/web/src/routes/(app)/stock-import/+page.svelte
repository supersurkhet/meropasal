<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import StockImportList from '$lib/components/modules/stock-import/StockImportList.svelte';
	import { t } from '$lib/t';
</script>

<MetaTags title={t('nav_stock_import')} />

<div class="p-6">
	<StockImportList />
</div>
