<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Filter, Scale } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';

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
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<Filter class="size-4 text-zinc-500" />
		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			bind:value={selectedFY}
		>
			<option value="">Current FY ({currentFY.data ?? '...'})</option>
			{#each fiscalYears as fy}
				<option value={fy}>{fy}</option>
			{/each}
		</select>

		{#if trialBalance.data}
			<div class="ml-auto flex items-center gap-2">
				<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium {isBalanced
					? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
					: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}">
					<Scale class="size-3" />
					{isBalanced ? 'Balanced' : 'Unbalanced'}
				</span>
			</div>
		{/if}
	</div>

	{#if trialBalance.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('common_loading')}</p>
			</div>
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
						<Table.Row class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
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
