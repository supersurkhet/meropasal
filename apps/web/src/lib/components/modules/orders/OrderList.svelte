<script lang="ts">
	import * as Table from '$lib/components/ui/table'
	import * as Select from '$lib/components/ui/select'
	import { Button } from '$lib/components/ui/button'
	import { ClipboardList, Plus } from '@lucide/svelte'
	import { getConvexClient, api } from '$lib/convex'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { formatDate } from '$lib/date-utils'
	import { formatNPR } from '$lib/currency'

	type Order = {
		_id: string
		issuedAt: string
		invoiceNumber?: string
		partyId?: string
		items: { productTitle: string; quantity: number }[]
		totalAmount: number
		paidAmount: number
		paymentStatus: string
	}

	const viewPref = createViewPreference('orders')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	let orders = $state<Order[]>([])
	let customerNames = $state<Record<string, string>>({})
	let statusFilter = $state('all')
	let loaded = $state(false)

	$effect(() => {
		loadOrders()
	})

	async function loadOrders() {
		const client = getConvexClient()
		const [ordersData, customers] = await Promise.all([
			client.query(api['functions/orders'].list, {}),
			client.query(api['functions/customers'].list, {}),
		])
		orders = ordersData
		const nameMap: Record<string, string> = {}
		for (const c of customers) {
			nameMap[c._id] = c.name
		}
		customerNames = nameMap
		loaded = true
	}

	let filteredOrders = $derived.by(() => {
		if (statusFilter === 'all') return orders
		if (statusFilter === 'done') return orders.filter((o) => o.invoiceNumber)
		if (statusFilter === 'cancelled') return orders.filter((o) => o.paymentStatus === 'cancelled')
		if (statusFilter === 'pending') return orders.filter((o) => !o.invoiceNumber && o.paymentStatus !== 'cancelled')
		return orders
	})

	function orderStatus(order: Order): string {
		if (order.invoiceNumber) return 'done'
		if (order.paymentStatus === 'cancelled') return 'cancelled'
		return 'pending'
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'done':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
			case 'cancelled':
				return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
			default:
				return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
		}
	}

	function paymentBadgeClass(status: string): string {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
			case 'partial':
				return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
			case 'pending':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
			default:
				return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
		}
	}

	function itemsSummary(items: { productTitle: string; quantity: number }[]): string {
		if (items.length <= 2) {
			return items.map((i) => `${i.productTitle} ×${i.quantity}`).join(', ')
		}
		return `${items[0].productTitle} ×${items[0].quantity} +${items.length - 1} more`
	}

	function statusLabel(status: string): string {
		return status === 'done' ? t('status_done') : status === 'cancelled' ? t('status_cancelled') : t('status_pending')
	}

	function paymentLabel(status: string): string {
		return status === 'paid' ? t('status_paid') : status === 'partial' ? t('status_partial') : status === 'pending' ? t('status_pending') : status
	}

	let gridClass = $derived.by(() => {
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
<!-- Toolbar -->
<div class="flex items-center justify-between gap-3">
	<Select.Root type="single" bind:value={statusFilter}>
		<Select.Trigger class="h-9 w-44 text-sm border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
			{statusFilter === 'all' ? t('common_all_orders') : statusFilter === 'pending' ? t('status_pending') : statusFilter === 'done' ? t('status_done') : t('status_cancelled')}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="all">{t('common_all_orders')}</Select.Item>
			<Select.Item value="pending">{t('status_pending')}</Select.Item>
			<Select.Item value="done">{t('status_done')}</Select.Item>
			<Select.Item value="cancelled">{t('status_cancelled')}</Select.Item>
		</Select.Content>
	</Select.Root>
	<div class="flex items-center gap-2">
		<a href="/orders/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('order_create')}
			</Button>
		</a>
	</div>
</div>

{#if !loaded}
	<div class="flex items-center justify-center py-20">
		<div class="flex flex-col items-center gap-3">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
			<p class="text-sm text-zinc-500">{t('common_loading')}</p>
		</div>
	</div>
{:else if filteredOrders.length === 0}
	{#if statusFilter !== 'all' || orders.length > 0}
		<EmptyState
			icon={ClipboardList}
			title={t('empty_filtered')}
			description={t('empty_filtered_desc')}
		/>
	{:else}
		<EmptyState
			icon={ClipboardList}
			title={t('empty_orders')}
			description={t('empty_orders_desc')}
			actionLabel={t('order_create')}
			actionHref="/orders/new"
			actionIcon={Plus}
		/>
	{/if}
{:else if viewPref.mode === 'table'}
	<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('common_date')}</Table.Head>
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('order_customer')}</Table.Head>
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('order_items')}</Table.Head>
					<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('common_total')}</Table.Head>
					<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('order_paid')}</Table.Head>
					<Table.Head class="text-center font-semibold text-zinc-600 dark:text-zinc-400">{t('order_status')}</Table.Head>
					<Table.Head class="text-center font-semibold text-zinc-600 dark:text-zinc-400">{t('payment_method')}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredOrders as order}
					{@const status = orderStatus(order)}
					<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
						<Table.Cell>
							<a href="/orders/{order._id}" class="text-sm text-zinc-700 hover:underline dark:text-zinc-300">
								{formatDate(order.issuedAt)}
							</a>
						</Table.Cell>
						<Table.Cell class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
							{order.partyId ? (customerNames[order.partyId] ?? '—') : t('common_walk_in')}
						</Table.Cell>
						<Table.Cell class="max-w-[200px] truncate text-sm text-zinc-600 dark:text-zinc-400">
							{itemsSummary(order.items)}
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{formatNPR(order.totalAmount, true)}
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
							{formatNPR(order.paidAmount, true)}
						</Table.Cell>
						<Table.Cell class="text-center">
							<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {statusBadgeClass(status)}">
								{statusLabel(status)}
							</span>
						</Table.Cell>
						<Table.Cell class="text-center">
							<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {paymentBadgeClass(order.paymentStatus)}">
								{paymentLabel(order.paymentStatus)}
							</span>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<p class="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
		{filteredOrders.length} {filteredOrders.length === 1 ? t('order_title') : t('order_title_plural')}
	</p>
{:else}
	<div class={gridClass}>
		{#each filteredOrders as order}
			{@const status = orderStatus(order)}
			<a
				href="/orders/{order._id}"
				class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
			>
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0">
						<p class="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(order.issuedAt)}</p>
						<p class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
							{order.partyId ? (customerNames[order.partyId] ?? '—') : t('common_walk_in')}
						</p>
					</div>
					<div class="flex shrink-0 gap-1.5">
						<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {statusBadgeClass(status)}">
							{statusLabel(status)}
						</span>
						<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {paymentBadgeClass(order.paymentStatus)}">
							{paymentLabel(order.paymentStatus)}
						</span>
					</div>
				</div>
				<p class="mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
					{itemsSummary(order.items)}
				</p>
				<div class="mt-3 flex items-baseline justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
					<span class="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">
						{formatNPR(order.totalAmount, true)}
					</span>
					<span class="font-mono text-sm text-emerald-600 dark:text-emerald-400">
						{t('order_paid')}: {formatNPR(order.paidAmount, true)}
					</span>
				</div>
			</a>
		{/each}
	</div>
	<p class="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
		{filteredOrders.length} {filteredOrders.length === 1 ? t('order_title') : t('order_title_plural')}
	</p>
{/if}
</div>
