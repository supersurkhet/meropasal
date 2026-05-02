<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import { Label } from '$lib/components/ui/label';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { t } from '$lib/t.svelte';
	import { toast } from 'svelte-sonner';
	import type { BillLineItem } from '$lib/bill-line-item';

	type Party = { _id: string; name: string; panNumber?: string; address?: string; phone?: string; creditLimit?: number; paymentTerms?: string; notes?: string };
	type Product = { _id: string; title: string; unit?: string; costPrice: number; purchasePartyId: string; barcode?: string };
	type LineItem = BillLineItem;

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	let partyId = $state('');
	let invoiceDate = $state(new Date().toISOString().split('T')[0]);
	let items = $state<LineItem[]>([]);
	let submitting = $state(false);
	let loaded = $state(false);
	let parties = $state<Party[]>([]);
	let allProducts = $state<Product[]>([]);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const [partiesData, productsData] = await Promise.all([
			client.query(api.functions.parties.list, {}),
			client.query(api.functions.products.list, {}),
		]);
		parties = partiesData;
		allProducts = productsData;
		loaded = true;
	}

	const INITIAL_ROWS = 10;
	let nextId = 0;
	function genId() {
		return `item-${++nextId}-${Date.now()}`;
	}

	function emptyRow(): LineItem {
		return {
			id: genId(),
			productId: '',
			productTitle: '',
			quantity: 1,
			unit: '',
			unitStr: '',
			rate: 0,
			referenceRate: 0,
			discountPercent: 0,
		};
	}

	$effect(() => {
		if (loaded && items.length === 0) {
			items = Array.from({ length: INITIAL_ROWS }, () => emptyRow());
		}
	});

	const filteredProducts = $derived.by(() => {
		if (!partyId) return allProducts;
		return allProducts.filter((p) => p.purchasePartyId === partyId);
	});

	function addItem() {
		items = [...items, emptyRow()];
	}

	function selectProduct(index: number, productId: string) {
		const product = allProducts.find((p) => p._id === productId);
		if (!product) return;
		const units = getAvailableUnits(product.unit);
		const defaultUnit = units[0] || 'piece';
		const rate = Math.round(deriveUnitPrice(product.costPrice, product.unit, defaultUnit) * 100) / 100;
		items[index] = {
			...items[index],
			productId: product._id,
			productTitle: product.title,
			unitStr: product.unit || '',
			unit: defaultUnit,
			referenceRate: rate,
			rate,
			discountPercent: 0,
		};
		ensureTrailingRows(index);
	}

	function changeUnit(index: number, unit: string) {
		const item = items[index];
		const product = allProducts.find((p) => p._id === item.productId);
		if (!product) {
			items[index].unit = unit;
			return;
		}
		const rate = Math.round(deriveUnitPrice(product.costPrice, product.unit, unit) * 100) / 100;
		items[index] = {
			...items[index],
			unit,
			referenceRate: rate,
			rate,
			discountPercent: 0,
		};
	}

	function ensureTrailingRows(index: number) {
		const emptyAfter = items.slice(index + 1).filter((i) => !i.productId).length;
		const needed = 3 - emptyAfter;
		for (let n = 0; n < needed; n++) addItem();
	}

	function validate(): boolean {
		const validItems = items.filter((i) => i.productId && i.quantity > 0);
		if (validItems.length === 0) {
			toast.error('Please add at least one item');
			return false;
		}
		return true;
	}

	async function handleSubmit() {
		if (!validate()) return;
		const validItems = items.filter((i) => i.productId && i.quantity > 0);
		submitting = true;
		try {
			await client.mutation((api as any).functions.invoices.create, {
				type: 'purchase',
				...(partyId ? { partyId: partyId as any, partyType: 'supplier' as const } : {}),
				issuedAt: invoiceDate,
				items: validItems.map((item) => ({
					productId: item.productId as any,
					productTitle: item.productTitle,
					quantity: item.quantity,
					rate: item.rate,
					total: item.quantity * item.rate,
					unit: item.unit || undefined,
				})),
				tax: 0,
			});
			toast.success('Purchase invoice created');
			goto('/invoices');
		} catch (err) {
			toast.error(`Failed to create invoice: ${(err as Error).message}`);
		} finally {
			submitting = false;
		}
	}
</script>

<MetaTags title="New Purchase Invoice — MeroPasal" />

<div class="p-6">
	<div class="mb-4">
		<Button href="/invoices" variant="ghost" size="sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
			<ArrowLeft class="mr-1.5 size-4" />
			Back to Invoices
		</Button>
	</div>

	{#if !loaded}
		<div class="space-y-4">
			<Skeleton class="h-10 w-full" />
			<Skeleton class="h-64 w-full" />
		</div>
	{:else}
		<BillForm
			title="Purchase Invoice"
			submitLabel="Create Purchase Invoice"
			bind:items
			lineDiscountEnabled={false}
			onadditem={addItem}
			onsubmit={handleSubmit}
			{submitting}
		>
			{#snippet headerSlot()}
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							Supplier
							<span class="ml-1 text-xs font-normal text-zinc-400">({t('common_optional')})</span>
						</Label>
						<EntitySelect
							value={partyId}
							onValueChange={(val) => { partyId = val; }}
							items={parties}
							getKey={(p) => p._id}
							getLabel={(p) => p.name}
							placeholder="Select supplier"
							entityName="Supplier"
						>
							{#snippet createForm({ close })}
								<PartyForm
									inline
									onsubmit={async () => {
										await loadData()
										close()
									}}
								/>
							{/snippet}
						</EntitySelect>
					</div>
					<div class="space-y-1.5">
						<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Invoice Date</Label>
						<DatePicker bind:value={invoiceDate} class="w-full" />
					</div>
				</div>
				{#if partyId && filteredProducts.length === 0}
					<div class="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
						No products found for this supplier. You can still create an invoice with any product.
					</div>
				{/if}
			{/snippet}

			{#snippet productSelector({ item, index }: { item: LineItem; index: number })}
				<EntitySelect
					value={item.productId}
					onValueChange={(val) => selectProduct(index, val)}
					items={partyId ? filteredProducts : allProducts}
					getKey={(p) => p._id}
					getLabel={(p) => p.title}
					placeholder={t('common_select_product')}
					entityName="Product"
					small
				>
					{#snippet createForm({ close, onCreated })}
						<ProductForm
							inline
							initial={{ purchasePartyId: partyId }}
							onsaved={async (id: string) => {
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
								costPrice: product.costPrice,
							}}
							onsaved={async () => {
								await loadData()
								close()
							}}
						/>
					{/snippet}
				</EntitySelect>
			{/snippet}
		</BillForm>
	{/if}
</div>
