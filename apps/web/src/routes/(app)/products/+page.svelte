<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import ProductList from '$lib/components/modules/products/ProductList.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title="{t('nav_products')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<ProductList />
</div>
