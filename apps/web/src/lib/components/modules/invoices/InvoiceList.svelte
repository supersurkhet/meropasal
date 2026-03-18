<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { FileText, Filter } from '@lucide/svelte';

	type InvoiceType = 'purchase' | 'sale';
	type PaymentStatusFilter = 'pending' | 'paid' | 'partial' | 'overpaid';

	let typeFilter = $state<InvoiceType | undefined>(undefined);
	let fiscalYearFilter = $state<string | undefined>(undefined);
	let paymentStatusFilter = $state<PaymentStatusFilter | undefined>(undefined);

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const currentFY = useConvexQuery(client, api.functions.fiscalYear.current, () => ({}));

	const invoices = useConvexQuery(client, api.functions.invoices.list, () => ({
		type: typeFilter,
		fiscalYear: fiscalYearFilter,
		paymentStatus: paymentStatusFilter,
	}));

	function typeBadgeVariant(type: string) {
		return type === 'purchase' ? 'secondary' : 'default';
	}

	function typeLabel(type: string) {
		return type === 'purchase' ? 'Purchase' : 'Sale';
	}

	function statusBadgeClass(status: string) {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'pending':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
			case 'partial':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'overpaid':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			default:
				return '';
		}
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-NP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	const fiscalYears = $derived.by(() => {
		if (!currentFY.data) return [];
		const fy = currentFY.data;
		const parts = fy.split('/').map(Number);
		const start = parts[0];
		const years: string[] = [];
		for (let i = 0; i < 5; i++) {
			const s = start - i;
			const e = s + 1;
			years.push(`${String(s).padStart(2, '0')}/${String(e).padStart(2, '0')}`);
		}
		return years;
	});
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex items-center gap-2">
			<Filter class="size-4 text-zinc-500" />
			<span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">Filters</span>
		</div>

		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				typeFilter = val ? (val as InvoiceType) : undefined;
			}}
		>
			<option value="">All Types</option>
			<option value="purchase">Purchase</option>
			<option value="sale">Sale</option>
		</select>

		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				fiscalYearFilter = val || undefined;
			}}
		>
			<option value="">All Fiscal Years</option>
			{#each fiscalYears as fy}
				<option value={fy}>{fy}</option>
			{/each}
		</select>

		<select
			class="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				paymentStatusFilter = val ? (val as PaymentStatusFilter) : undefined;
			}}
		>
			<option value="">All Statuses</option>
			<option value="pending">Pending</option>
			<option value="partial">Partial</option>
			<option value="paid">Paid</option>
			<option value="overpaid">Overpaid</option>
		</select>
	</div>

	{#if invoices.isLoading}
		<div class="flex items-center justify-center py-12 text-zinc-500">
			<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
			<span class="ml-2 text-sm">Loading invoices...</span>
		</div>
	{:else if !invoices.data?.length}
		<div class="flex flex-col items-center justify-center py-16 text-zinc-500">
			<FileText class="mb-3 size-10 opacity-40" />
			<p class="text-sm">No invoices found</p>
			<p class="mt-1 text-xs text-zinc-400">Invoices are auto-generated from purchases, sales, and orders.</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">Invoice #</Table.Head>
						<Table.Head class="font-semibold">Type</Table.Head>
						<Table.Head class="font-semibold">Party</Table.Head>
						<Table.Head class="font-semibold">Date</Table.Head>
						<Table.Head class="text-right font-semibold">Total</Table.Head>
						<Table.Head class="font-semibold">Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each invoices.data as invoice}
						<Table.Row
							class="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
							onclick={() => {
								window.location.href = `/invoices/${invoice._id}`;
							}}
						>
							<Table.Cell class="font-mono text-sm">
								{invoice.invoiceNumber || '—'}
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {invoice.type === 'purchase'
										? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
										: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}"
								>
									{typeLabel(invoice.type)}
								</span>
							</Table.Cell>
							<Table.Cell class="text-zinc-700 dark:text-zinc-300">
								{invoice.partyId || '—'}
							</Table.Cell>
							<Table.Cell class="text-zinc-600 dark:text-zinc-400">
								{formatDate(invoice.issuedAt)}
							</Table.Cell>
							<Table.Cell class="text-right font-medium tabular-nums">
								{formatNPR(invoice.totalAmount)}
							</Table.Cell>
							<Table.Cell>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {statusBadgeClass(invoice.paymentStatus)}"
								>
									{invoice.paymentStatus}
								</span>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
