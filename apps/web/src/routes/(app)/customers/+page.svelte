<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerList from '$lib/components/modules/customers/CustomerList.svelte';
	import { UserRound } from '@lucide/svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const customersQuery = useConvexQuery(client, api.functions.customers.list, () => ({}));
	const removeMutation = useConvexMutation(client, api.functions.customers.remove);
</script>

<MetaTags title="Customers — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Page header -->
	<div class="mb-6">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
				<UserRound class="size-5 text-white dark:text-zinc-900" />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					Customers
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					Manage your customers and buyers
				</p>
			</div>
		</div>
	</div>

	<CustomerList
		customers={customersQuery.data ?? []}
		isLoading={customersQuery.isLoading}
		ondelete={async (id) => {
			await removeMutation.mutate({ id: id as any });
		}}
	/>
</div>
