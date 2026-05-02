<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { Filter, BookText, Download } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { exportCSV, exportJSON } from '$lib/export';
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
			default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
		}
	}

	function exportLedgerCSV() {
		const rows: (string | number)[][] = [
			['Ledger Entries'],
			[''],
			['Date', 'Account', 'Account Code', 'Debit', 'Credit', 'Narration', 'Voucher Type'],
			...filteredEntries.map((e) => [
				e.date,
				e.accountName,
				e.accountCode,
				e.debit,
				e.credit,
				e.narration,
				e.voucherType,
			]),
		];
		exportCSV('ledger-entries.csv', rows);
	}

	function exportLedgerJSON() {
		exportJSON('ledger-entries.json', {
			filters: { fiscalYear: fiscalYearFilter, account: accountFilter, dateFrom, dateTo },
			entries: filteredEntries,
		});
	}

</script>

<div class="space-y-4">
	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<Filter class="size-4 text-zinc-500" />

		<Select.Root type="single" value={accountFilter ?? 'all'} onValueChange={(v) => { accountFilter = v === 'all' ? undefined : v; }}>
			<Select.Trigger size="sm">
				{accountFilter ? `${accountFilter} — ${(accounts.data ?? []).find((a: any) => a.code === accountFilter)?.name ?? ''}` : t('common_all_accounts')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_accounts')}</Select.Item>
				{#each (accounts.data ?? []) as account}
					{@const acc = account as any}
					<Select.Item value={acc.code}>{acc.code} — {acc.name}</Select.Item>
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

		<div class="flex items-center gap-1.5">
			<DatePicker
				bind:value={dateFrom}
				placeholder={t('report_from')}
				class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
			<span class="text-zinc-400">—</span>
			<DatePicker
				bind:value={dateTo}
				placeholder={t('report_to')}
				class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
		<div class="ml-auto">
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
					<DropdownMenu.Item onclick={exportLedgerCSV}>
						<Download class="mr-2 size-4" />
						Export CSV
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={exportLedgerJSON}>
						<Download class="mr-2 size-4" />
						Export JSON
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	{#if entries.isLoading}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">{t('common_date')}</Table.Head>
						<Table.Head class="font-semibold">{t('ledger_account')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('ledger_debit')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('ledger_credit')}</Table.Head>
						<Table.Head class="font-semibold">{t('ledger_narration')}</Table.Head>
						<Table.Head class="font-semibold">{t('ledger_voucher_type')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each Array(8) as _}
						<Table.Row>
							<Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
							<Table.Cell>
								<div class="flex flex-col gap-1">
									<Skeleton class="h-4 w-28" />
									<Skeleton class="h-3 w-16" />
								</div>
							</Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-20" /></Table.Cell>
							<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-20" /></Table.Cell>
							<Table.Cell><Skeleton class="h-4 w-40" /></Table.Cell>
							<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{:else if !filteredEntries.length}
		<EmptyState
			icon={BookText}
			title={t('empty_ledger_entries')}
			description={t('empty_ledger_entries_desc')}
		/>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">{t('common_date')}</Table.Head>
						<Table.Head class="font-semibold">{t('ledger_account')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('ledger_debit')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('ledger_credit')}</Table.Head>
						<Table.Head class="font-semibold">{t('ledger_narration')}</Table.Head>
						<Table.Head class="font-semibold">{t('ledger_voucher_type')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredEntries as entry}
						<Table.Row class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
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
