<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import SaleDetail from '$lib/components/modules/sales/SaleDetail.svelte';
</script>

<MetaTags title="Sale Detail" />

<div class="p-6">
	<SaleDetail saleId={page.params.id!} />
</div>
