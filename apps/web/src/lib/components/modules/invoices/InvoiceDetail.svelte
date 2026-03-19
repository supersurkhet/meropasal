<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

	type Props = {
		invoiceId: string;
	};

	let { invoiceId }: Props = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const invoice = useConvexQuery(client, api.functions.invoices.getById, () => ({
		id: invoiceId as any,
	}));

	const orgSettings = useConvexQuery(client, api.functions.organizations.getSettings, () => ({}));

	let showPrint = $state(false);

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
</script>

{#if invoice.isLoading}
	<div class="flex items-center justify-center py-12 text-zinc-500">
		<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
		<span class="ml-2 text-sm">{t('detail_loading_invoice')}</span>
	</div>
{:else if !invoice.data}
	<div class="py-12 text-center text-zinc-500">
		<p>{t('detail_invoice_not_found')}</p>
		<a href="/invoices" class="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
			<ArrowLeft class="size-3.5" />
			{t('detail_back_to_invoices')}
		</a>
	</div>
{:else}
	{@const inv = invoice.data}
	{@const org = orgSettings.data}

	<div class="space-y-6">
		<!-- Header Actions -->
		<div class="flex items-center justify-between">
			<a href="/invoices" class="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
				<ArrowLeft class="size-4" />
				{t('detail_back_to_invoices')}
			</a>
			<Button variant="outline" size="sm" onclick={() => { showPrint = true; }}>
				<Printer class="mr-1.5 size-4" />
				{t('action_print')}
			</Button>
		</div>

		<!-- Invoice Card -->
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950" id="invoice-content">
			<!-- Business Header -->
			<div class="mb-6 text-center">
				<h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">
					{org?.businessName || 'Business Name'}
				</h2>
				{#if org?.location}
					<p class="text-sm text-zinc-500">{org.location}</p>
				{/if}
				{#if org?.phone}
					<p class="text-sm text-zinc-500">Tel: {org.phone}</p>
				{/if}
				{#if org?.panNumber}
					<p class="text-sm text-zinc-500">PAN: {org.panNumber}</p>
				{/if}
			</div>

			<Separator class="mb-6" />

			<!-- Invoice Meta -->
			<div class="mb-6 grid grid-cols-2 gap-4">
				<div>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_number')}</p>
					<p class="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						{inv.invoiceNumber || '—'}
					</p>
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_type')}</p>
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {inv.type === 'purchase'
							? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
							: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}"
					>
						{inv.type === 'purchase' ? t('invoice_type_purchase') : t('invoice_type_sale')}
					</span>
				</div>
				<div>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_issued_at')}</p>
					<p class="text-sm text-zinc-700 dark:text-zinc-300">{formatDate(inv.issuedAt)}</p>
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_fiscal_year')}</p>
					<p class="text-sm text-zinc-700 dark:text-zinc-300">{inv.fiscalYear}</p>
				</div>
				{#if inv.dueDate}
					<div>
						<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_due_date')}</p>
						<p class="text-sm text-zinc-700 dark:text-zinc-300">{formatDate(inv.dueDate)}</p>
					</div>
				{/if}
				<div class={inv.dueDate ? 'text-right' : ''}>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('order_status')}</p>
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {statusBadgeClass(inv.paymentStatus)}"
					>
						{inv.paymentStatus}
					</span>
				</div>
			</div>

			<!-- Party Info -->
			{#if inv.partyId}
				<div class="mb-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
					<p class="text-xs font-medium uppercase text-zinc-500">
						{inv.partyType === 'customer' ? t('customer_title') : t('party_title')}
					</p>
					<p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{inv.partyId}</p>
				</div>
			{/if}

			<!-- Line Items -->
			<div class="mb-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="w-12 font-semibold">{t('common_sn')}</Table.Head>
							<Table.Head class="font-semibold">{t('product_title')}</Table.Head>
							<Table.Head class="text-center font-semibold">{t('common_quantity')}</Table.Head>
							<Table.Head class="text-center font-semibold">{t('product_unit')}</Table.Head>
							<Table.Head class="text-right font-semibold">{t('common_rate')}</Table.Head>
							<Table.Head class="text-right font-semibold">{t('common_amount')}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each inv.items as item, i}
							<Table.Row>
								<Table.Cell class="text-zinc-500">{i + 1}</Table.Cell>
								<Table.Cell class="font-medium">{item.productTitle}</Table.Cell>
								<Table.Cell class="text-center tabular-nums">{item.quantity}</Table.Cell>
								<Table.Cell class="text-center text-zinc-500">{item.unit || '—'}</Table.Cell>
								<Table.Cell class="text-right tabular-nums">{formatNPR(item.rate)}</Table.Cell>
								<Table.Cell class="text-right font-medium tabular-nums">{formatNPR(item.total)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Totals -->
			<div class="flex justify-end">
				<div class="w-64 space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-zinc-500">{t('invoice_subtotal')}</span>
						<span class="tabular-nums">{formatNPR(inv.subTotal)}</span>
					</div>
					{#if inv.tax > 0}
						<div class="flex justify-between text-sm">
							<span class="text-zinc-500">{t('invoice_tax')}</span>
							<span class="tabular-nums">{formatNPR(inv.tax)}</span>
						</div>
					{/if}
					<Separator />
					<div class="flex justify-between font-semibold">
						<span>{t('common_total')}</span>
						<span class="tabular-nums">{formatNPR(inv.totalAmount)}</span>
					</div>
					{#if inv.paidAmount > 0}
						<div class="flex justify-between text-sm text-emerald-600">
							<span>{t('payment_summary_paid')}</span>
							<span class="tabular-nums">{formatNPR(inv.paidAmount)}</span>
						</div>
					{/if}
					{#if inv.totalAmount - inv.paidAmount > 0}
						<div class="flex justify-between text-sm font-medium text-amber-600">
							<span>{t('detail_balance_due')}</span>
							<span class="tabular-nums">{formatNPR(inv.totalAmount - inv.paidAmount)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Payments -->
			{#if inv.payments?.length}
				<div class="mt-6">
					<h3 class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('payment_payments')}</h3>
					<div class="space-y-2">
						{#each inv.payments as payment, i}
							<div class="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
								<div class="flex items-center gap-3">
									<span class="text-xs font-medium text-zinc-400">#{i + 1}</span>
									<span class="text-sm text-zinc-700 dark:text-zinc-300">
										{formatDate(payment.paidAt)}
									</span>
									<span class="rounded bg-zinc-100 px-2 py-0.5 text-xs capitalize dark:bg-zinc-800">
										{payment.paymentMethod}
									</span>
									{#if payment.bankVoucherNumber}
										<span class="font-mono text-xs text-zinc-500">
											{t('detail_voucher')}: {payment.bankVoucherNumber}
										</span>
									{/if}
								</div>
								<span class="font-medium tabular-nums text-emerald-600">
									{formatNPR(payment.paidAmount)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Print Dialog -->
	{#if showPrint}
		{@const InvoicePrint = import('./InvoicePrint.svelte')}
		{#await InvoicePrint then module}
			<module.default invoice={inv} orgSettings={org} onclose={() => { showPrint = false; }} />
		{/await}
	{/if}
{/if}
