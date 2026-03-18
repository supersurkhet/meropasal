<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import TripList from '$lib/components/modules/logistics/TripList.svelte';
	import { Truck } from '@lucide/svelte';
	import { t } from '$lib/t';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const tripsQuery = useConvexQuery(client, api.functions.trips.list, () => ({}));
	const vehiclesQuery = useConvexQuery(client, api.functions.vehicles.list, () => ({}));
</script>

<MetaTags title="{t('nav_trips')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<!-- Page header -->
	<div class="mb-6">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
				<Truck class="size-5 text-white dark:text-zinc-900" />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					{t('nav_trips')}
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					{t('page_trips_desc')}
				</p>
			</div>
		</div>
	</div>

	<TripList
		trips={tripsQuery.data ?? []}
		vehicles={vehiclesQuery.data ?? []}
		isLoading={tripsQuery.isLoading}
	/>
</div>
