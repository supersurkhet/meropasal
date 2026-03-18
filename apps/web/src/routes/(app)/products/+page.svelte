<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import ProductList from '$lib/components/modules/products/ProductList.svelte';
</script>

<MetaTags title="Products" />

<div class="p-6">
	<ProductList />
</div>
