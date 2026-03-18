<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR, formatNumber } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import {
		TrendingUp,
		Calendar,
		Download,
		ArrowLeft,
	} from '@lucide/svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	// Date range state
	let startDate = $state(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
	);
	let endDate = $state(new Date().toISOString().split('T')[0]);

	const salesData = useConvexQuery(client, api.functions.reports.salesByPeriod, () => ({
		startDate,
		endDate,
	}));

	const topProducts = useConvexQuery(client, api.functions.reports.topProducts, () => ({
		limit: 20,
		...(currentFY.data ? { fiscalYear: currentFY.data } : {}),
	}));

	// Daily breakdown from sales invoices
	const dailyBreakdown = $derived.by(() => {
		if (!salesData.data?.invoices) return [];
		const byDay: Record<string, { count: number; amount: number }> = {};
		for (const inv of salesData.data.invoices) {
			const day = inv.issuedAt.split('T')[0];
			if (!byDay[day]) byDay[day] = { count: 0, amount: 0 };
			byDay[day].count++;
			byDay[day].amount += inv.totalAmount;
		}
		return Object.entries(byDay)
			.map(([date, data]) => ({ date, ...data }))
			.sort((a, b) => b.date.localeCompare(a.date));
	});

	const maxDayAmount = $derived(Math.max(...dailyBreakdown.map((d) => d.amount), 1));

	function shortDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function setRange(days: number) {
		endDate = new Date().toISOString().split('T')[0];
		startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
	}
</script>

<MetaTags title="Sales Report — MeroPasal" />

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
				class="flex size-10 items-center justify-center rounded-xl bg-emerald-100 shadow-sm dark:bg-emerald-900/30"
			>
				<TrendingUp class="size-5 text-emerald-600 dark:text-emerald-400" />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					Sales Report
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					Sales performance and top products
				</p>
			</div>
		</div>
	</div>

	<!-- Date Range Controls -->
	<div
		class="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
	>
		<Calendar class="size-4 text-zinc-500" />
		<div class="flex items-center gap-2">
			<input
				type="date"
				bind:value={startDate}
				class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
			/>
			<span class="text-sm text-zinc-400">to</span>
			<input
				type="date"
				bind:value={endDate}
				class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
			/>
		</div>
		<div class="flex gap-1.5">
			<button
				onclick={() => setRange(7)}
				class="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				7d
			</button>
			<button
				onclick={() => setRange(30)}
				class="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				30d
			</button>
			<button
				onclick={() => setRange(90)}
				class="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				90d
			</button>
		</div>
		<div class="ml-auto">
			<button
				class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
				disabled
				title="Export coming soon"
			>
				<Download class="size-3.5" />
				Export
			</button>
		</div>
	</div>

	{#if salesData.isLoading}
		<div class="flex items-center justify-center py-16 text-zinc-500">
			<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
			></div>
			<span class="ml-2 text-sm">Loading sales data...</span>
		</div>
	{:else if salesData.data}
		<!-- Summary Cards -->
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Total Sales</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
					{formatNPR(salesData.data.totalAmount, true)}
				</p>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Collected</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
					{formatNPR(salesData.data.totalPaid, true)}
				</p>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Outstanding</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
					{formatNPR(salesData.data.totalOutstanding, true)}
				</p>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Invoices</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
					{salesData.data.count}
				</p>
			</div>
		</div>

		<!-- Daily Breakdown -->
		{#if dailyBreakdown.length > 0}
			<div class="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 class="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					Sales by Day
				</h2>
				<div class="space-y-2">
					{#each dailyBreakdown as day}
						{@const pct = (day.amount / maxDayAmount) * 100}
						<div class="flex items-center gap-3">
							<span class="w-28 shrink-0 text-xs text-zinc-500">{shortDate(day.date)}</span>
							<div class="flex-1">
								<div class="h-5 w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
									<div
										class="flex h-full items-center rounded bg-emerald-500 px-2 text-[10px] font-medium text-white dark:bg-emerald-600"
										style="width: {Math.max(pct, 3)}%"
									>
										{#if pct > 15}
											{formatNPR(day.amount, true)}
										{/if}
									</div>
								</div>
							</div>
							<span class="w-16 shrink-0 text-right text-xs tabular-nums text-zinc-500">
								{day.count} inv.
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Top Products Table -->
	{#if topProducts.data?.length}
		<div class="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
			<div class="border-b border-zinc-200 p-4 dark:border-zinc-800">
				<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					Top Selling Products
					{#if currentFY.data}
						<span class="font-normal text-zinc-400">— FY {currentFY.data}</span>
					{/if}
				</h2>
			</div>
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="w-10 font-semibold">#</Table.Head>
							<Table.Head class="font-semibold">Product</Table.Head>
							<Table.Head class="text-right font-semibold">Qty Sold</Table.Head>
							<Table.Head class="text-right font-semibold">Revenue</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each topProducts.data as product, i}
							<Table.Row>
								<Table.Cell class="text-zinc-400">{i + 1}</Table.Cell>
								<Table.Cell class="font-medium text-zinc-900 dark:text-zinc-100">
									{product.productTitle}
								</Table.Cell>
								<Table.Cell class="text-right tabular-nums text-zinc-600 dark:text-zinc-400">
									{formatNumber(product.totalQty)}
								</Table.Cell>
								<Table.Cell class="text-right font-medium tabular-nums">
									{formatNPR(product.totalAmount)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/if}
</div>
