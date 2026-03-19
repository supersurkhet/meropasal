<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import SaleForm from '$lib/components/modules/sales/SaleForm.svelte';
</script>

<MetaTags title="New Sale" />

<div class="p-6">
	<div class="mb-4">
		<Button href="/sales" variant="ghost" size="sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
			<ArrowLeft class="mr-1.5 size-4" />
			Back to Sales
		</Button>
	</div>

	<SaleForm onSuccess={() => { toast.success('Sale recorded successfully'); goto('/sales'); }} oncancel={() => goto('/sales')} />
</div>
