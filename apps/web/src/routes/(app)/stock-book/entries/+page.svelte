<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import StockBookEntries from '$lib/components/modules/stock-book/StockBookEntries.svelte';
	import { Button } from '$lib/components/ui/button';
	import { BookOpen, ArrowLeft } from '@lucide/svelte';
</script>

<MetaTags title="Stock Book Entries" />

<div class="p-6">
	<div class="mb-6 flex items-center gap-3">
		<a href="/stock-book">
			<Button variant="ghost" size="icon" class="size-8">
				<ArrowLeft class="size-4" />
			</Button>
		</a>
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<BookOpen class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Stock Book Entries</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">Raw stock movement records.</p>
			</div>
		</div>
	</div>

	<StockBookEntries />
</div>
