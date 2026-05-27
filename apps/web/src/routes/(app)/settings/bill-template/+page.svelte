<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import BillTemplateEditor from '$lib/components/modules/settings/BillTemplateEditor.svelte'
	import { page } from '$app/stores'

	let currentOrgName = $derived(($page.data as { currentOrgName?: string }).currentOrgName ?? '')
	let orgMetadata = $derived(($page.data as { orgMetadata?: Record<string, unknown> }).orgMetadata ?? {})
</script>

<MetaTags title="Bill Template" />

<BillTemplateEditor {currentOrgName} {orgMetadata} />
