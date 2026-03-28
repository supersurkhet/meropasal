<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import BillTemplateEditor from '$lib/components/modules/settings/BillTemplateEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileSliders } from '@lucide/svelte';
	import { page } from '$app/stores';

	let workosOrgName = $derived(($page.data as any).workosOrgName ?? '');
	let orgMetadata = $derived(($page.data as any).orgMetadata ?? {});
</script>

<MetaTags title="Bill Template" />

<div class="p-6">
	<div class="mb-6 flex items-center gap-3">
		<a href="/settings">
			<Button variant="ghost" size="icon" class="size-8">
				<ArrowLeft class="size-4" />
			</Button>
		</a>
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<FileSliders class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Bill Template</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">Customize your invoice print layout with live preview.</p>
			</div>
		</div>
	</div>

	<BillTemplateEditor {workosOrgName} {orgMetadata} />
</div>
