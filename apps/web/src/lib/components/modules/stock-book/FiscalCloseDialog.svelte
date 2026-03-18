<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNumber } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { AlertTriangle, CalendarCheck, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	let showConfirm = $state(false);

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const aggregation = useConvexQuery(client, api.functions.stockBook.getAggregation, () => ({
		fiscalYear: currentFY.data ?? undefined,
	}));

	const products = useConvexQuery(client, api.functions.products.list, () => ({}));

	const closeMutation = useConvexMutation(client, api.functions.fiscalYear.closeFiscalYear);

	type StockSnapshot = { productId: string; productTitle: string; totalAvailable: number };

	const stockSnapshot = $derived.by((): StockSnapshot[] => {
		if (!aggregation.data || !products.data) return [];
		const productMap = new Map((products.data as any[]).map((p) => [p._id, p.title]));
		const result: StockSnapshot[] = [];
		for (const [productId, total] of Object.entries(aggregation.data.productTotalAvailable ?? {})) {
			result.push({
				productId,
				productTitle: productMap.get(productId) ?? productId,
				totalAvailable: total as number,
			});
		}
		return result.sort((a, b) => a.productTitle.localeCompare(b.productTitle));
	});

	async function handleClose() {
		if (!currentFY.data) return;

		try {
			const result = await closeMutation.mutate({
				fiscalYear: currentFY.data,
				closeDate: new Date().toISOString().split('T')[0],
			});
			toast.success(`Fiscal year ${currentFY.data} closed. New FY: ${(result as any).newFiscalYear}. ${(result as any).entriesCreated} entries created.`);
			showConfirm = false;
		} catch (err) {
			toast.error(`Failed to close fiscal year: ${(err as Error).message}`);
		}
	}
</script>

<div class="space-y-6">
	<!-- Current FY Info -->
	<div class="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
		<div class="flex items-center gap-3 mb-4">
			<div class="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
				<CalendarCheck class="size-5 text-amber-600" />
			</div>
			<div>
				<h3 class="font-semibold text-zinc-900 dark:text-zinc-100">Current Fiscal Year</h3>
				<p class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
					{currentFY.data ?? '—'}
				</p>
			</div>
		</div>

		<Separator class="my-4" />

		<!-- Stock Snapshot -->
		<h4 class="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Stock Snapshot</h4>

		{#if !stockSnapshot.length}
			<p class="text-sm text-zinc-500">No stock data for current fiscal year.</p>
		{:else}
			<div class="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="font-semibold">Product</Table.Head>
							<Table.Head class="text-right font-semibold">Available Stock</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each stockSnapshot as item}
							<Table.Row>
								<Table.Cell>{item.productTitle}</Table.Cell>
								<Table.Cell class="text-right tabular-nums font-medium">
									{formatNumber(item.totalAvailable)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</div>

	<!-- Close Action -->
	{#if !showConfirm}
		<Button
			variant="destructive"
			size="lg"
			class="w-full"
			onclick={() => { showConfirm = true; }}
			disabled={!currentFY.data}
		>
			Close Fiscal Year {currentFY.data ?? ''}
		</Button>
	{:else}
		<div class="rounded-xl border-2 border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
			<div class="flex items-start gap-3">
				<AlertTriangle class="mt-0.5 size-5 text-amber-600 shrink-0" />
				<div class="space-y-3">
					<h4 class="font-semibold text-amber-900 dark:text-amber-200">
						Confirm Fiscal Year Close
					</h4>
					<p class="text-sm text-amber-800 dark:text-amber-300">
						This will close fiscal year <strong>{currentFY.data}</strong> and:
					</p>
					<ul class="list-disc pl-5 text-sm text-amber-800 dark:text-amber-300 space-y-1">
						<li>Create <strong>closing entries</strong> (out) for all products</li>
						<li>Create <strong>opening entries</strong> (in) for the next fiscal year</li>
						<li>Advance the org to the next fiscal year</li>
					</ul>
					<p class="text-sm font-medium text-amber-900 dark:text-amber-200">
						This action cannot be undone.
					</p>

					<div class="flex gap-3 pt-2">
						<Button
							variant="destructive"
							onclick={handleClose}
							disabled={closeMutation.isLoading}
						>
							{#if closeMutation.isLoading}
								<Loader2 class="mr-1.5 size-4 animate-spin" />
								Closing...
							{:else}
								Yes, Close Fiscal Year
							{/if}
						</Button>
						<Button
							variant="outline"
							onclick={() => { showConfirm = false; }}
							disabled={closeMutation.isLoading}
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
