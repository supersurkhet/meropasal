<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import PaymentSection from '$lib/components/shared/PaymentSection.svelte';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { formatNPR } from '$lib/currency';
	import { formatUnit } from '$lib/unit-price';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';
	import { toast } from 'svelte-sonner';
	import { Loader2 } from '@lucide/svelte';

	type PaymentRow = {
		paidAt: string;
		paidAmount: string;
		paymentMethod: string;
		bankVoucherNumber: string;
	};

	let { invoiceId = $bindable<string | null>(null) } = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	let dialogOpen = $state(false);

	$effect(() => {
		if (invoiceId) dialogOpen = true;
	});

	$effect(() => {
		if (!invoiceId) dialogOpen = false;
	});

	const myPerms = useConvexQuery(client, api.functions.organizations.getMyPermissions, () => ({}));
	const invoice = useConvexQuery(client, api.functions.invoices.getById, () =>
		dialogOpen && invoiceId ? { id: invoiceId as any } : 'skip',
	);

	let partyLabel = $state('—');
	let newPayments = $state<PaymentRow[]>([]);
	let submitError = $state('');
	let submitting = $state(false);

	const canRecord = $derived(
		myPerms.data?.permissions?.includes('invoices:recordPayment') ?? false,
	);

	const balanceDue = $derived.by(() => {
		const inv = invoice.data;
		if (!inv) return 0;
		return Math.max(0, inv.totalAmount - inv.paidAmount);
	});

	$effect(() => {
		const inv = invoice.data;
		if (!dialogOpen || !inv) return;
		const bal = inv.totalAmount - inv.paidAmount;
		if (bal > 0.005) {
			newPayments = [
				{
					paidAt: new Date().toISOString().split('T')[0],
					paidAmount: '',
					paymentMethod: 'cash',
					bankVoucherNumber: '',
				},
			];
		} else {
			newPayments = [];
		}
		submitError = '';
	});

	$effect(() => {
		const inv = invoice.data;
		if (!inv?.partyId) {
			partyLabel = t('invoice_pay_no_party');
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				if (inv.partyType === 'customer') {
					const c = await client.query(api.functions.customers.getById, {
						id: inv.partyId as any,
					});
					if (!cancelled) partyLabel = c?.name ?? '—';
				} else {
					const p = await client.query(api.functions.parties.getById, {
						id: inv.partyId as any,
					});
					if (!cancelled) partyLabel = p?.name ?? '—';
				}
			} catch {
				if (!cancelled) partyLabel = '—';
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	function payFullBalance() {
		const inv = invoice.data;
		if (!inv) return;
		const bal = Math.max(0, inv.totalAmount - inv.paidAmount);
		if (bal <= 0 || newPayments.length === 0) return;
		newPayments = newPayments.map((p, i) =>
			i === 0 ? { ...p, paidAmount: String(bal) } : p,
		);
	}

	async function submitPayments() {
		const inv = invoice.data;
		if (!inv || !invoiceId) return;
		const validPayments = newPayments.filter((p) => Number(p.paidAmount) > 0);
		if (validPayments.length === 0) return;

		for (const p of validPayments) {
			if (
				(p.paymentMethod === 'bankTransfer' || p.paymentMethod === 'check') &&
				!p.bankVoucherNumber.trim()
			) {
				submitError = t('invoice_pay_voucher_required');
				return;
			}
		}

		submitError = '';
		submitting = true;
		try {
			for (const p of validPayments) {
				await client.mutation(api.functions.invoices.addPayment, {
					invoiceId: invoiceId as any,
					payment: {
						paidAt: p.paidAt,
						paidAmount: Number(p.paidAmount),
						paymentMethod: p.paymentMethod as any,
						bankVoucherNumber: p.bankVoucherNumber.trim() || undefined,
					},
				});
			}
			toast.success(t('toast_payment_added'));
			invoiceId = null;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			submitError = msg;
			toast.error(msg);
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog
	bind:open={dialogOpen}
	onOpenChange={(o) => {
		if (!o) invoiceId = null;
	}}
>
	<DialogContent class="flex max-h-[min(90vh,880px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
		<DialogHeader class="shrink-0 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
			<DialogTitle>{t('invoice_pay_title')}</DialogTitle>
			<DialogDescription class="sr-only">{t('invoice_pay_title')}</DialogDescription>
		</DialogHeader>

		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
			{#if invoice.isLoading}
				<div class="flex items-center justify-center gap-2 py-12 text-zinc-500">
					<Loader2 class="size-5 animate-spin" />
					<span>{t('common_loading')}</span>
				</div>
			{:else if !invoice.data}
				<p class="py-8 text-center text-zinc-500">{t('detail_invoice_not_found')}</p>
			{:else if !canRecord}
				<p class="py-8 text-center text-amber-700 dark:text-amber-400">{t('invoice_pay_no_permission')}</p>
			{:else}
				{@const inv = invoice.data}
				<div class="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
					<div class="flex flex-wrap gap-x-6 gap-y-1">
						<div>
							<span class="text-xs font-medium uppercase text-zinc-500">{t('invoice_number')}</span>
							<p class="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
								{inv.invoiceNumber || '—'}
							</p>
						</div>
						<div>
							<span class="text-xs font-medium uppercase text-zinc-500">{t('invoice_type')}</span>
							<p class="font-medium text-zinc-900 dark:text-zinc-100">
								{inv.type === 'purchase' ? t('invoice_type_purchase') : t('invoice_type_sale')}
							</p>
						</div>
						<div>
							<span class="text-xs font-medium uppercase text-zinc-500">{t('invoice_issued_at')}</span>
							<p class="text-zinc-800 dark:text-zinc-200">{formatDate(inv.issuedAt)}</p>
						</div>
						<div>
							<span class="text-xs font-medium uppercase text-zinc-500">{t('invoice_party')}</span>
							<p class="font-medium text-zinc-900 dark:text-zinc-100">{partyLabel}</p>
						</div>
					</div>
					<div class="flex flex-wrap gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
						<div>
							<span class="text-xs text-zinc-500">{t('common_total')}</span>
							<p class="font-mono font-semibold tabular-nums">{formatNPR(inv.totalAmount)}</p>
						</div>
						<div>
							<span class="text-xs text-zinc-500">{t('payment_summary_paid')}</span>
							<p class="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
								{formatNPR(inv.paidAmount)}
							</p>
						</div>
						<div>
							<span class="text-xs text-zinc-500">{t('detail_balance_due')}</span>
							<p class="font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-400">
								{formatNPR(balanceDue)}
							</p>
						</div>
					</div>
				</div>

				<div class="mb-4 max-h-52 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
					<Table.Root>
						<Table.Header>
							<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
								<Table.Head class="w-10 font-semibold">{t('common_sn')}</Table.Head>
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
									<Table.Cell class="text-center text-zinc-500">
										{item.unit ? formatUnit(item.unit) : '—'}
									</Table.Cell>
									<Table.Cell class="text-right tabular-nums">{formatNPR(item.rate)}</Table.Cell>
									<Table.Cell class="text-right font-medium tabular-nums">{formatNPR(item.total)}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>

				{#if balanceDue > 0.005}
					<div class="space-y-3">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
								{t('detail_add_payments')}
							</h3>
							<Button type="button" variant="outline" size="sm" onclick={payFullBalance}>
								{t('invoice_pay_full_balance')}
							</Button>
						</div>
						<PaymentSection bind:payments={newPayments} totalAmount={balanceDue} />
						{#if submitError}
							<p class="text-sm text-red-600 dark:text-red-400">{submitError}</p>
						{/if}
					</div>
				{:else}
					<p class="text-center text-sm text-zinc-500">{t('invoice_pay_nothing_due')}</p>
				{/if}
			{/if}
		</div>

		<DialogFooter class="shrink-0 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
			<Button type="button" variant="outline" onclick={() => (invoiceId = null)}>
				{t('action_cancel')}
			</Button>
			<Button
				type="button"
				disabled={submitting ||
					!invoice.data ||
					!canRecord ||
					balanceDue <= 0.005 ||
					newPayments.filter((p) => Number(p.paidAmount) > 0).length === 0}
				onclick={submitPayments}
			>
				{#if submitting}
					<Loader2 class="mr-2 size-4 animate-spin" />
				{/if}
				{t('detail_save_payments')}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
