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
	import {
		Plus,
		Search,
		MoreHorizontal,
		Pencil,
		Trash2,
		Car,
		Loader2,
	} from '@lucide/svelte'
	import { t } from '$lib/t.svelte'
	import EmptyState from '$lib/components/shared/EmptyState.svelte'
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte'
	import { createViewPreference } from '$lib/view-preference.svelte'

	type Vehicle = {
		_id: string
		name: string
		licensePlate: string
		description?: string
		isActive: boolean
	}

	let {
		vehicles,
		isLoading = false,
		ondelete,
	}: {
		vehicles: Vehicle[]
		isLoading?: boolean
		ondelete?: (id: string) => Promise<void>
	} = $props()

	const viewPref = createViewPreference('vehicles')

	$effect(() => {
		breadcrumbViewToggle.set({
			get mode() { return viewPref.mode },
			onchange: (m) => { viewPref.mode = m },
		})
		return () => breadcrumbViewToggle.clear()
	})

	let searchQuery = $state('')
	let deletingId = $state<string | null>(null)

	let filteredVehicles = $derived(
		vehicles.filter(
			(v) =>
				v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.description?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)

	async function handleDelete(id: string) {
		if (!ondelete) return
		deletingId = id
		try {
			await ondelete(id)
		} finally {
			deletingId = null
		}
	}

	const gridClass = $derived(
		viewPref.mode === 'grid-3'
			? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
			: viewPref.mode === 'grid-2'
				? 'grid grid-cols-1 gap-4 md:grid-cols-2'
				: 'flex flex-col gap-2'
	)
</script>

{#snippet vehicleCard(vehicle: Vehicle)}
	<div class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1 space-y-1.5">
				<a href="/vehicles/{vehicle._id}" class="block font-medium text-zinc-900 hover:underline dark:text-zinc-100">
					{vehicle.name}
				</a>
				<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
					{vehicle.licensePlate}
				</Badge>
				{#if vehicle.description}
					<p class="text-sm text-zinc-600 dark:text-zinc-400">{vehicle.description}</p>
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<span
					class="size-2 rounded-full {vehicle.isActive
						? 'bg-emerald-500'
						: 'bg-zinc-300 dark:bg-zinc-600'}"
					title={vehicle.isActive ? 'Active' : 'Inactive'}
				></span>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button
							variant="ghost"
							size="sm"
							class="size-8 p-0"
							aria-label={t('a11y_more_options')}
						>
							<MoreHorizontal class="size-4 text-zinc-500" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" class="w-40">
						<a href="/vehicles/{vehicle._id}/edit">
							<DropdownMenuItem class="cursor-pointer">
								<Pencil class="mr-2 size-4" />
								{t('action_edit')}
							</DropdownMenuItem>
						</a>
						{#if ondelete}
							<DropdownMenuItem
								class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
								disabled={deletingId === vehicle._id}
								onclick={() => handleDelete(vehicle._id)}
							>
								{#if deletingId === vehicle._id}
									<Loader2 class="mr-2 size-4 animate-spin" />
								{:else}
									<Trash2 class="mr-2 size-4" />
								{/if}
								{t('action_delete')}
							</DropdownMenuItem>
						{/if}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
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
				placeholder={t('search_vehicles')}
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">{t('common_loading_vehicles')}</p>
			</div>
		</div>
	{:else if filteredVehicles.length === 0}
		{#if searchQuery}
			<EmptyState
				icon={Car}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={Car}
				title={t('empty_vehicles')}
				description={t('empty_vehicles_desc')}
				actionLabel={t('vehicle_create')}
				actionHref="/vehicles/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		{#if viewPref.mode === 'table'}
			<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<Table>
					<TableHeader>
						<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
							<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('vehicle_name')}</TableHead>
							<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('vehicle_license_plate')}</TableHead>
							<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">{t('vehicle_description')}</TableHead>
							<TableHead class="w-12"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filteredVehicles as vehicle (vehicle._id)}
							<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
								<TableCell>
									<a href="/vehicles/{vehicle._id}" class="block">
										<div class="font-medium text-zinc-900 dark:text-zinc-100">{vehicle.name}</div>
									</a>
								</TableCell>
								<TableCell>
									<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
										{vehicle.licensePlate}
									</Badge>
								</TableCell>
								<TableCell class="hidden md:table-cell">
									{#if vehicle.description}
										<span class="text-sm text-zinc-600 dark:text-zinc-400">{vehicle.description}</span>
									{:else}
										<span class="text-xs text-zinc-400">—</span>
									{/if}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger>
											<Button
												variant="ghost"
												size="sm"
												class="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
												aria-label={t('a11y_more_options')}
											>
												<MoreHorizontal class="size-4 text-zinc-500" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" class="w-40">
											<a href="/vehicles/{vehicle._id}">
												<DropdownMenuItem class="cursor-pointer">
													<Pencil class="mr-2 size-4" />
													{t('action_edit')}
												</DropdownMenuItem>
											</a>
											{#if ondelete}
												<DropdownMenuItem
													class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
													disabled={deletingId === vehicle._id}
													onclick={() => handleDelete(vehicle._id)}
												>
													{#if deletingId === vehicle._id}
														<Loader2 class="mr-2 size-4 animate-spin" />
													{:else}
														<Trash2 class="mr-2 size-4" />
													{/if}
													{t('action_delete')}
												</DropdownMenuItem>
											{/if}
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{:else}
			<div class={gridClass}>
				{#each filteredVehicles as vehicle (vehicle._id)}
					{@render vehicleCard(vehicle)}
				{/each}
			</div>
		{/if}
		<p class="text-xs text-zinc-400 dark:text-zinc-500">
			{filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'}
			{#if searchQuery}&middot; filtered from {vehicles.length}{/if}
		</p>
	{/if}
</div>
