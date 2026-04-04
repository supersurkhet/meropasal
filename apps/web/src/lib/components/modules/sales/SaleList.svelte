<script lang="ts">
	import * as Table from '$lib/components/ui/table'
	import { Button } from '$lib/components/ui/button'
	import { getConvexClient, api } from '$lib/convex'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
	import { ShoppingCart, Plus } from '@lucide/svelte'
	import { formatDate } from '$lib/date-utils'
	import { formatNPR } from '$lib/currency'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'
	type SaleInvoice = {
		_id: string
		invoiceNumber?: string
		issuedAt: string
		partyId?: string
		items: { productTitle: string; quantity: number }[]
		totalAmount: number
	}

	const viewPref = createViewPreference('sales')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	let sales = $state<SaleInvoice[]>([])
	let customerNames = $state<Record<string, string>>({})
	let loaded = $state(false)
	const skeletons = createStaggeredSkeletons()

	$effect(() => {
		loadSales()
	})

	async function loadSales() {
		const client = getConvexClient()
		const [salesData, customers] = await Promise.all([
			client.query(api['functions/sales'].list, {}),
			client.query(api['functions/customers'].list, {}),
		])
		// Sales list returns invoices — only show those with invoiceNumber (fulfilled sales)
		sales = salesData.filter((s: any) => s.invoiceNumber)
		const nameMap: Record<string, string> = {}
		for (const c of customers) {
			nameMap[c._id] = c.name
		}
		customerNames = nameMap
		loaded = true
	}

	function itemsSummary(items: { productTitle: string; quantity: number }[]): string {
		if (items.length <= 2) {
			return items.map((i) => `${i.productTitle} ×${i.quantity}`).join(', ')
		}
		return `${items[0].productTitle} ×${items[0].quantity} +${items.length - 1} more`
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
		const items = sales
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
{#if loaded && sales.length === 0}
	<EmptyState
		icon={ShoppingCart}
		title={t('empty_sales')}
		description={t('empty_sales_desc')}
		actionLabel={t('sale_create')}
		actionHref="/sales/new"
		actionIcon={Plus}
	/>
{:else}
	<!-- Toolbar -->
	<div class="flex items-center justify-end gap-3">
		<a href="/sales/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('sale_create')}
			</Button>
		</a>
	</div>

	{#if viewPref.mode === 'table'}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('common_date')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('sale_customer')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('sale_items')}</Table.Head>
						<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('common_total')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('invoice_number')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if !loaded}
						{#each Array(skeletons.count) as _, i}
							<Table.Row class="skeleton-stagger border-zinc-100 dark:border-zinc-800">
								<Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
								<Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
								<Table.Cell><Skeleton class="h-4 w-40" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-20" /></Table.Cell>
								<Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
							</Table.Row>
						{/each}
					{:else}
						{@const vItems = $virtualizer.getVirtualItems()}
						{@const totalSize = $virtualizer.getTotalSize()}
						{#if vItems.length > 0}
							<tr><td colspan="5" style="height:{vItems[0].start}px;padding:0;border:none;"></td></tr>
						{/if}
						{#each vItems as vRow (vRow.key)}
							{@const sale = sales[vRow.index]}
							<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60" onclick={() => { window.location.href = `/sales/${sale._id}` }}>
								<Table.Cell class="text-sm text-zinc-700 dark:text-zinc-300">
									{formatDate(sale.issuedAt)}
								</Table.Cell>
								<Table.Cell class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
									{sale.partyId ? (customerNames[sale.partyId] ?? '—') : t('common_walk_in')}
								</Table.Cell>
								<Table.Cell class="max-w-[240px] truncate text-sm text-zinc-600 dark:text-zinc-400">
									{itemsSummary(sale.items)}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									{formatNPR(sale.totalAmount, true)}
								</Table.Cell>
								<Table.Cell class="font-mono text-xs text-zinc-500 dark:text-zinc-400">
									{sale.invoiceNumber ?? '—'}
								</Table.Cell>
							</Table.Row>
						{/each}
						{#if vItems.length > 0}
							<tr><td colspan="5" style="height:{totalSize - vItems[vItems.length - 1].end}px;padding:0;border:none;"></td></tr>
						{/if}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	{:else if viewPref.mode === 'list'}
		{#if !loaded}
			<div class="flex flex-col gap-2">
				{#each Array(skeletons.count) as _, i}
					<div class="skeleton-stagger block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex items-center gap-2">
									<Skeleton class="h-4 w-20" />
									<Skeleton class="h-3 w-16" />
								</div>
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-4 w-40" />
							</div>
							<Skeleton class="h-5 w-20" />
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
					{@const sale = sales[vRow.index]}
						<a
							href="/sales/{sale._id}"
							class="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1 space-y-1">
									<div class="flex items-center gap-2">
										<span class="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(sale.issuedAt)}</span>
										<span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">{sale.invoiceNumber ?? '—'}</span>
									</div>
									<p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
										{sale.partyId ? (customerNames[sale.partyId] ?? '—') : t('common_walk_in')}
									</p>
									<p class="truncate text-sm text-zinc-500 dark:text-zinc-400">
										{itemsSummary(sale.items)}
									</p>
								</div>
								<span class="shrink-0 font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
									{formatNPR(sale.totalAmount, true)}
								</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		{@const gridClass = viewPref.mode === 'grid-3'
			? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
			: 'grid grid-cols-1 gap-4 md:grid-cols-2'}
		{#if !loaded}
			<div class={gridClass}>
				{#each Array(skeletons.count) as _, i}
					<div class="skeleton-stagger block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex items-center gap-2">
									<Skeleton class="h-4 w-20" />
									<Skeleton class="h-3 w-16" />
								</div>
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-4 w-40" />
							</div>
							<Skeleton class="h-5 w-20" />
						</div>
					</div>
				{/each}
			</div>
		{:else}
			{@const vItems = $virtualizer.getVirtualItems()}
			{@const chunks = chunkItems(sales, getLanes())}
			{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
			{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
			<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
				<div class={gridClass}>
					{#each vItems as vRow (vRow.key)}
						{#each chunks[vRow.index] as sale (sale._id)}
								<a
									href="/sales/{sale._id}"
									class="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1 space-y-1">
											<div class="flex items-center gap-2">
												<span class="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(sale.issuedAt)}</span>
												<span class="font-mono text-xs text-zinc-400 dark:text-zinc-500">{sale.invoiceNumber ?? '—'}</span>
											</div>
											<p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
												{sale.partyId ? (customerNames[sale.partyId] ?? '—') : t('common_walk_in')}
											</p>
											<p class="truncate text-sm text-zinc-500 dark:text-zinc-400">
												{itemsSummary(sale.items)}
											</p>
										</div>
										<span class="shrink-0 font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
											{formatNPR(sale.totalAmount, true)}
										</span>
									</div>
								</a>
						{/each}
					{/each}
				</div>
			</div>
		{/if}
	{/if}

{/if}
</div>
