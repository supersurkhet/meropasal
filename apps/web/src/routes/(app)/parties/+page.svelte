<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import PartyList from '$lib/components/modules/parties/PartyList.svelte';
	import { t } from '$lib/t.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const partiesQuery = useConvexQuery(client, api.functions.parties.list, () => ({}));
	const removeMutation = useConvexMutation(client, api.functions.parties.remove);
</script>

<MetaTags title="{t('nav_parties')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<PartyList
		parties={partiesQuery.data ?? []}
		isLoading={partiesQuery.isLoading}
		ondelete={async (id) => {
			await removeMutation.mutate({ id: id as any });
		}}
	/>
</div>
