<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import SaleList from '$lib/components/modules/sales/SaleList.svelte';
</script>

<MetaTags title="Sales" />

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Sales</h1>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">View and create sales transactions</p>
		</div>
		<Button
			href="/sales/new"
			class="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			<Plus class="mr-1.5 size-4" />
			New Sale
		</Button>
	</div>

	<SaleList />
</div>
