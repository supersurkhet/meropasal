<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import {
		Scale,
		ArrowLeft,
		Download,
	} from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { exportCSV, exportJSON } from '$lib/export';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

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

	const balanceSheet = useConvexQuery(
		client,
		(api as any).functions.ledger.balanceSheet,
		() => (activeFY ? { fiscalYear: activeFY } : 'skip'),
	);

	const totalAssets = $derived.by(() => {
		if (!balanceSheet.data) return 0;
		return balanceSheet.data.assets.reduce((sum: number, a: { amount: number }) => sum + a.amount, 0);
	});

	const totalLiabilities = $derived.by(() => {
		if (!balanceSheet.data) return 0;
		return balanceSheet.data.liabilities.reduce((sum: number, a: { amount: number }) => sum + a.amount, 0);
	});

	const totalEquity = $derived.by(() => {
		if (!balanceSheet.data) return 0;
		return balanceSheet.data.equity.reduce((sum: number, a: { amount: number }) => sum + a.amount, 0);
	});

	const totalLiabilitiesEquity = $derived(totalLiabilities + totalEquity);

	function exportBalanceSheetCSV() {
		const rows: (string | number)[][] = [
			['Balance Sheet', activeFY ? `FY ${activeFY}` : ''],
			[''],
			['Assets'],
			['Account Code', 'Account Name', 'Amount'],
			...(balanceSheet.data?.assets ?? []).map((a: { accountCode: string; accountName: string; amount: number }) => [a.accountCode, a.accountName, a.amount]),
			['', 'Total Assets', totalAssets],
			[''],
			['Liabilities'],
			['Account Code', 'Account Name', 'Amount'],
			...(balanceSheet.data?.liabilities ?? []).map((a: { accountCode: string; accountName: string; amount: number }) => [a.accountCode, a.accountName, a.amount]),
			['', 'Total Liabilities', totalLiabilities],
			[''],
			['Equity'],
			['Account Code', 'Account Name', 'Amount'],
			...(balanceSheet.data?.equity ?? []).map((a: { accountCode: string; accountName: string; amount: number }) => [a.accountCode, a.accountName, a.amount]),
			['', 'Total Equity', totalEquity],
			[''],
			['', 'Total Liabilities + Equity', totalLiabilitiesEquity],
		];
		exportCSV('balance-sheet.csv', rows);
	}

	function exportBalanceSheetJSON() {
		exportJSON('balance-sheet.json', {
			fiscalYear: activeFY,
			assets: balanceSheet.data?.assets ?? [],
			liabilities: balanceSheet.data?.liabilities ?? [],
			equity: balanceSheet.data?.equity ?? [],
			totals: { totalAssets, totalLiabilities, totalEquity, totalLiabilitiesEquity },
		});
	}
</script>

<MetaTags title="Balance Sheet — MeroPasal" />

<div class="p-6 lg:p-8">
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
					class="flex size-10 items-center justify-center rounded-xl bg-violet-100 shadow-sm dark:bg-violet-900/30"
				>
					<Scale class="size-5 text-violet-600 dark:text-violet-400" />
				</div>
				<div>
					<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
						Balance Sheet
					</h1>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">
						Assets, liabilities, and equity
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
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
						<DropdownMenu.Item onclick={exportBalanceSheetCSV}>
							<Download class="mr-2 size-4" />
							Export CSV
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={exportBalanceSheetJSON}>
							<Download class="mr-2 size-4" />
							Export JSON
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</div>

	{#if balanceSheet.isLoading}
		<div class="space-y-6">
			{#each Array(3) as _}
				<div class="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
					<Skeleton class="mb-4 h-5 w-40" />
					<div class="space-y-2">
						{#each Array(4) as _}
							<div class="flex justify-between">
								<Skeleton class="h-4 w-48" />
								<Skeleton class="h-4 w-24" />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else if !balanceSheet.data}
		<div class="flex h-48 items-center justify-center text-sm text-zinc-400">
			No data available
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Assets -->
			<div class="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 class="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Assets</h2>
				<div class="space-y-2">
					{#each balanceSheet.data.assets as row}
						<div class="flex items-center justify-between text-sm">
							<span class="text-zinc-700 dark:text-zinc-300">{row.accountCode} — {row.accountName}</span>
							<span class="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(row.amount)}</span>
						</div>
					{:else}
						<p class="text-sm text-zinc-400">No asset accounts</p>
					{/each}
				</div>
				<div class="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Assets</span>
						<span class="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(totalAssets)}</span>
					</div>
				</div>
			</div>

			<!-- Liabilities -->
			<div class="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 class="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Liabilities</h2>
				<div class="space-y-2">
					{#each balanceSheet.data.liabilities as row}
						<div class="flex items-center justify-between text-sm">
							<span class="text-zinc-700 dark:text-zinc-300">{row.accountCode} — {row.accountName}</span>
							<span class="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(row.amount)}</span>
						</div>
					{:else}
						<p class="text-sm text-zinc-400">No liability accounts</p>
					{/each}
				</div>
				<div class="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Liabilities</span>
						<span class="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(totalLiabilities)}</span>
					</div>
				</div>
			</div>

			<!-- Equity -->
			<div class="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 class="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Equity</h2>
				<div class="space-y-2">
					{#each balanceSheet.data.equity as row}
						<div class="flex items-center justify-between text-sm">
							<span class="text-zinc-700 dark:text-zinc-300">{row.accountCode} — {row.accountName}</span>
							<span class="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(row.amount)}</span>
						</div>
					{:else}
						<p class="text-sm text-zinc-400">No equity accounts</p>
					{/each}
				</div>
				<div class="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Equity</span>
						<span class="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(totalEquity)}</span>
					</div>
				</div>
			</div>

			<!-- Totals Check -->
			<div class="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 class="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Balance Check</h2>
				<div class="space-y-3">
					<div class="flex items-center justify-between text-sm">
						<span class="text-zinc-700 dark:text-zinc-300">Total Assets</span>
						<span class="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(totalAssets)}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-zinc-700 dark:text-zinc-300">Total Liabilities + Equity</span>
						<span class="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatNPR(totalLiabilitiesEquity)}</span>
					</div>
					<div class="border-t border-zinc-200 pt-2 dark:border-zinc-700">
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Difference</span>
							<span class="font-bold tabular-nums {Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
								{formatNPR(Math.abs(totalAssets - totalLiabilitiesEquity))}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
