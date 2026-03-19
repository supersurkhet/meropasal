<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import PaymentSection from '$lib/components/shared/PaymentSection.svelte';
	import { getConvexClient, api } from '$lib/convex';
	import { type PaymentStatus } from '$lib/payment-status';
	import { Loader2, CheckCircle, AlertTriangle } from '@lucide/svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

	let {
		orderId,
	}: {
		orderId: string;
	} = $props();

	type OrderData = {
		_id: string;
		issuedAt: string;
		invoiceNumber?: string;
		partyId?: string;
		items: { productId: string; productTitle: string; quantity: number; rate: number; total: number; unit?: string }[];
		totalAmount: number;
		payments: { paidAt: string; paidAmount: number; paymentMethod: string; bankVoucherNumber?: string }[];
		paidAmount: number;
		paymentStatus: string;
		description?: string;
	};

	type PaymentRow = {
		paidAt: string;
		paidAmount: string;
		paymentMethod: string;
		bankVoucherNumber: string;
	};

	let order = $state<OrderData | null>(null);
	let customerName = $state('');
	let loaded = $state(false);
	let error = $state('');
	let actionLoading = $state('');

	let newPayments = $state<PaymentRow[]>([]);

	let isDone = $derived(!!order?.invoiceNumber);
	let isCancelled = $derived(order?.paymentStatus === 'cancelled');
	let isReadonly = $derived(isDone || isCancelled);

	let orderStatus = $derived(
		isDone ? 'done' : isCancelled ? 'cancelled' : 'pending',
	);

	$effect(() => {
		loadOrder();
	});

	async function loadOrder() {
		const client = getConvexClient();
		const data = await client.query(api['functions/orders'].getById, { id: orderId as any });
		if (data) {
			order = data as any;
			if (data.partyId) {
				const customer = await client.query(api['functions/customers'].getById, { id: data.partyId as any });
				customerName = customer?.name ?? 'Unknown';
			}
		}
		loaded = true;
	}

	async function addPayments() {
		if (!order) return;
		const validPayments = newPayments.filter((p) => Number(p.paidAmount) > 0);
		if (validPayments.length === 0) return;

		for (const p of validPayments) {
			if ((p.paymentMethod === 'bankTransfer' || p.paymentMethod === 'check') && !p.bankVoucherNumber.trim()) {
				error = 'Bank voucher number is required for bank transfer and check payments';
				return;
			}
		}

		error = '';
		actionLoading = 'payment';
		try {
			const client = getConvexClient();
			for (const p of validPayments) {
				await client.mutation(api['functions/orders'].addPayment, {
					orderId: order._id as any,
					payment: {
						paidAt: p.paidAt,
						paidAmount: Number(p.paidAmount),
						paymentMethod: p.paymentMethod as any,
						bankVoucherNumber: p.bankVoucherNumber.trim() || undefined,
					},
				});
			}
			newPayments = [];
			await loadOrder();
			toast.success('Payment recorded');
		} catch (err: any) {
			error = err.message || 'Failed to add payment';
		} finally {
			actionLoading = '';
		}
	}

	async function markDone() {
		if (!order) return;
		error = '';
		actionLoading = 'done';
		try {
			const client = getConvexClient();
			await client.mutation(api['functions/orders'].markDone, { orderId: order._id as any });
			await loadOrder();
			toast.success('Order marked as done');
		} catch (err: any) {
			error = err.message || 'Failed to mark order as done';
		} finally {
			actionLoading = '';
		}
	}

	function formatNPR(amount: number): string {
		return new Intl.NumberFormat('en-NP', {
			style: 'currency',
			currency: 'NPR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(amount);
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

	function paymentStatusBadgeClass(status: string): string {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
			case 'partial':
				return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
			case 'pending':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
			case 'overpaid':
				return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
			default:
				return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
		}
	}
</script>

{#if !loaded}
	<div class="flex items-center justify-center py-12">
		<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
	</div>
{:else if !order}
	<div class="py-12 text-center">
		<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('detail_order_not_found')}</p>
	</div>
{:else}
	<div class="max-w-4xl space-y-6">
		{#if error}
			<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
				<AlertTriangle class="size-4 shrink-0" />
				{error}
			</div>
		{/if}

		<!-- Order header -->
		<div class="flex items-start justify-between">
			<div class="space-y-1">
				<div class="flex items-center gap-3">
					<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
						{customerName || t('detail_walk_in_customer')}
					</h2>
					<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {statusBadgeClass(orderStatus)}">
						{orderStatus === 'done' ? t('status_done') : orderStatus === 'cancelled' ? t('status_cancelled') : t('status_pending')}
					</span>
					<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {paymentStatusBadgeClass(order.paymentStatus)}">
						{order.paymentStatus === 'paid' ? t('status_paid') : order.paymentStatus === 'partial' ? t('status_partial') : order.paymentStatus === 'pending' ? t('detail_payment_pending') : order.paymentStatus}
					</span>
				</div>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					{formatDate(order.issuedAt)}
					{#if order.invoiceNumber}
						&middot; {t('invoice_title')} {order.invoiceNumber}
					{/if}
				</p>
			</div>

			{#if !isReadonly}
				<div class="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={markDone}
						disabled={!!actionLoading}
						class="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
					>
						{#if actionLoading === 'done'}
							<Loader2 class="mr-1.5 size-3.5 animate-spin" />
						{:else}
							<CheckCircle class="mr-1.5 size-3.5" />
						{/if}
						{t('action_mark_done')}
					</Button>
				</div>
			{/if}
		</div>

		<!-- Notes -->
		{#if order.description}
			<div class="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/30">
				<p class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('detail_notes')}</p>
				<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{order.description}</p>
			</div>
		{/if}

		<!-- Items table -->
		<div class="space-y-3">
			<h3 class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('detail_items')}</h3>
			<div class="rounded-lg border border-zinc-200 dark:border-zinc-700">
				<Table.Root>
					<Table.Header>
						<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
							<Table.Head class="text-xs font-medium uppercase tracking-wider">{t('product_title')}</Table.Head>
							<Table.Head class="text-xs font-medium uppercase tracking-wider text-right">{t('common_quantity')}</Table.Head>
							<Table.Head class="text-xs font-medium uppercase tracking-wider text-right">{t('common_rate')}</Table.Head>
							<Table.Head class="text-xs font-medium uppercase tracking-wider text-right">{t('common_total')}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each order.items as item}
							<Table.Row>
								<Table.Cell class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
									{item.productTitle}
									{#if item.unit}
										<span class="ml-1 text-xs text-zinc-400">({item.unit})</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-sm text-zinc-700 dark:text-zinc-300">
									{item.quantity}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-sm text-zinc-700 dark:text-zinc-300">
									{formatNPR(item.rate)}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									{formatNPR(item.total)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
				<div class="flex justify-end border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/30">
					<div class="text-right">
						<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('common_total')}</span>
						<p class="mt-0.5 text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatNPR(order.totalAmount)}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Existing payments (read-only) -->
		{#if order.payments.length > 0}
			<div class="space-y-3">
				<h3 class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('detail_payment_history')}</h3>
				<div class="rounded-lg border border-zinc-200 dark:border-zinc-700">
					<div class="grid grid-cols-[110px_1fr_1fr_auto] gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
						<span>{t('common_date')}</span>
						<span>{t('payment_amount')}</span>
						<span>{t('payment_method')}</span>
						<span>{t('payment_voucher_number')}</span>
					</div>
					{#each order.payments as p}
						<div class="grid grid-cols-[110px_1fr_1fr_auto] items-center gap-2 border-b border-zinc-100 px-3 py-2.5 last:border-b-0 dark:border-zinc-800">
							<span class="text-sm text-zinc-700 dark:text-zinc-300">{formatDate(p.paidAt)}</span>
							<span class="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatNPR(p.paidAmount)}</span>
							<span class="text-sm capitalize text-zinc-600 dark:text-zinc-400">{p.paymentMethod}</span>
							<span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{p.bankVoucherNumber || '—'}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Add new payments (if not readonly) -->
		{#if !isReadonly}
			<div class="space-y-3">
				<h3 class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('detail_add_payments')}</h3>
				<PaymentSection bind:payments={newPayments} totalAmount={order.totalAmount - order.paidAmount} />

				{#if newPayments.length > 0}
					<div class="flex justify-end">
						<Button
							onclick={addPayments}
							disabled={!!actionLoading}
							size="sm"
							class="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
						>
							{#if actionLoading === 'payment'}
								<Loader2 class="mr-1.5 size-3.5 animate-spin" />
							{/if}
							Save Payments
						</Button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Payment summary -->
		<div class="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/30">
			<div class="grid grid-cols-3 gap-4 text-sm">
				<div>
					<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('common_total')}</span>
					<p class="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">{formatNPR(order.totalAmount)}</p>
				</div>
				<div>
					<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('payment_summary_paid')}</span>
					<p class="mt-0.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatNPR(order.paidAmount)}</p>
				</div>
				<div>
					<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('payment_remaining')}</span>
					<p class="mt-0.5 font-mono font-semibold {order.totalAmount - order.paidAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}">
						{formatNPR(Math.abs(order.totalAmount - order.paidAmount))}
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
