<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { formatNPR } from '$lib/currency';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { Plus, PackageOpen } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { formatDate } from '$lib/date-utils';

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
	<!-- Toolbar -->
	<div class="flex items-center justify-end gap-3">
		<a href="/stock-import/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('action_new_import')}
			</Button>
		</a>
	</div>

	<!-- Table -->
	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
				<p class="text-sm text-zinc-500">{t('common_loading')}</p>
			</div>
		</div>
	{:else if invoices.length === 0}
		<EmptyState
			icon={PackageOpen}
			title={t('empty_stock_import')}
			description={t('empty_stock_import_desc')}
			actionLabel={t('stock_import_create')}
			actionHref="/stock-import/new"
			actionIcon={Plus}
		/>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('invoice_number')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('stock_import_party')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('common_date')}</Table.Head>
						<Table.Head class="text-center font-semibold text-zinc-600 dark:text-zinc-400">{t('stock_import_items')}</Table.Head>
						<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('common_total')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('order_status')}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each invoices as inv (inv._id)}
						<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40" onclick={() => { window.location.href = `/stock-import/${inv._id}`; }}>
							<Table.Cell>
								{#if inv.invoiceNumber}
									<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
										{inv.invoiceNumber}
									</Badge>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-sm text-zinc-600 dark:text-zinc-400">
								{getPartyName(inv.partyId)}
							</Table.Cell>
							<Table.Cell class="text-sm text-zinc-500 dark:text-zinc-400">
								{formatDate(inv.issuedAt)}
							</Table.Cell>
							<Table.Cell class="text-center font-mono text-sm text-zinc-700 dark:text-zinc-300">
								{inv.items.length}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
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
		<p class="text-xs text-zinc-400 dark:text-zinc-500">
			{invoices.length} {invoices.length === 1 ? 'import' : 'imports'}
		</p>
	{/if}
</div>
