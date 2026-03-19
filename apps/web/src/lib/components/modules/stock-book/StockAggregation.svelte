<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNumber } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { ChevronDown, ChevronRight, Package, Filter } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	let fiscalYearFilter = $state<string | undefined>(undefined);
	let expandedProducts = $state<Set<string>>(new Set());

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const aggregation = useConvexQuery(client, api.functions.stockBook.getAggregation, () => ({
		fiscalYear: fiscalYearFilter,
	}));

	const products = useConvexQuery(client, api.functions.products.list, () => ({}));

	const fiscalYears = $derived.by(() => {
		if (!currentFY.data) return [];
		const parts = currentFY.data.split('/').map(Number);
		const start = parts[0];
		const years: string[] = [];
		for (let i = 0; i < 5; i++) {
			const s = start - i;
			const e = s + 1;
			years.push(`${String(s).padStart(2, '0')}/${String(e).padStart(2, '0')}`);
		}
		return years;
	});

	type AggregatedProduct = {
		productId: string;
		productTitle: string;
		totalAvailable: number;
		reorderLevel: number;
		buckets: Array<{ partyId: string; available: number }>;
	};

	const aggregatedProducts = $derived.by((): AggregatedProduct[] => {
		if (!aggregation.data || !products.data) return [];
		const agg = aggregation.data;
		const productMap = new Map<string, any>(products.data.map((p: any) => [p._id, p]));

		const result: AggregatedProduct[] = [];
		for (const [productId, total] of Object.entries(agg.productTotalAvailable ?? {})) {
			const product = productMap.get(productId);
			const buckets = Object.entries(agg.productPartyAvailable?.[productId] ?? {}).map(
				([partyId, available]) => ({ partyId, available: available as number }),
			);
			result.push({
				productId,
				productTitle: product?.title ?? productId,
				totalAvailable: total as number,
				reorderLevel: product?.reorderLevel ?? 0,
				buckets,
			});
		}

		return result.sort((a, b) => a.productTitle.localeCompare(b.productTitle));
	});

	function toggleExpand(productId: string) {
		const next = new Set(expandedProducts);
		if (next.has(productId)) {
			next.delete(productId);
		} else {
			next.add(productId);
		}
		expandedProducts = next;
	}

	function stockColorClass(total: number, reorder: number) {
		if (reorder <= 0) return 'text-zinc-900 dark:text-zinc-100';
		if (total <= 0) return 'text-red-600 dark:text-red-400 font-semibold';
		if (total <= reorder) return 'text-red-600 dark:text-red-400';
		if (total <= reorder * 1.5) return 'text-amber-600 dark:text-amber-400';
		return 'text-emerald-600 dark:text-emerald-400';
	}

	function stockIndicator(total: number, reorder: number) {
		if (reorder <= 0) return '';
		if (total <= 0) return 'bg-red-500';
		if (total <= reorder) return 'bg-red-400';
		if (total <= reorder * 1.5) return 'bg-amber-400';
		return 'bg-emerald-400';
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<Filter class="size-4 text-zinc-500" />
		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				fiscalYearFilter = val || undefined;
			}}
		>
			<option value="">{t('common_all_fiscal_years')}</option>
			{#each fiscalYears as fy}
				<option value={fy}>{fy}</option>
			{/each}
		</select>
	</div>

	{#if aggregation.isLoading || products.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('common_loading_stock')}</p>
			</div>
		</div>
	{:else if !aggregatedProducts.length}
		<EmptyState
			icon={Package}
			title={t('empty_stock_book')}
			description={t('empty_stock_book_desc')}
		/>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="w-8"></Table.Head>
						<Table.Head class="font-semibold">{t('stock_book_product')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('stock_aggregation_total_available')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('product_reorder_level')}</Table.Head>
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each aggregatedProducts as item}
						{@const isExpanded = expandedProducts.has(item.productId)}
						<Table.Row
							class="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
							onclick={() => toggleExpand(item.productId)}
						>
							<Table.Cell class="w-8 pr-0">
								{#if item.buckets.length > 1}
									{#if isExpanded}
										<ChevronDown class="size-4 text-zinc-400" />
									{:else}
										<ChevronRight class="size-4 text-zinc-400" />
									{/if}
								{/if}
							</Table.Cell>
							<Table.Cell class="font-medium">{item.productTitle}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-2">
									{#if stockIndicator(item.totalAvailable, item.reorderLevel)}
										<span class="inline-block size-2 rounded-full {stockIndicator(item.totalAvailable, item.reorderLevel)}"></span>
									{/if}
									<span class="tabular-nums {stockColorClass(item.totalAvailable, item.reorderLevel)}">
										{formatNumber(item.totalAvailable)}
									</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums text-zinc-500">
								{item.reorderLevel > 0 ? formatNumber(item.reorderLevel) : '—'}
							</Table.Cell>
							<Table.Cell></Table.Cell>
						</Table.Row>

						<!-- Expanded Supplier Buckets -->
						{#if isExpanded && item.buckets.length > 0}
							{#each item.buckets as bucket}
								<Table.Row class="bg-zinc-50/50 dark:bg-zinc-900/20">
									<Table.Cell></Table.Cell>
									<Table.Cell class="pl-8 text-sm text-zinc-500">
										{bucket.partyId === '__UNASSIGNED__' ? t('common_unassigned') : bucket.partyId}
									</Table.Cell>
									<Table.Cell class="text-right tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
										{formatNumber(bucket.available)}
									</Table.Cell>
									<Table.Cell></Table.Cell>
									<Table.Cell></Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
