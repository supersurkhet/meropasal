<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import { Button } from '$lib/components/ui/button';
	import { X, Printer } from '@lucide/svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

	type InvoiceData = {
		invoiceNumber?: string;
		type: 'purchase' | 'sale';
		issuedAt: string;
		dueDate?: string;
		fiscalYear: string;
		partyId?: string;
		partyType?: string;
		items: Array<{
			productTitle: string;
			quantity: number;
			rate: number;
			total: number;
			unit?: string;
		}>;
		subTotal: number;
		tax: number;
		totalAmount: number;
		paidAmount: number;
		paymentStatus: string;
		payments: Array<{
			paidAt: string;
			paidAmount: number;
			paymentMethod: string;
			bankVoucherNumber?: string;
		}>;
		description?: string;
	};

	type OrgSettings = {
		businessName?: string;
		location?: string;
		phone?: string;
		panNumber?: string;
	} | null;

	type Props = {
		invoice: InvoiceData;
		orgSettings?: OrgSettings;
		onclose: () => void;
	};

	let { invoice, orgSettings, onclose }: Props = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const template = useConvexQuery(client, api.functions.billTemplates.getDefault, () => ({}));

	let partyName = $state<string | null>(null);

	$effect(() => {
		if (invoice.partyId) {
			const queryFn = invoice.partyType === 'customer'
				? api.functions.customers.getById
				: api.functions.parties.getById;
			client.query(queryFn, { id: invoice.partyId as any }).then((p: any) => {
				partyName = p?.name ?? null;
			});
		}
	});

	const layout = $derived(template.data?.layout ?? {
		headerFields: ['businessName', 'address', 'phone', 'pan'],
		showLogo: false,
		logoPosition: 'left' as const,
		columnOrder: ['sn', 'product', 'quantity', 'unit', 'rate', 'amount'],
		showTax: true,
		showDiscount: false,
		footerText: 'Thank you for your business!',
		paperSize: 'a4' as const,
		fontSize: 'medium' as const,
		showPaymentDetails: true,
		customFields: [],
	});

	const paperClass = $derived.by(() => {
		switch (layout.paperSize) {
			case 'a5': return 'max-w-[148mm] mx-auto';
			case 'thermal-80mm': return 'max-w-[80mm] mx-auto text-xs';
			case 'thermal-58mm': return 'max-w-[58mm] mx-auto text-[10px]';
			default: return 'max-w-[210mm] mx-auto';
		}
	});

	const fontClass = $derived.by(() => {
		switch (layout.fontSize) {
			case 'small': return 'text-xs';
			case 'large': return 'text-base';
			default: return 'text-sm';
		}
	});

	function handlePrint() {
		window.print();
	}
</script>

