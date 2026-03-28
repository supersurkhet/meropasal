<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const customerQuery = useConvexQuery(
		client,
		api.functions.customers.getById,
		() => ({ id: page.params.id as any }),
	);
	const updateMutation = useConvexMutation(client, api.functions.customers.update);

	$effect(() => {
		breadcrumbLabel.set(customerQuery.data?.name ?? null);
		return () => breadcrumbLabel.set(null);
	});
</script>

<MetaTags title="Edit {customerQuery.data?.name ?? 'Customer'} — MeroPasal" />

<div class="p-6 lg:p-8">
	<div class="mb-4">
		<a
			href="/customers"
			class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-3.5" />
			Back to Customers
		</a>
	</div>

	{#if customerQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading customer...</p>
			</div>
		</div>
	{:else if !customerQuery.data}
		<div class="py-20 text-center">
			<p class="text-zinc-500">Customer not found</p>
			<a href="/customers" class="mt-2 inline-block text-sm text-zinc-900 underline dark:text-zinc-100">Back to customers</a>
		</div>
	{:else}
		<CustomerForm
			customer={customerQuery.data}
			onsubmit={async (data) => {
				try {
					await updateMutation.mutate({ id: page.params.id as any, ...data });
					toast.success('Customer updated successfully');
					goto('/customers');
				} catch (e) {
					toast.error(e instanceof Error ? e.message : 'Failed to update customer');
				}
			}}
			oncancel={() => goto(`/customers/${page.params.id}`)}
		/>
	{/if}
</div>
