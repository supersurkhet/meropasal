<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerList from '$lib/components/modules/customers/CustomerList.svelte';
	import { t } from '$lib/t.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const customersQuery = useConvexQuery(client, api.functions.customers.list, () => ({}));
	const removeMutation = useConvexMutation(client, api.functions.customers.remove);
</script>

<MetaTags title="{t('nav_customers')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<CustomerList
		customers={customersQuery.data ?? []}
		isLoading={customersQuery.isLoading}
		ondelete={async (id) => {
			await removeMutation.mutate({ id: id as any });
		}}
	/>
</div>
