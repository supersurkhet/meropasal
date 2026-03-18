<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import OrgSettings from '$lib/components/modules/settings/OrgSettings.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Settings, Users, FileSliders } from '@lucide/svelte';
</script>

<MetaTags title="Settings" />

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<Settings class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Organization Settings</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">Manage your business configuration.</p>
			</div>
		</div>
		<div class="flex gap-2">
			<a href="/settings/members">
				<Button variant="outline" size="sm">
					<Users class="mr-1.5 size-4" />
					Members
				</Button>
			</a>
			<a href="/settings/bill-template">
				<Button variant="outline" size="sm">
					<FileSliders class="mr-1.5 size-4" />
					Bill Template
				</Button>
			</a>
		</div>
	</div>

	<div class="max-w-2xl">
		<OrgSettings />
	</div>
</div>
