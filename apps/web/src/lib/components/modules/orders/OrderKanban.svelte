<script lang="ts">
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'
	import { getConvexClient, api } from '$lib/convex'
	import { t } from '$lib/t.svelte'
	import { formatNPR } from '$lib/currency'
	import { formatDate } from '$lib/date-utils'
	import { toast } from 'svelte-sonner'
	import { Plus } from '@lucide/svelte'
	import { Button } from '$lib/components/ui/button'

	type Order = {
		_id: string
		id: string
		issuedAt: string
		invoiceNumber?: string
		partyId?: string
		items: { productTitle: string; quantity: number; rate: number; total: number }[]
		totalAmount: number
		paidAmount: number
		paymentStatus: string
	}

	type Column = {
		id: string
		label: string
		items: Order[]
		locked: boolean
		colorClass: string
		headerClass: string
	}

	let orders = $state<Order[]>([])
	let customerNames = $state<Record<string, string>>({})
	let loaded = $state(false)
	const flipDurationMs = 200

	$effect(() => {
		loadOrders()
	})

	async function loadOrders() {
		const client = getConvexClient()
		const [ordersData, customers] = await Promise.all([
			client.query(api['functions/orders'].list, {}),
			client.query(api['functions/customers'].list, {}),
		])
		orders = ordersData.map((o: any) => ({ ...o, id: o._id }))
		const nameMap: Record<string, string> = {}
		for (const c of customers) {
			nameMap[c._id] = c.name
		}
		customerNames = nameMap
		loaded = true
	}

	function orderStatus(order: Order): string {
		if (order.invoiceNumber) return 'done'
		if (order.paymentStatus === 'cancelled') return 'cancelled'
		return 'pending'
	}

	let columns = $derived.by((): Column[] => {
		const pending = orders.filter((o) => orderStatus(o) === 'pending')
		const done = orders.filter((o) => orderStatus(o) === 'done')
		const cancelled = orders.filter((o) => orderStatus(o) === 'cancelled')

		return [
			{
				id: 'pending',
				label: t('status_pending'),
				items: pending,
				locked: false,
				colorClass: 'border-blue-200 dark:border-blue-800',
				headerClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
			},
			{
				id: 'done',
				label: t('status_done'),
				items: done,
				locked: true,
				colorClass: 'border-emerald-200 dark:border-emerald-800',
				headerClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
			},
			{
				id: 'cancelled',
				label: t('status_cancelled'),
				items: cancelled,
				locked: true,
				colorClass: 'border-zinc-200 dark:border-zinc-700',
				headerClass: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
			},
		]
	})

	// Mutable column items for drag-and-drop
	let pendingItems = $state<Order[]>([])
	let doneItems = $state<Order[]>([])
	let cancelledItems = $state<Order[]>([])

	// Sync derived columns to mutable state
	$effect(() => {
		const pending = orders.filter((o) => orderStatus(o) === 'pending')
		const done = orders.filter((o) => orderStatus(o) === 'done')
		const cancelled = orders.filter((o) => orderStatus(o) === 'cancelled')
		pendingItems = pending
		doneItems = done
		cancelledItems = cancelled
	})

	async function handleDndConsider(column: string, e: CustomEvent<{ items: Order[] }>) {
		if (column === 'pending') pendingItems = e.detail.items
		else if (column === 'done') doneItems = e.detail.items
		else cancelledItems = e.detail.items
	}

	async function handleDndFinalize(column: string, e: CustomEvent<{ items: Order[]; info: { trigger: string } }>) {
		const items = e.detail.items
		if (column === 'pending') pendingItems = items
		else if (column === 'done') doneItems = items
		else cancelledItems = items

		// Only act on drop, not sort
		if (e.detail.info.trigger !== TRIGGERS.DROPPED_INTO_ZONE) return

		const client = getConvexClient()

		for (const item of items) {
			// Skip shadow items
			if ((item as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME]) continue

			const currentStatus = orderStatus(item)

			if (column === 'done' && currentStatus === 'pending') {
				try {
					await client.mutation(api['functions/orders'].markDone, { orderId: item._id as any })
					toast.success(t('toast_order_done'))
					await loadOrders()
				} catch (err: any) {
					toast.error(err.message ?? t('common_error'))
					await loadOrders()
				}
			} else if (column === 'cancelled' && currentStatus === 'pending') {
				try {
					await client.mutation(api['functions/orders'].cancel, { orderId: item._id as any })
					toast.success(t('toast_order_cancelled'))
					await loadOrders()
				} catch (err: any) {
					toast.error(err.message ?? t('common_error'))
					await loadOrders()
				}
			}
		}
	}

	function itemsSummary(items: { productTitle: string; quantity: number }[]): string {
		if (items.length <= 2) {
			return items.map((i) => `${i.productTitle} ×${i.quantity}`).join(', ')
		}
		return `${items[0].productTitle} ×${items[0].quantity} +${items.length - 1} more`
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
			case 'partial':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
			default:
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
		}
	}
