<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import {
		Plus,
		Search,
		MoreHorizontal,
		Pencil,
		Trash2,
		Car,
		Loader2,
	} from '@lucide/svelte';

	type Vehicle = {
		_id: string;
		name: string;
		licensePlate: string;
		description?: string;
		isActive: boolean;
	};

	let {
		vehicles,
		isLoading = false,
		ondelete,
	}: {
		vehicles: Vehicle[];
		isLoading?: boolean;
		ondelete?: (id: string) => Promise<void>;
	} = $props();

	let searchQuery = $state('');
	let deletingId = $state<string | null>(null);

	let filteredVehicles = $derived(
		vehicles.filter(
			(v) =>
				v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
				v.description?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	async function handleDelete(id: string) {
		if (!ondelete) return;
		deletingId = id;
		try {
			await ondelete(id);
		} finally {
			deletingId = null;
		}
	}
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
			<Input
				bind:value={searchQuery}
				placeholder="Search vehicles..."
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	</div>

	<!-- Table -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading vehicles...</p>
			</div>
		</div>
	{:else if filteredVehicles.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
			<div class="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
				<Car class="size-6 text-zinc-400" />
			</div>
			<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
				{searchQuery ? 'No vehicles found' : 'No vehicles yet'}
			</h3>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				{searchQuery ? 'Try a different search term' : 'Add your first vehicle to start dispatching trips'}
			</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Name</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">License Plate</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">Description</TableHead>
						<TableHead class="w-12"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredVehicles as vehicle (vehicle._id)}
						<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40">
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
										>
											<MoreHorizontal class="size-4 text-zinc-500" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" class="w-40">
										<a href="/vehicles/{vehicle._id}">
											<DropdownMenuItem class="cursor-pointer">
												<Pencil class="mr-2 size-4" />
												Edit
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
												Deactivate
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
		<p class="text-xs text-zinc-400 dark:text-zinc-500">
			{filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'}
			{#if searchQuery}&middot; filtered from {vehicles.length}{/if}
		</p>
	{/if}
</div>
