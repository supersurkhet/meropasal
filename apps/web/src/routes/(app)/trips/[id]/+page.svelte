<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import TripDetail from '$lib/components/modules/logistics/TripDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';

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

	{#if tripQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading trip...</p>
			</div>
		</div>
	{:else if !tripQuery.data}
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
		</div>
	{/if}
</div>
