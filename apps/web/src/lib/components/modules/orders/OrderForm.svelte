<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { Loader2, Save, Plus, Trash2, AlertTriangle } from '@lucide/svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import PaymentSection from '$lib/components/shared/PaymentSection.svelte';
	import { getConvexClient, api } from '$lib/convex';
	import { orderSchema } from '$lib/schemas/order';
	import { t } from '$lib/t.svelte';

	let {
		onSuccess,
		oncancel,
	}: {
		onSuccess?: () => void;
		oncancel?: () => void;
	} = $props();

	type Customer = { _id: string; name: string };
	type Product = { _id: string; title: string; sellingPrice?: number; unit?: string };
	type LineItem = {
		productId: string;
		productTitle: string;
		quantity: string;
		rate: string;
		unit: string;
	};
	type PaymentRow = {
		paidAt: string;
		paidAmount: string;
		paymentMethod: string;
		bankVoucherNumber: string;
	};

	let customerId = $state('');
	let orderDate = $state(new Date().toISOString().split('T')[0]);
	let notes = $state('');
	let items = $state<LineItem[]>([{ productId: '', productTitle: '', quantity: '', rate: '', unit: '' }]);
	let payments = $state<PaymentRow[]>([]);
	let submitting = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	let customers = $state<Customer[]>([]);
	let products = $state<Product[]>([]);
	let loaded = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient();
		const [c, p] = await Promise.all([
			client.query(api['functions/customers'].list, {}),
			client.query(api['functions/products'].list, {}),
		]);
		customers = c;
		products = p;
		loaded = true;
	}

	function addItem() {
		items = [...items, { productId: '', productTitle: '', quantity: '', rate: '', unit: '' }];
	}

	function removeItem(index: number) {
		if (items.length <= 1) return;
		items = items.filter((_, i) => i !== index);
	}

	function onProductSelect(index: number, productId: string) {
		const product = products.find((p) => p._id === productId);
		if (!product) return;
		items[index] = {
			...items[index],
			productId,
			productTitle: product.title,
			rate: (product.sellingPrice ?? 0).toString(),
			unit: product.unit ?? 'piece',
		};
	}

	let totalAmount = $derived(
		items.reduce((sum, item) => {
			const qty = Number(item.quantity) || 0;
			const rate = Number(item.rate) || 0;
			return sum + qty * rate;
		}, 0),
	);

	function validate(): boolean {
		const validItems = items
			.filter((i) => i.productId && Number(i.quantity) > 0)
			.map((i) => ({
				productId: i.productId,
				productTitle: i.productTitle,
				quantity: Number(i.quantity),
				rate: Number(i.rate),
				unit: i.unit || undefined,
			}))

		const validPayments = payments
			.filter((p) => Number(p.paidAmount) > 0)
			.map((p) => ({
				paidAt: p.paidAt,
				paidAmount: Number(p.paidAmount),
				paymentMethod: p.paymentMethod as any,
				bankVoucherNumber: p.bankVoucherNumber.trim() || undefined,
			}))

		const result = orderSchema.safeParse({
			customerId: customerId || undefined,
			orderDate,
			items: validItems,
			payments: validPayments.length > 0 ? validPayments : undefined,
			notes: notes.trim() || undefined,
		})

		if (!result.success) {
			fieldErrors = {}
			for (const issue of result.error.issues) {
				const key = issue.path.join('.')
				if (!fieldErrors[key]) fieldErrors[key] = issue.message
			}
			const firstError = result.error.issues[0]?.message
			error = firstError || t('validation_form_errors')
			toast.error(error)
			return false
		}
		fieldErrors = {}

		// Validate bank voucher numbers where required
		for (const p of payments) {
			if ((p.paymentMethod === 'bankTransfer' || p.paymentMethod === 'check') && !p.bankVoucherNumber.trim()) {
				error = 'Bank voucher number is required for bank transfer and check payments';
				return false;
			}
		}

		return true
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!validate()) return;

		const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);

		submitting = true;
		try {
			const client = getConvexClient();
			await client.mutation(api['functions/orders'].create, {
				customerId: customerId || undefined,
				orderDate,
				items: validItems.map((i) => ({
					productId: i.productId as any,
					productTitle: i.productTitle,
					quantity: Number(i.quantity),
					rate: Number(i.rate),
					unit: i.unit || undefined,
				})),
				payments: payments
					.filter((p) => Number(p.paidAmount) > 0)
					.map((p) => ({
						paidAt: p.paidAt,
						paidAmount: Number(p.paidAmount),
						paymentMethod: p.paymentMethod as any,
						bankVoucherNumber: p.bankVoucherNumber.trim() || undefined,
					})),
				notes: notes.trim() || undefined,
			});
			toast.success(t('toast_order_created'));
			onSuccess?.();
		} catch (err: any) {
			error = err.message || 'Failed to create order';
		} finally {
			submitting = false;
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

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			const form = (e.target as HTMLElement).closest('form');
			form?.requestSubmit();
		}
		if (e.key === 'Escape' && oncancel) {
			oncancel();
		}
	}
