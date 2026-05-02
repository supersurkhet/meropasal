<script lang="ts">
	import { getConvexClient } from '$lib/convex'
	import { useConvexQuery } from '$lib/convex-helpers.svelte'
	import { api } from '$lib/api'
	import { formatNPR } from '$lib/currency'
	import * as Table from '$lib/components/ui/table'
	import * as Select from '$lib/components/ui/select'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import { FileText, Filter, Wallet, Plus } from '@lucide/svelte'
	import { Button } from '$lib/components/ui/button'
	import InvoicePayDialog from '$lib/components/modules/invoices/InvoicePayDialog.svelte'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { formatDate } from '$lib/date-utils'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'
	type InvoiceType = 'purchase' | 'sale'
	type PaymentStatusFilter = 'pending' | 'paid' | 'partial' | 'overpaid'

	let typeFilter = $state<InvoiceType | undefined>(undefined)
	let fiscalYearFilter = $state<string | undefined>(undefined)
	let paymentStatusFilter = $state<PaymentStatusFilter | undefined>(undefined)
	const skeletons = createStaggeredSkeletons()

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

	const myPerms = useConvexQuery(client, api.functions.organizations.getMyPermissions, () => ({}))

	let payInvoiceFor = $state<string | null>(null)

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

	type InvoiceDoc = NonNullable<typeof invoices.data>[number]
	const filteredInvoices = $derived((invoices.data ?? []) as InvoiceDoc[])

	function canPayFor(inv: InvoiceDoc): boolean {
		if (!myPerms.data?.permissions?.includes('invoices:recordPayment')) return false
		return inv.totalAmount - inv.paidAmount > 0.005
	}

	// Virtualization
	const getLanes = useBreakpointLanes(() => viewPref.mode)

	const virtualizer = createVirtualizer({
		count: 0,
		getScrollElement: () => document.getElementById('main-content'),
		estimateSize: () => 49,
		overscan: 5,
	})

	$effect(() => {
		const items = filteredInvoices
		const l = getLanes()
		const mode = viewPref.mode
		const isGrid = mode.startsWith('grid')
		const est = isGrid ? 180 : mode === 'list' ? 56 : 49

		get(virtualizer).setOptions({
			count: isGrid ? rowCount(items.length, l) : items.length,
			getScrollElement: () => document.getElementById('main-content'),
			estimateSize: () => est,
			overscan: 5,
		})
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
		<div class="ml-auto flex items-center gap-2">
			<Button href="/invoices/purchase/new" size="sm" variant="outline">
				<Plus class="mr-1.5 size-3.5" />
				Purchase
			</Button>
		</div>
	</div>

	{#if !invoices.isLoading && !invoices.data?.length}
		<EmptyState
			icon={FileText}
			title={t('empty_invoices')}
			description={t('empty_invoices_desc')}
			actionLabel={t('stock_import_create')}
			actionHref="/stock-import/new"
		/>
	{:else}
		{#if viewPref.mode === 'grid-3'}
			{#if invoices.isLoading}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<Skeleton class="h-4 w-24" />
									<Skeleton class="mt-1 h-4 w-32" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
							<div class="mt-3 flex items-end justify-between gap-2">
								<div>
									<Skeleton class="h-6 w-24" />
									<Skeleton class="mt-0.5 h-3 w-20" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const chunks = chunkItems(filteredInvoices, getLanes())}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each vItems as vRow (vRow.key)}
							{#each chunks[vRow.index] as invoice (invoice._id)}
								<div
									class="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
								>
									<a
										href="/invoices/{invoice._id}"
										class="block min-h-0 flex-1 p-4 transition-all hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
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
									{#if canPayFor(invoice)}
										<div
											class="flex shrink-0 justify-end border-t border-zinc-100 px-3 py-2 dark:border-zinc-800"
										>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onclick={() => (payInvoiceFor = invoice._id)}
											>
												<Wallet class="mr-1.5 size-3.5" />
												{t('action_pay')}
											</Button>
										</div>
									{/if}
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{:else if viewPref.mode === 'grid-2'}
			{#if invoices.isLoading}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<Skeleton class="h-4 w-24" />
									<Skeleton class="mt-1 h-4 w-32" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
							<div class="mt-3 flex items-end justify-between gap-2">
								<div>
									<Skeleton class="h-6 w-24" />
									<Skeleton class="mt-0.5 h-3 w-20" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const chunks = chunkItems(filteredInvoices, getLanes())}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each vItems as vRow (vRow.key)}
							{#each chunks[vRow.index] as invoice (invoice._id)}
								<div
									class="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
								>
									<a
										href="/invoices/{invoice._id}"
										class="block min-h-0 flex-1 p-4 transition-all hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
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
									{#if canPayFor(invoice)}
										<div
											class="flex shrink-0 justify-end border-t border-zinc-100 px-3 py-2 dark:border-zinc-800"
										>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onclick={() => (payInvoiceFor = invoice._id)}
											>
												<Wallet class="mr-1.5 size-3.5" />
												{t('action_pay')}
											</Button>
										</div>
									{/if}
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{:else if viewPref.mode === 'list'}
			{#if invoices.isLoading}
				<div class="flex flex-col gap-2">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<Skeleton class="h-4 w-24" />
									<Skeleton class="mt-1 h-4 w-32" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
							<div class="mt-3 flex items-end justify-between gap-2">
								<div>
									<Skeleton class="h-6 w-24" />
									<Skeleton class="mt-0.5 h-3 w-20" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="flex flex-col gap-2">
						{#each vItems as vRow (vRow.key)}
						{@const invoice = filteredInvoices[vRow.index]}
							<div
								class="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
							>
								<a
									href="/invoices/{invoice._id}"
									class="block min-h-0 flex-1 p-4 transition-all hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
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
								{#if canPayFor(invoice)}
									<div
										class="flex shrink-0 justify-end border-t border-zinc-100 px-3 py-2 dark:border-zinc-800"
									>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onclick={() => (payInvoiceFor = invoice._id)}
										>
											<Wallet class="mr-1.5 size-3.5" />
											{t('action_pay')}
										</Button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
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
							<Table.Head class="w-28 text-right font-semibold">{t('invoice_actions')}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if invoices.isLoading}
							{#each Array(skeletons.count) as _, i}
								<Table.Row class="skeleton-stagger border-zinc-100 dark:border-zinc-800">
									<Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
									<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-20" /></Table.Cell>
									<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-8 w-16" /></Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							{@const vItems = $virtualizer.getVirtualItems()}
							{@const totalSize = $virtualizer.getTotalSize()}
							{#if vItems.length > 0}
								<tr><td colspan="7" style="height:{vItems[0].start}px;padding:0;border:none;"></td></tr>
							{/if}
							{#each vItems as vRow (vRow.key)}
								{@const invoice = filteredInvoices[vRow.index]}
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
									<Table.Cell
										class="w-28 text-right"
										onclick={(e) => e.stopPropagation()}
									>
										{#if canPayFor(invoice)}
											<Button
												type="button"
												variant="secondary"
												size="sm"
												class="h-8"
												onclick={() => (payInvoiceFor = invoice._id)}
											>
												<Wallet class="mr-1 size-3.5" />
												{t('action_pay')}
											</Button>
										{:else}
											<span class="text-zinc-400">—</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
							{#if vItems.length > 0}
								<tr><td colspan="7" style="height:{totalSize - vItems[vItems.length - 1].end}px;padding:0;border:none;"></td></tr>
							{/if}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	{/if}

	{#if payInvoiceFor}
		<InvoicePayDialog bind:invoiceId={payInvoiceFor} />
	{/if}
</div>
