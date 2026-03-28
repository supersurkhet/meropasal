<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';
	import { Plus, Trash2 } from '@lucide/svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import { computePaymentStatus, computePaidAmount, type PaymentStatus } from '$lib/payment-status';
	import { t } from '$lib/t.svelte';

	type PaymentRow = {
		paidAt: string;
		paidAmount: string;
		paymentMethod: string;
		bankVoucherNumber: string;
	};

	let {
		payments = $bindable([]),
		totalAmount = 0,
		readonly = false,
		errors = {},
	}: {
		payments: PaymentRow[];
		totalAmount: number;
		readonly?: boolean;
		errors?: Record<string, string>;
	} = $props();

	const PAYMENT_METHODS = [
		{ value: 'cash', label: () => t('payment_method_cash') },
		{ value: 'card', label: () => t('payment_method_card') },
		{ value: 'bankTransfer', label: () => t('payment_method_bank_transfer') },
		{ value: 'credit', label: () => t('payment_method_credit') },
		{ value: 'online', label: () => t('payment_method_online') },
		{ value: 'check', label: () => t('payment_method_check') },
	] as const;

	let paidAmount = $derived(
		payments.reduce((sum, p) => {
			const amt = Number(p.paidAmount);
			return sum + (Number.isFinite(amt) ? amt : 0);
		}, 0),
	);
	let remaining = $derived(totalAmount - paidAmount);
	let paymentStatus = $derived(computePaymentStatus(paidAmount, totalAmount)) as PaymentStatus;

	function addPayment() {
		payments = [
			...payments,
			{
				paidAt: new Date().toISOString().split('T')[0],
				paidAmount: '',
				paymentMethod: 'cash',
				bankVoucherNumber: '',
			},
		];
	}

	function removePayment(index: number) {
		payments = payments.filter((_, i) => i !== index);
	}

	function needsVoucher(method: string): boolean {
		return method === 'bankTransfer' || method === 'check';
	}

	function statusColor(status: PaymentStatus): string {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
			case 'partial':
				return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
			case 'pending':
				return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
			case 'overpaid':
				return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
		}
	}

	function statusLabel(status: PaymentStatus): string {
		switch (status) {
			case 'paid':
				return t('status_paid');
			case 'partial':
				return t('status_partial');
			case 'pending':
				return t('status_pending');
			case 'overpaid':
				return t('status_overpaid');
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
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
			{t('payment_payments')}
		</h3>
		<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {statusColor(paymentStatus)}">
			{statusLabel(paymentStatus)}
		</span>
	</div>

	<!-- Payment rows -->
	{#if payments.length > 0}
		<div class="rounded-lg border border-zinc-200 dark:border-zinc-700">
			<div class="grid grid-cols-[110px_1fr_1fr_auto_auto] gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
				<span>{t('common_date')}</span>
				<span>{t('common_amount')}</span>
				<span>{t('payment_method')}</span>
				<span>{t('payment_voucher_number')}</span>
				<span></span>
			</div>
			{#each payments as payment, i}
				<div class="grid grid-cols-[110px_1fr_1fr_auto_auto] items-center gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0 dark:border-zinc-800">
					<DatePicker
						bind:value={payment.paidAt}
						disabled={readonly}
						class="h-8 text-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
					/>
					<Input
						type="number"
						bind:value={payment.paidAmount}
						placeholder="0"
						min="0"
						step="0.01"
						disabled={readonly}
						class="h-8 text-sm font-mono border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
					/>
					<Select.Root type="single" bind:value={payment.paymentMethod}>
						<Select.Trigger class="h-8 text-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" disabled={readonly}>
							{PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod)?.label() ?? payment.paymentMethod}
						</Select.Trigger>
						<Select.Content>
							{#each PAYMENT_METHODS as method}
								<Select.Item value={method.value}>{method.label()}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if needsVoucher(payment.paymentMethod)}
						{@const voucherError = errors[`payments.${i}.bankVoucherNumber`]}
						<div>
							<Input
								bind:value={payment.bankVoucherNumber}
								placeholder={t('payment_voucher_number')}
								disabled={readonly}
								class="h-8 w-28 text-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 {voucherError ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
							/>
							{#if voucherError}
								<p class="mt-0.5 text-[10px] text-red-500">{voucherError}</p>
							{/if}
						</div>
					{:else}
						<span class="w-28 text-center text-xs text-zinc-400">—</span>
					{/if}
					{#if !readonly}
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onclick={() => removePayment(i)}
							class="text-zinc-400 hover:text-red-500"
							aria-label={t('a11y_remove_payment')}
						>
							<Trash2 class="size-3.5" />
						</Button>
					{:else}
						<span class="size-7"></span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add payment button -->
	{#if !readonly}
		<Button
			type="button"
			variant="outline"
			size="sm"
			onclick={addPayment}
			class="border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
		>
			<Plus class="mr-1.5 size-3.5" />
			{t('action_add_payment')}
		</Button>
	{/if}

	<!-- Summary -->
	<div class="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-900/30">
		<div class="grid grid-cols-3 gap-4 text-sm">
			<div>
				<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('common_total')}</span>
				<p class="mt-0.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">{formatNPR(totalAmount)}</p>
			</div>
			<div>
				<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('payment_summary_paid')}</span>
				<p class="mt-0.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatNPR(paidAmount)}</p>
			</div>
			<div>
				<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('payment_remaining')}</span>
				<p class="mt-0.5 font-mono font-semibold {remaining > 0 ? 'text-amber-600 dark:text-amber-400' : remaining < 0 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}">
					{formatNPR(Math.abs(remaining))}
					{#if remaining < 0}
						<span class="text-xs font-normal">{t('payment_overpaid_note')}</span>
					{/if}
				</p>
			</div>
		</div>
	</div>
</div>
