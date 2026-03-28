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
		aggregateStockBookEntries,
		getProductTotalAvailable,
	} from '$lib/stock-aggregation';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
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
		if (!vehicleId || items.length === 0) return;
		error = '';
		if (hasStockError) {
			error = 'Some items exceed available stock';
			return;
		}
		const validItems = items.filter((i) => i.productId && i.quantity > 0);
		if (validItems.length === 0) return;

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
	<div class="flex items-center justify-center py-20">
		<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
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
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('trip_vehicle')}</Label>
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
