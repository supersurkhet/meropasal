<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page as pageState } from '$app/state';
	import { page } from '$app/stores';
	import InvoiceDetail from '$lib/components/modules/invoices/InvoiceDetail.svelte';

	let workosOrgName = $derived(($page.data as any).workosOrgName ?? '');
</script>

<MetaTags title="Invoice Detail" />

<div class="p-6">
	<InvoiceDetail invoiceId={pageState.params.id!} {workosOrgName} />
</div>
