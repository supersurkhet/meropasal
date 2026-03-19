<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import { Loader2, Save, Plus, Trash2, AlertTriangle } from '@lucide/svelte';
	import StickyActions from '$lib/components/shared/StickyActions.svelte';
	import { getConvexClient, api } from '$lib/convex';
	import {
		aggregateStockBookEntries,
		getProductTotalAvailable,
	} from '$lib/stock-aggregation';
	import { saleSchema } from '$lib/schemas/sale';
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
		productId: string;
		productTitle: string;
		quantity: string;
		rate: string;
		unit: string;
		available: number;
	};

	let customerId = $state('');
	let saleDate = $state(new Date().toISOString().split('T')[0]);
	let items = $state<LineItem[]>([{ productId: '', productTitle: '', quantity: '', rate: '', unit: '', available: 0 }]);
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

	function addItem() {
		items = [...items, { productId: '', productTitle: '', quantity: '', rate: '', unit: '', available: 0 }];
	}

	function removeItem(index: number) {
		if (items.length <= 1) return;
		items = items.filter((_, i) => i !== index);
	}

	function onProductSelect(index: number, productId: string) {
		const product = products.find((p) => p._id === productId);
		if (!product) return;
		const available = stockAggregate ? getProductTotalAvailable(stockAggregate, productId) : 0;
		items[index] = {
			...items[index],
			productId,
			productTitle: product.title,
			rate: (product.sellingPrice ?? 0).toString(),
			unit: product.unit ?? 'piece',
			available,
		};
	}

	function stockIndicator(qty: number, available: number): { color: string; label: string } {
		if (qty <= 0) return { color: 'text-zinc-400', label: `${available} available` };
		if (qty > available) return { color: 'text-red-500', label: `Only ${available} available` };
		if (qty > available * 0.8) return { color: 'text-amber-500', label: `${available} available` };
		return { color: 'text-emerald-500', label: `${available} available` };
	}

	let totalAmount = $derived(
		items.reduce((sum, item) => {
			const qty = Number(item.quantity) || 0;
			const rate = Number(item.rate) || 0;
			return sum + qty * rate;
		}, 0),
	);

	let hasStockError = $derived(
		items.some((item) => {
			const qty = Number(item.quantity) || 0;
			return item.productId && qty > item.available;
		}),
	);

	function validate(): boolean {
		// Client-side: qty and rate must be positive for filled rows
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (!item.productId) continue
			const qty = Number(item.quantity)
			const rate = Number(item.rate)
			if (!qty || qty <= 0) {
				fieldErrors = { [`items.${i}.quantity`]: 'Quantity must be greater than 0' }
				error = 'Quantity must be greater than 0'
				toast.error(error)
				return false
			}
			if (rate < 0) {
				fieldErrors = { [`items.${i}.rate`]: 'Rate must be a positive number' }
				error = 'Rate must be a positive number'
				toast.error(error)
				return false
			}
		}

		const validItems = items
			.filter((i) => i.productId && Number(i.quantity) > 0)
			.map((i) => ({
				productId: i.productId,
				productTitle: i.productTitle,
				quantity: Number(i.quantity),
				rate: Number(i.rate),
				unit: i.unit || undefined,
			}))

		const result = saleSchema.safeParse({
			customerId: customerId || undefined,
			saleDate,
			items: validItems,
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
		return true
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (!validate()) return;

		if (hasStockError) {
			error = 'Some items exceed available stock';
			return;
		}

		const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);

		submitting = true;
		try {
			const client = getConvexClient();
			await client.mutation(api['functions/sales'].create, {
				customerId: customerId || undefined,
				saleDate,
				items: validItems.map((i) => ({
					productId: i.productId as any,
					productTitle: i.productTitle,
					quantity: Number(i.quantity),
					rate: Number(i.rate),
					unit: i.unit || undefined,
				})),
			});
			toast.success(t('toast_sale_created'));
			onSuccess?.();
		} catch (err: any) {
			error = err.message || 'Failed to create sale';
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
			<EntitySelect
				bind:value={customerId}
				items={customers}
				getKey={(c) => c._id}
				getLabel={(c) => c.name}
				placeholder="Select customer (optional)"
				entityName="Customer"
				triggerClass="h-10 border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
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
			<Label for="saleDate" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Sale Date
			</Label>
			<DatePicker
				bind:value={saleDate}
				name="saleDate"
				class="h-10 border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 {fieldErrors.saleDate ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
			/>
			{#if fieldErrors.saleDate}
				<p class="text-xs text-red-500 mt-1">{fieldErrors.saleDate}</p>
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
			<!-- Header -->
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
				{@const stock = stockIndicator(qty, item.available)}

				<div class="border-b border-zinc-100 px-3 py-2 last:border-b-0 dark:border-zinc-800">
					<div class="grid grid-cols-[1fr_100px_120px_100px_auto] items-center gap-2">
						<EntitySelect
							value={item.productId}
							onValueChange={(v) => onProductSelect(i, v)}
							items={products}
							getKey={(p) => p._id}
							getLabel={(p) => p.title}
							placeholder="Select product"
							entityName="Product"
							small
							triggerClass="border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
						>
							{#snippet createForm({ close, onCreated })}
								<ProductForm
									inline
									onsaved={async (id) => {
										await loadData()
										onCreated(id)
										onProductSelect(i, id)
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
										purchasePartyId: product.purchasePartyId,
									}}
									onsaved={async () => {
										await loadData()
										close()
									}}
								/>
							{/snippet}
						</EntitySelect>

						<div class="relative">
							<Input
								type="number"
								bind:value={item.quantity}
								placeholder="0"
								min="1"
								class="h-9 text-sm font-mono border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 {qty > item.available && item.productId || fieldErrors[`items.${i}.quantity`] ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
							/>
						</div>

						<Input
							type="number"
							bind:value={item.rate}
							placeholder="0"
							min="0"
							step="0.01"
							class="h-9 text-sm font-mono border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 {fieldErrors[`items.${i}.rate`] ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
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
							aria-label={t('a11y_remove_item')}
						>
							<Trash2 class="size-3.5" />
						</Button>
					</div>

					<!-- Stock indicator -->
					{#if item.productId}
						<p class="mt-1 pl-0.5 text-xs {stock.color}">
							{stock.label}
						</p>
					{/if}
				</div>
			{/each}
		</div>

		<Button
			type="button"
			variant="outline"
			size="sm"
			onclick={addItem}
			class="border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
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

	<!-- Actions -->
	<StickyActions>
		{#if oncancel}
			<Button type="button" onclick={oncancel}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={submitting || hasStockError}>
			{#if submitting}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
				Creating...
			{:else}
				<Save class="mr-1.5 size-4" />
				Create Sale
			{/if}
		</Button>
	</StickyActions>
</form>
