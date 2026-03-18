<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import CustomerDetail from '$lib/components/modules/customers/CustomerDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const customerQuery = useConvexQuery(
		client,
		api.functions.customers.getById,
		() => ({ id: page.params.id as any }),
	);
	const updateMutation = useConvexMutation(client, api.functions.customers.update);
	const removeMutation = useConvexMutation(client, api.functions.customers.remove);

	let editing = $state(false);
</script>

<MetaTags title="{customerQuery.data?.name ?? 'Customer'} — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Breadcrumb -->
	<a
		href="/customers"
		class="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
	>
		<ArrowLeft class="size-3.5" />
		Back to Customers
	</a>

	{#if customerQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading customer...</p>
			</div>
		</div>
	{:else if !customerQuery.data}
		<div class="flex flex-col items-center justify-center py-20">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Customer not found</h2>
			<p class="mt-1 text-sm text-zinc-500">This customer may have been deactivated or doesn't exist.</p>
			<a href="/customers" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Customers
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{#if editing}
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit Customer</h2>
					<p class="text-sm text-zinc-500">Update customer details</p>
				</div>
				<CustomerForm
					customer={customerQuery.data}
					onsubmit={async (data) => {
						await updateMutation.mutate({ id: page.params.id as any, ...data });
						editing = false;
					}}
					oncancel={() => (editing = false)}
				/>
			{:else}
				<CustomerDetail
					customer={customerQuery.data}
					onedit={() => (editing = true)}
					ondelete={async () => {
						await removeMutation.mutate({ id: page.params.id as any });
						goto('/customers');
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
