<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { t } from '$lib/t';
	import {
		LayoutDashboard,
		TrendingUp,
		TrendingDown,
		AlertTriangle,
		Package,
		ArrowUpRight,
		ArrowDownRight,
		Receipt,
		DollarSign,
		ShoppingCart,
		BarChart3,
	} from '@lucide/svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const dashboardData = useConvexQuery(
		client,
		api.functions.reports.dashboard,
		() => (currentFY.data ? { fiscalYear: currentFY.data } : {}),
	);

	const topProducts = useConvexQuery(client, api.functions.reports.topProducts, () => ({
		limit: 5,
		...(currentFY.data ? { fiscalYear: currentFY.data } : {}),
	}));

	// Get last 30 days sales
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
	const today = new Date().toISOString().split('T')[0];

	const recentSales = useConvexQuery(client, api.functions.reports.salesByPeriod, () => ({
		startDate: thirtyDaysAgo,
		endDate: today,
	}));

	// Aggregate daily sales for the bar chart
	const dailySales = $derived.by(() => {
		if (!recentSales.data?.invoices) return [];
		const byDay: Record<string, number> = {};
		for (const inv of recentSales.data.invoices) {
			const day = inv.issuedAt.split('T')[0];
			byDay[day] = (byDay[day] ?? 0) + inv.totalAmount;
		}
		const days = Object.entries(byDay)
			.map(([date, amount]) => ({ date, amount }))
			.sort((a, b) => a.date.localeCompare(b.date));
		return days.slice(-14); // last 14 days with data
	});

	const maxDailySale = $derived(Math.max(...dailySales.map((d) => d.amount), 1));

	function shortDate(iso: string) {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const d = $derived(dashboardData.data);
	const netIncomePositive = $derived((d?.netIncome ?? 0) >= 0);
</script>

<MetaTags title="{t('dashboard_title')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3">
			<div
				class="flex size-11 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100"
			>
				<LayoutDashboard class="size-5 text-white dark:text-zinc-900" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
					{t('dashboard_title')}
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					{#if currentFY.data}
						{t('fiscal_year')} {currentFY.data} &middot;
					{/if}
					{t('dashboard_subtitle')}
				</p>
			</div>
		</div>
	</div>

	{#if dashboardData.isLoading}
		<div class="flex items-center justify-center py-24 text-zinc-500">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
			></div>
			<span class="ml-3 text-sm">{t('dashboard_loading')}</span>
		</div>
	{:else if d}
		<!-- KPI Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Revenue -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30"
					>
						<TrendingUp class="size-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<span
						class="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
					>
						{d.totalSaleInvoices} sales
						<ArrowUpRight class="size-3" />
					</span>
				</div>
				<p class="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
					{formatNPR(d.totalRevenue, true)}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_total_revenue')}</p>
			</div>

			<!-- Expenses -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30"
					>
						<TrendingDown class="size-4 text-red-600 dark:text-red-400" />
					</div>
					<span
						class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
					>
						{d.totalPurchaseInvoices} purchases
						<ArrowDownRight class="size-3" />
					</span>
				</div>
				<p class="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
					{formatNPR(d.totalExpenses, true)}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_total_expenses')}</p>
			</div>

			<!-- Net Income -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg {netIncomePositive
							? 'bg-emerald-100 dark:bg-emerald-900/30'
							: 'bg-red-100 dark:bg-red-900/30'}"
					>
						<DollarSign
							class="size-4 {netIncomePositive
								? 'text-emerald-600 dark:text-emerald-400'
								: 'text-red-600 dark:text-red-400'}"
						/>
					</div>
					<span
						class="text-xs font-medium {netIncomePositive
							? 'text-emerald-600 dark:text-emerald-400'
							: 'text-red-600 dark:text-red-400'}"
					>
						{netIncomePositive ? t('dashboard_profit') : t('dashboard_loss')}
					</span>
				</div>
				<p
					class="text-2xl font-bold tabular-nums {netIncomePositive
						? 'text-emerald-700 dark:text-emerald-400'
						: 'text-red-700 dark:text-red-400'}"
				>
					{formatNPR(Math.abs(d.netIncome), true)}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_net_income')}</p>
			</div>

			<!-- Low Stock -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg {d.lowStockCount > 0
							? 'bg-amber-100 dark:bg-amber-900/30'
							: 'bg-zinc-100 dark:bg-zinc-800'}"
					>
						{#if d.lowStockCount > 0}
							<AlertTriangle class="size-4 text-amber-600 dark:text-amber-400" />
						{:else}
							<Package class="size-4 text-zinc-500 dark:text-zinc-400" />
						{/if}
					</div>
					{#if d.lowStockCount > 0}
						<a
							href="/reports/inventory"
							class="text-xs font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
						>
							{t('dashboard_view_details')}
						</a>
					{/if}
				</div>
				<p
					class="text-2xl font-bold tabular-nums {d.lowStockCount > 0
						? 'text-amber-700 dark:text-amber-400'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{d.lowStockCount}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_low_stock')}</p>
			</div>
		</div>

		<!-- Outstanding Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Receivables -->
			<div
				class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
				>
					<Receipt class="size-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('dashboard_outstanding_receivables')}</p>
					<p class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
						{formatNPR(d.outstandingReceivables)}
					</p>
				</div>
				<a
					href="/reports/financial"
					class="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
					>{t('dashboard_details')}</a
				>
			</div>

			<!-- Payables -->
			<div
				class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30"
				>
					<ShoppingCart class="size-5 text-violet-600 dark:text-violet-400" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('dashboard_outstanding_payables')}</p>
					<p class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
						{formatNPR(d.outstandingPayables)}
					</p>
				</div>
				<a
					href="/reports/financial"
					class="text-xs text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
					>{t('dashboard_details')}</a
				>
			</div>
		</div>

		<!-- Charts + Top Products Row -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
			<!-- Sales Chart (3 cols) -->
			<div
				class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3"
			>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<BarChart3 class="size-4 text-zinc-500" />
						<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{t('dashboard_sales_chart')}
						</h2>
					</div>
					{#if recentSales.data}
						<span class="text-xs text-zinc-500">
							{recentSales.data.count} invoices &middot; {formatNPR(recentSales.data.totalAmount, true)}
						</span>
					{/if}
				</div>

				{#if dailySales.length === 0}
					<div class="flex h-48 items-center justify-center text-sm text-zinc-400">
						{t('dashboard_no_sales_period')}
					</div>
				{:else}
					<!-- CSS Bar Chart -->
					<div class="flex h-48 items-end gap-1.5">
						{#each dailySales as day}
							{@const pct = (day.amount / maxDailySale) * 100}
							<div class="group relative flex flex-1 flex-col items-center justify-end">
								<div
									class="w-full min-w-[6px] rounded-t-sm bg-emerald-500 transition-colors group-hover:bg-emerald-400 dark:bg-emerald-600 dark:group-hover:bg-emerald-500"
									style="height: {Math.max(pct, 2)}%"
								></div>
								<!-- Tooltip -->
								<div
									class="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 rounded-md bg-zinc-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block dark:bg-zinc-700"
								>
									<div class="font-medium">{formatNPR(day.amount, true)}</div>
									<div class="text-zinc-400">{shortDate(day.date)}</div>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-2 flex justify-between text-[10px] text-zinc-400">
						<span>{shortDate(dailySales[0].date)}</span>
						<span>{shortDate(dailySales[dailySales.length - 1].date)}</span>
					</div>
				{/if}
			</div>

			<!-- Top Products (2 cols) -->
			<div
				class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						{t('dashboard_top_products')}
					</h2>
					<a
						href="/reports/sales"
						class="text-xs text-zinc-500 underline-offset-2 hover:underline"
					>
						{t('dashboard_view_all')}
					</a>
				</div>

				{#if topProducts.isLoading}
					<div class="flex h-48 items-center justify-center text-sm text-zinc-400">
						{t('common_loading')}
					</div>
				{:else if !topProducts.data?.length}
					<div class="flex h-48 items-center justify-center text-sm text-zinc-400">
						{t('dashboard_no_sales_yet')}
					</div>
				{:else}
					<div class="space-y-3">
						{#each topProducts.data as product, i}
							{@const maxAmount = topProducts.data[0].totalAmount}
							{@const pct = maxAmount > 0 ? (product.totalAmount / maxAmount) * 100 : 0}
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="flex items-center gap-2 truncate text-zinc-700 dark:text-zinc-300">
										<span
											class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold {i === 0
												? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
												: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}"
										>
											{i + 1}
										</span>
										<span class="truncate">{product.productTitle}</span>
									</span>
									<span class="ml-2 shrink-0 tabular-nums text-zinc-500">
										{formatNPR(product.totalAmount, true)}
									</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
									<div
										class="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-600"
										style="width: {pct}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick Links -->
		<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<a
				href="/reports/sales"
				class="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
			>
				{t('report_sales')}
			</a>
			<a
				href="/reports/inventory"
				class="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
			>
				{t('report_inventory')}
			</a>
			<a
				href="/reports/financial"
				class="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
			>
				{t('report_financial')}
			</a>
			<a
				href="/sales/new"
				class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
			>
				{t('dashboard_new_sale')}
			</a>
		</div>
	{/if}
</div>
