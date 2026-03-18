<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import PartyDetail from '$lib/components/modules/parties/PartyDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const partyQuery = useConvexQuery(
		client,
		api.functions.parties.getById,
		() => ({ id: page.params.id as any }),
	);
	const updateMutation = useConvexMutation(client, api.functions.parties.update);
	const removeMutation = useConvexMutation(client, api.functions.parties.remove);

	let editing = $state(false);
</script>

<MetaTags title="{partyQuery.data?.name ?? 'Party'} — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Breadcrumb -->
	<a
		href="/parties"
		class="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
	>
		<ArrowLeft class="size-3.5" />
		Back to Parties
	</a>

	{#if partyQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading party...</p>
			</div>
		</div>
	{:else if !partyQuery.data}
		<div class="flex flex-col items-center justify-center py-20">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Party not found</h2>
			<p class="mt-1 text-sm text-zinc-500">This party may have been deactivated or doesn't exist.</p>
			<a href="/parties" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Parties
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{#if editing}
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit Party</h2>
					<p class="text-sm text-zinc-500">Update party details</p>
				</div>
				<PartyForm
					party={partyQuery.data}
					onsubmit={async (data) => {
						await updateMutation.mutate({ id: page.params.id as any, ...data });
						toast.success('Supplier updated successfully');
						editing = false;
					}}
					oncancel={() => (editing = false)}
				/>
			{:else}
				<PartyDetail
					party={partyQuery.data}
					onedit={() => (editing = true)}
					ondelete={async () => {
						await removeMutation.mutate({ id: page.params.id as any });
						goto('/parties');
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
