<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import AiScannerButton from '$lib/components/shared/AiScannerButton.svelte';
</script>

<MetaTags title="New Product" />

<div class="p-6">
	<div class="mb-4 flex justify-end">
		<AiScannerButton targetTable="products" />
	</div>
	<ProductForm />
</div>
