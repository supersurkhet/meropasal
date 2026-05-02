<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import { formatDate } from '$lib/date-utils';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import {
		DollarSign,
		TrendingUp,
		TrendingDown,
		ArrowLeft,
		Receipt,
		Wallet,
		Download,
	} from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { exportCSV, exportJSON } from '$lib/export';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

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

	let selectedFY = $state<string | undefined>(undefined);
	const activeFY = $derived(selectedFY ?? currentFY.data);

	const dashboard = useConvexQuery(
		client,
		api.functions.reports.dashboard,
		() => (activeFY ? { fiscalYear: activeFY } : {}),
	);

	// Fetch invoices for receivables/payables breakdown
	const invoices = useConvexQuery(client, api.functions.invoices.list, () => ({
		fiscalYear: activeFY,
	}));

	const outstandingSales = $derived.by(() => {
		if (!invoices.data) return [];
		return (invoices.data as any[])
			.filter((i) => i.type === 'sale' && i.paymentStatus !== 'paid')
			.sort((a, b) => b.totalAmount - b.paidAmount - (a.totalAmount - a.paidAmount))
			.slice(0, 10);
	});

	const outstandingPurchases = $derived.by(() => {
		if (!invoices.data) return [];
		return (invoices.data as any[])
			.filter((i) => i.type === 'purchase' && i.paymentStatus !== 'paid')
			.sort((a, b) => b.totalAmount - b.paidAmount - (a.totalAmount - a.paidAmount))
			.slice(0, 10);
	});

	function statusBadgeClass(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
			case 'partial':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			default:
				return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
		}
	}

	const d = $derived(dashboard.data);

	function exportFinancialCSV() {
		const rows: (string | number)[][] = [
			['Financial Report', activeFY ? `FY ${activeFY}` : ''],
			[''],
			['Total Revenue', d?.totalRevenue ?? 0],
			['Total Expenses', d?.totalExpenses ?? 0],
			['Net Income', d?.netIncome ?? 0],
			['Outstanding Receivables', d?.outstandingReceivables ?? 0],
			['Outstanding Payables', d?.outstandingPayables ?? 0],
			[''],
			['Outstanding Receivables'],
			['Invoice', 'Date', 'Due', 'Status'],
			...outstandingSales.map((inv) => [
				inv.invoiceNumber || '—',
				inv.issuedAt,
				inv.totalAmount - inv.paidAmount,
				inv.paymentStatus,
			]),
			[''],
			['Outstanding Payables'],
			['Invoice', 'Date', 'Due', 'Status'],
			...outstandingPurchases.map((inv) => [
				inv.invoiceNumber || '—',
				inv.issuedAt,
				inv.totalAmount - inv.paidAmount,
				inv.paymentStatus,
			]),
		];
		exportCSV('financial-report.csv', rows);
	}

	function exportFinancialJSON() {
		exportJSON('financial-report.json', {
			fiscalYear: activeFY,
			summary: d,
			outstandingSales,
			outstandingPurchases,
		});
	}
</script>

