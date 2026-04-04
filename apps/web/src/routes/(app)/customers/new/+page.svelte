<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import AiScannerButton from '$lib/components/shared/AiScannerButton.svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const createMutation = useConvexMutation(client, api.functions.customers.create);
</script>

<MetaTags title="New Customer — MeroPasal" />

<div class="p-6 lg:p-8">
	<div class="mb-4 flex items-center justify-between">
		<a
			href="/customers"
			class="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
		>
			<ArrowLeft class="size-3.5" />
			Back to Customers
		</a>
		<AiScannerButton targetTable="customers" />
	</div>

	<CustomerForm
		onsubmit={async (data) => {
			await createMutation.mutate(data);
			toast.success('Customer created successfully');
			goto('/customers');
		}}
		oncancel={() => goto('/customers')}
	/>
</div>
