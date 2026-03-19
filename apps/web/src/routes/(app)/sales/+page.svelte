<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import SaleList from '$lib/components/modules/sales/SaleList.svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title="{t('nav_sales')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<SaleList />
</div>
