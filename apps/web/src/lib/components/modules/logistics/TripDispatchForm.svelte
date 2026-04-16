<script lang="ts">
	import { goto } from '$app/navigation';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import VehicleForm from './VehicleForm.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import {
		findCatalogProduct,
		lineFromMatchedOrderTrip,
		lineFromUnmatchedScan,
	} from '$lib/ai-scanner/merge-scanned-lines';
	import {
		aggregateStockBookEntries,
		getProductTotalAvailable,
	} from '$lib/stock-aggregation';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { tripDispatchSchema } from '$lib/schemas/trip-dispatch';
	import { extractErrors } from '$lib/schemas/shared';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

	type Vehicle = { _id: string; name: string; licensePlate: string; description?: string };
	type Product = {
		_id: string;
		title: string;
		unit?: string;
		sellingPrice: number;
		purchasePartyId: string;
	};

	type LineItem = {
		id: string;
		productId: string;
		productTitle: string;
		quantity: number;
		unit: string;
		unitStr: string;
		rate: number;
	};

	let vehicles = $state<Vehicle[]>([]);
	let products = $state<Product[]>([]);
	let stockAggregate = $state<ReturnType<typeof aggregateStockBookEntries> | null>(null);
	let loaded = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const [vehiclesData, productsData, entries] = await Promise.all([
			client.query(api.functions.vehicles.list, {}),
			client.query(api.functions.products.list, {}),
			client.query(api.functions.stockBook.listEntries, {}),
		]);
		vehicles = vehiclesData;
		products = productsData;
		stockAggregate = aggregateStockBookEntries(entries);
		loaded = true;
	}

	function getAvailable(productId: string): number {
		return stockAggregate ? getProductTotalAvailable(stockAggregate, productId) : 0;
	}

	let vehicleId = $state('');
	let dispatchTime = $state(new Date().toISOString().slice(0, 16));
	let destination = $state('');
	let items = $state<LineItem[]>([]);
	let submitting = $state(false);
	let error = $state('');
	let errors = $state<Record<string, string>>({});

	let hasStockError = $derived(
		items.some((item) => {
			return item.productId && item.quantity > getAvailable(item.productId);
		}),
	);

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

	export function tryCommitScanImport(scannedItems: any[], partyName?: string): boolean {
		const snapVehicle = vehicleId
		const snapTime = dispatchTime
		const snapDest = destination
		const snapItems = structuredClone(items)
		addScannedItems(scannedItems, partyName)

		const validItems = items.filter((i) => i.productId && i.quantity > 0)
		const result = tripDispatchSchema.safeParse({
			vehicleId,
			dispatchTime,
			destination: destination.trim() || undefined,
			products: validItems.map((item) => ({
				productId: item.productId,
				productTitle: item.productTitle,
				quantity: item.quantity,
				unitPrice: item.rate,
				unit: item.unit || undefined,
			})),
		})
		if (!result.success) {
			vehicleId = snapVehicle
			dispatchTime = snapTime
			destination = snapDest
			items = snapItems
			errors = extractErrors(result.error.issues)
			toast.error(t('validation_form_errors'))
			return false
		}
		const overStock = items.some(
			(item) => item.productId && item.quantity > getAvailable(item.productId),
		)
		if (overStock) {
			vehicleId = snapVehicle
			dispatchTime = snapTime
			destination = snapDest
			items = snapItems
			errors = {}
			toast.error('Some items exceed available stock')
			return false
		}
		errors = {}
		return true
	}

	export function addScannedItems(scannedItems: any[], partyName?: string) {
		// Auto-set destination if provided and empty
		if (partyName && !destination) {
			destination = partyName
		}

		// Match scanned items to existing products and add as line items
		const newItems: LineItem[] = scannedItems.map((si) => {
			const product = findCatalogProduct(si, products)
			if (product) return lineFromMatchedOrderTrip(si, product, genId)
			return lineFromUnmatchedScan(si, genId)
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

	function ensureTrailingRows(index: number) {
		const emptyAfter = items.slice(index + 1).filter((i) => !i.productId).length;
		const needed = 3 - emptyAfter;
		for (let n = 0; n < needed; n++) addItem();
	}

	function selectProduct(index: number, productId: string) {
		const product = products.find((p) => p._id === productId);
		if (!product) return;
		const units = getAvailableUnits(product.unit);
		const defaultUnit = units[0] || 'piece';
		const rate = deriveUnitPrice(product.sellingPrice, product.unit, defaultUnit);
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
		const rate = deriveUnitPrice(product.sellingPrice, product.unit, unit);
		items[index] = {
			...items[index],
			unit,
			rate: Math.round(rate * 100) / 100,
		};
	}

	async function handleSubmit() {
		error = '';
		errors = {};
		const validItems = items.filter((i) => i.productId && i.quantity > 0);

		const result = tripDispatchSchema.safeParse({
			vehicleId,
			dispatchTime,
			destination: destination.trim() || undefined,
			products: validItems.map((item) => ({
				productId: item.productId,
				productTitle: item.productTitle,
				quantity: item.quantity,
				unitPrice: item.rate,
				unit: item.unit || undefined,
			})),
		});
		if (!result.success) {
			errors = extractErrors(result.error.issues);
			toast.error(t('validation_form_errors'));
			return;
		}

		if (hasStockError) {
			error = 'Some items exceed available stock';
			return;
		}

		submitting = true;
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
			await client.mutation(api.functions.trips.dispatch, {
				vehicleId: vehicleId as any,
				dispatchTime: new Date(dispatchTime).toISOString(),
				destination: destination.trim() || undefined,
				products: validItems.map((item) => ({
					productId: item.productId as any,
					productTitle: item.productTitle,
					quantity: item.quantity,
					unitPrice: item.rate,
					unit: item.unit || undefined,
				})),
			});
			goto('/trips');
		} catch (err: any) {
			error = err.message || 'Failed to dispatch trip';
		} finally {
			submitting = false;
		}
	}

</script>

{#if !loaded}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<!-- Header -->
			<div class="border-b border-dashed border-zinc-300 px-6 py-5 dark:border-zinc-700">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Trip Dispatch</h2>
						<p class="mt-0.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
							{formatDate(new Date().toISOString().split('T')[0])}
						</p>
					</div>
					<div class="text-right text-xs text-zinc-400">
						<span class="font-mono">0 items</span>
					</div>
				</div>
				<div class="mt-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div class="space-y-1.5">
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_vehicle')} <span class="text-red-500">*</span></span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
						<div class="space-y-1.5">
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_dispatch_time')}</span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
						<div class="space-y-1.5">
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_destination')}</span>
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
		<div class="mx-auto mb-4 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
			{error}
		</div>
	{/if}

	<BillForm
		title="Trip Dispatch"
		submitLabel="Dispatch Trip"
		bind:items
		onadditem={addItem}
		onsubmit={handleSubmit}
		onunitchange={changeUnit}
		{submitting}
	>
		{#snippet headerSlot()}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<!-- Vehicle selector -->
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_vehicle')} <span class="text-red-500">*</span></Label>
					<EntitySelect
						bind:value={vehicleId}
						items={vehicles}
						getKey={(v) => v._id}
						getLabel={(v) => `${v.name} (${v.licensePlate})`}
						placeholder={t('trip_select_vehicle')}
						entityName="Vehicle"
					>
						{#snippet itemContent({ item })}
							<div>
								<span class="font-medium">{item.name}</span>
								<span class="ml-1.5 font-mono text-xs text-zinc-400">{item.licensePlate}</span>
							</div>
						{/snippet}
						{#snippet createForm({ close, onCreated })}
							<VehicleForm
								inline
								onsubmit={async (data) => {
									const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
									const id = await client.mutation(api.functions.vehicles.create, data)
									await loadData()
									onCreated(id)
								}}
								oncancel={close}
							/>
						{/snippet}
						{#snippet editForm({ item, close })}
							<VehicleForm
								inline
								vehicle={item}
								onsubmit={async (data) => {
									const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
									await client.mutation(api.functions.vehicles.update, { id: item._id, ...data })
									await loadData()
									close()
								}}
								oncancel={close}
							/>
						{/snippet}
					</EntitySelect>
					{#if errors.vehicleId}
						<p class="mt-1 text-xs text-red-500">{errors.vehicleId}</p>
					{/if}
				</div>

				<!-- Dispatch Time -->
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_dispatch_time')}</Label>
					<Input type="datetime-local" bind:value={dispatchTime} />
				</div>

				<!-- Destination -->
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_destination')}</Label>
					<Input bind:value={destination} placeholder="e.g. Birendranagar Market" />
				</div>
			</div>
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
									purchasePartyId: product.purchasePartyId,
									unit: product.unit,
									sellingPrice: product.sellingPrice,
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
