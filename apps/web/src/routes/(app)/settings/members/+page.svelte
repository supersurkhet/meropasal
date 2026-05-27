<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import { Users } from '@lucide/svelte'
	import { t } from '$lib/t.svelte'
	import MembersWidget from '$lib/components/widgets/members-widget.svelte'

	let { data } = $props()
</script>

<MetaTags title="{t('settings_members')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<div class="mb-8 flex items-center gap-3">
		<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
			<Users class="size-5 text-white dark:text-zinc-900" />
		</div>
		<div>
			<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('settings_members')}</h1>
			<p class="text-sm text-zinc-500 dark:text-zinc-400">Manage organisation members and access control.</p>
		</div>
	</div>

	<MembersWidget token={data.widgetToken} />
</div>
