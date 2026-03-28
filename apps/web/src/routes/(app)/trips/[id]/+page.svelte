<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import TripDetail from '$lib/components/modules/logistics/TripDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Separator } from '$lib/components/ui/separator';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const tripQuery = useConvexQuery(
		client,
		api.functions.trips.getById,
		() => ({ id: page.params.id as any }),
	);

	// Fetch all vehicles to resolve vehicle name (simple approach, list is small)
	const vehiclesQuery = useConvexQuery(client, api.functions.vehicles.list, () => ({}));

	const returnMutation = useConvexMutation(client, api.functions.trips.returnTrip);
	const cancelMutation = useConvexMutation(client, api.functions.trips.cancel);

	let vehicle = $derived(
		tripQuery.data && vehiclesQuery.data
			? vehiclesQuery.data.find((v: any) => v._id === tripQuery.data!.vehicleId) ?? null
			: null
	);

	$effect(() => {
		breadcrumbLabel.set(vehicle?.name ?? null);
		return () => breadcrumbLabel.set(null);
	});
</script>

<MetaTags title="Trip Detail — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Breadcrumb -->
	<a
		href="/trips"
		class="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
	>
		<ArrowLeft class="size-3.5" />
		Back to Trips
	</a>

	{#if !tripQuery.isLoading && !tripQuery.data}
		<div class="flex flex-col items-center justify-center py-20">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Trip not found</h2>
			<p class="mt-1 text-sm text-zinc-500">This trip may have been deleted or doesn't exist.</p>
			<a href="/trips" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Trips
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{#if tripQuery.isLoading}
				<div class="space-y-6">
					<!-- Header -->
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-3">
								<Skeleton class="h-7 w-48" />
								<Skeleton class="h-5 w-24 rounded-full" />
							</div>
							<Skeleton class="mt-1 h-4 w-40" />
						</div>
						<Skeleton class="h-9 w-28 rounded-md" />
					</div>
					<!-- Info cards -->
					<div class="grid gap-4 sm:grid-cols-3">
						{#each Array(3) as _}
							<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="mt-2 h-5 w-32" />
							</div>
						{/each}
					</div>
					<!-- Products table -->
					<div>
						<Skeleton class="mb-3 h-5 w-40" />
						<div class="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
							<div class="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
								<div class="flex gap-6">
									<Skeleton class="h-3 w-20" />
									<Skeleton class="h-3 w-16" />
									<Skeleton class="h-3 w-12" />
									<Skeleton class="h-3 w-14" />
									<Skeleton class="h-3 w-16" />
								</div>
							</div>
							{#each Array(3) as _}
								<div class="flex items-center gap-6 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
									<Skeleton class="h-4 w-32" />
									<Skeleton class="h-4 w-10" />
									<Skeleton class="h-4 w-12" />
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-4 w-16" />
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<TripDetail
					trip={tripQuery.data}
					{vehicle}
					onreturn={async (data) => {
						await returnMutation.mutate({
							tripId: page.params.id as any,
							...data,
						});
					}}
					oncancel={async () => {
						await cancelMutation.mutate({ tripId: page.params.id as any });
						goto('/trips');
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
