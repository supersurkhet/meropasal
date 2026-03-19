<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import { t } from '$lib/t.svelte';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import {
		Package,
		AlertTriangle,
		ArrowLeft,
		Search,
	} from '@lucide/svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const products = useConvexQuery(client, api.functions.products.list, () => ({}));
	const stockAgg = useConvexQuery(client, api.functions.stockBook.getAggregation, () => ({}));

	let searchQuery = $state('');
	let showLowStockOnly = $state(false);

	type ProductWithStock = {
		_id: string;
		title: string;
		category?: string;
		costPrice: number;
		sellingPrice: number;
		reorderLevel?: number;
		isActive: boolean;
		available: number;
		stockValue: number;
		isLowStock: boolean;
	};

	const inventoryItems = $derived.by(() => {
		if (!products.data || !stockAgg.data) return [];

		const agg = stockAgg.data;
		const items: ProductWithStock[] = products.data
			.filter((p: any) => p.isActive)
			.map((p: any) => {
				const available = agg.productTotalAvailable?.[p._id] ?? 0;
				const reorder = p.reorderLevel ?? 0;
				return {
					_id: p._id,
					title: p.title,
					category: p.category,
					costPrice: p.costPrice,
					sellingPrice: p.sellingPrice,
					reorderLevel: p.reorderLevel,
					isActive: p.isActive,
					available,
					stockValue: available * p.costPrice,
					isLowStock: available <= reorder,
				};
			});

		let filtered = items;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.title.toLowerCase().includes(q) ||
					(p.category?.toLowerCase().includes(q) ?? false),
			);
		}
		if (showLowStockOnly) {
			filtered = filtered.filter((p) => p.isLowStock);
		}

		return filtered.sort((a, b) => {
			if (a.isLowStock && !b.isLowStock) return -1;
			if (!a.isLowStock && b.isLowStock) return 1;
			return a.title.localeCompare(b.title);
		});
	});

	const totalStockValue = $derived(
		inventoryItems.reduce((sum, p) => sum + p.stockValue, 0),
	);
	const lowStockCount = $derived(inventoryItems.filter((p) => p.isLowStock).length);
	const totalItems = $derived(inventoryItems.length);

	const categories = $derived.by(() => {
		if (!products.data) return [];
		const cats = new Set<string>();
		for (const p of products.data as any[]) {
			if (p.category) cats.add(p.category);
		}
		return Array.from(cats).sort();
	});

	let categoryFilter = $state<string>('');
</script>

<MetaTags title="Inventory Report — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-6">
		<a
			href="/reports"
			class="mb-3 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
		>
			<ArrowLeft class="size-3" />
			Back to Reports
		</a>
		<div class="flex items-center gap-3">
			<div
				class="flex size-10 items-center justify-center rounded-xl bg-amber-100 shadow-sm dark:bg-amber-900/30"
			>
				<Package class="size-5 text-amber-600 dark:text-amber-400" />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					Inventory Report
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					Stock levels, alerts, and valuation
				</p>
			</div>
		</div>
	</div>

	{#if products.isLoading || stockAgg.isLoading}
		<div class="flex items-center justify-center py-16 text-zinc-500">
			<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
			></div>
			<span class="ml-2 text-sm">Loading inventory data...</span>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Total Stock Value</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
					{formatNPR(totalStockValue, true)}
				</p>
				<p class="mt-0.5 text-xs text-zinc-400">{totalItems} products</p>
			</div>
			<div
				class="rounded-xl border p-4 {lowStockCount > 0
					? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10'
					: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}"
			>
				<p class="text-xs {lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}">
					Low Stock Alerts
				</p>
				<p
					class="mt-1 text-xl font-bold tabular-nums {lowStockCount > 0
						? 'text-amber-700 dark:text-amber-400'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{lowStockCount}
				</p>
				{#if lowStockCount > 0}
					<p class="mt-0.5 text-xs text-amber-600 dark:text-amber-400">Requires attention</p>
				{:else}
					<p class="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">All stocked</p>
				{/if}
			</div>
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Categories</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
					{categories.length}
				</p>
			</div>
		</div>

		<!-- Filters -->
		<div
			class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
		>
			<div class="relative flex-1 sm:max-w-xs">
				<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
				<input
					type="text"
					placeholder="{t('search_products')}"
					bind:value={searchQuery}
					class="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
				/>
			</div>
			{#if categories.length > 0}
				<Select.Root type="single" value={categoryFilter || 'all'} onValueChange={(v) => {
					categoryFilter = v === 'all' ? '' : v;
					if (categoryFilter) {
						searchQuery = categoryFilter;
					}
				}}>
					<Select.Trigger size="sm">
						{categoryFilter || 'All Categories'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">All Categories</Select.Item>
						{#each categories as cat}
							<Select.Item value={cat}>{cat}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
			<label class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
				<Checkbox bind:checked={showLowStockOnly} />
				Low stock only
			</label>
		</div>

		<!-- Inventory Table -->
		{#if inventoryItems.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-zinc-500">
				<Package class="mb-3 size-10 opacity-40" />
				<p class="text-sm">No products found</p>
			</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="font-semibold">Product</Table.Head>
							<Table.Head class="font-semibold">Category</Table.Head>
							<Table.Head class="text-right font-semibold">Stock</Table.Head>
							<Table.Head class="text-right font-semibold">Reorder</Table.Head>
							<Table.Head class="text-right font-semibold">Cost Price</Table.Head>
							<Table.Head class="text-right font-semibold">Stock Value</Table.Head>
							<Table.Head class="font-semibold">Status</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each inventoryItems as item}
							<Table.Row
								class={item.isLowStock
									? 'bg-red-50/50 dark:bg-red-900/5'
									: ''}
							>
								<Table.Cell class="font-medium text-zinc-900 dark:text-zinc-100">
									{#if item.isLowStock}
										<span class="mr-1.5 inline-block">
											<AlertTriangle class="inline size-3.5 text-red-500" />
										</span>
									{/if}
									{item.title}
								</Table.Cell>
								<Table.Cell class="text-zinc-500 dark:text-zinc-400">
									{item.category ?? '—'}
								</Table.Cell>
								<Table.Cell
									class="text-right tabular-nums font-medium {item.isLowStock
										? 'text-red-600 dark:text-red-400'
										: 'text-zinc-900 dark:text-zinc-100'}"
								>
									{item.available}
								</Table.Cell>
								<Table.Cell class="text-right tabular-nums text-zinc-500 dark:text-zinc-400">
									{item.reorderLevel ?? '—'}
								</Table.Cell>
								<Table.Cell class="text-right tabular-nums text-zinc-600 dark:text-zinc-400">
									{formatNPR(item.costPrice)}
								</Table.Cell>
								<Table.Cell class="text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
									{formatNPR(item.stockValue)}
								</Table.Cell>
								<Table.Cell>
									{#if item.isLowStock}
										{#if item.available === 0}
											<span
												class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
											>
												Out of stock
											</span>
										{:else}
											<span
												class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
											>
												Low stock
											</span>
										{/if}
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
										>
											In stock
										</span>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	{/if}
</div>
