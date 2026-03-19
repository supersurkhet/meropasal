<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, FileText, PackageOpen } from '@lucide/svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';

	type Props = {
		importId: string;
	};

	let { importId }: Props = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const stockImport = useConvexQuery(client, api.functions.stockImport.getById, () => ({
		id: importId as any,
	}));

	let partyName = $state<string | null>(null);

	$effect(() => {
		if (stockImport.data?.partyId) {
			client
				.query(api.functions.parties.getById, { id: stockImport.data.partyId as any })
				.then((p: any) => {
					partyName = p?.name ?? null;
				});
		}
	});

	$effect(() => {
		breadcrumbLabel.set(partyName);
		return () => breadcrumbLabel.set(null);
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

{#if stockImport.isLoading}
	<div class="flex items-center justify-center py-12 text-zinc-500">
		<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
		<span class="ml-2 text-sm">{t('detail_loading_stock_import')}</span>
	</div>
{:else if !stockImport.data}
	<div class="py-12 text-center text-zinc-500">
		<PackageOpen class="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-600" />
		<p class="text-sm">{t('detail_stock_import_not_found')}</p>
		<a href="/stock-import" class="mt-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
			<ArrowLeft class="size-3.5" />
			{t('detail_back_to_stock_imports')}
		</a>
	</div>
{:else}
	{@const imp = stockImport.data}

	<div class="space-y-6">
		<!-- Header Actions -->
		<div class="flex items-center justify-between">
			<a href="/stock-import" class="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
				<ArrowLeft class="size-4" />
				{t('detail_back_to_stock_imports')}
			</a>
			{#if imp.invoiceNumber}
				<Button href="/invoices/{imp._id}" variant="outline" size="sm">
					<FileText class="mr-1.5 size-4" />
					{t('detail_view_invoice')}
				</Button>
			{/if}
		</div>

		<!-- Import Card -->
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<!-- Import Meta -->
			<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('detail_supplier')}</p>
					<p class="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						{partyName ?? (imp.partyId ? '...' : '—')}
					</p>
				</div>
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('common_date')}</p>
					<p class="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(imp.issuedAt)}</p>
				</div>
				{#if imp.invoiceNumber}
					<div>
						<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('detail_invoice_number')}</p>
						<p class="mt-0.5 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{imp.invoiceNumber}
						</p>
					</div>
				{/if}
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('order_status')}</p>
					<div class="mt-1">
						<Badge variant={statusBadgeVariant(imp.paymentStatus)} class="capitalize">
							{imp.paymentStatus}
						</Badge>
					</div>
				</div>
			</div>

			{#if imp.fiscalYear}
				<div class="mb-6">
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('fiscal_year')}</p>
					<p class="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{imp.fiscalYear}</p>
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
							{#each imp.items as item, i}
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
					{#if imp.subTotal != null && imp.subTotal !== imp.totalAmount}
						<div class="flex justify-between text-sm">
							<span class="text-zinc-500">{t('detail_subtotal')}</span>
							<span class="tabular-nums">{formatNPR(imp.subTotal)}</span>
						</div>
					{/if}
					{#if imp.tax != null && imp.tax > 0}
						<div class="flex justify-between text-sm">
							<span class="text-zinc-500">{t('detail_tax')}</span>
							<span class="tabular-nums">{formatNPR(imp.tax)}</span>
						</div>
					{/if}
					{#if (imp.subTotal != null && imp.subTotal !== imp.totalAmount) || (imp.tax != null && imp.tax > 0)}
						<Separator />
					{/if}
					<div class="flex justify-between font-semibold text-zinc-900 dark:text-zinc-100">
						<span>{t('common_total')}</span>
						<span class="font-mono tabular-nums">{formatNPR(imp.totalAmount)}</span>
					</div>
					{#if imp.paidAmount != null && imp.paidAmount > 0}
						<div class="flex justify-between text-sm text-emerald-600">
							<span>{t('payment_summary_paid')}</span>
							<span class="tabular-nums">{formatNPR(imp.paidAmount)}</span>
						</div>
					{/if}
					{#if imp.paidAmount != null && imp.totalAmount - imp.paidAmount > 0}
						<div class="flex justify-between text-sm font-medium text-amber-600">
							<span>{t('detail_balance_due')}</span>
							<span class="tabular-nums">{formatNPR(imp.totalAmount - imp.paidAmount)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Description -->
			{#if imp.description}
				<div class="mt-6 rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/30">
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('detail_notes')}</p>
					<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{imp.description}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