</script>

<form onsubmit={handleSubmit} onkeydown={handleKeydown} class="max-w-4xl space-y-6">
	{#if error}
		<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
			<AlertTriangle class="size-4 shrink-0" />
			{error}
		</div>
	{/if}

	<!-- Customer & Date -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer</Label>
			<Select.Root type="single" bind:value={customerId}>
				<Select.Trigger class="h-10 border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
					{customers.find((c) => c._id === customerId)?.name ?? 'Select customer (optional)'}
				</Select.Trigger>
				<Select.Content>
					{#each customers as customer}
						<Select.Item value={customer._id}>{customer.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="space-y-1.5">
			<Label for="orderDate" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Order Date
			</Label>
			<DatePicker
				bind:value={orderDate}
				name="orderDate"
				class="h-10 border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 {fieldErrors.orderDate ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
			/>
			{#if fieldErrors.orderDate}
				<p class="text-xs text-red-500 mt-1">{fieldErrors.orderDate}</p>
			{/if}
		</div>
	</div>

	{#if fieldErrors.items}
		<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
			<AlertTriangle class="size-4 shrink-0" />
			{fieldErrors.items}
		</div>
	{/if}

	<!-- Line Items -->
	<div class="space-y-3">
		<h3 class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Items</h3>

		<div class="rounded-lg border border-zinc-200 dark:border-zinc-700">
			<div class="grid grid-cols-[1fr_100px_120px_100px_auto] gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
				<span>Product</span>
				<span>Qty</span>
				<span>Rate</span>
				<span>Total</span>
				<span></span>
			</div>

			{#each items as item, i}
				{@const qty = Number(item.quantity) || 0}
				{@const rate = Number(item.rate) || 0}
				{@const lineTotal = qty * rate}

				<div class="grid grid-cols-[1fr_100px_120px_100px_auto] items-center gap-2 border-b border-zinc-100 px-3 py-2 last:border-b-0 dark:border-zinc-800">
					<Select.Root type="single" value={item.productId} onValueChange={(v) => onProductSelect(i, v)}>
						<Select.Trigger class="h-9 text-sm border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
							{item.productTitle || 'Select product'}
						</Select.Trigger>
						<Select.Content>
							{#each products as product}
								<Select.Item value={product._id}>{product.title}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<Input
						type="number"
						bind:value={item.quantity}
						placeholder="0"
						min="1"
						class="h-9 text-sm font-mono border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
					/>

					<Input
						type="number"
						bind:value={item.rate}
						placeholder="0"
						min="0"
						step="0.01"
						class="h-9 text-sm font-mono border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
					/>

					<span class="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
						{formatNPR(lineTotal)}
					</span>

					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onclick={() => removeItem(i)}
						disabled={items.length <= 1}
						class="text-zinc-400 hover:text-red-500"
					>
						<Trash2 class="size-3.5" />
					</Button>
				</div>
			{/each}
		</div>

		<Button
			type="button"
			variant="outline"
			size="sm"
			onclick={addItem}
			class="border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400"
		>
			<Plus class="mr-1.5 size-3.5" />
			Add Item
		</Button>
	</div>

	<!-- Total -->
	<div class="flex justify-end rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/30">
		<div class="text-right">
			<span class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Amount</span>
			<p class="mt-0.5 text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatNPR(totalAmount)}</p>
		</div>
	</div>

	<!-- Payments -->
	<PaymentSection bind:payments totalAmount={totalAmount} />

	<!-- Notes -->
	<div class="space-y-1.5">
		<Label for="notes" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</Label>
		<Textarea
			id="notes"
			bind:value={notes}
			placeholder="Additional notes about this order..."
			rows={3}
			class="border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
		/>
	</div>

	<!-- Actions -->
	<div class="flex items-center gap-3 pt-2">
		{#if oncancel}
			<Button type="button" variant="ghost" onclick={oncancel} class="text-zinc-600 dark:text-zinc-400">
				Cancel
			</Button>
		{/if}
		<Button
			type="submit"
			disabled={submitting}
			class="min-w-[140px] bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			{#if submitting}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
				Creating...
			{:else}
				<Save class="mr-1.5 size-4" />
				Create Order
			{/if}
		</Button>
	</div>
</form>
