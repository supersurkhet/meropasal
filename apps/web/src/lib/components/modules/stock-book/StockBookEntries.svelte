<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR, formatNumber } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { ArrowDownToLine, ArrowUpFromLine, Filter, BookOpen } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { formatDate } from '$lib/date-utils';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	let fiscalYearFilter = $state<string | undefined>(undefined);
	let productFilter = $state<string | undefined>(undefined);
	let movementTypeFilter = $state<string | undefined>(undefined);

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const entries = useConvexQuery(client, api.functions.stockBook.listEntries, () => ({
		fiscalYear: fiscalYearFilter,
		productId: productFilter as any,
	}));

	const products = useConvexQuery(client, api.functions.products.list, () => ({}));

	const filteredEntries = $derived.by(() => {
		if (!entries.data) return [];
		let result = [...entries.data];
		if (movementTypeFilter) {
			result = result.filter((e: any) => e.movementType === movementTypeFilter);
		}
		return result.sort((a: any, b: any) => {
			const dateA = new Date(a.entryDate).getTime();
			const dateB = new Date(b.entryDate).getTime();
			return dateB - dateA;
		});
	});

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

	const productMap = $derived(
		new Map((products.data ?? []).map((p: any) => [p._id, p.title])),
	);

	const movementTypes = [
		'opening', 'closing', 'purchase', 'sale', 'order',
		'tripDispatch', 'tripReturn', 'adjustment',
	];

	const movementTypeLabels: Record<string, () => string> = {
		opening: () => t('stock_book_movement_opening'),
		closing: () => t('stock_book_movement_closing'),
		purchase: () => t('stock_book_movement_purchase'),
		sale: () => t('stock_book_movement_sale'),
		order: () => t('stock_book_movement_order'),
		tripDispatch: () => t('stock_book_movement_dispatch'),
		tripReturn: () => t('stock_book_movement_return'),
		adjustment: () => t('stock_book_movement_adjustment'),
	};

	function movementBadgeClass(type: string) {
		switch (type) {
			case 'purchase': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'sale': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'opening': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
			case 'closing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
			case 'tripDispatch': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
			case 'tripReturn': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
			case 'order': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
			case 'adjustment': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
			default: return 'bg-zinc-100 text-zinc-800';
		}
	}

</script>

<div class="space-y-4">
	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<Filter class="size-4 text-zinc-500" />

		<Select.Root type="single" value={productFilter ?? 'all'} onValueChange={(v) => { productFilter = v === 'all' ? undefined : v; }}>
			<Select.Trigger size="sm">
				{productFilter ? (products.data ?? []).find((p: any) => p._id === productFilter)?.title ?? productFilter : t('common_all_products')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_products')}</Select.Item>
				{#each products.data ?? [] as product}
					<Select.Item value={(product as any)._id}>{(product as any).title}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" value={movementTypeFilter ?? 'all'} onValueChange={(v) => { movementTypeFilter = v === 'all' ? undefined : v; }}>
			<Select.Trigger size="sm">
				{movementTypeFilter ? movementTypeLabels[movementTypeFilter]?.() ?? movementTypeFilter : t('common_all_movement_types')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_movement_types')}</Select.Item>
				{#each movementTypes as mt}
					<Select.Item value={mt}>{movementTypeLabels[mt]?.() ?? mt}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" value={fiscalYearFilter ?? 'all'} onValueChange={(v) => { fiscalYearFilter = v === 'all' ? undefined : v; }}>
			<Select.Trigger size="sm">
				{fiscalYearFilter ?? t('common_all_fiscal_years')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_fiscal_years')}</Select.Item>
				{#each fiscalYears as fy}
					<Select.Item value={fy}>{fy}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if entries.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('common_loading')}</p>
			</div>
		</div>
	{:else if !filteredEntries.length}
		<EmptyState
			icon={BookOpen}
			title={t('empty_stock_entries')}
			description={t('empty_stock_entries_desc')}
		/>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">{t('common_date')}</Table.Head>
						<Table.Head class="font-semibold">{t('stock_book_product')}</Table.Head>
						<Table.Head class="font-semibold">{t('stock_book_movement_type')}</Table.Head>
						<Table.Head class="text-center font-semibold">{t('stock_book_direction')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('stock_book_quantity_in')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('stock_book_quantity_out')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('common_rate')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('common_total')}</Table.Head>
						<Table.Head class="font-semibold">{t('stock_book_source')}</Table.Head>
						<Table.Head class="font-semibold">{t('common_particulars')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredEntries as entry}
						{@const e = entry as any}
						<Table.Row class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
							<Table.Cell class="text-sm text-zinc-600 dark:text-zinc-400">
								{formatDate(e.entryDate)}
							</Table.Cell>
							<Table.Cell class="font-medium">
								{productMap.get(e.productId) ?? e.productId}
							</Table.Cell>
							<Table.Cell>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {movementBadgeClass(e.movementType)}">
									{e.movementType}
								</span>
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if e.direction === 'in'}
									<span class="inline-flex items-center gap-1 text-emerald-600">
										<ArrowDownToLine class="size-3.5" />
										<span class="text-xs font-medium">{t('stock_book_direction_in')}</span>
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 text-red-500">
										<ArrowUpFromLine class="size-3.5" />
										<span class="text-xs font-medium">{t('stock_book_direction_out')}</span>
									</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums {e.quantityIn > 0 ? 'text-emerald-600 font-medium' : 'text-zinc-300 dark:text-zinc-700'}">
								{e.quantityIn > 0 ? formatNumber(e.quantityIn) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums {e.quantityOut > 0 ? 'text-red-500 font-medium' : 'text-zinc-300 dark:text-zinc-700'}">
								{e.quantityOut > 0 ? formatNumber(e.quantityOut) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums">
								{formatNPR(e.unitRate)}
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums font-medium">
								{formatNPR(e.totalAmount)}
							</Table.Cell>
							<Table.Cell class="text-xs text-zinc-500">{e.sourceTable}</Table.Cell>
							<Table.Cell class="max-w-[200px] truncate text-xs text-zinc-500">
								{e.particulars}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
