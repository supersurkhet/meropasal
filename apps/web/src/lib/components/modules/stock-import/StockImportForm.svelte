<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { syncFromRate, isDiscountAtOrAboveMax } from '$lib/line-discount';
	import {
		findCatalogProduct,
		lineFromMatchedStockImport,
		lineFromUnmatchedStockSale,
	} from '$lib/ai-scanner/merge-scanned-lines';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { stockImportSchema } from '$lib/schemas/stock-import';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';
	import type { BillLineItem } from '$lib/bill-line-item';
	import BarcodeScanner from '$lib/components/shared/BarcodeScanner.svelte';

	type Party = { _id: string; name: string; panNumber?: string; address?: string; phone?: string; creditLimit?: number; paymentTerms?: string; notes?: string };
	type Product = {
		_id: string;
		title: string;
		unit?: string;
		costPrice: number;
		purchasePartyId: string;
		barcode?: string;
	};

	type LineItem = BillLineItem;

	let parties = $state<Party[]>([]);
	let allProducts = $state<Product[]>([]);
	let loaded = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const [partiesData, productsData] = await Promise.all([
			client.query(api.functions.parties.list, {}),
			client.query(api.functions.products.list, {}),
		]);
		parties = partiesData;
		allProducts = productsData;
		loaded = true;
	}

	let partyId = $state('');
	let importDate = $state(new Date().toISOString().split('T')[0]);
	let items = $state<LineItem[]>([]);
	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});
	let confirmMaxDiscountOpen = $state(false);

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

	// Seed empty rows when loaded
	$effect(() => {
		if (loaded && items.length === 0) {
			items = Array.from({ length: INITIAL_ROWS }, () => emptyRow());
		}
	});

	let filteredProducts = $derived(
		partyId ? allProducts.filter((p) => p.purchasePartyId === partyId) : allProducts,
	);

	export function tryCommitScanImport(scannedItems: any[], partyName?: string): boolean {
		const snapParty = partyId
		const snapDate = importDate
		const snapItems = structuredClone(items)
		const snapErrors = { ...errors }
		addScannedItems(scannedItems, partyName)
		if (!validate()) {
			partyId = snapParty
			importDate = snapDate
			items = snapItems
			errors = snapErrors
			return false
		}
		return true
	}

	/** Receive scanned line items from AI Scanner */
	export function addScannedItems(scannedItems: any[], partyName?: string) {
		// Auto-select supplier if provided
		if (partyName && !partyId) {
			const match = parties.find((p) => p.name.toLowerCase().includes(partyName.toLowerCase()) || partyName.toLowerCase().includes(p.name.toLowerCase()))
			if (match) partyId = match._id
		}

		// Match scanned items to existing products and add as line items
		const newItems: LineItem[] = scannedItems.map((si) => {
			const product = findCatalogProduct(si, allProducts)
			if (product) return lineFromMatchedStockImport(si, product, genId)
			return lineFromUnmatchedStockSale(si, genId)
		})

		const filledCount = items.filter((i) => i.productId).length
		if (filledCount === 0) {
			items = [...newItems, ...Array.from({ length: 3 }, () => emptyRow())]
		} else {
			items = [...items.filter((i) => i.productId), ...newItems, ...Array.from({ length: 3 }, () => emptyRow())]
		}
	}

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
		// Grow the grid when a product is picked
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

	function handleBarcodeScan(code: string) {
		const product = allProducts.find((p) => p.barcode && p.barcode.trim() === code);
		if (!product) {
			toast.error(`No product found with barcode: ${code}`);
			return;
		}
		let index = items.findIndex((i) => !i.productId);
		if (index === -1) {
			addItem();
			index = items.length - 1;
		}
		selectProduct(index, product._id);
		toast.success(`Added: ${product.title}`);
	}

	function ensureTrailingRows(index: number) {
		const emptyAfter = items.slice(index + 1).filter((i) => !i.productId).length;
		const needed = 3 - emptyAfter;
		for (let n = 0; n < needed; n++) addItem();
	}

	function validate(): boolean {
		const validItems = items
			.filter((i) => i.productId && i.quantity > 0)
			.map((i) => ({
				productId: i.productId,
				productTitle: i.productTitle,
				quantity: i.quantity,
				rate: i.rate,
				unit: i.unit || undefined,
			}))

		const result = stockImportSchema.safeParse({
			partyId: partyId || undefined,
			importDate,
			items: validItems,
		})

		if (!result.success) {
			errors = {}
			for (const issue of result.error.issues) {
				const key = issue.path.join('.')
				if (!errors[key]) errors[key] = issue.message
			}
			const firstError = result.error.issues[0]?.message
			toast.error(firstError || t('validation_form_errors'))
			return false
		}
		errors = {}
		return true
	}

	async function executeSubmit() {
		const validItems = items.filter((i) => i.productId && i.quantity > 0);
		submitting = true;
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
			await client.mutation(api.functions.stockImport.create, {
				...(partyId ? { partyId: partyId as any } : {}),
				importDate,
				items: validItems.map((item) => ({
					productId: item.productId as any,
					productTitle: item.productTitle,
					quantity: item.quantity,
					rate: item.rate,
					unit: item.unit || undefined,
				})),
			});
			toast.success(t('toast_stock_imported'));
			goto('/stock-import');
		} catch (err) {
			toast.error(`Failed to create stock import: ${(err as Error).message}`);
		} finally {
			submitting = false;
		}
	}

	function handleSubmit() {
		if (!validate()) return;
		const valid = items.filter((i) => i.productId && i.quantity > 0);
		if (valid.some((i) => isDiscountAtOrAboveMax(i.discountPercent ?? 0))) {
			confirmMaxDiscountOpen = true;
			return;
		}
		void executeSubmit();
	}
