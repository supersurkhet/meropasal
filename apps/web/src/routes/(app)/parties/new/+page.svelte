<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const createMutation = useConvexMutation(client, api.functions.parties.create);
</script>

<MetaTags title="New Party — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Breadcrumb + Header -->
	<div class="mb-8">
		<a
			href="/parties"
			class="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-3.5" />
			Back to Parties
		</a>
		<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
			New Party
		</h1>
		<p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
			Add a new supplier or purchase party
		</p>
	</div>

	<!-- Form card -->
	<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
		<PartyForm
			onsubmit={async (data) => {
				await createMutation.mutate(data);
				toast.success('Supplier created successfully');
				goto('/parties');
			}}
			oncancel={() => goto('/parties')}
		/>
	</div>
</div>
