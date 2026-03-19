<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import TripList from '$lib/components/modules/logistics/TripList.svelte';
	import { t } from '$lib/t.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const tripsQuery = useConvexQuery(client, api.functions.trips.list, () => ({}));
	const vehiclesQuery = useConvexQuery(client, api.functions.vehicles.list, () => ({}));
</script>

<MetaTags title="{t('nav_trips')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<TripList
		trips={tripsQuery.data ?? []}
		vehicles={vehiclesQuery.data ?? []}
		isLoading={tripsQuery.isLoading}
	/>
</div>
