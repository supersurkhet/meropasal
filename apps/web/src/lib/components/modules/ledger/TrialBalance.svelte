<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { Filter, Scale, Download } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { exportCSV, exportJSON } from '$lib/export';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	let selectedFY = $state('');

	const effectiveFY = $derived(selectedFY || currentFY.data || '');

	const trialBalance = useConvexQuery(
		client,
		api.functions.ledger.trialBalance,
		() => (effectiveFY ? { fiscalYear: effectiveFY } : 'skip'),
	);

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

	const totals = $derived.by(() => {
		if (!trialBalance.data) return { debit: 0, credit: 0 };
		return (trialBalance.data as any[]).reduce(
			(acc, row) => ({
				debit: acc.debit + row.debit,
				credit: acc.credit + row.credit,
			}),
			{ debit: 0, credit: 0 },
		);
	});

	const isBalanced = $derived(Math.abs(totals.debit - totals.credit) < 0.01);

	function exportTrialBalanceCSV() {
		const data = trialBalance.data ?? [];
		const rows: (string | number)[][] = [
			['Trial Balance', effectiveFY ? `FY ${effectiveFY}` : ''],
			[''],
			['Account Code', 'Account Name', 'Debit', 'Credit'],
			...data.map((r: any) => [r.accountCode, r.accountName, r.debit, r.credit]),
			['', 'Grand Total', totals.debit, totals.credit],
		];
		exportCSV('trial-balance.csv', rows);
	}

	function exportTrialBalanceJSON() {
		exportJSON('trial-balance.json', {
			fiscalYear: effectiveFY,
			isBalanced,
			totals,
			rows: trialBalance.data ?? [],
		});
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<Filter class="size-4 text-zinc-500" />
		<Select.Root type="single" value={selectedFY || 'current'} onValueChange={(v) => { selectedFY = v === 'current' ? '' : v; }}>
			<Select.Trigger size="sm">
				{selectedFY || `${t('ledger_current_fy')} (${currentFY.data ?? '...'})`}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="current">{t('ledger_current_fy')} ({currentFY.data ?? '...'})</Select.Item>
				{#each fiscalYears as fy}
					<Select.Item value={fy}>{fy}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		{#if trialBalance.data}
			<div class="ml-auto flex items-center gap-2">
				<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {isBalanced
					? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
					: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}">
					<Scale class="size-3" />
					{isBalanced ? 'Balanced' : 'Unbalanced'}
				</span>
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
						<DropdownMenu.Item onclick={exportTrialBalanceCSV}>
							<Download class="mr-2 size-4" />
							Export CSV
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={exportTrialBalanceJSON}>
							<Download class="mr-2 size-4" />
							Export JSON
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/if}
	</div>

	{#if trialBalance.isLoading}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">Account Code</Table.Head>
						<Table.Head class="font-semibold">Account Name</Table.Head>
						<Table.Head class="text-right font-semibold">Debit Total</Table.Head>
						<Table.Head class="text-right font-semibold">Credit Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each Array(8) as _}
						<Table.Row>
							<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-36" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-24" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-24" /></Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
				<Table.Footer>
					<Table.Row class="bg-zinc-100 dark:bg-zinc-800 font-semibold">
						<Table.Cell colspan={2} class="text-right font-bold">Grand Total</Table.Cell>
						<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-24" /></Table.Cell>
						<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-24" /></Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
		</div>
	{:else if !trialBalance.data?.length}
		<EmptyState
			icon={Scale}
			title={t('empty_trial_balance')}
			description={t('empty_trial_balance_desc')}
		/>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">Account Code</Table.Head>
						<Table.Head class="font-semibold">Account Name</Table.Head>
						<Table.Head class="text-right font-semibold">Debit Total</Table.Head>
						<Table.Head class="text-right font-semibold">Credit Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each trialBalance.data as row}
						{@const r = row as any}
						<Table.Row class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
							<Table.Cell class="font-mono text-sm">{r.accountCode}</Table.Cell>
							<Table.Cell class="font-medium">{r.accountName}</Table.Cell>
							<Table.Cell class="text-right tabular-nums {r.debit > 0 ? 'font-medium' : 'text-zinc-300 dark:text-zinc-700'}">
								{r.debit > 0 ? formatNPR(r.debit) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums {r.credit > 0 ? 'font-medium' : 'text-zinc-300 dark:text-zinc-700'}">
								{r.credit > 0 ? formatNPR(r.credit) : '—'}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
				<Table.Footer>
					<Table.Row class="bg-zinc-100 dark:bg-zinc-800 font-semibold">
						<Table.Cell colspan={2} class="text-right font-bold">Grand Total</Table.Cell>
						<Table.Cell class="text-right tabular-nums font-bold">{formatNPR(totals.debit)}</Table.Cell>
						<Table.Cell class="text-right tabular-nums font-bold">{formatNPR(totals.credit)}</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
		</div>
	{/if}
</div>
