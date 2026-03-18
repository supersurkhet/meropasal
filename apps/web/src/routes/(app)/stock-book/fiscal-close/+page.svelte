<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import FiscalCloseDialog from '$lib/components/modules/stock-book/FiscalCloseDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { CalendarCheck, ArrowLeft } from '@lucide/svelte';
</script>

<MetaTags title="Fiscal Year Close" />

<div class="p-6">
	<div class="mb-6 flex items-center gap-3">
		<a href="/stock-book">
			<Button variant="ghost" size="icon" class="size-8">
				<ArrowLeft class="size-4" />
			</Button>
		</a>
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
				<CalendarCheck class="size-5 text-amber-600" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Fiscal Year Close</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">Close the current fiscal year and carry forward balances.</p>
			</div>
		</div>
	</div>

	<FiscalCloseDialog />
</div>
