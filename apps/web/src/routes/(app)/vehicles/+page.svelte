<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import VehicleList from '$lib/components/modules/logistics/VehicleList.svelte';
	import VehicleForm from '$lib/components/modules/logistics/VehicleForm.svelte';
	import { Plus } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const vehiclesQuery = useConvexQuery(client, api.functions.vehicles.list, () => ({}));
	const createMutation = useConvexMutation(client, api.functions.vehicles.create);
	const removeMutation = useConvexMutation(client, api.functions.vehicles.remove);

	let createOpen = $state(false);
</script>

<MetaTags title="{t('nav_vehicles')} — {t('app_name')}" />

<Dialog bind:open={createOpen}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>{t('vehicle_create')}</DialogTitle>
			<DialogDescription>{t('page_vehicles_desc')}</DialogDescription>
		</DialogHeader>
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
	</DialogContent>
</Dialog>

<div class="p-6 lg:p-8">
	<VehicleList
		vehicles={vehiclesQuery.data ?? []}
		isLoading={vehiclesQuery.isLoading}
		ondelete={async (id) => {
			await removeMutation.mutate({ id: id as any });
		}}
	/>
</div>
