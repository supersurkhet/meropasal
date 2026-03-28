<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowLeft, Printer } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	type Props = {
		invoiceId: string;
		workosOrgName?: string;
	};

	let { invoiceId, workosOrgName = '' }: Props = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const invoice = useConvexQuery(client, api.functions.invoices.getById, () => ({
		id: invoiceId as any,
	}));

	$effect(() => {
		breadcrumbLabel.set(invoice.data?.invoiceNumber ?? null);
		return () => breadcrumbLabel.set(null);
	});

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
	<div class="space-y-6">
		<!-- Header Actions -->
		<div class="flex items-center justify-between">
			<a href="/invoices" class="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
				<ArrowLeft class="size-4" />
				{t('detail_back_to_invoices')}
			</a>
			<Skeleton class="h-8 w-24 rounded-md" />
		</div>

		<!-- Invoice Card -->
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<!-- Business Header -->
			<div class="mb-6 text-center">
				<Skeleton class="mx-auto h-6 w-48" />
				<Skeleton class="mx-auto mt-1 h-4 w-32" />
				<Skeleton class="mx-auto mt-1 h-4 w-28" />
			</div>

			<Separator class="mb-6" />

			<!-- Invoice Meta -->
			<div class="mb-6 grid grid-cols-2 gap-4">
				<div>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_number')}</p>
					<Skeleton class="mt-0.5 h-5 w-24" />
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_type')}</p>
					<Skeleton class="ml-auto mt-0.5 h-5 w-16 rounded-full" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_issued_at')}</p>
					<Skeleton class="mt-0.5 h-5 w-24" />
				</div>
				<div class="text-right">
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_fiscal_year')}</p>
					<Skeleton class="ml-auto mt-0.5 h-5 w-16" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('invoice_due_date')}</p>
					<Skeleton class="mt-0.5 h-5 w-24" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase text-zinc-500">{t('order_status')}</p>
					<Skeleton class="mt-0.5 h-5 w-16 rounded-full" />
				</div>
			</div>

			<!-- Party Info -->
			<div class="mb-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
				<p class="text-xs font-medium uppercase text-zinc-500">{t('party_title')}</p>
				<Skeleton class="mt-0.5 h-5 w-36" />
			</div>

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
						{#each Array(4) as _, i}
							<Table.Row>
								<Table.Cell class="text-zinc-500">{i + 1}</Table.Cell>
								<Table.Cell><Skeleton class="h-4 w-36" /></Table.Cell>
								<Table.Cell class="text-center"><Skeleton class="mx-auto h-4 w-10" /></Table.Cell>
								<Table.Cell class="text-center"><Skeleton class="mx-auto h-4 w-10" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-16" /></Table.Cell>
								<Table.Cell class="text-right"><Skeleton class="ml-auto h-4 w-20" /></Table.Cell>
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
						<Skeleton class="h-4 w-20" />
					</div>
					<Separator />
					<div class="flex justify-between font-semibold">
						<span>{t('common_total')}</span>
						<Skeleton class="h-5 w-24" />
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-zinc-500">{t('payment_summary_paid')}</span>
						<Skeleton class="h-4 w-20" />
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-zinc-500">{t('detail_balance_due')}</span>
						<Skeleton class="h-4 w-20" />
					</div>
				</div>
			</div>

			<!-- Payments -->
			<div class="mt-6">
				<h3 class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('payment_payments')}</h3>
				<div class="space-y-2">
					{#each Array(2) as _, i}
						<div class="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
							<div class="flex items-center gap-3">
								<span class="text-xs font-medium text-zinc-400">#{i + 1}</span>
								<Skeleton class="h-4 w-20" />
								<Skeleton class="h-5 w-16 rounded" />
							</div>
							<Skeleton class="h-4 w-20" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{:else if !invoice.data}
	<div class="py-12 text-center text-zinc-500">
		<p>{t('detail_invoice_not_found')}</p>
		<a href="/invoices" class="mt-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
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
					{workosOrgName || 'Business Name'}
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
			<module.default invoice={inv} orgSettings={org} {workosOrgName} onclose={() => { showPrint = false; }} />
		{/await}
	{/if}
{/if}
