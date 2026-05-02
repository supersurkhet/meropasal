<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Select from '$lib/components/ui/select';
	import {
		Banknote,
		ArrowLeft,
		Download,
		ArrowDownLeft,
		ArrowUpRight,
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

	const cashPosition = useConvexQuery(
		client,
		(api as any).functions.ledger.cashPosition,
		() => (activeFY ? { fiscalYear: activeFY } : 'skip'),
	);

	const totalInflow = $derived.by(() => {
		if (!cashPosition.data) return 0;
		return cashPosition.data.movements.reduce((sum: number, m: { inflow: number }) => sum + m.inflow, 0);
	});

	const totalOutflow = $derived.by(() => {
		if (!cashPosition.data) return 0;
		return cashPosition.data.movements.reduce((sum: number, m: { outflow: number }) => sum + m.outflow, 0);
	});

	const netChange = $derived(totalInflow - totalOutflow);

	function exportCashFlowCSV() {
		const rows: (string | number)[][] = [
			['Cash Flow Report', activeFY ? `FY ${activeFY}` : ''],
			[''],
			['Total Inflow', totalInflow],
			['Total Outflow', totalOutflow],
			['Net Change', netChange],
			[''],
			['Voucher Type', 'Inflow', 'Outflow'],
			...(cashPosition.data?.movements ?? []).map((m: { voucherType: string; inflow: number; outflow: number }) => [m.voucherType, m.inflow, m.outflow]),
		];
		exportCSV('cash-flow.csv', rows);
	}

	function exportCashFlowJSON() {
		exportJSON('cash-flow.json', {
			fiscalYear: activeFY,
			totalInflow,
			totalOutflow,
			netChange,
			movements: cashPosition.data?.movements ?? [],
		});
	}
</script>

<MetaTags title="Cash Flow — MeroPasal" />

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
					class="flex size-10 items-center justify-center rounded-xl bg-emerald-100 shadow-sm dark:bg-emerald-900/30"
				>
					<Banknote class="size-5 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div>
					<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
						Cash Flow
					</h1>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">
						Cash and bank account movements
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
						<DropdownMenu.Item onclick={exportCashFlowCSV}>
							<Download class="mr-2 size-4" />
							Export CSV
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={exportCashFlowJSON}>
							<Download class="mr-2 size-4" />
							Export JSON
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</div>

	{#if cashPosition.isLoading}
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each Array(3) as _}
				<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
					<Skeleton class="h-4 w-24" />
					<Skeleton class="mt-2 h-7 w-32" />
				</div>
			{/each}
		</div>
		<div class="space-y-2">
			{#each Array(5) as _}
				<div class="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
					<Skeleton class="h-4 w-24" />
					<div class="flex gap-4">
						<Skeleton class="h-4 w-20" />
						<Skeleton class="h-4 w-20" />
					</div>
				</div>
			{/each}
		</div>
	{:else if !cashPosition.data}
		<div class="flex h-48 items-center justify-center text-sm text-zinc-400">
			No data available
		</div>
	{:else}
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Total Inflow</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
					{formatNPR(totalInflow)}
				</p>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Total Outflow</p>
				<p class="mt-1 text-xl font-bold tabular-nums text-red-700 dark:text-red-400">
					{formatNPR(totalOutflow)}
				</p>
			</div>
			<div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
				<p class="text-xs text-zinc-500 dark:text-zinc-400">Net Change</p>
				<p class="mt-1 text-xl font-bold tabular-nums {netChange >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}">
					{netChange >= 0 ? '+' : ''}{formatNPR(netChange)}
				</p>
			</div>
		</div>

		<div class="space-y-2">
			{#each cashPosition.data.movements as movement}
				<div class="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
					<div class="flex items-center gap-2">
						<span class="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
							{movement.voucherType}
						</span>
					</div>
					<div class="flex items-center gap-4">
						{#if movement.inflow > 0}
							<span class="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
								<ArrowDownLeft class="size-3.5" />
								{formatNPR(movement.inflow)}
							</span>
						{:else}
							<span class="text-sm text-zinc-300 dark:text-zinc-700">—</span>
						{/if}
						{#if movement.outflow > 0}
							<span class="flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-400">
								<ArrowUpRight class="size-3.5" />
								{formatNPR(movement.outflow)}
							</span>
						{:else}
							<span class="text-sm text-zinc-300 dark:text-zinc-700">—</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="flex h-24 items-center justify-center text-sm text-zinc-400">
					No cash movements for this period
				</div>
			{/each}
		</div>
	{/if}
</div>
