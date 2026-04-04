<script lang="ts">
	import { Input } from '$lib/components/ui/input'
	import { Button } from '$lib/components/ui/button'
	import { Badge } from '$lib/components/ui/badge'
	import * as Table from '$lib/components/ui/table'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
	import { formatNPR } from '$lib/currency'
	import { formatUnit } from '$lib/unit-price'
	import { getConvexClient } from '$lib/convex'
	import { api } from '$lib/api'
	import { toast } from 'svelte-sonner'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from '@lucide/svelte'
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { t } from '$lib/t.svelte'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'

	type Product = {
		_id: string
		title: string
		purchasePartyId: string
		unit?: string
		costPrice: number
		sellingPrice?: number
		openingStock: number
		category?: string
		sku?: string
		isActive: boolean
	}

	type Party = {
		_id: string
		name: string
	}

	const viewPref = createViewPreference('products')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	let products = $state<Product[]>([])
	let parties = $state<Party[]>([])
	let loaded = $state(false)
	const skeletons = createStaggeredSkeletons()
	let searchTerm = $state('')

	$effect(() => {
		loadData()
	})

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
		const [productsData, partiesData] = await Promise.all([
			client.query(api.functions.products.list, {}),
			client.query(api.functions.parties.list, {}),
		])
		products = productsData
		parties = partiesData
		loaded = true
	}

	function getPartyName(partyId: string): string {
		return parties.find((p) => p._id === partyId)?.name ?? '—'
	}

	let filteredProducts = $derived(
		searchTerm
			? products.filter((p) =>
					p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
					(p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
				)
			: products,
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
		const items = filteredProducts
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

	let confirmDeleteId = $state<string | null>(null)
	let confirmOpen = $state(false)
	let deleting = $state(false)

	function requestDelete(id: string) {
		confirmDeleteId = id
		confirmOpen = true
	}

	async function handleDelete() {
		if (!confirmDeleteId) return
		deleting = true
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
			await client.mutation(api.functions.products.remove, { id: confirmDeleteId as any })
			toast.success(t('toast_product_deleted'))
			await loadData()
		} finally {
			deleting = false
			confirmOpen = false
			confirmDeleteId = null
		}
	}
</script>

{#snippet actionMenu(product: Product)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button
				variant="ghost"
				size="sm"
				class="size-8 p-0 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
				aria-label="More options"
			>
				<MoreHorizontal class="size-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-40">
			<a href="/products/{product._id}/edit">
				<DropdownMenu.Item class="cursor-pointer">
					<Pencil class="mr-2 size-4" />
					{t('action_edit')}
				</DropdownMenu.Item>
			</a>
			<DropdownMenu.Item
				class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
				onclick={() => requestDelete(product._id)}
			>
				<Trash2 class="mr-2 size-4" />
				{t('action_delete')}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
			<Input
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				placeholder={t('search_products')}
				bind:value={searchTerm}
			/>
		</div>
		<a href="/products/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('product_create')}
			</Button>
		</a>
	</div>

	<!-- Content -->
	{#if loaded && filteredProducts.length === 0}
		{#if searchTerm}
			<EmptyState
				icon={Package}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={Package}
				title={t('empty_products')}
				description={t('empty_products_desc')}
				actionLabel={t('product_create')}
				actionHref="/products/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		{#if viewPref.mode === 'grid-3'}
			{#if !loaded}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-2">
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-8 w-8 rounded-md" />
							</div>
							<Skeleton class="mt-0.5 h-3 w-24" />
							<div class="mt-3 flex items-baseline gap-3">
								<div>
									<Skeleton class="h-2 w-8" />
									<Skeleton class="mt-1 h-4 w-16" />
								</div>
								<div>
									<Skeleton class="h-2 w-8" />
									<Skeleton class="mt-1 h-4 w-16" />
								</div>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-1.5">
								<Skeleton class="h-5 w-12 rounded-full" />
								<Skeleton class="h-5 w-20 rounded-full" />
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const chunks = chunkItems(filteredProducts, getLanes())}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each vItems as vRow (vRow.key)}
							{#each chunks[vRow.index] as product (product._id)}
																<div class="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
									<div class="flex items-start justify-between gap-2">
										<a
											href="/products/{product._id}"
											class="text-sm font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
										>
											{product.title}
										</a>
										<div class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
											{@render actionMenu(product)}
										</div>
									</div>
									<p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
										{getPartyName(product.purchasePartyId)}
									</p>
									<div class="mt-3 flex items-baseline gap-3">
										<div>
											<span class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Cost</span>
											<p class="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">{formatNPR(product.costPrice, true)}</p>
										</div>
										<div>
											<span class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Sell</span>
											<p class="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">{formatNPR(product.sellingPrice ?? 0, true)}</p>
										</div>
									</div>
									<div class="mt-3 flex flex-wrap items-center gap-1.5">
										<Badge variant="secondary" class="bg-zinc-100 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
											{formatUnit(product.unit)}
										</Badge>
										<Badge variant="secondary" class="bg-zinc-100 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
											{product.openingStock} in stock
										</Badge>
										{#if product.category}
											<Badge variant="outline" class="border-zinc-300 text-[11px] capitalize text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
												{product.category}
											</Badge>
										{/if}
									</div>
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{:else if viewPref.mode === 'grid-2'}
			{#if !loaded}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<Skeleton class="h-5 w-40" />
									<Skeleton class="mt-0.5 h-4 w-28" />
								</div>
								<Skeleton class="h-8 w-8 rounded-md" />
							</div>
							<div class="mt-4 grid grid-cols-2 gap-4">
								<div class="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
									<Skeleton class="h-2 w-16" />
									<Skeleton class="mt-0.5 h-4 w-20" />
								</div>
								<div class="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
									<Skeleton class="h-2 w-16" />
									<Skeleton class="mt-0.5 h-4 w-20" />
								</div>
							</div>
							<div class="mt-4 flex flex-wrap items-center gap-2">
								<Skeleton class="h-5 w-12 rounded-full" />
								<Skeleton class="h-5 w-20 rounded-full" />
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const chunks = chunkItems(filteredProducts, getLanes())}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each vItems as vRow (vRow.key)}
							{#each chunks[vRow.index] as product (product._id)}
																		<div class="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0 flex-1">
												<a
													href="/products/{product._id}"
													class="text-base font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
												>
													{product.title}
												</a>
												<p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
													{getPartyName(product.purchasePartyId)}
												</p>
											</div>
											<div class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
												{@render actionMenu(product)}
											</div>
										</div>
										<div class="mt-4 grid grid-cols-2 gap-4">
											<div class="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
												<span class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Cost price</span>
												<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{formatNPR(product.costPrice, true)}</p>
											</div>
											<div class="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
												<span class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Selling price</span>
												<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{formatNPR(product.sellingPrice ?? 0, true)}</p>
											</div>
										</div>
										<div class="mt-4 flex flex-wrap items-center gap-2">
											<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
												{formatUnit(product.unit)}
											</Badge>
											<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
												{product.openingStock} in stock
											</Badge>
											{#if product.category}
												<Badge variant="outline" class="border-zinc-300 text-xs capitalize text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
													{product.category}
												</Badge>
											{/if}
											{#if product.sku}
												<span class="text-xs text-zinc-400 dark:text-zinc-500">SKU: {product.sku}</span>
											{/if}
										</div>
									</div>
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{:else if viewPref.mode === 'list'}
			{#if !loaded}
				<div class="flex flex-col gap-2">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<Skeleton class="min-w-0 flex-1 h-4 w-36" />
							<Skeleton class="hidden shrink-0 h-3 w-24 sm:inline-block" />
							<div class="hidden shrink-0 items-center gap-3 sm:flex">
								<Skeleton class="h-3 w-16" />
								<Skeleton class="h-3 w-16" />
							</div>
							<Skeleton class="hidden h-5 w-12 rounded-full md:inline-block" />
							<Skeleton class="hidden h-3 w-10 md:inline-block" />
							<Skeleton class="hidden h-5 w-16 rounded-full lg:inline-block" />
							<Skeleton class="h-8 w-8 rounded-md" />
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
						{@const product = filteredProducts[vRow.index]}
							<div class="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
								<a
									href="/products/{product._id}"
									class="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
								>
									{product.title}
								</a>
								<span class="hidden shrink-0 text-xs text-zinc-500 sm:inline dark:text-zinc-400">
									{getPartyName(product.purchasePartyId)}
								</span>
								<div class="hidden shrink-0 items-center gap-3 sm:flex">
									<span class="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatNPR(product.costPrice, true)}</span>
									<span class="text-zinc-300 dark:text-zinc-600">/</span>
									<span class="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatNPR(product.sellingPrice ?? 0, true)}</span>
								</div>
								<Badge variant="secondary" class="hidden shrink-0 bg-zinc-100 font-mono text-[11px] text-zinc-600 md:inline-flex dark:bg-zinc-800 dark:text-zinc-300">
									{formatUnit(product.unit)}
								</Badge>
								<span class="hidden shrink-0 font-mono text-xs tabular-nums text-zinc-500 md:inline dark:text-zinc-400">
									{product.openingStock}
								</span>
								{#if product.category}
									<Badge variant="outline" class="hidden shrink-0 border-zinc-300 text-[11px] capitalize text-zinc-600 lg:inline-flex dark:border-zinc-600 dark:text-zinc-300">
										{product.category}
									</Badge>
								{/if}
								<div class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
									{@render actionMenu(product)}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<Table.Root>
					<Table.Header>
						<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('product_name')}</Table.Head>
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('product_supplier')}</Table.Head>
							<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('table_cost')}</Table.Head>
							<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('table_selling')}</Table.Head>
							<Table.Head class="text-center font-semibold text-zinc-600 dark:text-zinc-400">{t('product_unit')}</Table.Head>
							<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('table_stock')}</Table.Head>
							<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('product_category')}</Table.Head>
							<Table.Head class="w-12"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if !loaded}
							{#each Array(skeletons.count) as _, i}
								<Table.Row class="skeleton-stagger border-zinc-100 dark:border-zinc-800">
									<Table.Cell><Skeleton class="h-4 w-36" /></Table.Cell>
									<Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-16" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-16" /></Table.Cell>
									<Table.Cell class="text-center"><Skeleton class="mx-auto h-5 w-12 rounded-full" /></Table.Cell>
									<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-12" /></Table.Cell>
									<Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
									<Table.Cell><Skeleton class="h-8 w-8 rounded-md" /></Table.Cell>
								</Table.Row>
							{/each}
						{:else}
							{@const vItems = $virtualizer.getVirtualItems()}
							{@const totalSize = $virtualizer.getTotalSize()}
							{#if vItems.length > 0}
								<tr><td colspan="8" style="height:{vItems[0].start}px;padding:0;border:none;"></td></tr>
							{/if}
							{#each vItems as vRow (vRow.key)}
								{@const product = filteredProducts[vRow.index]}
																<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
									<Table.Cell>
										<a
											href="/products/{product._id}"
											class="block font-medium text-zinc-900 dark:text-zinc-100"
										>
											{product.title}
										</a>
									</Table.Cell>
									<Table.Cell class="text-sm text-zinc-600 dark:text-zinc-400">
										{getPartyName(product.purchasePartyId)}
									</Table.Cell>
									<Table.Cell class="text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
										{formatNPR(product.costPrice, true)}
									</Table.Cell>
									<Table.Cell class="text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
										{formatNPR(product.sellingPrice ?? 0, true)}
									</Table.Cell>
									<Table.Cell class="text-center">
										<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
											{formatUnit(product.unit)}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
										{product.openingStock}
									</Table.Cell>
									<Table.Cell>
										{#if product.category}
											<Badge variant="outline" class="text-xs capitalize border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300">{product.category}</Badge>
										{:else}
											<span class="text-xs text-zinc-400">—</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										<div class="opacity-0 transition-opacity group-hover:opacity-100">
											{@render actionMenu(product)}
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
							{#if vItems.length > 0}
								<tr><td colspan="8" style="height:{totalSize - vItems[vItems.length - 1].end}px;padding:0;border:none;"></td></tr>
							{/if}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('action_delete') + ' ' + t('product_title')}
	description={t('confirm_delete_product')}
	confirmLabel={t('action_delete')}
	loading={deleting}
	onconfirm={handleDelete}
/>
