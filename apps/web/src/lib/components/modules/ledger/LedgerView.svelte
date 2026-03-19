<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Filter, BookText } from '@lucide/svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import { formatDate } from '$lib/date-utils';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	let fiscalYearFilter = $state<string | undefined>(undefined);
	let accountFilter = $state<string | undefined>(undefined);
	let dateFrom = $state('');
	let dateTo = $state('');

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const entries = useConvexQuery(client, api.functions.ledger.listEntries, () => ({
		fiscalYear: fiscalYearFilter,
		accountCode: accountFilter,
	}));

	const accounts = useConvexQuery(client, api.functions.ledger.listAccounts, () => ({}));

	const filteredEntries = $derived.by(() => {
		if (!entries.data) return [];
		let result = [...(entries.data as any[])];

		if (dateFrom) {
			result = result.filter((e) => e.date >= dateFrom);
		}
		if (dateTo) {
			result = result.filter((e) => e.date <= dateTo);
		}

		return result.sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
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

	function voucherBadgeClass(type: string) {
		switch (type) {
			case 'sales': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'purchase': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'receipt': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
			case 'payment': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
			case 'journal': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
			case 'contra': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
			default: return 'bg-zinc-100 text-zinc-800';
		}
	}

</script>

<div class="space-y-4">
	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<Filter class="size-4 text-zinc-500" />

		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				accountFilter = val || undefined;
			}}
		>
			<option value="">All Accounts</option>
			{#each (accounts.data ?? []) as account}
				{@const acc = account as any}
				<option value={acc.code}>{acc.code} — {acc.name}</option>
			{/each}
		</select>

		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				fiscalYearFilter = val || undefined;
			}}
		>
			<option value="">All Fiscal Years</option>
			{#each fiscalYears as fy}
				<option value={fy}>{fy}</option>
			{/each}
		</select>

		<div class="flex items-center gap-1.5">
			<DatePicker
				bind:value={dateFrom}
				placeholder="From"
				class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
			<span class="text-zinc-400">—</span>
			<DatePicker
				bind:value={dateTo}
				placeholder="To"
				class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	</div>

	{#if entries.isLoading}
		<div class="flex items-center justify-center py-12 text-zinc-500">
			<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
			<span class="ml-2 text-sm">Loading ledger entries...</span>
		</div>
	{:else if !filteredEntries.length}
		<div class="flex flex-col items-center justify-center py-16 text-zinc-500">
			<BookText class="mb-3 size-10 opacity-40" />
			<p class="text-sm">No ledger entries found</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">Date</Table.Head>
						<Table.Head class="font-semibold">Account</Table.Head>
						<Table.Head class="text-right font-semibold">Debit</Table.Head>
						<Table.Head class="text-right font-semibold">Credit</Table.Head>
						<Table.Head class="font-semibold">Narration</Table.Head>
						<Table.Head class="font-semibold">Voucher Type</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredEntries as entry}
						<Table.Row class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
							<Table.Cell class="text-sm text-zinc-600 dark:text-zinc-400">
								{formatDate(entry.date)}
							</Table.Cell>
							<Table.Cell>
								<div class="flex flex-col">
									<span class="font-medium text-zinc-900 dark:text-zinc-100">{entry.accountName}</span>
									<span class="font-mono text-xs text-zinc-500">{entry.accountCode}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums {entry.debit > 0 ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-300 dark:text-zinc-700'}">
								{entry.debit > 0 ? formatNPR(entry.debit) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums {entry.credit > 0 ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-300 dark:text-zinc-700'}">
								{entry.credit > 0 ? formatNPR(entry.credit) : '—'}
							</Table.Cell>
							<Table.Cell class="max-w-[250px] truncate text-sm text-zinc-600 dark:text-zinc-400">
								{entry.narration}
							</Table.Cell>
							<Table.Cell>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize {voucherBadgeClass(entry.voucherType)}">
									{entry.voucherType}
								</span>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
