<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Badge } from '$lib/components/ui/badge'
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import {
		Plus,
		Search,
		MoreHorizontal,
		Pencil,
		Trash2,
		Phone,
		Mail,
		UserRound,
		Loader2,
		Wallet,
	} from '@lucide/svelte'
	import { toast } from 'svelte-sonner'
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
import { createViewPreference } from '$lib/view-preference.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { t } from '$lib/t.svelte'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'
	type Customer = {
		_id: string
		name: string
		panNumber?: string
		address?: string
		phone?: string
		email?: string
		creditLimit?: number
		notes?: string
		isActive: boolean
	}

	let {
		customers,
		isLoading = false,
		ondelete,
	}: {
		customers: Customer[]
		isLoading?: boolean
		ondelete?: (id: string) => Promise<void>
	} = $props()

	const skeletons = createStaggeredSkeletons()
	const viewPref = createViewPreference('customers')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	let searchQuery = $state('')
	let deletingId = $state<string | null>(null)
	let confirmDeleteId = $state<string | null>(null)
	let confirmOpen = $state(false)

	let filteredCustomers = $derived(
		customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.phone?.includes(searchQuery) ||
				c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.address?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)

	const getLanes = useBreakpointLanes(() => viewPref.mode)

	const virtualizer = createVirtualizer({
		count: 0,
		getScrollElement: () => document.getElementById('main-content'),
		estimateSize: () => 49,
		overscan: 5,
	})

	$effect(() => {
		const items = filteredCustomers
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

	function requestDelete(id: string) {
		confirmDeleteId = id
		confirmOpen = true
	}

	async function handleDelete() {
		if (!ondelete || !confirmDeleteId) return
		deletingId = confirmDeleteId
		try {
			await ondelete(confirmDeleteId)
			toast.success(t('toast_customer_deleted'))
		} finally {
			deletingId = null
			confirmDeleteId = null
			confirmOpen = false
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ne-NP', {
			style: 'currency',
			currency: 'NPR',
			maximumFractionDigits: 0,
		}).format(amount)
	}
</script>

{#snippet actionDropdown(customer: Customer)}
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="sm"
					class="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
					aria-label="More options"
				>
					<MoreHorizontal class="size-4 text-zinc-500" />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="w-40">
			<a href="/customers/{customer._id}/edit">
				<DropdownMenuItem class="cursor-pointer">
					<Pencil class="mr-2 size-4" />
					{t('action_edit')}
				</DropdownMenuItem>
			</a>
			{#if ondelete}
				<DropdownMenuItem
					class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
					disabled={deletingId === customer._id}
					onclick={() => requestDelete(customer._id)}
				>
					{#if deletingId === customer._id}
						<Loader2 class="mr-2 size-4 animate-spin" />
					{:else}
						<Trash2 class="mr-2 size-4" />
					{/if}
					{t('action_delete')}
				</DropdownMenuItem>
			{/if}
		</DropdownMenuContent>
	</DropdownMenu>
{/snippet}

{#snippet customerCard(customer: Customer)}
	<div class="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<a href="/customers/{customer._id}" class="group/link inline-block">
					<h3 class="truncate text-[15px] font-semibold text-zinc-900 group-hover/link:text-blue-600 dark:text-zinc-100 dark:group-hover/link:text-blue-400">
						{customer.name}
					</h3>
				</a>
				{#if customer.address}
					<p class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{customer.address}</p>
				{/if}
			</div>
			<div class="shrink-0">
				{@render actionDropdown(customer)}
			</div>
		</div>

		<div class="mt-3 space-y-1.5">
			{#if customer.phone}
				<div class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
					<Phone class="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
					<span class="truncate">{customer.phone}</span>
				</div>
			{/if}
			{#if customer.email}
				<div class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
					<Mail class="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
					<span class="truncate">{customer.email}</span>
				</div>
			{/if}
		</div>

		<div class="mt-3 flex items-center gap-2 flex-wrap">
			{#if customer.panNumber}
				<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
					{customer.panNumber}
				</Badge>
			{/if}
			{#if customer.creditLimit}
				<div class="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
					<Wallet class="size-3 text-zinc-400 dark:text-zinc-500" />
					{formatCurrency(customer.creditLimit)}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet customerListItem(customer: Customer)}
	<div class="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-3">
				<a href="/customers/{customer._id}" class="group/link shrink-0">
					<h3 class="text-[15px] font-semibold text-zinc-900 group-hover/link:text-blue-600 dark:text-zinc-100 dark:group-hover/link:text-blue-400">
						{customer.name}
					</h3>
				</a>
				{#if customer.panNumber}
					<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
						{customer.panNumber}
					</Badge>
				{/if}
				{#if customer.address}
					<span class="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:inline">{customer.address}</span>
				{/if}
			</div>
		</div>

		<div class="hidden items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 sm:flex">
			{#if customer.phone}
				<div class="flex items-center gap-1.5">
					<Phone class="size-3.5 text-zinc-400 dark:text-zinc-500" />
					{customer.phone}
				</div>
			{/if}
			{#if customer.email}
				<div class="flex items-center gap-1.5">
					<Mail class="size-3.5 text-zinc-400 dark:text-zinc-500" />
					{customer.email}
				</div>
			{/if}
			{#if customer.creditLimit}
				<div class="flex items-center gap-1 text-xs font-medium">
					<Wallet class="size-3 text-zinc-400 dark:text-zinc-500" />
					{formatCurrency(customer.creditLimit)}
				</div>
			{/if}
		</div>

		<div class="shrink-0">
			{@render actionDropdown(customer)}
		</div>
	</div>
{/snippet}

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
			<Input
				bind:value={searchQuery}
				placeholder={t('search_customers')}
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
		<a href="/customers/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('customer_create')}
			</Button>
		</a>
	</div>

	<!-- Content -->
	{#if !isLoading && filteredCustomers.length === 0}
		{#if searchQuery}
			<EmptyState
				icon={UserRound}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={UserRound}
				title={t('empty_customers')}
				description={t('empty_customers_desc')}
				actionLabel={t('action_add_customer')}
				actionHref="/customers/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		{#if viewPref.mode === 'table'}
			<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<Table>
					<TableHeader>
						<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
							<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('customer_name')}</TableHead>
							<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('customer_pan_number')}</TableHead>
							<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">{t('customer_phone')}</TableHead>
							<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">{t('customer_credit_limit')}</TableHead>
							<TableHead class="w-12"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#if isLoading}
							{#each Array(skeletons.count) as _, i}
								<TableRow class="skeleton-stagger group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
									<TableCell>
										<Skeleton class="h-4 w-32" />
										<Skeleton class="mt-1 h-3 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton class="h-5 w-20 rounded-full" />
									</TableCell>
									<TableCell class="hidden md:table-cell">
										<Skeleton class="h-4 w-24" />
										<Skeleton class="mt-1 h-4 w-28" />
									</TableCell>
									<TableCell class="hidden lg:table-cell">
										<Skeleton class="h-4 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton class="size-8 rounded-md" />
									</TableCell>
								</TableRow>
							{/each}
						{:else}
							{@const vItems = $virtualizer.getVirtualItems()}
							{@const totalSize = $virtualizer.getTotalSize()}
							{#if vItems.length > 0}
								<tr><td colspan="5" style="height:{vItems[0].start}px;padding:0;border:none;"></td></tr>
							{/if}
							{#each vItems as vRow (vRow.key)}
								{@const customer = filteredCustomers[vRow.index]}
								<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
									<TableCell>
										<a href="/customers/{customer._id}" class="block">
											<div class="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</div>
											{#if customer.address}
												<div class="mt-0.5 text-xs text-zinc-500">{customer.address}</div>
											{/if}
										</a>
									</TableCell>
									<TableCell>
										{#if customer.panNumber}
											<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
												{customer.panNumber}
											</Badge>
										{:else}
											<span class="text-xs text-zinc-400">—</span>
										{/if}
									</TableCell>
									<TableCell class="hidden md:table-cell">
										<div class="space-y-0.5">
											{#if customer.phone}
												<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
													<Phone class="size-3.5" />
													{customer.phone}
												</div>
											{/if}
											{#if customer.email}
												<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
													<Mail class="size-3.5" />
													{customer.email}
												</div>
											{/if}
											{#if !customer.phone && !customer.email}
												<span class="text-xs text-zinc-400">—</span>
											{/if}
										</div>
									</TableCell>
									<TableCell class="hidden lg:table-cell">
										{#if customer.creditLimit}
											<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
												{formatCurrency(customer.creditLimit)}
											</span>
										{:else}
											<span class="text-xs text-zinc-400">—</span>
										{/if}
									</TableCell>
									<TableCell>
										{@render actionDropdown(customer)}
									</TableCell>
								</TableRow>
							{/each}
							{#if vItems.length > 0}
								<tr><td colspan="5" style="height:{totalSize - vItems[vItems.length - 1].end}px;padding:0;border:none;"></td></tr>
							{/if}
						{/if}
					</TableBody>
				</Table>
			</div>
		{:else if viewPref.mode === 'grid-3'}
			{#if isLoading}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<Skeleton class="h-5 w-32" />
									<Skeleton class="mt-1 h-3 w-24" />
								</div>
								<Skeleton class="size-8 rounded-md" />
							</div>
							<div class="mt-3 space-y-1.5">
								<Skeleton class="h-4 w-28" />
								<Skeleton class="h-4 w-36" />
							</div>
							<div class="mt-3 flex items-center gap-2">
								<Skeleton class="h-5 w-20 rounded-full" />
								<Skeleton class="h-4 w-16" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const chunks = chunkItems(filteredCustomers, getLanes())}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each vItems as vRow (vRow.key)}
							{#each chunks[vRow.index] as item (item._id)}
									{@render customerCard(item)}
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{:else if viewPref.mode === 'grid-2'}
			{#if isLoading}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<Skeleton class="h-5 w-32" />
									<Skeleton class="mt-1 h-3 w-24" />
								</div>
								<Skeleton class="size-8 rounded-md" />
							</div>
							<div class="mt-3 space-y-1.5">
								<Skeleton class="h-4 w-28" />
								<Skeleton class="h-4 w-36" />
							</div>
							<div class="mt-3 flex items-center gap-2">
								<Skeleton class="h-5 w-20 rounded-full" />
								<Skeleton class="h-4 w-16" />
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const vItems = $virtualizer.getVirtualItems()}
				{@const chunks = chunkItems(filteredCustomers, getLanes())}
				{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
				{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
				<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each vItems as vRow (vRow.key)}
							{#each chunks[vRow.index] as item (item._id)}
									{@render customerCard(item)}
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		{:else if viewPref.mode === 'list'}
			{#if isLoading}
				<div class="flex flex-col gap-2">
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-3">
									<Skeleton class="h-5 w-32" />
									<Skeleton class="h-5 w-20 rounded-full" />
									<Skeleton class="hidden h-3 w-24 sm:block" />
								</div>
							</div>
							<div class="hidden items-center gap-4 sm:flex">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-4 w-16" />
							</div>
							<Skeleton class="size-8 shrink-0 rounded-md" />
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
						{@const customer = filteredCustomers[vRow.index]}
							{@render customerListItem(customer)}
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('action_delete') + ' ' + t('customer_title')}
	description={t('confirm_delete_customer')}
	confirmLabel={t('action_delete')}
	loading={deletingId !== null}
	onconfirm={handleDelete}
	oncancel={() => { confirmDeleteId = null }}
/>
