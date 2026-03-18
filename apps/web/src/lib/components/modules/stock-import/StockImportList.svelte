<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { formatNPR } from '$lib/currency';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { Plus, PackageOpen } from '@lucide/svelte';

	type Invoice = {
		_id: string;
		invoiceNumber?: string;
		partyId?: string;
		issuedAt: string;
		totalAmount: number;
		paymentStatus: string;
		items: Array<{ productTitle: string; quantity: number; rate: number; total: number }>;
	};

	type Party = { _id: string; name: string };

	let invoices = $state<Invoice[]>([]);
	let parties = $state<Party[]>([]);
	let loaded = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const [invoicesData, partiesData] = await Promise.all([
			client.query(api.functions.stockImport.list, {}),
			client.query(api.functions.parties.list, {}),
		]);
		invoices = invoicesData;
		parties = partiesData;
		loaded = true;
	}

	function getPartyName(partyId?: string): string {
		if (!partyId) return '—';
		return parties.find((p) => p._id === partyId)?.name ?? '—';
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-NP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'paid': return 'default';
			case 'partial': return 'secondary';
			case 'pending': return 'outline';
			default: return 'destructive';
		}
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Stock Import</h1>
			<p class="mt-0.5 text-sm text-zinc-500">
				{invoices.length} import{invoices.length !== 1 ? 's' : ''} recorded
			</p>
		</div>
		<Button href="/stock-import/new" class="gap-2">
			<Plus class="size-4" />
			New Import
		</Button>
	</div>

	<!-- Table -->
	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
		</div>
	{:else if invoices.length === 0}
		<div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
			<PackageOpen class="mb-3 size-10 text-zinc-300 dark:text-zinc-600" />
			<p class="text-sm text-zinc-500">No stock imports yet</p>
			<Button href="/stock-import/new" variant="outline" size="sm" class="mt-3 gap-2">
				<Plus class="size-3.5" />
				Import your first stock
			</Button>
		</div>
	{:else}
		<div class="rounded-lg border border-zinc-200 dark:border-zinc-800">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head>Invoice #</Table.Head>
						<Table.Head>Supplier</Table.Head>
						<Table.Head>Date</Table.Head>
						<Table.Head class="text-center">Items</Table.Head>
						<Table.Head class="text-right">Total</Table.Head>
						<Table.Head>Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each invoices as inv (inv._id)}
						<Table.Row class="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30" onclick={() => { window.location.href = `/stock-import/${inv._id}`; }}>
							<Table.Cell class="font-mono text-sm">
								<span class="font-medium">
									{inv.invoiceNumber ?? '—'}
								</span>
							</Table.Cell>
							<Table.Cell class="text-zinc-600 dark:text-zinc-400">
								{getPartyName(inv.partyId)}
							</Table.Cell>
							<Table.Cell class="text-sm text-zinc-500">
								{formatDate(inv.issuedAt)}
							</Table.Cell>
							<Table.Cell class="text-center font-mono text-sm">
								{inv.items.length}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums font-medium">
								{formatNPR(inv.totalAmount)}
							</Table.Cell>
							<Table.Cell>
								<Badge variant={statusVariant(inv.paymentStatus)} class="text-xs capitalize">
									{inv.paymentStatus}
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