</script>

{#if !loaded}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<!-- Header -->
			<div class="border-b border-dashed border-zinc-300 px-6 py-5 dark:border-zinc-700">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Stock Import</h2>
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
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('stock_import_party')} <span class="ml-1 text-xs font-normal text-zinc-400">({t('common_optional')})</span></span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
						<div class="space-y-1.5">
							<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('stock_import_date')}</span>
							<Skeleton class="h-9 w-full rounded-md" />
						</div>
					</div>
				</div>
			</div>

			<!-- Grid header -->
			<div class="bill-grid max-h-[30vh] overflow-y-auto">
				<div class="sticky top-0 z-10 grid grid-cols-[2rem_1fr_4.5rem_4rem_4.5rem_3.25rem_4.5rem_1.5rem] items-stretch border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_sn')}</span>
					<span class="flex items-center border-r border-zinc-200 px-3 py-2 dark:border-zinc-800">{t('product_title')}</span>
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_quantity')}</span>
					<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('product_unit')}</span>
					<span class="flex items-center justify-end border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_rate')}</span>
					<span class="flex items-center justify-end border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('line_discount_percent')}</span>
					<span class="flex items-center justify-end px-2 py-2">{t('common_amount')}</span>
					<span></span>
				</div>
				{#each Array(5) as _, i}
					<div class="grid grid-cols-[2rem_1fr_4.5rem_4rem_4.5rem_3.25rem_4.5rem_1.5rem] items-stretch border-b border-zinc-100/30 dark:border-zinc-800/20">
						<span class="flex items-center justify-center border-r border-zinc-100/30 px-2 py-2.5 font-mono text-xs text-zinc-300 dark:border-zinc-800/20 dark:text-zinc-600">{i + 1}</span>
						<div class="flex items-center border-r border-zinc-100/30 px-3 dark:border-zinc-800/20"><Skeleton class="h-4 w-24" /></div>
						<div class="flex items-center justify-center border-r border-zinc-100/30 dark:border-zinc-800/20"><Skeleton class="h-4 w-8" /></div>
						<div class="flex items-center justify-center border-r border-zinc-100/30 dark:border-zinc-800/20"><Skeleton class="h-4 w-10" /></div>
						<div class="flex items-center justify-end border-r border-zinc-100/30 px-2 dark:border-zinc-800/20"><Skeleton class="h-4 w-14" /></div>
						<div class="flex items-center justify-end border-r border-zinc-100/30 px-2 dark:border-zinc-800/20"><Skeleton class="h-4 w-10" /></div>
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
	<ConfirmDialog
		bind:open={confirmMaxDiscountOpen}
		title={t('line_discount_max_title')}
		description={t('line_discount_max_desc')}
		confirmLabel={t('line_discount_confirm_continue')}
		cancelLabel={t('action_cancel')}
		variant="warning"
		onconfirm={() => {
			confirmMaxDiscountOpen = false;
			void executeSubmit();
		}}
	/>

	<div class="mx-auto mb-4 max-w-4xl">
		<BarcodeScanner onScan={handleBarcodeScan} placeholder="Scan or type barcode to add product..." />
	</div>

	<BillForm
		title="Stock Import"
		submitLabel="Import Stock"
		bind:items
		lineDiscountEnabled={true}
		onadditem={addItem}
		onsubmit={handleSubmit}
		onunitchange={changeUnit}
		{submitting}
	>
		{#snippet headerSlot()}
			<div class="grid grid-cols-2 gap-4">
				<!-- Party selector -->
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						{t('stock_import_party')}
						<span class="ml-1 text-xs font-normal text-zinc-400">({t('common_optional')})</span>
					</Label>
					<EntitySelect
						bind:value={partyId}
						items={parties}
						getKey={(p) => p._id}
						getLabel={(p) => p.name}
						placeholder={t('common_select_supplier')}
						entityName="Supplier"
					>
						{#snippet createForm({ close, onCreated })}
							<PartyForm
								inline
								onsubmit={async (data) => {
									const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
									const id = await client.mutation(api.functions.parties.create, data)
									await loadData()
									onCreated(id)
								}}
								oncancel={close}
							/>
						{/snippet}
						{#snippet editForm({ item, close })}
							<PartyForm
								inline
								party={item}
								onsubmit={async (data) => {
									const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
									await client.mutation(api.functions.parties.update, { id: item._id, ...data })
									await loadData()
									close()
								}}
								oncancel={close}
							/>
						{/snippet}
					</EntitySelect>
				</div>

				<!-- Date -->
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('stock_import_date')}</Label>
					<DatePicker
						bind:value={importDate}
						name="importDate"
						class={errors.importDate ? 'border-red-400 ring-1 ring-red-400/30' : ''}
					/>
					{#if errors.importDate}
						<p class="text-xs text-red-500 mt-1">{errors.importDate}</p>
					{/if}
				</div>
			</div>

			{#if errors.items}
				<div class="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
					{errors.items}
				</div>
			{/if}

			{#if !partyId}
				<div class="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
					{t('stock_import_no_supplier_hint')}
				</div>
			{:else if filteredProducts.length === 0}
				<div class="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
					{t('stock_import_no_products_for_supplier')}
				</div>
			{/if}
		{/snippet}

		{#snippet productSelector({ item, index }: { item: LineItem; index: number })}
			<EntitySelect
				value={item.productId}
				onValueChange={(val) => selectProduct(index, val)}
				items={filteredProducts}
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