<MetaTags title="Financial Report — MeroPasal" />

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
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-blue-100 shadow-sm dark:bg-blue-900/30"
				>
					<DollarSign class="size-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
						Financial Report
					</h1>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">
						Revenue, expenses, and outstanding balances
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<!-- Fiscal Year Selector -->
				{#if fiscalYears.length > 0}
					<Select.Root type="single" value={activeFY ?? ''} onValueChange={(v) => {
						selectedFY = v || undefined;
					}}>
						<Select.Trigger size="sm">
							{activeFY ? `FY ${activeFY}` : 'Select FY'}
						</Select.Trigger>
						<Select.Content>
							{#each fiscalYears as fy}
								<Select.Item value={fy}>FY {fy}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/if}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button
								class="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
								{...props}
							>
								<Download class="size-3.5" />
								Export
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={exportFinancialCSV}>
							<Download class="mr-2 size-4" />
							Export CSV
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={exportFinancialJSON}>
							<Download class="mr-2 size-4" />
							Export JSON
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</div>

	<!-- P&L Summary -->
	<div
		class="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
	>
		<h2 class="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
			Profit & Loss Summary
			{#if activeFY}
				<span class="font-normal text-zinc-400">— FY {activeFY}</span>
			{/if}
		</h2>

		<div class="space-y-3">
			<!-- Revenue -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<TrendingUp class="size-4 text-emerald-500" />
					<span class="text-sm text-zinc-700 dark:text-zinc-300">Total Revenue</span>
					{#if !dashboard.isLoading && d}
						<span class="text-xs text-zinc-400">({d.totalSaleInvoices} invoices)</span>
					{/if}
				</div>
				{#if dashboard.isLoading}
					<Skeleton class="h-6 w-32" />
				{:else if d}
					<span class="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
						{formatNPR(d.totalRevenue)}
					</span>
				{/if}
			</div>

			<!-- Expenses -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<TrendingDown class="size-4 text-red-500" />
					<span class="text-sm text-zinc-700 dark:text-zinc-300">Total Expenses</span>
					{#if !dashboard.isLoading && d}
						<span class="text-xs text-zinc-400">({d.totalPurchaseInvoices} invoices)</span>
					{/if}
				</div>
				{#if dashboard.isLoading}
					<Skeleton class="h-6 w-32" />
				{:else if d}
					<span class="text-lg font-semibold tabular-nums text-red-700 dark:text-red-400">
						({formatNPR(d.totalExpenses)})
					</span>
				{/if}
			</div>

			<!-- Separator -->
			<div class="border-t border-zinc-200 dark:border-zinc-700"></div>

			<!-- Net Income -->
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					{#if !dashboard.isLoading && d}
						Net {d.netIncome >= 0 ? 'Profit' : 'Loss'}
					{:else}
						Net Profit / Loss
					{/if}
				</span>
				{#if dashboard.isLoading}
					<Skeleton class="h-7 w-36" />
				{:else if d}
					<span
						class="text-xl font-bold tabular-nums {d.netIncome >= 0
							? 'text-emerald-700 dark:text-emerald-400'
							: 'text-red-700 dark:text-red-400'}"
					>
						{formatNPR(Math.abs(d.netIncome))}
					</span>
				{/if}
			</div>

			<!-- Margin -->
			<div class="flex items-center justify-between">
				<span class="text-xs text-zinc-500">Profit Margin</span>
				{#if dashboard.isLoading}
					<Skeleton class="h-4 w-14" />
				{:else if d && d.totalRevenue > 0}
					<span
						class="text-sm font-medium tabular-nums {d.netIncome >= 0
							? 'text-emerald-600 dark:text-emerald-400'
							: 'text-red-600 dark:text-red-400'}"
					>
						{((d.netIncome / d.totalRevenue) * 100).toFixed(1)}%
					</span>
				{:else}
					<span class="text-sm text-zinc-400">—</span>
				{/if}
			</div>
		</div>

		<!-- Visual Breakdown Bar -->
		{#if dashboard.isLoading}
			<Skeleton class="mt-4 h-3 w-full rounded-full" />
			<div class="mt-1.5 flex justify-between text-[10px] text-zinc-400">
				<span>Revenue</span>
				<span>Expenses</span>
			</div>
		{:else if d && (d.totalRevenue > 0 || d.totalExpenses > 0)}
			{@const total = d.totalRevenue + d.totalExpenses}
			{@const revPct = (d.totalRevenue / total) * 100}
			<div class="mt-4 flex h-3 overflow-hidden rounded-full">
				<div
					class="bg-emerald-500 dark:bg-emerald-600"
					style="width: {revPct}%"
					title="Revenue: {formatNPR(d.totalRevenue)}"
				></div>
				<div
					class="bg-red-400 dark:bg-red-600"
					style="width: {100 - revPct}%"
					title="Expenses: {formatNPR(d.totalExpenses)}"
				></div>
			</div>
			<div class="mt-1.5 flex justify-between text-[10px] text-zinc-400">
				<span>Revenue ({revPct.toFixed(0)}%)</span>
				<span>Expenses ({(100 - revPct).toFixed(0)}%)</span>
			</div>
		{/if}
	</div>

	<!-- Outstanding Balances -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Receivables -->
		<div class="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
			<div class="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
				<div class="flex items-center gap-2">
					<Receipt class="size-4 text-blue-500" />
					<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						Outstanding Receivables
					</h3>
				</div>
				{#if dashboard.isLoading}
					<Skeleton class="h-5 w-24" />
				{:else if d}
					<span class="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
						{formatNPR(d.outstandingReceivables)}
					</span>
				{/if}
			</div>
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="text-xs font-semibold">Invoice</Table.Head>
							<Table.Head class="text-xs font-semibold">Date</Table.Head>
							<Table.Head class="text-right text-xs font-semibold">Due</Table.Head>
							<Table.Head class="text-xs font-semibold">Status</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if dashboard.isLoading || invoices.isLoading}
							{#each Array(4) as _}
								<Table.Row>
									<Table.Cell><Skeleton class="h-3 w-20" /></Table.Cell>
									<Table.Cell><Skeleton class="h-3 w-16" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-3 w-20" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-14 rounded-full" /></Table.Cell>
								</Table.Row>
							{/each}
						{:else if outstandingSales.length === 0}
							<Table.Row>
								<Table.Cell colspan={4}>
									<div class="flex items-center justify-center py-8 text-sm text-zinc-400">
										No outstanding receivables
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each outstandingSales as inv}
								<Table.Row>
									<Table.Cell class="font-mono text-xs">
										{inv.invoiceNumber || '—'}
									</Table.Cell>
									<Table.Cell class="text-xs text-zinc-500">
										{formatDate(inv.issuedAt)}
									</Table.Cell>
									<Table.Cell class="text-right text-xs font-medium tabular-nums text-blue-600 dark:text-blue-400">
										{formatNPR(inv.totalAmount - inv.paidAmount)}
									</Table.Cell>
									<Table.Cell>
										<span
											class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize {statusBadgeClass(inv.paymentStatus)}"
										>
											{inv.paymentStatus}
										</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</div>

		<!-- Payables -->
		<div class="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
			<div class="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
				<div class="flex items-center gap-2">
					<Wallet class="size-4 text-violet-500" />
					<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						Outstanding Payables
					</h3>
				</div>
				{#if dashboard.isLoading}
					<Skeleton class="h-5 w-24" />
				{:else if d}
					<span class="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
						{formatNPR(d.outstandingPayables)}
					</span>
				{/if}
			</div>
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="text-xs font-semibold">Invoice</Table.Head>
							<Table.Head class="text-xs font-semibold">Date</Table.Head>
							<Table.Head class="text-right text-xs font-semibold">Due</Table.Head>
							<Table.Head class="text-xs font-semibold">Status</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if dashboard.isLoading || invoices.isLoading}
							{#each Array(4) as _}
								<Table.Row>
									<Table.Cell><Skeleton class="h-3 w-20" /></Table.Cell>
									<Table.Cell><Skeleton class="h-3 w-16" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-3 w-20" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-14 rounded-full" /></Table.Cell>
								</Table.Row>
							{/each}
						{:else if outstandingPurchases.length === 0}
							<Table.Row>
								<Table.Cell colspan={4}>
									<div class="flex items-center justify-center py-8 text-sm text-zinc-400">
										No outstanding payables
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each outstandingPurchases as inv}
								<Table.Row>
									<Table.Cell class="font-mono text-xs">
										{inv.invoiceNumber || '—'}
									</Table.Cell>
									<Table.Cell class="text-xs text-zinc-500">
										{formatDate(inv.issuedAt)}
									</Table.Cell>
									<Table.Cell class="text-right text-xs font-medium tabular-nums text-violet-600 dark:text-violet-400">
										{formatNPR(inv.totalAmount - inv.paidAmount)}
									</Table.Cell>
									<Table.Cell>
										<span
											class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize {statusBadgeClass(inv.paymentStatus)}"
										>
											{inv.paymentStatus}
										</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</div>
</div>
