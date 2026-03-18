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
	import * as Select from '$lib/components/ui/select';
	import {
		Plus,
		Search,
		Truck,
		MapPin,
		Loader2,
		Clock,
	} from '@lucide/svelte';

	type Trip = {
		_id: string;
		vehicleId: string;
		dispatchTime: string;
		returnTime?: string;
		destination?: string;
		status: 'dispatched' | 'returned' | 'cancelled';
		products: Array<{ productId: string; productTitle: string; quantity: number; unitPrice: number; unit?: string }>;
		returnedProducts: Array<{ productId: string; productTitle: string; quantity: number; unitPrice: number; unit?: string }>;
	};

	type Vehicle = {
		_id: string;
		name: string;
		licensePlate: string;
	};

	let {
		trips,
		vehicles = [],
		isLoading = false,
	}: {
		trips: Trip[];
		vehicles?: Vehicle[];
		isLoading?: boolean;
	} = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');

	function getVehicleName(vehicleId: string): string {
		const v = vehicles.find((vh) => vh._id === vehicleId);
		return v ? `${v.name} (${v.licensePlate})` : 'Unknown';
	}

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleDateString('en-NP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	const statusConfig = {
		dispatched: { label: 'Dispatched', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
		returned: { label: 'Returned', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
		cancelled: { label: 'Cancelled', class: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
	};

	let filteredTrips = $derived(
		trips
			.filter((t) => {
				if (statusFilter !== 'all' && t.status !== statusFilter) return false;
				if (!searchQuery) return true;
				const q = searchQuery.toLowerCase();
				const vehicleName = getVehicleName(t.vehicleId).toLowerCase();
				return (
					vehicleName.includes(q) ||
					t.destination?.toLowerCase().includes(q) ||
					t.status.includes(q)
				);
			})
			.sort((a, b) => new Date(b.dispatchTime).getTime() - new Date(a.dispatchTime).getTime())
	);
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-1 items-center gap-3">
			<div class="relative max-w-sm flex-1">
				<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
				<Input
					bind:value={searchQuery}
					placeholder="Search trips..."
					class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				/>
			</div>
			<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="w-36">
					{statusFilter === 'all' ? 'All Status' : statusConfig[statusFilter as keyof typeof statusConfig]?.label || statusFilter}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Status">All Status</Select.Item>
					<Select.Item value="dispatched" label="Dispatched">Dispatched</Select.Item>
					<Select.Item value="returned" label="Returned">Returned</Select.Item>
					<Select.Item value="cancelled" label="Cancelled">Cancelled</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<a href="/trips/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				New Trip
			</Button>
		</a>
	</div>

	<!-- Table -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading trips...</p>
			</div>
		</div>
	{:else if filteredTrips.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
			<div class="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
				<Truck class="size-6 text-zinc-400" />
			</div>
			<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
				{searchQuery || statusFilter !== 'all' ? 'No trips found' : 'No trips yet'}
			</h3>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				{searchQuery || statusFilter !== 'all' ? 'Try different filters' : 'Dispatch your first trip to get started'}
			</p>
			{#if !searchQuery && statusFilter === 'all'}
				<a href="/trips/new" class="mt-4">
					<Button
						size="sm"
						variant="outline"
						class="border-zinc-300 shadow-sm dark:border-zinc-700"
					>
						<Plus class="mr-1.5 size-4" />
						Dispatch Trip
					</Button>
				</a>
			{/if}
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Vehicle</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">Destination</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Dispatch</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">Return</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Status</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Items</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredTrips as trip (trip._id)}
						{@const cfg = statusConfig[trip.status]}
						<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40">
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
									<span class="text-xs text-zinc-400">—</span>
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
									<span class="text-xs text-zinc-400">—</span>
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
				</TableBody>
			</Table>
		</div>
		<p class="text-xs text-zinc-400 dark:text-zinc-500">
			{filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
			{#if searchQuery || statusFilter !== 'all'}&middot; filtered from {trips.length}{/if}
		</p>
	{/if}
</div>
