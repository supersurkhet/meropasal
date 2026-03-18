<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import StockImportDetail from '$lib/components/modules/stock-import/StockImportDetail.svelte';
</script>

<MetaTags title="Stock Import Detail" />

<div class="p-6">
	<StockImportDetail importId={page.params.id!} />
</div>
