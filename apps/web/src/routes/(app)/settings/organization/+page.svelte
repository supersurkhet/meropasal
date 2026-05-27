<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import OrgSettings from '$lib/components/modules/settings/OrgSettings.svelte'
	import { t } from '$lib/t.svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()
</script>

<MetaTags title="Organization — {t('app_name')}" />

<div class="max-w-2xl">
	<OrgSettings currentOrgName={data.currentOrgName} orgMetadata={data.orgMetadata} />
</div>