<!-- Print overlay -->
<div class="fixed inset-0 z-50 bg-black/50 print:hidden" role="dialog">
	<div class="flex h-full flex-col">
		<!-- Toolbar -->
		<div class="flex items-center justify-between bg-white px-4 py-3 shadow dark:bg-zinc-900">
			<h3 class="text-sm font-semibold">{t('detail_print_preview')}</h3>
			<div class="flex items-center gap-2">
				<Button variant="default" size="sm" onclick={handlePrint}>
					<Printer class="mr-1.5 size-4" />
					{t('action_print')}
				</Button>
				<Button variant="ghost" size="icon" onclick={onclose}>
					<X class="size-4" />
				</Button>
			</div>
		</div>

		<!-- Preview Area -->
		<div class="flex-1 overflow-auto bg-zinc-100 p-8 dark:bg-zinc-950">
			<div class="{paperClass} rounded-sm bg-white p-8 text-zinc-900 shadow-lg print:shadow-none print:p-0" id="print-area">
				<div class={fontClass}>
					<!-- Business Header -->
					<div class="mb-6 text-center">
						{#if layout.headerFields?.includes('businessName')}
							<h1 class="text-lg font-bold">{orgSettings?.businessName || 'Business Name'}</h1>
						{/if}
						{#if layout.headerFields?.includes('address') && orgSettings?.location}
							<p class="text-zinc-600">{orgSettings.location}</p>
						{/if}
						{#if layout.headerFields?.includes('phone') && orgSettings?.phone}
							<p class="text-zinc-600">Tel: {orgSettings.phone}</p>
						{/if}
						{#if layout.headerFields?.includes('pan') && orgSettings?.panNumber}
							<p class="text-zinc-600">PAN: {orgSettings.panNumber}</p>
						{/if}
					</div>

					<div class="mb-4 border-b-2 border-black pb-2 text-center">
						<h2 class="text-base font-bold uppercase">
							{invoice.type === 'purchase' ? t('detail_invoice_type_purchase') : t('detail_invoice_type_sale')}
						</h2>
					</div>

					<!-- Invoice Meta Row -->
					<div class="mb-4 flex justify-between text-xs">
						<div>
							<p><strong>{t('invoice_number')}:</strong> {invoice.invoiceNumber || '—'}</p>
							<p><strong>{t('common_date')}:</strong> {formatDate(invoice.issuedAt)}</p>
							{#if invoice.dueDate}
								<p><strong>{t('invoice_due_date')}:</strong> {formatDate(invoice.dueDate)}</p>
							{/if}
						</div>
						<div class="text-right">
							<p><strong>{t('invoice_fiscal_year')}:</strong> {invoice.fiscalYear}</p>
							{#if invoice.partyId}
								<p><strong>{invoice.partyType === 'customer' ? t('customer_title') : t('party_title')}:</strong> {partyName ?? '...'}</p>
							{/if}
						</div>
					</div>

					<!-- Items Table -->
					<table class="mb-4 w-full border-collapse border border-zinc-400">
						<thead>
							<tr class="bg-zinc-100 dark:bg-zinc-800">
								{#each layout.columnOrder ?? ['sn', 'product', 'quantity', 'unit', 'rate', 'amount'] as col}
									{#if col === 'sn'}
										<th class="border border-zinc-400 px-2 py-1 text-left">{t('common_sn')}</th>
									{:else if col === 'product'}
										<th class="border border-zinc-400 px-2 py-1 text-left">{t('product_title')}</th>
									{:else if col === 'quantity'}
										<th class="border border-zinc-400 px-2 py-1 text-center">{t('common_quantity')}</th>
									{:else if col === 'unit'}
										<th class="border border-zinc-400 px-2 py-1 text-center">{t('product_unit')}</th>
									{:else if col === 'rate'}
										<th class="border border-zinc-400 px-2 py-1 text-right">{t('common_rate')}</th>
									{:else if col === 'amount'}
										<th class="border border-zinc-400 px-2 py-1 text-right">{t('common_amount')}</th>
									{/if}
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each invoice.items as item, i}
								<tr>
									{#each layout.columnOrder ?? ['sn', 'product', 'quantity', 'unit', 'rate', 'amount'] as col}
										{#if col === 'sn'}
											<td class="border border-zinc-400 px-2 py-1">{i + 1}</td>
										{:else if col === 'product'}
											<td class="border border-zinc-400 px-2 py-1">{item.productTitle}</td>
										{:else if col === 'quantity'}
											<td class="border border-zinc-400 px-2 py-1 text-center">{item.quantity}</td>
										{:else if col === 'unit'}
											<td class="border border-zinc-400 px-2 py-1 text-center">{item.unit || '—'}</td>
										{:else if col === 'rate'}
											<td class="border border-zinc-400 px-2 py-1 text-right">{formatNPR(item.rate)}</td>
										{:else if col === 'amount'}
											<td class="border border-zinc-400 px-2 py-1 text-right">{formatNPR(item.total)}</td>
										{/if}
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>

					<!-- Totals -->
					<div class="mb-4 flex justify-end">
						<div class="w-48">
							<div class="flex justify-between border-b border-zinc-300 py-1">
								<span>{t('invoice_subtotal')}</span>
								<span>{formatNPR(invoice.subTotal)}</span>
							</div>
							{#if layout.showTax && invoice.tax > 0}
								<div class="flex justify-between border-b border-zinc-300 py-1">
									<span>{t('invoice_tax')}</span>
									<span>{formatNPR(invoice.tax)}</span>
								</div>
							{/if}
							<div class="flex justify-between py-1 font-bold">
								<span>{t('common_total')}</span>
								<span>{formatNPR(invoice.totalAmount)}</span>
							</div>
						</div>
					</div>

					<!-- Payments -->
					{#if layout.showPaymentDetails && invoice.payments?.length}
						<div class="mb-4">
							<p class="mb-1 font-semibold">{t('payment_payments')}:</p>
							{#each invoice.payments as payment}
								<p class="text-xs">
									{formatDate(payment.paidAt)} — {formatNPR(payment.paidAmount)} ({payment.paymentMethod})
									{#if payment.bankVoucherNumber}
										[{t('detail_voucher')}: {payment.bankVoucherNumber}]
									{/if}
								</p>
							{/each}
						</div>
					{/if}

					<!-- Custom Fields -->
					{#if layout.customFields?.length}
						<div class="mb-4 text-xs">
							{#each layout.customFields as field}
								<p><strong>{field.label}:</strong> {field.value}</p>
							{/each}
						</div>
					{/if}

					<!-- Footer -->
					{#if layout.footerText}
						<div class="mt-8 border-t border-zinc-300 pt-2 text-center text-xs text-zinc-600">
							{layout.footerText}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@media print {
		:global(body > *:not(#print-area)) {
			display: none !important;
		}
	}
</style>
