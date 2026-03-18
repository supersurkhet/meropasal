<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import PartyList from '$lib/components/modules/parties/PartyList.svelte';
	import { Users } from '@lucide/svelte';
	import { t } from '$lib/t';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const partiesQuery = useConvexQuery(client, api.functions.parties.list, () => ({}));
	const removeMutation = useConvexMutation(client, api.functions.parties.remove);
</script>

<MetaTags title="{t('nav_parties')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<!-- Page header -->
	<div class="mb-6">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
				<Users class="size-5 text-white dark:text-zinc-900" />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					{t('nav_parties')}
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					{t('page_parties_desc')}
				</p>
			</div>
		</div>
	</div>

	<PartyList
		parties={partiesQuery.data ?? []}
		isLoading={partiesQuery.isLoading}
		ondelete={async (id) => {
			await removeMutation.mutate({ id: id as any });
		}}
	/>
</div>
