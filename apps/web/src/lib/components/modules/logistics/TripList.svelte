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
	import * as Select from '$lib/components/ui/select'
	import { Skeleton } from '$lib/components/ui/skeleton'
	import {
		Plus,
		Search,
		Truck,
		MapPin,
		Clock,
		Package,
	} from '@lucide/svelte'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { formatDateTime } from '$lib/date-utils'
	import { createViewPreference } from '$lib/view-preference.svelte'
	import { createStaggeredSkeletons } from '$lib/staggered-skeleton.svelte'
	import { get } from 'svelte/store'
	import { createVirtualizer, chunkItems, rowCount, useBreakpointLanes } from '$lib/virtual-list.svelte'
	type Trip = {
		_id: string
		vehicleId: string
		dispatchTime: string
		returnTime?: string
		destination?: string
		status: 'dispatched' | 'returned' | 'cancelled'
		products: Array<{ productId: string; productTitle: string; quantity: number; unitPrice: number; unit?: string }>
		returnedProducts: Array<{ productId: string; productTitle: string; quantity: number; unitPrice: number; unit?: string }>
	}

	type Vehicle = {
		_id: string
		name: string
		licensePlate: string
	}

	let {
		trips,
		vehicles = [],
		isLoading = false,
	}: {
		trips: Trip[]
		vehicles?: Vehicle[]
		isLoading?: boolean
	} = $props()

	let searchQuery = $state('')
	let statusFilter = $state('all')
	const viewPref = createViewPreference('trips')
	const skeletons = createStaggeredSkeletons()

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	function getVehicleName(vehicleId: string): string {
		const v = vehicles.find((vh) => vh._id === vehicleId)
		return v ? `${v.name} (${v.licensePlate})` : 'Unknown'
	}

	const statusConfig = $derived({
		dispatched: { label: t('status_dispatched'), class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
		returned: { label: t('status_returned'), class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
		cancelled: { label: t('status_cancelled'), class: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
	})

	let filteredTrips = $derived(
		trips
			.filter((t) => {
				if (statusFilter !== 'all' && t.status !== statusFilter) return false
				if (!searchQuery) return true
				const q = searchQuery.toLowerCase()
				const vehicleName = getVehicleName(t.vehicleId).toLowerCase()
				return (
					vehicleName.includes(q) ||
					t.destination?.toLowerCase().includes(q) ||
					t.status.includes(q)
				)
			})
			.sort((a, b) => new Date(b.dispatchTime).getTime() - new Date(a.dispatchTime).getTime())
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
		const items = filteredTrips
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
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-1 items-center gap-3">
			<div class="relative max-w-sm flex-1">
				<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
				<Input
					bind:value={searchQuery}
					placeholder={t('search_trips')}
					class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				/>
			</div>
			<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="w-36">
					{statusFilter === 'all' ? t('common_all_status') : statusConfig[statusFilter as keyof typeof statusConfig]?.label || statusFilter}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label={t('common_all_status')}>{t('common_all_status')}</Select.Item>
					<Select.Item value="dispatched" label={t('status_dispatched')}>{t('status_dispatched')}</Select.Item>
					<Select.Item value="returned" label={t('status_returned')}>{t('status_returned')}</Select.Item>
					<Select.Item value="cancelled" label={t('status_cancelled')}>{t('status_cancelled')}</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<a href="/trips/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('trip_create')}
			</Button>
		</a>
	</div>

	<!-- Content -->
	{#if !isLoading && filteredTrips.length === 0}
		{#if searchQuery || statusFilter !== 'all'}
			<EmptyState
				icon={Truck}
				title={t('empty_filtered')}
				description={t('empty_filtered_desc')}
			/>
		{:else}
			<EmptyState
				icon={Truck}
				title={t('empty_trips')}
				description={t('empty_trips_desc')}
				actionLabel={t('action_dispatch_trip')}
				actionHref="/trips/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else if viewPref.mode === 'table'}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('trip_vehicle')}</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">{t('trip_destination')}</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('trip_dispatch_time')}</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">{t('trip_return_time')}</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('order_status')}</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('stock_import_items')}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if isLoading}
						{#each Array(skeletons.count) as _, i}
							<TableRow class="skeleton-stagger group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
								<TableCell>
									<Skeleton class="h-4 w-36" />
								</TableCell>
								<TableCell class="hidden md:table-cell">
									<Skeleton class="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton class="h-4 w-32" />
								</TableCell>
								<TableCell class="hidden lg:table-cell">
									<Skeleton class="h-4 w-32" />
								</TableCell>
								<TableCell>
									<Skeleton class="h-5 w-20 rounded-full" />
								</TableCell>
								<TableCell>
									<Skeleton class="h-4 w-8" />
								</TableCell>
							</TableRow>
						{/each}
					{:else}
						{@const vItems = $virtualizer.getVirtualItems()}
						{@const totalSize = $virtualizer.getTotalSize()}
						{#if vItems.length > 0}
							<tr><td colspan="6" style="height:{vItems[0].start}px;padding:0;border:none;"></td></tr>
						{/if}
						{#each vItems as vRow (vRow.key)}
							{@const trip = filteredTrips[vRow.index]}
							{@const cfg = statusConfig[trip.status]}
							<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
								<TableCell>
									<a href="/trips/{trip._id}" class="block">
										<div class="font-medium text-zinc-900 dark:text-zinc-100">
											{getVehicleName(trip.vehicleId)}
										</div>
									</a>
								</TableCell>
								<TableCell class="hidden md:table-cell">
									{#if trip.destination}
										<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
											<MapPin class="size-3.5" />
											{trip.destination}
										</div>
									{:else}
										<span class="text-xs text-zinc-400">---</span>
									{/if}
								</TableCell>
								<TableCell>
									<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
										<Clock class="size-3.5" />
										{formatDateTime(trip.dispatchTime)}
									</div>
								</TableCell>
								<TableCell class="hidden lg:table-cell">
									{#if trip.returnTime}
										<span class="text-sm text-zinc-600 dark:text-zinc-400">{formatDateTime(trip.returnTime)}</span>
									{:else}
										<span class="text-xs text-zinc-400">---</span>
									{/if}
								</TableCell>
								<TableCell>
									<Badge variant="secondary" class={cfg.class}>
										{cfg.label}
									</Badge>
								</TableCell>
								<TableCell>
									<span class="font-mono text-sm text-zinc-600 dark:text-zinc-400">
										{trip.products.length}
									</span>
								</TableCell>
							</TableRow>
						{/each}
						{#if vItems.length > 0}
							<tr><td colspan="6" style="height:{totalSize - vItems[vItems.length - 1].end}px;padding:0;border:none;"></td></tr>
						{/if}
					{/if}
				</TableBody>
			</Table>
		</div>
	{:else if viewPref.mode === 'grid-3'}
		{#if isLoading}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each Array(skeletons.count) as _, i}
					<div class="skeleton-stagger rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<Skeleton class="h-5 w-36" />
								<Skeleton class="mt-1.5 h-4 w-24" />
							</div>
							<Skeleton class="h-5 w-20 shrink-0 rounded-full" />
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-8" />
						</div>
					</div>
				{/each}
			</div>
		{:else}
			{@const vItems = $virtualizer.getVirtualItems()}
			{@const chunks = chunkItems(filteredTrips, getLanes())}
			{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
			{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
			<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each vItems as vRow (vRow.key)}
						{#each chunks[vRow.index] as trip (trip._id)}
								{@const cfg = statusConfig[trip.status]}
								<a
									href="/trips/{trip._id}"
									class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<p class="truncate font-semibold text-zinc-900 dark:text-zinc-100">
												{getVehicleName(trip.vehicleId)}
											</p>
											{#if trip.destination}
												<div class="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
													<MapPin class="size-3.5 shrink-0" />
													<span class="truncate">{trip.destination}</span>
												</div>
											{/if}
										</div>
										<Badge variant="secondary" class="{cfg.class} shrink-0">
											{cfg.label}
										</Badge>
									</div>
									<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
										<div class="flex items-center gap-1.5">
											<Clock class="size-3.5" />
											{formatDateTime(trip.dispatchTime)}
										</div>
										{#if trip.returnTime}
											<div class="flex items-center gap-1.5">
												<Clock class="size-3.5" />
												{formatDateTime(trip.returnTime)}
											</div>
										{/if}
										<div class="flex items-center gap-1.5">
											<Package class="size-3.5" />
											<span class="font-mono">{trip.products.length}</span>
										</div>
									</div>
								</a>
						{/each}
					{/each}
				</div>
			</div>
		{/if}
	{:else if viewPref.mode === 'grid-2'}
		{#if isLoading}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each Array(skeletons.count) as _, i}
					<div class="skeleton-stagger rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<Skeleton class="h-5 w-36" />
								<Skeleton class="mt-1.5 h-4 w-24" />
							</div>
							<Skeleton class="h-5 w-20 shrink-0 rounded-full" />
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-8" />
						</div>
					</div>
				{/each}
			</div>
		{:else}
			{@const vItems = $virtualizer.getVirtualItems()}
			{@const chunks = chunkItems(filteredTrips, getLanes())}
			{@const padTop = vItems.length > 0 ? vItems[0].start : 0}
			{@const padBottom = vItems.length > 0 ? $virtualizer.getTotalSize() - vItems[vItems.length - 1].end : 0}
			<div style="padding-top:{padTop}px;padding-bottom:{padBottom}px;">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each vItems as vRow (vRow.key)}
						{#each chunks[vRow.index] as trip (trip._id)}
								{@const cfg = statusConfig[trip.status]}
								<a
									href="/trips/{trip._id}"
									class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<p class="truncate font-semibold text-zinc-900 dark:text-zinc-100">
												{getVehicleName(trip.vehicleId)}
											</p>
											{#if trip.destination}
												<div class="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
													<MapPin class="size-3.5 shrink-0" />
													<span class="truncate">{trip.destination}</span>
												</div>
											{/if}
										</div>
										<Badge variant="secondary" class="{cfg.class} shrink-0">
											{cfg.label}
										</Badge>
									</div>
									<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
										<div class="flex items-center gap-1.5">
											<Clock class="size-3.5" />
											{formatDateTime(trip.dispatchTime)}
										</div>
										{#if trip.returnTime}
											<div class="flex items-center gap-1.5">
												<Clock class="size-3.5" />
												{formatDateTime(trip.returnTime)}
											</div>
										{/if}
										<div class="flex items-center gap-1.5">
											<Package class="size-3.5" />
											<span class="font-mono">{trip.products.length}</span>
										</div>
									</div>
								</a>
						{/each}
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		{#if isLoading}
			<div class="flex flex-col gap-2">
				{#each Array(skeletons.count) as _, i}
					<div class="skeleton-stagger rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<Skeleton class="h-5 w-36" />
								<Skeleton class="mt-1.5 h-4 w-24" />
							</div>
							<Skeleton class="h-5 w-20 shrink-0 rounded-full" />
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-4 w-8" />
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
					{@const trip = filteredTrips[vRow.index]}
					{@const cfg = statusConfig[trip.status]}
						<a
							href="/trips/{trip._id}"
							class="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<p class="truncate font-semibold text-zinc-900 dark:text-zinc-100">
										{getVehicleName(trip.vehicleId)}
									</p>
									{#if trip.destination}
										<div class="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
											<MapPin class="size-3.5 shrink-0" />
											<span class="truncate">{trip.destination}</span>
										</div>
									{/if}
								</div>
								<Badge variant="secondary" class="{cfg.class} shrink-0">
									{cfg.label}
								</Badge>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
								<div class="flex items-center gap-1.5">
									<Clock class="size-3.5" />
									{formatDateTime(trip.dispatchTime)}
								</div>
								{#if trip.returnTime}
									<div class="flex items-center gap-1.5">
										<Clock class="size-3.5" />
										{formatDateTime(trip.returnTime)}
									</div>
								{/if}
								<div class="flex items-center gap-1.5">
									<Package class="size-3.5" />
									<span class="font-mono">{trip.products.length}</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
