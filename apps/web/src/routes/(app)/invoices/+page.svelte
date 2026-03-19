<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import InvoiceList from '$lib/components/modules/invoices/InvoiceList.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title={t('nav_invoices')} />

<div class="p-6 lg:p-8">
	<InvoiceList />
</div>
