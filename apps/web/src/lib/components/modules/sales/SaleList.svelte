<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { getConvexClient, api } from '$lib/convex';

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

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

{#if !loaded}
	<div class="flex items-center justify-center py-12">
		<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
	</div>
{:else if sales.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<p class="text-sm text-zinc-500 dark:text-zinc-400">No sales yet</p>
		<p class="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Create your first sale to get started</p>
	</div>
{:else}
	<div class="rounded-lg border border-zinc-200 dark:border-zinc-700">
		<Table.Root>
			<Table.Header>
				<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
					<Table.Head class="text-xs font-medium uppercase tracking-wider">Date</Table.Head>
					<Table.Head class="text-xs font-medium uppercase tracking-wider">Customer</Table.Head>
					<Table.Head class="text-xs font-medium uppercase tracking-wider">Items</Table.Head>
					<Table.Head class="text-xs font-medium uppercase tracking-wider text-right">Total</Table.Head>
					<Table.Head class="text-xs font-medium uppercase tracking-wider">Invoice #</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each sales as sale}
					<Table.Row class="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30" onclick={() => { window.location.href = `/sales/${sale._id}`; }}>
						<Table.Cell class="text-sm text-zinc-700 dark:text-zinc-300">
							{formatDate(sale.issuedAt)}
						</Table.Cell>
						<Table.Cell class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
							{sale.partyId ? (customerNames[sale.partyId] ?? '—') : 'Walk-in'}
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
{/if}
