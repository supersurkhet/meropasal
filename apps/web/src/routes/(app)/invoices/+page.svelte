<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import InvoiceList from '$lib/components/modules/invoices/InvoiceList.svelte';
	import { FileText } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title={t('nav_invoices')} />

<div class="p-6">
	<div class="mb-6 flex items-center gap-3">
		<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
			<FileText class="size-5 text-zinc-600 dark:text-zinc-400" />
		</div>
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('nav_invoices')}</h1>
			<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('page_invoices_desc')}</p>
		</div>
	</div>

	<InvoiceList />
</div>
