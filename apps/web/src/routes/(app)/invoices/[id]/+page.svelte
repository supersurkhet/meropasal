<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';
	import InvoiceDetail from '$lib/components/modules/invoices/InvoiceDetail.svelte';
</script>

<MetaTags title="Invoice Detail" />

<div class="p-6">
	<InvoiceDetail invoiceId={page.params.id} />
</div>
