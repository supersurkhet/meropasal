<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import OrgSettings from '$lib/components/modules/settings/OrgSettings.svelte'
	import { t } from '$lib/t.svelte'
	import { Settings2 } from '@lucide/svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()
</script>

<MetaTags title="General Settings — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<div class="mb-8 flex items-center gap-3">
		<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
			<Settings2 class="size-5 text-white dark:text-zinc-900" />
		</div>
		<div>
			<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">General</h1>
			<p class="text-sm text-zinc-500 dark:text-zinc-400">Organisation details, logo, and preferences.</p>
		</div>
	</div>
	<div class="max-w-2xl">
		<OrgSettings workosOrgName={data.workosOrgName} orgMetadata={data.orgMetadata} />
	</div>
</div>
