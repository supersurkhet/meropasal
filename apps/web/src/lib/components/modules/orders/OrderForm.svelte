<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Save, AlertTriangle } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import StickyActions from '$lib/components/shared/StickyActions.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import PaymentSection from '$lib/components/shared/PaymentSection.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import {
		aggregateStockBookEntries,
		getProductTotalAvailable,
	} from '$lib/stock-aggregation';
	import { getConvexClient, api } from '$lib/convex';
	import { orderSchema } from '$lib/schemas/order';
	import { extractErrors } from '$lib/schemas/shared';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

	let {
		onSuccess,
		oncancel,
	}: {
		onSuccess?: () => void;
		oncancel?: () => void;
	} = $props();

	type Customer = { _id: string; name: string; panNumber?: string; address?: string; phone?: string; email?: string; creditLimit?: number; notes?: string };
	type Product = { _id: string; title: string; sellingPrice?: number; unit?: string; purchasePartyId?: string; costPrice?: number };

	type LineItem = {
		id: string;
		productId: string;
		productTitle: string;
		quantity: number;
		unit: string;
		unitStr: string;
		rate: number;
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
	let items = $state<LineItem[]>([]);
	let payments = $state<PaymentRow[]>([]);
	let submitting = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	let customers = $state<Customer[]>([]);
	let products = $state<Product[]>([]);
	let stockAggregate = $state<ReturnType<typeof aggregateStockBookEntries> | null>(null);
	let loaded = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient();
		const [c, p, entries] = await Promise.all([
			client.query(api['functions/customers'].list, {}),
			client.query(api['functions/products'].list, {}),
			client.query(api['functions/stockBook'].listEntries, {}),
		]);
		customers = c;
		products = p;
		stockAggregate = aggregateStockBookEntries(entries);
		loaded = true;
	}

	const INITIAL_ROWS = 10;

	$effect(() => {
		if (loaded && items.length === 0) {
			items = Array.from({ length: INITIAL_ROWS }, () => ({
				id: genId(),
				productId: '',
				productTitle: '',
				quantity: 1,
				unit: '',
				unitStr: '',
				rate: 0,
			}));
		}
	});

	let nextId = 0;
	function genId() {
		return `item-${++nextId}-${Date.now()}`;
	}

	function addItem() {
		items = [
			...items,
			{
				id: genId(),
				productId: '',
				productTitle: '',
				quantity: 1,
				unit: '',
				unitStr: '',
				rate: 0,
			},
		];
	}

	function selectProduct(index: number, productId: string) {
		const product = products.find((p) => p._id === productId);
		if (!product) return;
		const units = getAvailableUnits(product.unit);
		const defaultUnit = units[0] || 'piece';
		const rate = deriveUnitPrice(product.sellingPrice ?? 0, product.unit, defaultUnit);
		items[index] = {
			...items[index],
			productId: product._id,
			productTitle: product.title,
			unitStr: product.unit || '',
			unit: defaultUnit,
			rate: Math.round(rate * 100) / 100,
		};
		ensureTrailingRows(index);
	}

	function changeUnit(index: number, unit: string) {
		const item = items[index];
		const product = products.find((p) => p._id === item.productId);
		if (!product) {
			items[index].unit = unit;
			return;
		}
		const rate = deriveUnitPrice(product.sellingPrice ?? 0, product.unit, unit);
		items[index] = {
			...items[index],
			unit,
			rate: Math.round(rate * 100) / 100,
		};
	}

	function ensureTrailingRows(index: number) {
		const emptyAfter = items.slice(index + 1).filter((i) => !i.productId).length;
		const needed = 3 - emptyAfter;
		for (let n = 0; n < needed; n++) addItem();
	}

	function getAvailable(productId: string): number {
		return stockAggregate ? getProductTotalAvailable(stockAggregate, productId) : 0;
	}

	let hasStockError = $derived(
		items.some((item) => {
			return item.productId && item.quantity > getAvailable(item.productId);
		}),
	);

	let totalAmount = $derived(
		items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
	);

	function validate(): boolean {
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (!item.productId) continue
			if (item.quantity <= 0) {
				fieldErrors = { [`items.${i}.quantity`]: 'Quantity must be greater than 0' }
				error = 'Quantity must be greater than 0'
				toast.error(error)
				return false
			}
			if (item.rate < 0) {
				fieldErrors = { [`items.${i}.rate`]: 'Rate must be a positive number' }
				error = 'Rate must be a positive number'
				toast.error(error)
				return false
			}
		}

		const validItems = items
			.filter((i) => i.productId && i.quantity > 0)
			.map((i) => ({
				productId: i.productId,
				productTitle: i.productTitle,
				quantity: i.quantity,
				rate: i.rate,
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
			fieldErrors = extractErrors(result.error.issues)
			const firstError = result.error.issues[0]?.message
			error = firstError || t('validation_form_errors')
			toast.error(error)
			return false
		}
		fieldErrors = {}
		return true
	}

	async function handleSubmit() {
		error = '';
		if (!validate()) return;
		if (hasStockError) {
			error = 'Some items exceed available stock';
			toast.error(error);
			return;
		}

		const validItems = items.filter((i) => i.productId && i.quantity > 0);

		submitting = true;
		try {
			const client = getConvexClient();
			await client.mutation(api['functions/orders'].create, {
				customerId: customerId || undefined,
				orderDate,
				items: validItems.map((i) => ({
					productId: i.productId as any,
					productTitle: i.productTitle,
					quantity: i.quantity,
					rate: i.rate,
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && oncancel) {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !loaded}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<!-- Header -->
			<div class="border-b border-dashed border-zinc-300 px-6 py-5 dark:border-zinc-700">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Order</h2>
						<p class="mt-0.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
							{formatDate(new Date().toISOString().split('T')[0])}
						</p>
					</div>
					<div class="text-right text-xs text-zinc-400">
						<span class="font-mono">0 items</span>
					</div>
				</div>
				<div class="mt-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer <span class="ml-1 text-xs font-normal text-zinc-400">({t('common_optional')})</span></span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
						<div class="space-y-1.5">
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Order Date</span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
					</div>
				</div>
			</div>

			<!-- Grid header -->
			<div class="bill-grid max-h-[30vh] overflow-y-auto">
				<div class="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_6rem_5.5rem_8rem_8rem_2rem] items-stretch border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_sn')}</span>
					<span class="flex items-center border-r border-zinc-200 px-3 py-2 dark:border-zinc-800">{t('product_title')}</span>
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_quantity')}</span>
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('product_unit')}</span>
					<span class="flex items-center justify-end border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_rate')}</span>
					<span class="flex items-center justify-end px-2 py-2">{t('common_amount')}</span>
					<span></span>
				</div>
				{#each Array(5) as _, i}
					<div class="grid grid-cols-[2.5rem_1fr_6rem_5.5rem_8rem_8rem_2rem] items-stretch border-b border-zinc-100/30 dark:border-zinc-800/20">
						<span class="flex items-center justify-center border-r border-zinc-100/30 px-2 py-2.5 font-mono text-xs text-zinc-300 dark:border-zinc-800/20 dark:text-zinc-600">{i + 1}</span>
						<div class="flex items-center border-r border-zinc-100/30 px-3 dark:border-zinc-800/20"><Skeleton class="h-4 w-24" /></div>
						<div class="flex items-center justify-center border-r border-zinc-100/30 dark:border-zinc-800/20"><Skeleton class="h-4 w-8" /></div>
						<div class="flex items-center justify-center border-r border-zinc-100/30 dark:border-zinc-800/20"><Skeleton class="h-4 w-10" /></div>
						<div class="flex items-center justify-end border-r border-zinc-100/30 px-2 dark:border-zinc-800/20"><Skeleton class="h-4 w-14" /></div>
						<div class="flex items-center justify-end px-2"><Skeleton class="h-4 w-14" /></div>
						<span></span>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="border-t border-dashed border-zinc-300 dark:border-zinc-700">
				<div class="flex items-center justify-between px-6 py-3">
					<span class="text-sm text-zinc-500">{t('invoice_subtotal')}</span>
					<Skeleton class="h-4 w-20" />
				</div>
				<div class="border-t border-double border-zinc-300 px-6 py-3 dark:border-zinc-600">
					<div class="flex items-center justify-between">
						<span class="text-base font-bold text-zinc-900 dark:text-zinc-100">{t('common_total')}</span>
						<Skeleton class="h-6 w-24" />
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Payment section skeleton -->
	<div class="mx-auto mt-6 max-w-4xl">
		<div class="space-y-3 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Skeleton class="h-5 w-28" />
			<Skeleton class="h-9 w-full rounded-md" />
		</div>
	</div>

	<!-- Notes skeleton -->
	<div class="mx-auto mt-6 max-w-4xl space-y-1.5">
		<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</span>
		<Skeleton class="h-20 w-full rounded-md" />
	</div>
{:else}
	{#if error}
		<div class="mx-auto mb-4 max-w-4xl flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
			<AlertTriangle class="size-4 shrink-0" />
			{error}
		</div>
	{/if}

	<BillForm
		title="Order"
		submitLabel="Create Order"
		bind:items
		onadditem={addItem}
		onsubmit={handleSubmit}
		onunitchange={changeUnit}
		{submitting}
	>
		{#snippet headerSlot()}
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Customer
						<span class="ml-1 text-xs font-normal text-zinc-400">({t('common_optional')})</span>
					</Label>
					<EntitySelect
						bind:value={customerId}
						items={customers}
						getKey={(c) => c._id}
						getLabel={(c) => c.name}
						placeholder="Select customer (optional)"
						entityName="Customer"
					>
						{#snippet createForm({ close, onCreated })}
							<CustomerForm
								inline
								onsubmit={async (data) => {
									const client = getConvexClient()
									const id = await client.mutation(api['functions/customers'].create, data)
									await loadData()
									onCreated(id)
								}}
								oncancel={close}
							/>
						{/snippet}
						{#snippet editForm({ item, close })}
							<CustomerForm
								inline
								customer={item}
								onsubmit={async (data) => {
									const client = getConvexClient()
									await client.mutation(api['functions/customers'].update, { id: item._id, ...data })
									await loadData()
									close()
								}}
								oncancel={close}
							/>
						{/snippet}
					</EntitySelect>
				</div>

				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Order Date</Label>
					<DatePicker
						bind:value={orderDate}
						name="orderDate"
						class={fieldErrors.orderDate ? 'border-red-400 ring-1 ring-red-400/30' : ''}
					/>
					{#if fieldErrors.orderDate}
						<p class="text-xs text-red-500 mt-1">{fieldErrors.orderDate}</p>
					{/if}
				</div>
			</div>

			{#if fieldErrors.items}
				<div class="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
					{fieldErrors.items}
				</div>
			{/if}
		{/snippet}

		{#snippet productSelector({ item, index }: { item: LineItem; index: number })}
			{@const available = item.productId ? getAvailable(item.productId) : 0}
			{@const overStock = item.productId && item.quantity > available}
			<div class="flex w-full items-center gap-1.5" class:pr-2={!!item.productId}>
				<div class="min-w-0 flex-1">
					<EntitySelect
						value={item.productId}
						onValueChange={(val) => selectProduct(index, val)}
						items={products}
						getKey={(p) => p._id}
						getLabel={(p) => p.title}
						placeholder={t('common_select_product')}
						entityName="Product"
						small
					>
						{#snippet itemContent({ item: product })}
							{@const stock = getAvailable(product._id)}
							<div class="flex w-full items-center justify-between gap-2">
								<span class="truncate">{product.title}</span>
								<span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums {stock > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'}">
									{stock > 0 ? stock : 'Out of stock'}
								</span>
							</div>
						{/snippet}
						{#snippet createForm({ close, onCreated })}
							<ProductForm
								inline
								onsaved={async (id) => {
									await loadData()
									onCreated(id)
									selectProduct(index, id)
								}}
							/>
						{/snippet}
						{#snippet editForm({ item: product, close })}
							<ProductForm
								inline
								initial={{
									_id: product._id,
									title: product.title,
									sellingPrice: product.sellingPrice,
									unit: product.unit,
								}}
								onsaved={async () => {
									await loadData()
									close()
								}}
							/>
						{/snippet}
					</EntitySelect>
				</div>
				{#if item.productId}
					<span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums {overStock ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' : available > 0 ? 'text-zinc-400' : 'text-red-400'}">
						{#if overStock}
							{available}/{item.quantity}
						{:else}
							{available}
						{/if}
					</span>
				{/if}
			</div>
		{/snippet}
	</BillForm>

	<!-- Payments (below BillForm) -->
	<div class="mx-auto mt-6 max-w-4xl">
		<PaymentSection bind:payments totalAmount={totalAmount} errors={fieldErrors} />
	</div>

	<!-- Notes -->
	<div class="mx-auto mt-6 max-w-4xl space-y-1.5">
		<Label for="notes" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</Label>
		<Textarea
			id="notes"
			bind:value={notes}
			placeholder="Additional notes about this order..."
			rows={3}
		/>
	</div>
{/if}
