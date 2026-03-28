<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import VehicleDetail from '$lib/components/modules/logistics/VehicleDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const vehicleQuery = useConvexQuery(
		client,
		api.functions.vehicles.getById,
		() => ({ id: page.params.id as any }),
	);
	const removeMutation = useConvexMutation(client, api.functions.vehicles.remove);

	$effect(() => {
		breadcrumbLabel.set(vehicleQuery.data?.name ?? null);
		return () => breadcrumbLabel.set(null);
	});
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

	{#if !vehicleQuery.isLoading && !vehicleQuery.data}
		<div class="flex flex-col items-center justify-center py-20">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Vehicle not found</h2>
			<p class="mt-1 text-sm text-zinc-500">This vehicle may have been deleted or doesn't exist.</p>
			<a href="/vehicles" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Vehicles
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{#if vehicleQuery.isLoading}
				<div class="space-y-6">
					<!-- Header -->
					<div class="flex items-start justify-between">
						<div>
							<Skeleton class="h-7 w-40" />
							<Skeleton class="mt-1 h-4 w-32" />
						</div>
						<div class="flex items-center gap-2">
							<Skeleton class="h-9 w-16 rounded-md" />
							<Skeleton class="h-9 w-20 rounded-md" />
						</div>
					</div>
					<!-- Info cards -->
					<div class="grid gap-4 sm:grid-cols-2">
						{#each Array(2) as _}
							<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="mt-2 h-5 w-36" />
							</div>
						{/each}
					</div>
					<!-- Description -->
					<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="mt-2 h-4 w-full" />
					</div>
				</div>
			{:else}
				<VehicleDetail
					vehicle={vehicleQuery.data}
					editHref="/vehicles/{page.params.id}/edit"
					ondelete={async () => {
						await removeMutation.mutate({ id: page.params.id as any });
						goto('/vehicles');
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
