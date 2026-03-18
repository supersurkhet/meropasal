<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import TripDispatchForm from '$lib/components/modules/logistics/TripDispatchForm.svelte';
	import { ArrowLeft } from '@lucide/svelte';
</script>

<MetaTags title="Dispatch Trip — MeroPasal" />

<div class="p-6 lg:p-8">
	<!-- Breadcrumb + Header -->
	<div class="mb-8">
		<a
			href="/trips"
			class="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-3.5" />
			Back to Trips
		</a>
		<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
			Dispatch Trip
		</h1>
		<p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
			Select a vehicle, add products, and dispatch
		</p>
	</div>

	<TripDispatchForm />
</div>
