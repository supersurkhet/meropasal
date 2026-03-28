<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import OrgSettings from '$lib/components/modules/settings/OrgSettings.svelte';
	import { t } from '$lib/t.svelte';
	import { page } from '$app/stores';

	let workosOrgName = $derived(($page.data as any).workosOrgName ?? '');
	let orgMetadata = $derived(($page.data as any).orgMetadata ?? {});
</script>

<MetaTags title={t('nav_settings')} />

<div class="p-6 lg:p-8">
	<div class="max-w-2xl">
		<OrgSettings {workosOrgName} {orgMetadata} />
	</div>
</div>
