<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const partyQuery = useConvexQuery(
		client,
		api.functions.parties.getById,
		() => ({ id: page.params.id as any }),
	);
	const updateMutation = useConvexMutation(client, api.functions.parties.update);

	$effect(() => {
		breadcrumbLabel.set(partyQuery.data?.name ?? null);
		return () => breadcrumbLabel.set(null);
	});
</script>

<MetaTags title="Edit {partyQuery.data?.name ?? 'Party'} — MeroPasal" />

<div class="p-6 lg:p-8">
	<div class="mb-4">
		<a
			href="/parties"
			class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-3.5" />
			Back to Parties
		</a>
	</div>

	{#if !partyQuery.isLoading && !partyQuery.data}
		<div class="py-20 text-center">
			<p class="text-zinc-500">Party not found</p>
			<a href="/parties" class="mt-2 inline-block text-sm text-zinc-900 underline dark:text-zinc-100">Back to parties</a>
		</div>
	{:else if partyQuery.isLoading}
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
			<!-- Address -->
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-20" />
				<Skeleton class="h-10 w-full rounded-md" />
			</div>
			<!-- Credit Limit & Payment Terms row -->
			<div class="grid gap-4 sm:grid-cols-2">
				{#each Array(2) as _}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-28" />
						<Skeleton class="h-10 w-full rounded-md" />
					</div>
				{/each}
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
		<PartyForm
			party={partyQuery.data}
			onsubmit={async (data) => {
				try {
					await updateMutation.mutate({ id: page.params.id as any, ...data });
					toast.success('Supplier updated successfully');
					goto('/parties');
				} catch (e) {
					toast.error(e instanceof Error ? e.message : 'Failed to update party');
				}
			}}
			oncancel={() => goto(`/parties/${page.params.id}`)}
		/>
	{/if}
</div>
