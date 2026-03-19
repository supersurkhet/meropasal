<script lang="ts">
	import { getConvexClient } from '$lib/convex'
	import { useConvexQuery } from '$lib/convex-helpers.svelte'
	import { api } from '$lib/api'
	import { formatNPR } from '$lib/currency'
	import * as Table from '$lib/components/ui/table'
	import * as Select from '$lib/components/ui/select'
	import { FileText, Filter } from '@lucide/svelte'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { formatDate } from '$lib/date-utils'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'

	type InvoiceType = 'purchase' | 'sale'
	type PaymentStatusFilter = 'pending' | 'paid' | 'partial' | 'overpaid'

	let typeFilter = $state<InvoiceType | undefined>(undefined)
	let fiscalYearFilter = $state<string | undefined>(undefined)
	let paymentStatusFilter = $state<PaymentStatusFilter | undefined>(undefined)

	const viewPref = createViewPreference('invoices')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}))
	const parties = useConvexQuery(client, api.functions.parties.list, () => ({}))
	const customers = useConvexQuery(client, api.functions.customers.list, () => ({}))

	function resolvePartyName(partyId: string | undefined, partyType: string | undefined): string {
		if (!partyId) return '—'
		if (partyType === 'customer') {
			return customers.data?.find((c: any) => c._id === partyId)?.name ?? '—'
		}
		return parties.data?.find((p: any) => p._id === partyId)?.name ?? '—'
	}

	const invoices = useConvexQuery(client, api.functions.invoices.list, () => ({
		type: typeFilter,
		fiscalYear: fiscalYearFilter,
		paymentStatus: paymentStatusFilter,
	}))

	function typeBadgeVariant(type: string) {
		return type === 'purchase' ? 'secondary' : 'default'
	}

	function typeLabel(type: string) {
		return type === 'purchase' ? t('invoice_type_purchase') : t('invoice_type_sale')
	}

	function statusBadgeClass(status: string) {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
			case 'pending':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
			case 'partial':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
			case 'overpaid':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
			default:
				return ''
		}
	}

	function typeBadgeClass(type: string) {
		return type === 'purchase'
			? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
			: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
	}

	const fiscalYears = $derived.by(() => {
		if (!currentFY.data) return []
		const fy = currentFY.data
		const parts = fy.split('/').map(Number)
		const start = parts[0]
		const years: string[] = []
		for (let i = 0; i < 5; i++) {
			const s = start - i
			const e = s + 1
			years.push(`${String(s).padStart(2, '0')}/${String(e).padStart(2, '0')}`)
		}
		return years
	})

	const gridClass = $derived.by(() => {
		switch (viewPref.mode) {
			case 'grid-3':
				return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
			case 'grid-2':
				return 'grid grid-cols-1 gap-4 md:grid-cols-2'
			case 'list':
				return 'flex flex-col gap-2'
			default:
				return ''
		}
	})
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex items-center gap-2">
			<Filter class="size-4 text-zinc-500" />
			<span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t('common_filters')}</span>
		</div>

		<Select.Root type="single" value={typeFilter ?? 'all'} onValueChange={(v) => { typeFilter = v === 'all' ? undefined : v as InvoiceType }}>
			<Select.Trigger size="sm">
				{typeFilter ? (typeFilter === 'purchase' ? t('invoice_type_purchase') : t('invoice_type_sale')) : t('common_all_types')}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">{t('common_all_types')}</Select.Item>
				<Select.Item value="purchase">{t('invoice_type_purchase')}</Select.Item>
				<Select.Item value="sale">{t('invoice_type_sale')}</Select.Item>
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" value={fiscalYearFilter ?? 'all'} onValueChange={(v) => { fiscalYearFilter = v === 'all' ? undefined : v }}>
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

		<Select.Root type="single" value={paymentStatusFilter ?? 'all'} onValueChange={(v) => { paymentStatusFilter = v === 'all' ? undefined : v as PaymentStatusFilter }}>
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
	{:else if viewPref.mode === 'table'}
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
								window.location.href = `/invoices/${invoice._id}`
							}}
						>
							<Table.Cell class="font-mono text-sm">
								{invoice.invoiceNumber || '—'}
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {typeBadgeClass(invoice.type)}"
								>
									{typeLabel(invoice.type)}
								</span>
							</Table.Cell>
							<Table.Cell class="text-zinc-700 dark:text-zinc-300">
								<span class="block truncate max-w-[200px]">{resolvePartyName(invoice.partyId, invoice.partyType)}</span>
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
	{:else}
		<div class={gridClass}>
			{#each invoices.data as invoice}
				<a
					href="/invoices/{invoice._id}"
					class="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<p class="truncate font-mono text-sm text-zinc-900 dark:text-zinc-100">
								{invoice.invoiceNumber || '—'}
							</p>
							<p class="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
								{resolvePartyName(invoice.partyId, invoice.partyType)}
							</p>
						</div>
						<span
							class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium {typeBadgeClass(invoice.type)}"
						>
							{typeLabel(invoice.type)}
						</span>
					</div>

					<div class="mt-3 flex items-end justify-between gap-2">
						<div>
							<p class="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
								{formatNPR(invoice.totalAmount)}
							</p>
							<p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
								{formatDate(invoice.issuedAt)}
							</p>
						</div>
						<span
							class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {statusBadgeClass(invoice.paymentStatus)}"
						>
							{t(`status_${invoice.paymentStatus}`)}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
