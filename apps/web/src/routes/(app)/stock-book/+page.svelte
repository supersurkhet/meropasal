<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import StockAggregation from '$lib/components/modules/stock-book/StockAggregation.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Package, BookOpen, CalendarCheck } from '@lucide/svelte';
</script>

<MetaTags title="Stock Book" />

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<Package class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Stock Book</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">Aggregated stock per product and supplier.</p>
			</div>
		</div>
		<div class="flex gap-2">
			<a href="/stock-book/entries">
				<Button variant="outline" size="sm">
					<BookOpen class="mr-1.5 size-4" />
					Entries
				</Button>
			</a>
			<a href="/stock-book/fiscal-close">
				<Button variant="outline" size="sm">
					<CalendarCheck class="mr-1.5 size-4" />
					Fiscal Close
				</Button>
			</a>
		</div>
	</div>

	<StockAggregation />
</div>
