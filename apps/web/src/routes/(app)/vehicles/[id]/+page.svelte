<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import VehicleForm from '$lib/components/modules/logistics/VehicleForm.svelte';
	import VehicleDetail from '$lib/components/modules/logistics/VehicleDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const vehicleQuery = useConvexQuery(
		client,
		api.functions.vehicles.getById,
		() => ({ id: page.params.id as any }),
	);
	const updateMutation = useConvexMutation(client, api.functions.vehicles.update);
	const removeMutation = useConvexMutation(client, api.functions.vehicles.remove);

	let editing = $state(false);
</script>

<MetaTags title="{vehicleQuery.data?.name ?? 'Vehicle'} — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Breadcrumb -->
	<a
		href="/vehicles"
		class="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
	>
		<ArrowLeft class="size-3.5" />
		Back to Vehicles
	</a>

	{#if vehicleQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading vehicle...</p>
			</div>
		</div>
	{:else if !vehicleQuery.data}
		<div class="flex flex-col items-center justify-center py-20">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Vehicle not found</h2>
			<p class="mt-1 text-sm text-zinc-500">This vehicle may have been deactivated or doesn't exist.</p>
			<a href="/vehicles" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Vehicles
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{#if editing}
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit Vehicle</h2>
					<p class="text-sm text-zinc-500">Update vehicle details</p>
				</div>
				<VehicleForm
					vehicle={vehicleQuery.data}
					onsubmit={async (data) => {
						await updateMutation.mutate({ id: page.params.id as any, ...data });
						editing = false;
					}}
					oncancel={() => (editing = false)}
				/>
			{:else}
				<VehicleDetail
					vehicle={vehicleQuery.data}
					onedit={() => (editing = true)}
					ondelete={async () => {
						await removeMutation.mutate({ id: page.params.id as any });
						goto('/vehicles');
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
