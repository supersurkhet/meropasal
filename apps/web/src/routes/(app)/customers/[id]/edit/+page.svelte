<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
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

	{#if !customerQuery.isLoading && !customerQuery.data}
		<div class="py-20 text-center">
			<p class="text-zinc-500">Customer not found</p>
			<a href="/customers" class="mt-2 inline-block text-sm text-zinc-900 underline dark:text-zinc-100">Back to customers</a>
		</div>
	{:else if customerQuery.isLoading}
		<div class="space-y-5 max-w-2xl">
			<!-- Name -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-16" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- PAN & Phone row -->
			<div class="grid gap-4 sm:grid-cols-2">
				{#each Array(2) as _}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-10 w-full rounded-md" />
					</div>
				{/each}
			</div>
			<!-- Email & Address row -->
			<div class="grid gap-4 sm:grid-cols-2">
				{#each Array(2) as _}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-20" />
						<Skeleton class="h-10 w-full rounded-md" />
					</div>
				{/each}
			</div>
			<!-- Credit Limit -->
			<div class="max-w-xs space-y-1.5">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- Notes -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-16" />
				<Skeleton class="h-20 w-full rounded-md" />
			</div>
			<!-- Actions -->
			<div class="flex justify-end gap-2">
				<Skeleton class="h-10 w-20 rounded-md" />
				<Skeleton class="h-10 w-32 rounded-md" />
			</div>
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
