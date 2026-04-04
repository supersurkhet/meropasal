<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Badge } from '$lib/components/ui/badge'
	import * as Table from '$lib/components/ui/table'
	import { formatNPR } from '$lib/currency'
	import { getConvexClient } from '$lib/convex'
	import { api } from '$lib/api'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import { Plus, PackageOpen } from '@lucide/svelte'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { formatDate } from '$lib/date-utils'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'
	type Invoice = {
		_id: string
		invoiceNumber?: string
		partyId?: string
		issuedAt: string
		totalAmount: number
		paymentStatus: string
		items: Array<{ productTitle: string; quantity: number; rate: number; total: number }>
	}

	type Party = { _id: string; name: string }

	let invoices = $state<Invoice[]>([])
	let parties = $state<Party[]>([])
	let loaded = $state(false)
	const skeletons = createStaggeredSkeletons()

	const viewPref = createViewPreference('stock-import')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	$effect(() => {
		loadData()
	})

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
		const [invoicesData, partiesData] = await Promise.all([
			client.query(api.functions.stockImport.list, {}),
			client.query(api.functions.parties.list, {}),
		])
		invoices = invoicesData
		parties = partiesData
		loaded = true
	}

	function getPartyName(partyId?: string): string {
		if (!partyId) return '—'
		return parties.find((p) => p._id === partyId)?.name ?? '—'
	}

	function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'paid': return 'default'
			case 'partial': return 'secondary'
			case 'pending': return 'outline'
			default: return 'destructive'
		}
	}

	function statusLabel(status: string): string {
		switch (status) {
			case 'paid': return t('status_paid')
			case 'partial': return t('status_partial')
			case 'pending': return t('status_pending')
			default: return status
		}
	}

	const gridClass = $derived(
		viewPref.mode === 'grid-3'
			? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
			: viewPref.mode === 'grid-2'
				? 'grid grid-cols-1 gap-4 md:grid-cols-2'
				: 'flex flex-col gap-2'
	)

	// Virtualization
	const getLanes = useBreakpointLanes(() => viewPref.mode)

	const virtualizer = createVirtualizer({
		count: 0,
		getScrollElement: () => document.getElementById('main-content'),
		estimateSize: () => 49,
		overscan: 5,
	})

	$effect(() => {
		const items = invoices
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
	<!-- Toolbar -->
	<div class="flex items-center justify-end gap-3">
		<a href="/stock-import/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('action_new_import')}
			</Button>
		</a>
	</div>

	<!-- Content -->
	{#if loaded && invoices.length === 0}
		<EmptyState
			icon={PackageOpen}
			title={t('empty_stock_import')}
			description={t('empty_stock_import_desc')}
			actionLabel={t('stock_import_create')}
			actionHref="/stock-import/new"
			actionIcon={Plus}
		/>
	{:else}
		{#if viewPref.mode === 'table'}
			<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<Table.Root>
					<Table.Header>
						<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('invoice_number')}</Table.Head>
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('stock_import_party')}</Table.Head>
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('common_date')}</Table.Head>
							<Table.Head class="text-center font-semibold text-zinc-600 dark:text-zinc-400">{t('stock_import_items')}</Table.Head>
							<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('common_total')}</Table.Head>
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('order_status')}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if !loaded}
							{#each Array(skeletons.count) as _, i}
								<Table.Row class="skeleton-stagger border-zinc-100 dark:border-zinc-800">
									<Table.Cell><Skeleton class="h-5 w-20 rounded-full" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
									<Table.Cell class="text-center"><Skeleton class="mx-auto h-4 w-8" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-20" /></Table.Cell>
									<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							{@const vItems = $virtualizer.getVirtualItems()}
							{@const totalSize = $virtualizer.getTotalSize()}
							{#if vItems.length > 0}
								<tr><td colspan="6" style="height:{vItems[0].start}px;padding:0;border:none;"></td></tr>
							{/if}
							{#each vItems as vRow (vRow.key)}
								{@const inv = invoices[vRow.index]}
								<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60" onclick={() => { window.location.href = `/stock-import/${inv._id}` }}>
									<Table.Cell>
										{#if inv.invoiceNumber}
											<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
												{inv.invoiceNumber}
											</Badge>
										{:else}
											<span class="text-xs text-zinc-400">---</span>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-sm text-zinc-600 dark:text-zinc-400">
										{getPartyName(inv.partyId)}
									</Table.Cell>
									<Table.Cell class="text-sm text-zinc-500 dark:text-zinc-400">
										{formatDate(inv.issuedAt)}
									</Table.Cell>
									<Table.Cell class="text-center font-mono text-sm text-zinc-700 dark:text-zinc-300">
										{inv.items.length}
									</Table.Cell>
									<Table.Cell class="text-right font-mono text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
										{formatNPR(inv.totalAmount)}
									</Table.Cell>
									<Table.Cell>
										<Badge variant={statusVariant(inv.paymentStatus)} class="text-xs capitalize">
											{statusLabel(inv.paymentStatus)}
										</Badge>
									</Table.Cell>
								</Table.Row>
							{/each}
							{#if vItems.length > 0}
								<tr><td colspan="6" style="height:{totalSize - vItems[vItems.length - 1].end}px;padding:0;border:none;"></td></tr>
							{/if}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		{:else}
			<div class={gridClass}>
				{#if !loaded}
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 flex-1">
									<Skeleton class="mb-2 h-5 w-20 rounded-full" />
									<Skeleton class="h-4 w-32" />
									<Skeleton class="mt-0.5 h-3 w-20" />
								</div>
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
							<div class="mt-3 flex items-end justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
								<Skeleton class="h-3 w-16" />
								<Skeleton class="h-5 w-24" />
							</div>
						</div>
					{/each}
				{:else}
					{@const isListMode = viewPref.mode === 'list'}
					{#if isListMode}
						{@const vItems = $virtualizer.getVirtualItems()}
						{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
						{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
						<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
							<div class="flex flex-col gap-2">
								{#each vItems as vRow (vRow.key)}
								{@const inv = invoices[vRow.index]}
									<a
										href="/stock-import/{inv._id}"
										class="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
									>
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0 flex-1">
												{#if inv.invoiceNumber}
													<Badge variant="secondary" class="mb-2 bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
														{inv.invoiceNumber}
													</Badge>
												{/if}
												<p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
													{getPartyName(inv.partyId)}
												</p>
												<p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
													{formatDate(inv.issuedAt)}
												</p>
											</div>
											<Badge variant={statusVariant(inv.paymentStatus)} class="shrink-0 text-xs capitalize">
												{statusLabel(inv.paymentStatus)}
											</Badge>
										</div>
										<div class="mt-3 flex items-end justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
											<span class="text-xs text-zinc-500 dark:text-zinc-400">
												{inv.items.length} {t('stock_import_items')}
											</span>
											<span class="font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
												{formatNPR(inv.totalAmount)}
											</span>
										</div>
									</a>
								{/each}
							</div>
						</div>
					{:else}
						{@const vItems = $virtualizer.getVirtualItems()}
						{@const chunks = chunkItems(invoices, getLanes())}
						{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
						{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
						<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
							<div class={gridClass}>
								{#each vItems as vRow (vRow.key)}
									{#each chunks[vRow.index] as inv (inv._id)}
											<a
												href="/stock-import/{inv._id}"
												class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
											>
												<div class="flex items-start justify-between gap-2">
													<div class="min-w-0 flex-1">
														{#if inv.invoiceNumber}
															<Badge variant="secondary" class="mb-2 bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
																{inv.invoiceNumber}
															</Badge>
														{/if}
														<p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
															{getPartyName(inv.partyId)}
														</p>
														<p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
															{formatDate(inv.issuedAt)}
														</p>
													</div>
													<Badge variant={statusVariant(inv.paymentStatus)} class="shrink-0 text-xs capitalize">
														{statusLabel(inv.paymentStatus)}
													</Badge>
												</div>
												<div class="mt-3 flex items-end justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
													<span class="text-xs text-zinc-500 dark:text-zinc-400">
														{inv.items.length} {t('stock_import_items')}
													</span>
													<span class="font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
														{formatNPR(inv.totalAmount)}
													</span>
												</div>
											</a>
									{/each}
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	{/if}
</div>
