<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import VehicleList from '$lib/components/modules/logistics/VehicleList.svelte';
	import VehicleForm from '$lib/components/modules/logistics/VehicleForm.svelte';
	import InlineCreateDialog from '$lib/components/shared/InlineCreateDialog.svelte';
	import { Car } from '@lucide/svelte';
	import { t } from '$lib/t';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const vehiclesQuery = useConvexQuery(client, api.functions.vehicles.list, () => ({}));
	const createMutation = useConvexMutation(client, api.functions.vehicles.create);
	const removeMutation = useConvexMutation(client, api.functions.vehicles.remove);

	let createOpen = $state(false);
</script>

<MetaTags title="{t('nav_vehicles')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<!-- Page header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
					<Car class="size-5 text-white dark:text-zinc-900" />
				</div>
				<div>
					<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
						{t('nav_vehicles')}
					</h1>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">
						{t('page_vehicles_desc')}
					</p>
				</div>
			</div>
			<InlineCreateDialog title={t('vehicle_create')} description={t('page_vehicles_desc')} bind:open={createOpen}>
				<div class="p-1">
					<VehicleForm
						inline
						onsubmit={async (data) => {
							await createMutation.mutate(data);
							createOpen = false;
						}}
						oncancel={() => (createOpen = false)}
					/>
				</div>
			</InlineCreateDialog>
		</div>
	</div>

	<VehicleList
		vehicles={vehiclesQuery.data ?? []}
		isLoading={vehiclesQuery.isLoading}
		ondelete={async (id) => {
			await removeMutation.mutate({ id: id as any });
		}}
	/>
</div>
