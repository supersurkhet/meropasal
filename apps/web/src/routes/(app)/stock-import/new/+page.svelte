<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import StockImportForm from '$lib/components/modules/stock-import/StockImportForm.svelte';
	import AiScannerButton from '$lib/components/shared/AiScannerButton.svelte';

	let formRef = $state<{ addScannedItems: (items: any[], partyName?: string) => void } | null>(null)
</script>

<MetaTags title="New Stock Import" />

<div class="p-6">
	<div class="mb-4 flex justify-end">
		<AiScannerButton
			targetTable="stock-import"
			onlineitems={(items, partyName) => formRef?.addScannedItems(items, partyName)}
		/>
	</div>
	<StockImportForm bind:this={formRef} />
</div>
