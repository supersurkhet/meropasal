<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText, ShoppingCart } from '@lucide/svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	type Props = {
		saleId: string;
	};

	let { saleId }: Props = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const sale = useConvexQuery(client, api.functions.sales.getById, () => ({
		id: saleId as any,
	}));

	$effect(() => {
		const s = sale.data;
		breadcrumbLabel.set(s?.invoiceNumber ?? null);
		return () => breadcrumbLabel.set(null);
	});

	let customerName = $state<string | null>(null);

	$effect(() => {
		if (sale.data?.partyId) {
			client
				.query(api.functions.customers.getById, { id: sale.data.partyId as any })
				.then((c: any) => {
					customerName = c?.name ?? null;
				});
		}
	});

	function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (status) {
			case 'paid':
				return 'default';
			case 'partial':
				return 'secondary';
			case 'pending':
				return 'outline';
			default:
				return 'destructive';
		}
	}
</script>

{#if sale.isLoading}
	<div class="flex items-center justify-center py-12 text-zinc-500">
		<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
		<span class="ml-2 text-sm">{t('detail_loading_sale')}</span>
	</div>
{:else if !sale.data}
	<div class="py-12 text-center text-zinc-500">
		<ShoppingCart class="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-600" />
		<p class="text-sm">{t('detail_sale_not_found')}</p>
		<a href="/sales" class="mt-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
			<ArrowLeft class="size-3.5" />
			{t('detail_back_to_sales')}
		</a>
	</div>
{:else}
	{@const s = sale.data}

	<div class="space-y-6">
		<!-- Header Actions -->
		<div class="flex items-center justify-between">
			<a href="/sales" class="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
				<ArrowLeft class="size-4" />
				{t('detail_back_to_sales')}
			</a>
			{#if s.invoiceNumber}
				<Button href="/invoices/{s._id}" variant="outline" size="sm">
					<FileText class="mr-1.5 size-4" />
					{t('detail_view_invoice')}
				</Button>
			{/if}
		</div>

		<!-- Sale Card -->
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<!-- Sale Meta -->
			<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('detail_customer')}</p>
					<p class="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						{customerName ?? (s.partyId ? '...' : t('detail_walk_in_customer'))}
					</p>
				</div>
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('common_date')}</p>
					<p class="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(s.issuedAt)}</p>
				</div>
				{#if s.invoiceNumber}
					<div>
						<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('detail_invoice_number')}</p>
						<p class="mt-0.5 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{s.invoiceNumber}
						</p>
					</div>
				{/if}
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('order_status')}</p>
					<div class="mt-1">
						<Badge variant={statusBadgeVariant(s.paymentStatus)} class="capitalize">
							{s.paymentStatus}
						</Badge>
					</div>
				</div>
			</div>

			{#if s.fiscalYear}
				<div class="mb-6">
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('fiscal_year')}</p>
					<p class="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{s.fiscalYear}</p>
				</div>
			{/if}

			<Separator class="mb-6" />

			<!-- Line Items -->
			<div class="mb-6">
				<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('detail_items')}</h3>
				<div class="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
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
							{#each s.items as item, i}
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
			</div>

			<!-- Totals -->
			<div class="flex justify-end">
				<div class="w-64 space-y-2">
					{#if s.subTotal != null && s.subTotal !== s.totalAmount}
						<div class="flex justify-between text-sm">
							<span class="text-zinc-500">{t('detail_subtotal')}</span>
							<span class="tabular-nums">{formatNPR(s.subTotal)}</span>
						</div>
					{/if}
					{#if s.tax != null && s.tax > 0}
						<div class="flex justify-between text-sm">
							<span class="text-zinc-500">{t('detail_tax')}</span>
							<span class="tabular-nums">{formatNPR(s.tax)}</span>
						</div>
					{/if}
					{#if (s.subTotal != null && s.subTotal !== s.totalAmount) || (s.tax != null && s.tax > 0)}
						<Separator />
					{/if}
					<div class="flex justify-between font-semibold text-zinc-900 dark:text-zinc-100">
						<span>{t('common_total')}</span>
						<span class="font-mono tabular-nums">{formatNPR(s.totalAmount)}</span>
					</div>
					{#if s.paidAmount != null && s.paidAmount > 0}
						<div class="flex justify-between text-sm text-emerald-600">
							<span>{t('payment_summary_paid')}</span>
							<span class="tabular-nums">{formatNPR(s.paidAmount)}</span>
						</div>
					{/if}
					{#if s.paidAmount != null && s.totalAmount - s.paidAmount > 0}
						<div class="flex justify-between text-sm font-medium text-amber-600">
							<span>{t('detail_balance_due')}</span>
							<span class="tabular-nums">{formatNPR(s.totalAmount - s.paidAmount)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Payments -->
			{#if s.payments?.length}
				<div class="mt-6">
					<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('payment_payments')}</h3>
					<div class="space-y-2">
						{#each s.payments as payment, i}
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
{/if}
