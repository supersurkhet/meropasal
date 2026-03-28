<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import PartyDetail from '$lib/components/modules/parties/PartyDetail.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const partyQuery = useConvexQuery(
		client,
		api.functions.parties.getById,
		() => ({ id: page.params.id as any }),
	);
	const removeMutation = useConvexMutation(client, api.functions.parties.remove);

	$effect(() => {
		breadcrumbLabel.set(partyQuery.data?.name ?? null);
		return () => breadcrumbLabel.set(null);
	});
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
			<p class="mt-1 text-sm text-zinc-500">This party may have been deleted or doesn't exist.</p>
			<a href="/parties" class="mt-4">
				<Button variant="outline" size="sm">
					<ArrowLeft class="mr-1.5 size-4" />
					Go to Parties
				</Button>
			</a>
		</div>
	{:else}
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<PartyDetail
				party={partyQuery.data}
				editHref="/parties/{page.params.id}/edit"
				ondelete={async () => {
					try {
						await removeMutation.mutate({ id: page.params.id as any });
						goto('/parties');
					} catch (e) {
						toast.error(e instanceof Error ? e.message : 'Failed to delete party');
					}
				}}
			/>
		</div>
	{/if}
</div>
