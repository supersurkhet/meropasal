<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import { getConvexClient } from '$lib/convex'
	import { useConvexQuery } from '$lib/convex-helpers.svelte'
	import { api } from '$lib/api'
	import { formatNPR, formatCount } from '$lib/currency'
	import { formatDate } from '$lib/date-utils'
	import * as Table from '$lib/components/ui/table'
	import * as Popover from '$lib/components/ui/popover'
	import * as Select from '$lib/components/ui/select'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
	import { t } from '$lib/t.svelte'
	import { Button } from '$lib/components/ui/button'
	import {
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
		Plus,
		PackageOpen,
		ClipboardList,
		Info,
		Download,
		Printer,
		Users,
		Building2,
		CreditCard,
		PackageCheck,
	} from '@lucide/svelte'
	import { Skeleton } from '$lib/components/ui/skeleton'

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)

	let period = $state('fy')

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}))

	const dashboardData = useConvexQuery(
		client,
		api.functions.reports.dashboard,
		() => (currentFY.data ? { fiscalYear: currentFY.data } : {}),
	)

	const breakdowns = useConvexQuery(
		client,
		api.functions.reports.dashboardBreakdowns,
		() => {
			const args: Record<string, string> = {}
			if (period === 'fy' && currentFY.data) {
				args.fiscalYear = currentFY.data
			} else if (period !== 'fy') {
				args.period = period
			}
			return args
		},
	)

	const topProducts = useConvexQuery(client, api.functions.reports.topProducts, () => ({
		limit: 5,
		...(currentFY.data ? { fiscalYear: currentFY.data } : {}),
	}))

	// Get last 30 days sales
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
	const today = new Date().toISOString().split('T')[0]

	const recentSales = useConvexQuery(client, api.functions.reports.salesByPeriod, () => ({
		startDate: thirtyDaysAgo,
		endDate: today,
	}))

	// Aggregate daily sales for the bar chart
	const dailySales = $derived.by(() => {
		if (!recentSales.data?.invoices) return []
		const byDay: Record<string, number> = {}
		for (const inv of recentSales.data.invoices) {
			const day = inv.issuedAt.split('T')[0]
			byDay[day] = (byDay[day] ?? 0) + inv.totalAmount
		}
		const days = Object.entries(byDay)
			.map(([date, amount]) => ({ date, amount }))
			.sort((a, b) => a.date.localeCompare(b.date))
		return days.slice(-14)
	})

	const maxDailySale = $derived(Math.max(...dailySales.map((d) => d.amount), 1))

	function shortDate(iso: string) {
		return formatDate(iso, 'short')
	}

	const d = $derived(dashboardData.data)
	const b = $derived(breakdowns.data)
	const isLoading = $derived(dashboardData.isLoading)
	const netIncomePositive = $derived((d?.netIncome ?? 0) >= 0)

	// Payment method label
	function methodLabel(method: string): string {
		const labels: Record<string, string> = {
			cash: t('payment_method_cash'),
			card: t('payment_method_card'),
			bankTransfer: t('payment_method_bank_transfer'),
			credit: t('payment_method_credit'),
			online: t('payment_method_online'),
			check: t('payment_method_check'),
		}
		return labels[method] ?? method
	}

	// Payment method colors
	function methodColor(method: string): string {
		const colors: Record<string, string> = {
			cash: 'bg-emerald-500 dark:bg-emerald-600',
			card: 'bg-blue-500 dark:bg-blue-600',
			bankTransfer: 'bg-violet-500 dark:bg-violet-600',
			credit: 'bg-amber-500 dark:bg-amber-600',
			online: 'bg-cyan-500 dark:bg-cyan-600',
			check: 'bg-rose-500 dark:bg-rose-600',
		}
		return colors[method] ?? 'bg-zinc-500'
	}

	// Export functions
	function exportCSV() {
		if (!d || !b) return
		const rows = [
			['Metric', 'Value'],
			['Total Revenue', String(d.totalRevenue)],
			['Total Expenses', String(d.totalExpenses)],
			['Net Income', String(d.netIncome)],
			['Outstanding Receivables', String(d.outstandingReceivables)],
			['Outstanding Payables', String(d.outstandingPayables)],
			['Low Stock Items', String(d.lowStockCount)],
			[''],
			['Top Customers', ''],
			['Name', 'Total Spent', 'Purchases'],
			...b.topCustomers.map((c: any) => [c.name, String(c.totalSpent), String(c.purchaseCount)]),
			[''],
			['Top Suppliers', ''],
			['Name', 'Total Amount'],
			...b.topSuppliers.map((s: any) => [s.name, String(s.totalAmount)]),
		]
		const csv = rows.map((r) => r.join(',')).join('\n')
		downloadFile(csv, 'dashboard-report.csv', 'text/csv')
	}

	function exportJSON() {
		if (!d || !b) return
		const data = { dashboard: d, breakdowns: b }
		downloadFile(JSON.stringify(data, null, 2), 'dashboard-report.json', 'application/json')
	}

	function downloadFile(content: string, filename: string, type: string) {
		const blob = new Blob([content], { type })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.click()
		URL.revokeObjectURL(url)
	}

	function printReport() {
		window.print()
	}

	// Inventory chart max
	const inventoryMax = $derived.by(() => {
		if (!b) return 1
		return Math.max(b.inventoryStatus.inStock + b.inventoryStatus.lowStock + b.inventoryStatus.outOfStock, 1)
	})
