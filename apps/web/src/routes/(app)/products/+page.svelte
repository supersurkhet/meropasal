<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import ProductList from '$lib/components/modules/products/ProductList.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title={t('nav_products')} />

<div class="p-6">
	<ProductList />
</div>
