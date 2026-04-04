<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label';
	import { AlertTriangle } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { getConvexClient, api } from '$lib/convex';
	import {
		aggregateStockBookEntries,
		getProductTotalAvailable,
	} from '$lib/stock-aggregation';
	import { saleSchema } from '$lib/schemas/sale';
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

	let customerId = $state('');
	let saleDate = $state(new Date().toISOString().split('T')[0]);
	let items = $state<LineItem[]>([]);
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

	export function addScannedItems(scannedItems: any[], partyName?: string) {
		// Auto-select customer if provided
		if (partyName && !customerId) {
			const match = customers.find((c) => c.name.toLowerCase().includes(partyName.toLowerCase()) || partyName.toLowerCase().includes(c.name.toLowerCase()))
			if (match) customerId = match._id
		}

		// Match scanned items to existing products and add as line items
		const newItems: LineItem[] = scannedItems.map((si) => {
			const product = products.find((p) => p.title.toLowerCase() === si.productTitle.toLowerCase())
			if (product) {
				const units = getAvailableUnits(product.unit)
				const defaultUnit = units[0] || 'piece'
				return {
					id: genId(),
					productId: product._id,
					productTitle: product.title,
					quantity: si.quantity || 1,
					unitStr: product.unit || '',
					unit: defaultUnit,
					rate: si.rate || Math.round(deriveUnitPrice(product.sellingPrice ?? 0, product.unit, defaultUnit) * 100) / 100,
				}
			}
			// Product not found — add with title only (user can select manually)
			return {
				id: genId(),
				productId: '',
				productTitle: si.productTitle,
				quantity: si.quantity || 1,
				unitStr: si.unitStr || '',
				unit: si.unit || 'piece',
				rate: si.rate || 0,
			}
		})

		// Replace empty rows at the start, or append
		const filledCount = items.filter((i) => i.productId).length
		if (filledCount === 0) {
			items = [...newItems, ...Array.from({ length: 3 }, () => ({ id: genId(), productId: '', productTitle: '', quantity: 1, unit: '', unitStr: '', rate: 0 }))]
		} else {
			items = [...items.filter((i) => i.productId), ...newItems, ...Array.from({ length: 3 }, () => ({ id: genId(), productId: '', productTitle: '', quantity: 1, unit: '', unitStr: '', rate: 0 }))]
		}
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
			await client.mutation(api['functions/sales'].create, {
				customerId: customerId || undefined,
				saleDate,
				items: validItems.map((i) => ({
					productId: i.productId as any,
					productTitle: i.productTitle,
					quantity: i.quantity,
					rate: i.rate,
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
						<h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Sale</h2>
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
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sale Date</span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
					</div>
				</div>
			</div>

			<!-- Grid header -->
			<div class="bill-grid max-h-[30vh] overflow-y-auto">
				<div class="sticky top-0 z-10 grid grid-cols-[2rem_1fr_4.5rem_4rem_5rem_4.5rem_1.5rem] items-stretch border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_sn')}</span>
					<span class="flex items-center border-r border-zinc-200 px-3 py-2 dark:border-zinc-800">{t('product_title')}</span>
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_quantity')}</span>
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('product_unit')}</span>
					<span class="flex items-center justify-end border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_rate')}</span>
					<span class="flex items-center justify-end px-2 py-2">{t('common_amount')}</span>
					<span></span>
				</div>
				{#each Array(5) as _, i}
					<div class="grid grid-cols-[2rem_1fr_4.5rem_4rem_5rem_4.5rem_1.5rem] items-stretch border-b border-zinc-100/30 dark:border-zinc-800/20">
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
{:else}
	{#if error}
		<div class="mx-auto mb-4 max-w-4xl flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
			<AlertTriangle class="size-4 shrink-0" />
			{error}
		</div>
	{/if}

	<BillForm
		title="Sale"
		submitLabel="Create Sale"
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
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sale Date</Label>
					<DatePicker
						bind:value={saleDate}
						name="saleDate"
						class={fieldErrors.saleDate ? 'border-red-400 ring-1 ring-red-400/30' : ''}
					/>
					{#if fieldErrors.saleDate}
						<p class="text-xs text-red-500 mt-1">{fieldErrors.saleDate}</p>
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
									purchasePartyId: product.purchasePartyId,
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
{/if}
