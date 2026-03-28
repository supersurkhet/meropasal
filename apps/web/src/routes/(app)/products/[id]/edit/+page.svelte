<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

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

	$effect(() => {
		breadcrumbLabel.set(product?.title ?? null);
		return () => breadcrumbLabel.set(null);
	});

	async function loadProduct() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const products = await client.query(api.functions.products.list, {});
		product = products.find((p: any) => p._id === productId) ?? null;
		loaded = true;
	}
</script>

<MetaTags title={product ? `Edit ${product.title}` : 'Edit Product'} />

<div class="p-6 lg:p-8">
	<div class="mb-4">
		<a
			href="/products"
			class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-3.5" />
			Back to Products
		</a>
	</div>

	{#if loaded && !product}
		<div class="py-20 text-center">
			<p class="text-zinc-500">Product not found</p>
			<a href="/products" class="mt-2 inline-block text-sm text-zinc-900 underline dark:text-zinc-100">Back to products</a>
		</div>
	{:else if !loaded}
		<div class="space-y-5 mx-auto max-w-2xl">
			<!-- Title -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- Supplier -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-20" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- Unit -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-12" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- Prices -->
			<div class="grid grid-cols-2 gap-4">
				{#each Array(2) as _}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-10 w-full rounded-md" />
					</div>
				{/each}
			</div>
			<!-- Stock -->
			<div class="grid grid-cols-2 gap-4">
				{#each Array(2) as _}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-28" />
						<Skeleton class="h-10 w-full rounded-md" />
					</div>
				{/each}
			</div>
			<!-- Category -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-20" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- SKU / Barcode / HS Code -->
			<div class="grid grid-cols-3 gap-4">
				{#each Array(3) as _}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-16" />
						<Skeleton class="h-10 w-full rounded-md" />
					</div>
				{/each}
			</div>
			<!-- Description -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-20 w-full rounded-md" />
			</div>
			<!-- Actions -->
			<div class="flex justify-end">
				<Skeleton class="h-10 w-32 rounded-md" />
			</div>
		</div>
	{:else}
		<ProductForm initial={product ?? undefined} />
	{/if}
</div>
