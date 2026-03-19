<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { stockImportSchema } from '$lib/schemas/stock-import';
	import { t } from '$lib/t.svelte';

	type Party = { _id: string; name: string; panNumber?: string; address?: string; phone?: string; creditLimit?: number; paymentTerms?: string; notes?: string };
	type Product = {
		_id: string;
		title: string;
		unit?: string;
		costPrice: number;
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

	let filteredProducts = $derived(
		partyId ? allProducts.filter((p) => p.purchasePartyId === partyId) : [],
	);

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
		const product = allProducts.find((p) => p._id === productId);
		if (!product) return;
		const units = getAvailableUnits(product.unit);
		const defaultUnit = units[0] || 'piece';
		const rate = deriveUnitPrice(product.costPrice, product.unit, defaultUnit);
		items[index] = {
			...items[index],
			productId: product._id,
			productTitle: product.title,
			unitStr: product.unit || '',
			unit: defaultUnit,
			rate: Math.round(rate * 100) / 100,
		};
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
			partyId,
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

	async function handleSubmit() {
		if (!validate()) return;
		const validItems = items.filter((i) => i.productId && i.quantity > 0);

		submitting = true;
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
			await client.mutation(api.functions.stockImport.create, {
				partyId: partyId as any,
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
</script>

{#if !loaded}
	<div class="flex items-center justify-center py-20">
		<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
	</div>
{:else}
	<BillForm
		title="Stock Import"
		submitLabel="Import Stock"
		bind:items
		onadditem={addItem}
		onsubmit={handleSubmit}
		{submitting}
	>
		{#snippet headerSlot()}
			<div class="grid grid-cols-2 gap-4">
				<!-- Party selector -->
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('stock_import_party')}</Label>
					<EntitySelect
						bind:value={partyId}
						items={parties}
						getKey={(p) => p._id}
						getLabel={(p) => p.name}
						placeholder={t('common_select_supplier')}
						entityName="Supplier"
						triggerClass={errors.partyId ? 'border-red-400 ring-1 ring-red-400/30' : ''}
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
					{#if errors.partyId}
						<p class="text-xs text-red-500 mt-1">{errors.partyId}</p>
					{/if}
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

			{#if partyId && filteredProducts.length === 0}
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