</script>

<MetaTags title="{t('dashboard_title')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
		<!-- Header with Period Selector + Export -->
		<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap gap-3">
				<a href="/sales/new">
					<Button
						size="sm"
						class="gap-2 bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
					>
						{t('dashboard_new_sale')}
					</Button>
				</a>
				<a href="/stock-import/new">
					<Button
						size="sm"
						variant="outline"
						class="gap-2 border-zinc-300 shadow-sm dark:border-zinc-700"
					>
						<PackageOpen class="size-4" />
						{t('stock_import_create')}
					</Button>
				</a>
				<a href="/orders/new">
					<Button
						size="sm"
						variant="outline"
						class="gap-2 border-zinc-300 shadow-sm dark:border-zinc-700"
					>
						<ClipboardList class="size-4" />
						{t('order_create')}
					</Button>
				</a>
			</div>

			<div class="flex items-center gap-2">
				<!-- Period Selector -->
				<Select.Root type="single" bind:value={period}>
					<Select.Trigger class="h-9 w-36 text-sm border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
						{period === 'all' ? t('dashboard_period_all') : period === 'month' ? t('dashboard_period_month') : period === 'quarter' ? t('dashboard_period_quarter') : period === 'year' ? t('dashboard_period_year') : t('dashboard_period_fy')}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="fy">{t('dashboard_period_fy')}</Select.Item>
						<Select.Item value="all">{t('dashboard_period_all')}</Select.Item>
						<Select.Item value="month">{t('dashboard_period_month')}</Select.Item>
						<Select.Item value="quarter">{t('dashboard_period_quarter')}</Select.Item>
						<Select.Item value="year">{t('dashboard_period_year')}</Select.Item>
					</Select.Content>
				</Select.Root>

				<!-- Export Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="sm"
								class="h-9 border-zinc-200 shadow-sm dark:border-zinc-700"
							>
								<Download class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={exportCSV}>
							<Download class="mr-2 size-4" />
							{t('dashboard_export_csv')}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={exportJSON}>
							<Download class="mr-2 size-4" />
							{t('dashboard_export_json')}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={printReport}>
							<Printer class="mr-2 size-4" />
							{t('dashboard_print')}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		<!-- KPI Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Revenue -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30"
					>
						<TrendingUp class="size-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div class="flex items-center gap-2">
						{#if isLoading}
							<Skeleton class="h-4 w-16" />
						{:else if d}
							<span
								class="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
							>
								{formatCount(d.totalSaleInvoices)} {t('sale_title_plural').toLowerCase()}
								<ArrowUpRight class="size-3" />
							</span>
							<!-- Revenue Breakdown Popover -->
							{#if b?.revenueBreakdown?.length}
								<Popover.Root>
									<Popover.Trigger>
										<button class="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
											<Info class="size-3.5" />
										</button>
									</Popover.Trigger>
									<Popover.Content class="w-80 max-h-64 overflow-y-auto" align="end">
										<p class="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('dashboard_revenue_breakdown')}</p>
										<div class="space-y-2">
											{#each b.revenueBreakdown.slice(0, 10) as r}
												<div class="flex items-center justify-between text-xs">
													<span class="truncate text-zinc-600 dark:text-zinc-400">{r.customer}</span>
													<div class="flex gap-3 shrink-0">
														<span class="font-medium text-emerald-600">{formatNPR(r.total, true)}</span>
														{#if r.due > 0}
															<span class="text-amber-600">{t('dashboard_due')}: {formatNPR(r.due, true)}</span>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</Popover.Content>
								</Popover.Root>
							{/if}
						{/if}
					</div>
				</div>
				{#if isLoading}
					<Skeleton class="h-8 w-32" />
				{:else if d}
					<p class="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
						{formatNPR(d.totalRevenue, true)}
					</p>
				{/if}
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_total_revenue')}</p>
			</div>

			<!-- Expenses -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30"
					>
						<TrendingDown class="size-4 text-red-600 dark:text-red-400" />
					</div>
					<div class="flex items-center gap-2">
						{#if isLoading}
							<Skeleton class="h-4 w-16" />
						{:else if d}
							<span
								class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
							>
								{formatCount(d.totalPurchaseInvoices)} {t('invoice_type_purchase').toLowerCase()}
								<ArrowDownRight class="size-3" />
							</span>
							<!-- Cost Breakdown Popover -->
							{#if b?.costBreakdown?.length}
								<Popover.Root>
									<Popover.Trigger>
										<button class="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
											<Info class="size-3.5" />
										</button>
									</Popover.Trigger>
									<Popover.Content class="w-80 max-h-64 overflow-y-auto" align="end">
										<p class="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('dashboard_cost_breakdown')}</p>
										<div class="space-y-2">
											{#each b.costBreakdown.slice(0, 10) as c}
												<div class="flex items-center justify-between text-xs">
													<span class="truncate text-zinc-600 dark:text-zinc-400">{c.supplier}</span>
													<div class="flex gap-3 shrink-0">
														<span class="font-medium text-red-600">{formatNPR(c.total, true)}</span>
														{#if c.due > 0}
															<span class="text-amber-600">{t('dashboard_due')}: {formatNPR(c.due, true)}</span>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</Popover.Content>
								</Popover.Root>
							{/if}
						{/if}
					</div>
				</div>
				{#if isLoading}
					<Skeleton class="h-8 w-32" />
				{:else if d}
					<p class="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
						{formatNPR(d.totalExpenses, true)}
					</p>
				{/if}
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_total_expenses')}</p>
			</div>

			<!-- Net Income -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="absolute inset-x-0 top-0 h-1 {isLoading ? 'bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600' : netIncomePositive ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-red-400 to-red-600'}"></div>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg {isLoading
							? 'bg-zinc-100 dark:bg-zinc-800'
							: netIncomePositive
								? 'bg-emerald-100 dark:bg-emerald-900/30'
								: 'bg-red-100 dark:bg-red-900/30'}"
					>
						<DollarSign
							class="size-4 {isLoading
								? 'text-zinc-400'
								: netIncomePositive
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-red-600 dark:text-red-400'}"
						/>
					</div>
					<div class="flex items-center gap-2">
						{#if isLoading}
							<Skeleton class="h-4 w-12" />
						{:else if d}
							<span
								class="text-xs font-medium {netIncomePositive
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-red-600 dark:text-red-400'}"
							>
								{netIncomePositive ? t('dashboard_profit') : t('dashboard_loss')}
							</span>
							<!-- Net Profit Breakdown Popover -->
							<Popover.Root>
								<Popover.Trigger>
									<button class="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
										<Info class="size-3.5" />
									</button>
								</Popover.Trigger>
								<Popover.Content class="w-64" align="end">
									<p class="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('dashboard_net_profit')}</p>
									<div class="space-y-1.5 text-xs">
										<div class="flex justify-between">
											<span class="text-zinc-500">{t('dashboard_total_revenue')}</span>
											<span class="font-medium text-emerald-600">{formatNPR(d.totalRevenue, true)}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-zinc-500">{t('dashboard_total_expenses')}</span>
											<span class="font-medium text-red-600">- {formatNPR(d.totalExpenses, true)}</span>
										</div>
										<div class="border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
											<div class="flex justify-between font-semibold">
												<span class="text-zinc-700 dark:text-zinc-300">{t('dashboard_net_income')}</span>
												<span class="{netIncomePositive ? 'text-emerald-600' : 'text-red-600'}">{formatNPR(d.netIncome, true)}</span>
											</div>
										</div>
									</div>
								</Popover.Content>
							</Popover.Root>
						{/if}
					</div>
				</div>
				{#if isLoading}
					<Skeleton class="h-8 w-32" />
				{:else if d}
					<p
						class="text-2xl font-bold tabular-nums {netIncomePositive
							? 'text-emerald-700 dark:text-emerald-400'
							: 'text-red-700 dark:text-red-400'}"
					>
						{formatNPR(Math.abs(d.netIncome), true)}
					</p>
				{/if}
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('dashboard_net_income')}</p>
			</div>

			<!-- Low Stock -->
			<div
				class="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
			>
				<div class="absolute inset-x-0 top-0 h-1 {isLoading ? 'bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600' : (d?.lowStockCount ?? 0) > 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600'}"></div>
				<div class="mb-3 flex items-center justify-between">
					<div
						class="flex size-9 items-center justify-center rounded-lg {!isLoading && (d?.lowStockCount ?? 0) > 0
							? 'bg-amber-100 dark:bg-amber-900/30'
							: 'bg-zinc-100 dark:bg-zinc-800'}"
					>
						{#if !isLoading && (d?.lowStockCount ?? 0) > 0}
							<AlertTriangle class="size-4 text-amber-600 dark:text-amber-400" />
						{:else}
							<Package class="size-4 text-zinc-500 dark:text-zinc-400" />
						{/if}
					</div>
					{#if !isLoading && d && d.lowStockCount > 0}
						<a
							href="/reports/inventory"
							class="text-xs font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
						>
							{t('dashboard_view_details')}
						</a>
					{/if}
				</div>
				{#if isLoading}
					<Skeleton class="h-8 w-16" />
				{:else if d}
					<p
						class="text-2xl font-bold tabular-nums {d.lowStockCount > 0
							? 'text-amber-700 dark:text-amber-400'
							: 'text-zinc-900 dark:text-zinc-100'}"
					>
						{formatCount(d.lowStockCount)}
					</p>
				{/if}
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
					{#if isLoading}
						<Skeleton class="h-6 w-28" />
					{:else if d}
						<p class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
							{formatNPR(d.outstandingReceivables)}
						</p>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if b?.receivablesBreakdown?.length}
						<Popover.Root>
							<Popover.Trigger>
								<button class="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
									<Info class="size-4" />
								</button>
							</Popover.Trigger>
							<Popover.Content class="w-96 max-h-72 overflow-y-auto" align="end">
								<p class="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('dashboard_receivables_breakdown')}</p>
								<div class="space-y-2">
									{#each b.receivablesBreakdown as r}
										<div class="flex items-center justify-between text-xs">
											<div class="min-w-0">
												<span class="block truncate font-medium text-zinc-700 dark:text-zinc-300">{r.customer}</span>
												<span class="text-zinc-400">{r.invoiceNumber} &middot; {formatDate(r.date, 'short')}</span>
											</div>
											<div class="flex gap-3 shrink-0 text-right">
												<span class="text-zinc-500">{formatNPR(r.total, true)}</span>
												<span class="font-medium text-amber-600">{formatNPR(r.due, true)}</span>
											</div>
										</div>
									{/each}
								</div>
							</Popover.Content>
						</Popover.Root>
					{/if}
					<a
						href="/reports/financial"
						class="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
						>{t('dashboard_details')}</a
					>
				</div>
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
					{#if isLoading}
						<Skeleton class="h-6 w-28" />
					{:else if d}
						<p class="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
							{formatNPR(d.outstandingPayables)}
						</p>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if b?.payablesBreakdown?.length}
						<Popover.Root>
							<Popover.Trigger>
								<button class="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
									<Info class="size-4" />
								</button>
							</Popover.Trigger>
							<Popover.Content class="w-96 max-h-72 overflow-y-auto" align="end">
								<p class="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('dashboard_payables_breakdown')}</p>
								<div class="space-y-2">
									{#each b.payablesBreakdown as p}
										<div class="flex items-center justify-between text-xs">
											<div class="min-w-0">
												<span class="block truncate font-medium text-zinc-700 dark:text-zinc-300">{p.supplier}</span>
												<span class="text-zinc-400">{p.invoiceNumber} &middot; {formatDate(p.date, 'short')}</span>
											</div>
											<div class="flex gap-3 shrink-0 text-right">
												<span class="text-zinc-500">{formatNPR(p.total, true)}</span>
												<span class="font-medium text-amber-600">{formatNPR(p.due, true)}</span>
											</div>
										</div>
									{/each}
								</div>
							</Popover.Content>
						</Popover.Root>
					{/if}
					<a
						href="/reports/financial"
						class="text-xs text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
						>{t('dashboard_details')}</a
					>
				</div>
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
					{#if !recentSales.isLoading && recentSales.data}
						<span class="text-xs text-zinc-500">
							{formatCount(recentSales.data.count)} {t('invoice_title_plural').toLowerCase()} &middot; {formatNPR(recentSales.data.totalAmount, true)}
						</span>
					{/if}
				</div>

				{#if isLoading || recentSales.isLoading}
					<div class="flex h-48 items-end gap-1.5">
						{#each Array(14) as _, i}
							{@const h = [30, 50, 40, 65, 45, 70, 55, 35, 60, 80, 50, 40, 55, 45][i]}
							<div class="flex flex-1 flex-col items-center justify-end">
								<Skeleton class="w-full min-w-[6px] rounded-t-sm" style="height: {h}%" />
							</div>
						{/each}
					</div>
					<div class="mt-2 flex justify-between text-[10px] text-zinc-400">
						<Skeleton class="h-3 w-14" />
						<Skeleton class="h-3 w-14" />
					</div>
				{:else if dailySales.length === 0}
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

				{#if isLoading || topProducts.isLoading}
					<div class="space-y-3">
						{#each Array(5) as _, i}
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="flex items-center gap-2">
										<span class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{i + 1}</span>
										<Skeleton class="h-4 w-28" />
									</span>
									<Skeleton class="h-4 w-20" />
								</div>
								<Skeleton class="h-1.5 w-full rounded-full" />
							</div>
						{/each}
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

		<!-- New Row: Top Customers + Top Suppliers + Payment Methods + Inventory Status -->
		<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<!-- Top Customers -->
			<div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<div class="mb-4 flex items-center gap-2">
					<Users class="size-4 text-blue-500" />
					<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('dashboard_top_customers')}</h2>
				</div>
				{#if isLoading || breakdowns.isLoading}
					<div class="space-y-3">
						{#each Array(5) as _, i}
							<div class="flex items-center justify-between text-sm">
								<span class="flex items-center gap-2">
									<span class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">{i + 1}</span>
									<Skeleton class="h-4 w-24" />
								</span>
								<div class="ml-2 shrink-0 text-right">
									<Skeleton class="h-3 w-16" />
									<Skeleton class="mt-1 h-2.5 w-12" />
								</div>
							</div>
						{/each}
					</div>
				{:else if !b || b.topCustomers.length === 0}
					<p class="text-xs text-zinc-400">{t('dashboard_no_data')}</p>
				{:else}
					<div class="space-y-3">
						{#each b.topCustomers.slice(0, 5) as customer, i}
							<div class="flex items-center justify-between text-sm">
								<span class="flex items-center gap-2 truncate text-zinc-700 dark:text-zinc-300">
									<span class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">{i + 1}</span>
									<span class="truncate">{customer.name}</span>
								</span>
								<div class="ml-2 shrink-0 text-right">
									<span class="block tabular-nums text-xs font-medium text-zinc-900 dark:text-zinc-100">{formatNPR(customer.totalSpent, true)}</span>
									<span class="text-[10px] text-zinc-400">{formatCount(customer.purchaseCount)} {t('dashboard_purchases').toLowerCase()}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Top Suppliers -->
			<div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<div class="mb-4 flex items-center gap-2">
					<Building2 class="size-4 text-violet-500" />
					<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('dashboard_top_suppliers')}</h2>
				</div>
				{#if isLoading || breakdowns.isLoading}
					<div class="space-y-3">
						{#each Array(5) as _, i}
							<div class="flex items-center justify-between text-sm">
								<span class="flex items-center gap-2">
									<span class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">{i + 1}</span>
									<Skeleton class="h-4 w-24" />
								</span>
								<Skeleton class="ml-2 h-3 w-20" />
							</div>
						{/each}
					</div>
				{:else if !b || b.topSuppliers.length === 0}
					<p class="text-xs text-zinc-400">{t('dashboard_no_data')}</p>
				{:else}
					<div class="space-y-3">
						{#each b.topSuppliers.slice(0, 5) as supplier, i}
							<div class="flex items-center justify-between text-sm">
								<span class="flex items-center gap-2 truncate text-zinc-700 dark:text-zinc-300">
									<span class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">{i + 1}</span>
									<span class="truncate">{supplier.name}</span>
								</span>
								<span class="ml-2 shrink-0 tabular-nums text-xs font-medium text-zinc-900 dark:text-zinc-100">{formatNPR(supplier.totalAmount, true)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Payment Methods -->
			<div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<div class="mb-4 flex items-center gap-2">
					<CreditCard class="size-4 text-cyan-500" />
					<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('dashboard_payment_methods')}</h2>
				</div>
				{#if isLoading || breakdowns.isLoading}
					<div class="space-y-3">
						{#each Array(3) as _}
							<div>
								<div class="mb-1 flex items-center justify-between text-xs">
									<Skeleton class="h-3 w-16" />
									<Skeleton class="h-3 w-20" />
								</div>
								<Skeleton class="h-1.5 w-full rounded-full" />
							</div>
						{/each}
					</div>
				{:else if !b || b.paymentMethods.length === 0}
					<p class="text-xs text-zinc-400">{t('dashboard_no_data')}</p>
				{:else}
					{@const maxMethod = Math.max(...b.paymentMethods.map((m: any) => m.amount), 1)}
					<div class="space-y-3">
						{#each b.paymentMethods as pm}
							{@const pct = (pm.amount / maxMethod) * 100}
							<div>
								<div class="mb-1 flex items-center justify-between text-xs">
									<span class="text-zinc-600 dark:text-zinc-400">{methodLabel(pm.method)}</span>
									<span class="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{formatNPR(pm.amount, true)}</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
									<div
										class="h-full rounded-full {methodColor(pm.method)} transition-all"
										style="width: {pct}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Inventory Status -->
			<div class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<div class="mb-4 flex items-center gap-2">
					<PackageCheck class="size-4 text-amber-500" />
					<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('dashboard_inventory_status')}</h2>
				</div>
				{#if isLoading || breakdowns.isLoading}
					<div class="space-y-3">
						{#each ['bg-emerald-500', 'bg-amber-500', 'bg-red-500'] as color}
							<div>
								<div class="mb-1 flex items-center justify-between text-xs">
									<span class="flex items-center gap-1.5">
										<span class="size-2 rounded-full {color}"></span>
										<Skeleton class="h-3 w-16" />
									</span>
									<Skeleton class="h-3 w-8" />
								</div>
								<Skeleton class="h-2 w-full rounded-full" />
							</div>
						{/each}
					</div>
				{:else if b}
					<div class="space-y-3">
						<!-- In Stock -->
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="flex items-center gap-1.5">
									<span class="size-2 rounded-full bg-emerald-500"></span>
									<span class="text-zinc-600 dark:text-zinc-400">{t('dashboard_in_stock')}</span>
								</span>
								<span class="tabular-nums font-bold text-zinc-900 dark:text-zinc-100">{formatCount(b.inventoryStatus.inStock)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
								<div
									class="h-full rounded-full bg-emerald-500 transition-all"
									style="width: {(b.inventoryStatus.inStock / inventoryMax) * 100}%"
								></div>
							</div>
						</div>
						<!-- Low Stock -->
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="flex items-center gap-1.5">
									<span class="size-2 rounded-full bg-amber-500"></span>
									<span class="text-zinc-600 dark:text-zinc-400">{t('dashboard_low_stock')}</span>
								</span>
								<span class="tabular-nums font-bold text-amber-700 dark:text-amber-400">{formatCount(b.inventoryStatus.lowStock)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
								<div
									class="h-full rounded-full bg-amber-500 transition-all"
									style="width: {(b.inventoryStatus.lowStock / inventoryMax) * 100}%"
								></div>
							</div>
						</div>
						<!-- Out of Stock -->
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="flex items-center gap-1.5">
									<span class="size-2 rounded-full bg-red-500"></span>
									<span class="text-zinc-600 dark:text-zinc-400">{t('dashboard_out_of_stock')}</span>
								</span>
								<span class="tabular-nums font-bold text-red-700 dark:text-red-400">{formatCount(b.inventoryStatus.outOfStock)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
								<div
									class="h-full rounded-full bg-red-500 transition-all"
									style="width: {(b.inventoryStatus.outOfStock / inventoryMax) * 100}%"
								></div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Reports Links -->
		<div class="mt-8">
			<h2 class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('nav_reports')}</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<a
					href="/reports/sales"
					class="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
				>
					<div class="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
						<TrendingUp class="size-4 text-emerald-600 dark:text-emerald-400" />
					</div>
					<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('report_sales')}</span>
				</a>
				<a
					href="/reports/inventory"
					class="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
				>
					<div class="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
						<Package class="size-4 text-amber-600 dark:text-amber-400" />
					</div>
					<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('report_inventory')}</span>
				</a>
				<a
					href="/reports/financial"
					class="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
				>
					<div class="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<DollarSign class="size-4 text-blue-600 dark:text-blue-400" />
					</div>
					<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('report_financial')}</span>
				</a>
			</div>
		</div>
</div>
