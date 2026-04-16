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
		MapPin,
		Users,
		Loader2,
		Banknote,
		CalendarClock,
	} from '@lucide/svelte'
	import { toast } from 'svelte-sonner'
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { t } from '$lib/t.svelte'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'

	type Party = {
		_id: string
		name: string
		panNumber?: string
		address?: string
		phone?: string
		creditLimit?: number
		paymentTerms?: string
		notes?: string
		isActive: boolean
	}

	let {
		parties,
		isLoading = false,
		ondelete,
	}: {
		parties: Party[]
		isLoading?: boolean
		ondelete?: (id: string) => Promise<void>
	} = $props()

	const viewPref = createViewPreference('parties')
	const skeletons = createStaggeredSkeletons()

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

	let filteredParties = $derived(
		parties.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.phone?.includes(searchQuery) ||
				p.address?.toLowerCase().includes(searchQuery.toLowerCase())
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
		const items = filteredParties
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

	async function handleDelete(id: string) {
		if (!ondelete) return
		deletingId = id
		try {
			await ondelete(id)
			toast.success(t('toast_party_deleted'))
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

{#snippet actionDropdown(party: Party)}
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
			<a href="/parties/{party._id}/edit">
				<DropdownMenuItem class="cursor-pointer">
					<Pencil class="mr-2 size-4" />
					{t('action_edit')}
				</DropdownMenuItem>
			</a>
			{#if ondelete}
				<DropdownMenuItem
					class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
					disabled={deletingId === party._id}
					onclick={() => requestDelete(party._id)}
				>
					{#if deletingId === party._id}
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

{#snippet partyCard(party: Party)}
	<div class="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
		<div class="flex items-start justify-between gap-2">
			<a href="/parties/{party._id}" class="min-w-0 flex-1">
				<h3 class="truncate font-medium text-zinc-900 dark:text-zinc-100">{party.name}</h3>
			</a>
			{@render actionDropdown(party)}
		</div>

		{#if party.address}
			<div class="mt-2 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
				<MapPin class="size-3.5 shrink-0" />
				<span class="truncate">{party.address}</span>
			</div>
		{/if}

		{#if party.panNumber}
			<div class="mt-2">
				<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
					{party.panNumber}
				</Badge>
			</div>
		{/if}

		{#if party.phone}
			<div class="mt-2 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
				<Phone class="size-3.5 shrink-0" />
				{party.phone}
			</div>
		{/if}

		{#if party.creditLimit || party.paymentTerms}
			<div class="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
				{#if party.creditLimit}
					<div class="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
						<Banknote class="size-3.5 shrink-0 text-zinc-400" />
						{formatCurrency(party.creditLimit)}
					</div>
				{/if}
				{#if party.paymentTerms}
					<div class="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
						<CalendarClock class="size-3.5 shrink-0 text-zinc-400" />
						{party.paymentTerms}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet partyListItem(party: Party)}
	<div class="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
		<div class="flex items-center gap-4">
			<a href="/parties/{party._id}" class="min-w-0 flex-1">
				<div class="flex items-center gap-3">
					<h3 class="font-medium text-zinc-900 dark:text-zinc-100">{party.name}</h3>
					{#if party.panNumber}
						<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
							{party.panNumber}
						</Badge>
					{/if}
				</div>
				<div class="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
					{#if party.address}
						<span class="flex items-center gap-1">
							<MapPin class="size-3" />
							{party.address}
						</span>
					{/if}
					{#if party.phone}
						<span class="flex items-center gap-1">
							<Phone class="size-3" />
							{party.phone}
						</span>
					{/if}
					{#if party.creditLimit}
						<span class="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
							<Banknote class="size-3" />
							{formatCurrency(party.creditLimit)}
						</span>
					{/if}
					{#if party.paymentTerms}
						<span class="flex items-center gap-1">
							<CalendarClock class="size-3" />
							{party.paymentTerms}
						</span>
					{/if}
				</div>
			</a>
			{@render actionDropdown(party)}
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
				placeholder={t('search_parties')}
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
		<a href="/parties/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('action_new_party')}
			</Button>
		</a>
	</div>

	<!-- Content -->
	{#if !isLoading && filteredParties.length === 0}
		{#if searchQuery}
			<EmptyState
				icon={Users}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={Users}
				title={t('empty_parties')}
				description={t('empty_parties_desc')}
				actionLabel={t('action_add_party')}
				actionHref="/parties/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		{#if viewPref.mode === 'table'}
			<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<Table>
					<TableHeader>
						<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
							<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('party_name')}</TableHead>
							<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('party_pan_number')}</TableHead>
							<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">{t('party_phone')}</TableHead>
							<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">{t('party_credit_limit')}</TableHead>
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
								{@const party = filteredParties[vRow.index]}
								<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
									<TableCell>
										<a href="/parties/{party._id}" class="block">
											<div class="font-medium text-zinc-900 dark:text-zinc-100">{party.name}</div>
											{#if party.address}
												<div class="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
													<MapPin class="size-3" />
													{party.address}
												</div>
											{/if}
										</a>
									</TableCell>
									<TableCell>
										{#if party.panNumber}
											<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
												{party.panNumber}
											</Badge>
										{:else}
											<span class="text-xs text-zinc-400">—</span>
										{/if}
									</TableCell>
									<TableCell class="hidden md:table-cell">
										{#if party.phone}
											<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
												<Phone class="size-3.5" />
												{party.phone}
											</div>
										{:else}
											<span class="text-xs text-zinc-400">—</span>
										{/if}
									</TableCell>
									<TableCell class="hidden lg:table-cell">
										{#if party.creditLimit}
											<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
												{formatCurrency(party.creditLimit)}
											</span>
										{:else}
											<span class="text-xs text-zinc-400">—</span>
										{/if}
									</TableCell>
									<TableCell>
										{@render actionDropdown(party)}
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
		{:else if viewPref.mode === 'list'}
			<div class="flex flex-col gap-2">
				{#if isLoading}
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-center gap-4">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-3">
										<Skeleton class="h-5 w-32" />
										<Skeleton class="h-5 w-20 rounded-full" />
									</div>
									<div class="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
										<Skeleton class="h-4 w-24" />
										<Skeleton class="h-4 w-20" />
										<Skeleton class="h-4 w-16" />
									</div>
								</div>
								<Skeleton class="size-8 shrink-0 rounded-md" />
							</div>
						</div>
					{/each}
				{:else}
					{@const vItems = $virtualizer.getVirtualItems()}
					{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
					{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
					<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
						<div class="flex flex-col gap-2">
							{#each vItems as vRow (vRow.key)}
							{@const party = filteredParties[vRow.index]}
								{@render partyListItem(party)}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class={viewPref.mode === 'grid-3'
				? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
				: 'grid grid-cols-1 gap-4 md:grid-cols-2'}>
				{#if isLoading}
					{#each Array(skeletons.count) as _, i}
						<div class="skeleton-stagger group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
							<div class="flex items-start justify-between gap-2">
								<Skeleton class="h-5 w-32" />
								<Skeleton class="size-8 rounded-md" />
							</div>
							<Skeleton class="mt-2 h-4 w-28" />
							<Skeleton class="mt-2 h-5 w-20 rounded-full" />
							<Skeleton class="mt-2 h-4 w-24" />
							<div class="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
								<Skeleton class="h-4 w-20" />
								<Skeleton class="h-4 w-16" />
							</div>
						</div>
					{/each}
				{:else}
					{@const vItems = $virtualizer.getVirtualItems()}
					{@const chunks = chunkItems(filteredParties, getLanes())}
					{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
					{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
					<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
						<div class={viewPref.mode === 'grid-3'
									? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
									: 'grid grid-cols-1 gap-4 md:grid-cols-2'}>
								{#each vItems as vRow (vRow.key)}
									{#each chunks[vRow.index] as item (item._id)}
										{@render partyCard(item)}
								{/each}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('action_delete') + ' ' + t('party_title')}
	description={t('confirm_delete_party')}
	confirmLabel={t('action_delete')}
	loading={deletingId !== null}
	onconfirm={() => {
		if (confirmDeleteId) handleDelete(confirmDeleteId)
	}}
	oncancel={() => {
		confirmDeleteId = null
	}}
/>
