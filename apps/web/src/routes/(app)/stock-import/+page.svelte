<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import StockImportList from '$lib/components/modules/stock-import/StockImportList.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title="{t('nav_stock_import')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<StockImportList />
</div>