</script>

<div class="space-y-4">
	<!-- Add New Order -->
	<div class="flex items-center justify-between">
		<p class="text-xs text-zinc-400 dark:text-zinc-500">{t('order_drag_hint')}</p>
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

	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
				<p class="text-sm text-zinc-500">{t('common_loading')}</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<!-- Pending Column -->
			<div class="flex flex-col rounded-xl border border-blue-200 bg-white dark:border-blue-800 dark:bg-zinc-950">
				<div class="flex items-center justify-between rounded-t-xl bg-blue-50 px-4 py-3 dark:bg-blue-950">
					<span class="text-sm font-semibold text-blue-700 dark:text-blue-300">
						{t('status_pending')}
					</span>
					<span class="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
						{pendingItems.length}
					</span>
				</div>
				<div
					class="flex min-h-[200px] flex-col gap-2 p-3"
					use:dndzone={{
						items: pendingItems,
						flipDurationMs,
						dropTargetStyle: { outline: 'none' },
					}}
					onconsider={(e) => handleDndConsider('pending', e)}
					onfinalize={(e) => handleDndFinalize('pending', e)}
				>
					{#each pendingItems as order (order.id)}
						<a
							href="/orders/{order._id}"
							class="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
							animate:flip={{ duration: flipDurationMs }}
						>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<p class="text-xs text-zinc-400">{formatDate(order.issuedAt, 'short')}</p>
									<p class="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
										{order.partyId ? (customerNames[order.partyId] ?? '—') : t('common_walk_in')}
									</p>
								</div>
								<span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold {statusBadgeClass(order.paymentStatus)}">
									{order.paymentStatus}
								</span>
							</div>
							<p class="mt-1.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
								{itemsSummary(order.items)}
							</p>
							<div class="mt-2 flex items-baseline justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
								<span class="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
									{formatNPR(order.totalAmount, true)}
								</span>
								{#if order.paidAmount > 0}
									<span class="font-mono text-xs text-emerald-600 dark:text-emerald-400">
										{formatNPR(order.paidAmount, true)}
									</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</div>

			<!-- Done Column -->
			<div class="flex flex-col rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-zinc-950">
				<div class="flex items-center justify-between rounded-t-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950">
					<span class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
						{t('status_done')}
					</span>
					<span class="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
						{doneItems.length}
					</span>
				</div>
				<div
					class="flex min-h-[200px] flex-col gap-2 p-3"
					use:dndzone={{
						items: doneItems,
						flipDurationMs,
						dropTargetStyle: { outline: 'none' },
					}}
					onconsider={(e) => handleDndConsider('done', e)}
					onfinalize={(e) => handleDndFinalize('done', e)}
				>
					{#each doneItems as order (order.id)}
						<a
							href="/orders/{order._id}"
							class="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30"
							animate:flip={{ duration: flipDurationMs }}
						>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<p class="text-xs text-zinc-400">{formatDate(order.issuedAt, 'short')}</p>
									<p class="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
										{order.partyId ? (customerNames[order.partyId] ?? '—') : t('common_walk_in')}
									</p>
								</div>
							</div>
							<p class="mt-1.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
								{itemsSummary(order.items)}
							</p>
							<div class="mt-2 flex items-baseline justify-between border-t border-emerald-100 pt-2 dark:border-emerald-900">
								<span class="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
									{formatNPR(order.totalAmount, true)}
								</span>
								{#if order.invoiceNumber}
									<span class="text-[10px] text-zinc-400">{order.invoiceNumber}</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</div>

			<!-- Cancelled Column -->
			<div class="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
				<div class="flex items-center justify-between rounded-t-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
					<span class="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
						{t('status_cancelled')}
					</span>
					<span class="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-bold text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
						{cancelledItems.length}
					</span>
				</div>
				<div
					class="flex min-h-[200px] flex-col gap-2 p-3"
					use:dndzone={{
						items: cancelledItems,
						flipDurationMs,
						dropTargetStyle: { outline: 'none' },
					}}
					onconsider={(e) => handleDndConsider('cancelled', e)}
					onfinalize={(e) => handleDndFinalize('cancelled', e)}
				>
					{#each cancelledItems as order (order.id)}
						<div
							class="rounded-lg border border-zinc-200 bg-zinc-50 p-3 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
							animate:flip={{ duration: flipDurationMs }}
						>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<p class="text-xs text-zinc-400">{formatDate(order.issuedAt, 'short')}</p>
									<p class="mt-0.5 truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
										{order.partyId ? (customerNames[order.partyId] ?? '—') : t('common_walk_in')}
									</p>
								</div>
							</div>
							<p class="mt-1.5 truncate text-xs text-zinc-400">
								{itemsSummary(order.items)}
							</p>
							<div class="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
								<span class="font-mono text-sm text-zinc-400 line-through">
									{formatNPR(order.totalAmount, true)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
