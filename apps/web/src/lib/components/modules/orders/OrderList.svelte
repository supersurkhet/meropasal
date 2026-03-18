<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import { getConvexClient, api } from '$lib/convex';

	type Order = {
		_id: string;
		issuedAt: string;
		invoiceNumber?: string;
		partyId?: string;
		items: { productTitle: string; quantity: number }[];
		totalAmount: number;
		paidAmount: number;
		paymentStatus: string;
	};

	let orders = $state<Order[]>([]);
	let customerNames = $state<Record<string, string>>({});
	let statusFilter = $state('all');
	let loaded = $state(false);

	$effect(() => {
		loadOrders();
	});

	async function loadOrders() {
		const client = getConvexClient();
		const [ordersData, customers] = await Promise.all([
			client.query(api['functions/orders'].list, {}),
			client.query(api['functions/customers'].list, {}),
		]);
		orders = ordersData;
		const nameMap: Record<string, string> = {};
		for (const c of customers) {
			nameMap[c._id] = c.name;
		}
		customerNames = nameMap;
		loaded = true;
	}

	let filteredOrders = $derived.by(() => {
		if (statusFilter === 'all') return orders;
		if (statusFilter === 'done') return orders.filter((o) => o.invoiceNumber);
		if (statusFilter === 'cancelled') return orders.filter((o) => o.paymentStatus === 'cancelled');
		if (statusFilter === 'pending') return orders.filter((o) => !o.invoiceNumber && o.paymentStatus !== 'cancelled');
		return orders;
	});

	function orderStatus(order: Order): string {
		if (order.invoiceNumber) return 'done';
		if (order.paymentStatus === 'cancelled') return 'cancelled';
		return 'pending';
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'done':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
			case 'cancelled':
				return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
			default:
				return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
		}
	}

	function paymentBadgeClass(status: string): string {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
			case 'partial':
				return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
			case 'pending':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
			default:
				return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
		}
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

<!-- Status filter -->
<div class="mb-4">
	<Select.Root type="single" bind:value={statusFilter}>
		<Select.Trigger class="h-9 w-44 text-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
			{statusFilter === 'all' ? 'All Orders' : statusFilter === 'pending' ? 'Pending' : statusFilter === 'done' ? 'Done' : 'Cancelled'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="all">All Orders</Select.Item>
			<Select.Item value="pending">Pending</Select.Item>
			<Select.Item value="done">Done</Select.Item>
			<Select.Item value="cancelled">Cancelled</Select.Item>
		</Select.Content>
	</Select.Root>
</div>

{#if !loaded}
	<div class="flex items-center justify-center py-12">
		<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
	</div>
{:else if filteredOrders.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<p class="text-sm text-zinc-500 dark:text-zinc-400">No orders found</p>
		<p class="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Create your first order to get started</p>
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
					<Table.Head class="text-xs font-medium uppercase tracking-wider text-right">Paid</Table.Head>
					<Table.Head class="text-xs font-medium uppercase tracking-wider text-center">Status</Table.Head>
					<Table.Head class="text-xs font-medium uppercase tracking-wider text-center">Payment</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredOrders as order}
					{@const status = orderStatus(order)}
					<Table.Row class="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
						<Table.Cell>
							<a href="/orders/{order._id}" class="text-sm text-zinc-700 dark:text-zinc-300 hover:underline">
								{formatDate(order.issuedAt)}
							</a>
						</Table.Cell>
						<Table.Cell class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
							{order.partyId ? (customerNames[order.partyId] ?? '—') : 'Walk-in'}
						</Table.Cell>
						<Table.Cell class="max-w-[200px] truncate text-sm text-zinc-600 dark:text-zinc-400">
							{itemsSummary(order.items)}
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{formatNPR(order.totalAmount)}
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
							{formatNPR(order.paidAmount)}
						</Table.Cell>
						<Table.Cell class="text-center">
							<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {statusBadgeClass(status)}">
								{status === 'done' ? 'Done' : status === 'cancelled' ? 'Cancelled' : 'Pending'}
							</span>
						</Table.Cell>
						<Table.Cell class="text-center">
							<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {paymentBadgeClass(order.paymentStatus)}">
								{order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'partial' ? 'Partial' : order.paymentStatus === 'pending' ? 'Pending' : order.paymentStatus}
							</span>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
