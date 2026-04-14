<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { ScanLine } from '@lucide/svelte'
	import AiScannerDialog from './AiScannerDialog.svelte'

	let {
		targetTable = 'mixed',
		onlineitems,
		onCommitBillImport,
	}: {
		targetTable?: 'products' | 'parties' | 'customers' | 'mixed' | 'stock-import' | 'orders' | 'sales' | 'trips'
		onlineitems?: (items: any[], partyName?: string) => void
		onCommitBillImport?: (items: any[], partyName?: string) => boolean
	} = $props()

	let scannerOpen = $state(false)
</script>

<Button
	variant="outline"
	size="sm"
	class="gap-2"
	onclick={() => {
		scannerOpen = true
	}}
>
	<ScanLine class="size-4" />
	AI Scan
</Button>

<AiScannerDialog bind:open={scannerOpen} {targetTable} {onlineitems} {onCommitBillImport} />
