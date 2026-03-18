<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { getConvexClient } from '$lib/convex';
	import { api } from '../../../../../convex/_generated/api';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';

	type Product = {
		_id: string;
		title: string;
		purchasePartyId: string;
		unit?: string;
		costPrice: number;
		sellingPrice?: number;
		openingStock: number;
		hsCode?: string;
		barcode?: string;
		sku?: string;
		category?: string;
		reorderLevel?: number;
		description?: string;
	};

	let productId = $derived(page.params.id);
	let product = $state<Product | null>(null);
	let loaded = $state(false);

	$effect(() => {
		loadProduct();
	});

	async function loadProduct() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const products = await client.query(api.functions.products.list, {});
		product = products.find((p: any) => p._id === productId) ?? null;
		loaded = true;
	}
</script>

<MetaTags title={product ? `Edit ${product.title}` : 'Edit Product'} />

<div class="p-6">
	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
		</div>
	{:else if product}
		<ProductForm initial={product} />
	{:else}
		<div class="py-20 text-center">
			<p class="text-zinc-500">Product not found</p>
			<a href="/products" class="mt-2 inline-block text-sm text-zinc-900 underline dark:text-zinc-100">Back to products</a>
		</div>
	{/if}
</div>
