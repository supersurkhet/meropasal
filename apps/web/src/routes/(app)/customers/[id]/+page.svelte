<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerDetail from '$lib/components/modules/customers/CustomerDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const customerQuery = useConvexQuery(
		client,
		api.functions.customers.getById,
		() => ({ id: page.params.id as any }),
	);
	const removeMutation = useConvexMutation(client, api.functions.customers.remove);

	$effect(() => {
		breadcrumbLabel.set(customerQuery.data?.name ?? null);
		return () => breadcrumbLabel.set(null);
	});
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

	{#if !customerQuery.isLoading && !customerQuery.data}
		<div class="flex flex-col items-center justify-center py-20">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Customer not found</h2>
			<p class="mt-1 text-sm text-zinc-500">This customer may have been deleted or doesn't exist.</p>
			<a href="/customers" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Customers
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{#if customerQuery.isLoading}
				<div class="space-y-6">
					<!-- Header -->
					<div class="flex items-start justify-between gap-4">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-3">
								<Skeleton class="h-7 w-48" />
								<Skeleton class="h-5 w-20 rounded-full" />
							</div>
							<Skeleton class="mt-1 h-4 w-32" />
						</div>
						<div class="flex items-center gap-2">
							<Skeleton class="h-9 w-20 rounded-md" />
							<Skeleton class="h-9 w-16 rounded-md" />
						</div>
					</div>
					<Separator class="bg-zinc-100 dark:bg-zinc-800" />
					<!-- Details grid -->
					<div class="grid gap-5 sm:grid-cols-2">
						{#each Array(4) as _}
							<div class="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/30">
								<Skeleton class="size-9 shrink-0 rounded-lg" />
								<div>
									<Skeleton class="h-3 w-16" />
									<Skeleton class="mt-1.5 h-4 w-28" />
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<CustomerDetail
					customer={customerQuery.data}
					editHref="/customers/{page.params.id}/edit"
					ondelete={async () => {
						try {
							await removeMutation.mutate({ id: page.params.id as any });
							goto('/customers');
						} catch (e) {
							toast.error(e instanceof Error ? e.message : 'Failed to delete customer');
						}
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
