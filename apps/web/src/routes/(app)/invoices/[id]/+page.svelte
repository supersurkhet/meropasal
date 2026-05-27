<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page as pageState } from '$app/state';
	import { page } from '$app/stores';
	import InvoiceDetail from '$lib/components/modules/invoices/InvoiceDetail.svelte';

	let currentOrgName = $derived(($page.data as any).currentOrgName ?? '');
	let orgMetadata = $derived(($page.data as any).orgMetadata ?? {});
</script>

<MetaTags title="Invoice Detail" />

<div class="p-6">
	<InvoiceDetail invoiceId={pageState.params.id!} {currentOrgName} {orgMetadata} />
</div>
