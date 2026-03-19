<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { FileText, Filter } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { formatDate } from '$lib/date-utils';

	type InvoiceType = 'purchase' | 'sale';
	type PaymentStatusFilter = 'pending' | 'paid' | 'partial' | 'overpaid';

	let typeFilter = $state<InvoiceType | undefined>(undefined);
	let fiscalYearFilter = $state<string | undefined>(undefined);
	let paymentStatusFilter = $state<PaymentStatusFilter | undefined>(undefined);

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const invoices = useConvexQuery(client, api.functions.invoices.list, () => ({
		type: typeFilter,
		fiscalYear: fiscalYearFilter,
		paymentStatus: paymentStatusFilter,
	}));

	function typeBadgeVariant(type: string) {
		return type === 'purchase' ? 'secondary' : 'default';
	}

	function typeLabel(type: string) {
		return type === 'purchase' ? t('invoice_type_purchase') : t('invoice_type_sale');
	}

	function statusBadgeClass(status: string) {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'pending':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
			case 'partial':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'overpaid':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			default:
				return '';
		}
	}

	const fiscalYears = $derived.by(() => {
		if (!currentFY.data) return [];
		const fy = currentFY.data;
		const parts = fy.split('/').map(Number);
		const start = parts[0];
		const years: string[] = [];
		for (let i = 0; i < 5; i++) {
			const s = start - i;
			const e = s + 1;
			years.push(`${String(s).padStart(2, '0')}/${String(e).padStart(2, '0')}`);
		}
		return years;
	});
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex items-center gap-2">
			<Filter class="size-4 text-zinc-500" />
			<span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t('common_filters')}</span>
		</div>

		<Select.Root type="single" value={typeFilter ?? 'all'} onValueChange={(v) => { typeFilter = v === 'all' ? undefined : v as InvoiceType; }}>
			<Select.Trigger size="sm">
				{typeFilter ? (typeFilter === 'purchase' ? t('invoice_type_purchase') : t('invoice_type_sale')) : t('common_all_types')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_types')}</Select.Item>
				<Select.Item value="purchase">{t('invoice_type_purchase')}</Select.Item>
				<Select.Item value="sale">{t('invoice_type_sale')}</Select.Item>
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

		<Select.Root type="single" value={paymentStatusFilter ?? 'all'} onValueChange={(v) => { paymentStatusFilter = v === 'all' ? undefined : v as PaymentStatusFilter; }}>
			<Select.Trigger size="sm">
				{paymentStatusFilter ? t(`status_${paymentStatusFilter}`) : t('common_all_statuses')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_statuses')}</Select.Item>
				<Select.Item value="pending">{t('status_pending')}</Select.Item>
				<Select.Item value="partial">{t('status_partial')}</Select.Item>
				<Select.Item value="paid">{t('status_paid')}</Select.Item>
				<Select.Item value="overpaid">{t('status_overpaid')}</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>

	{#if invoices.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('common_loading_invoices')}</p>
			</div>
		</div>
	{:else if !invoices.data?.length}
		<EmptyState
			icon={FileText}
			title={t('empty_invoices')}
			description={t('empty_invoices_desc')}
			actionLabel={t('stock_import_create')}
			actionHref="/stock-import/new"
		/>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">{t('invoice_number')}</Table.Head>
						<Table.Head class="font-semibold">{t('invoice_type')}</Table.Head>
						<Table.Head class="font-semibold">{t('invoice_party')}</Table.Head>
						<Table.Head class="font-semibold">{t('common_date')}</Table.Head>
						<Table.Head class="text-right font-semibold">{t('common_total')}</Table.Head>
						<Table.Head class="font-semibold">{t('order_status')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each invoices.data as invoice}
						<Table.Row
							class="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
							onclick={() => {
								window.location.href = `/invoices/${invoice._id}`;
							}}
						>
							<Table.Cell class="font-mono text-sm">
								{invoice.invoiceNumber || '—'}
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {invoice.type === 'purchase'
										? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
										: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}"
								>
									{typeLabel(invoice.type)}
								</span>
							</Table.Cell>
							<Table.Cell class="text-zinc-700 dark:text-zinc-300">
								{invoice.partyId || '—'}
							</Table.Cell>
							<Table.Cell class="text-zinc-600 dark:text-zinc-400">
								{formatDate(invoice.issuedAt)}
							</Table.Cell>
							<Table.Cell class="text-right font-medium tabular-nums">
								{formatNPR(invoice.totalAmount)}
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {statusBadgeClass(invoice.paymentStatus)}"
								>
									{t(`status_${invoice.paymentStatus}`)}
								</span>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
