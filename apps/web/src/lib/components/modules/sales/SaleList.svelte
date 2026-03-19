<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { getConvexClient, api } from '$lib/convex';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { ShoppingCart, Plus } from '@lucide/svelte';
	import { formatDate } from '$lib/date-utils';

	type SaleInvoice = {
		_id: string;
		invoiceNumber?: string;
		issuedAt: string;
		partyId?: string;
		items: { productTitle: string; quantity: number }[];
		totalAmount: number;
	};

	let sales = $state<SaleInvoice[]>([]);
	let customerNames = $state<Record<string, string>>({});
	let loaded = $state(false);

	$effect(() => {
		loadSales();
	});

	async function loadSales() {
		const client = getConvexClient();
		const [salesData, customers] = await Promise.all([
			client.query(api['functions/sales'].list, {}),
			client.query(api['functions/customers'].list, {}),
		]);
		// Sales list returns invoices — only show those with invoiceNumber (fulfilled sales)
		sales = salesData.filter((s: any) => s.invoiceNumber);
		const nameMap: Record<string, string> = {};
		for (const c of customers) {
			nameMap[c._id] = c.name;
		}
		customerNames = nameMap;
		loaded = true;
	}

	function formatNPR(amount: number): string {
		return new Intl.NumberFormat('en-NP', {
			style: 'currency',
			currency: 'NPR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(amount);
	}

	function itemsSummary(items: { productTitle: string; quantity: number }[]): string {
		if (items.length <= 2) {
			return items.map((i) => `${i.productTitle} ×${i.quantity}`).join(', ');
		}
		return `${items[0].productTitle} ×${items[0].quantity} +${items.length - 1} more`;
	}
</script>

<div class="space-y-4">
{#if !loaded}
	<div class="flex items-center justify-center py-20">
		<div class="flex flex-col items-center gap-3">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
			<p class="text-sm text-zinc-500">Loading sales...</p>
		</div>
	</div>
{:else if sales.length === 0}
	<EmptyState
		icon={ShoppingCart}
		title={t('empty_sales')}
		description={t('empty_sales_desc')}
		actionLabel={t('sale_create')}
		actionHref="/sales/new"
		actionIcon={Plus}
	/>
{:else}
	<!-- Toolbar -->
	<div class="flex items-center justify-end gap-3">
		<a href="/sales/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('sale_create')}
			</Button>
		</a>
	</div>
	<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
		<Table.Root>
			<Table.Header>
				<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('common_date')}</Table.Head>
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('sale_customer')}</Table.Head>
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('sale_items')}</Table.Head>
					<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('common_total')}</Table.Head>
					<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('invoice_number')}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each sales as sale}
					<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60" onclick={() => { window.location.href = `/sales/${sale._id}`; }}>
						<Table.Cell class="text-sm text-zinc-700 dark:text-zinc-300">
							{formatDate(sale.issuedAt)}
						</Table.Cell>
						<Table.Cell class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
							{sale.partyId ? (customerNames[sale.partyId] ?? '—') : t('common_walk_in')}
						</Table.Cell>
						<Table.Cell class="max-w-[240px] truncate text-sm text-zinc-600 dark:text-zinc-400">
							{itemsSummary(sale.items)}
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{formatNPR(sale.totalAmount)}
						</Table.Cell>
						<Table.Cell class="font-mono text-xs text-zinc-500 dark:text-zinc-400">
							{sale.invoiceNumber ?? '—'}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<p class="text-xs text-zinc-400 dark:text-zinc-500">
		{sales.length} {sales.length === 1 ? 'sale' : 'sales'}
	</p>
{/if}
</div>
