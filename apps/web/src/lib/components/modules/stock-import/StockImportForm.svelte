<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import InlineCreateDialog from '$lib/components/shared/InlineCreateDialog.svelte';
	import ProductForm from '$lib/components/modules/products/ProductForm.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { Plus } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { stockImportSchema } from '$lib/schemas/stock-import';
	import { t } from '$lib/t.svelte';

	type Party = { _id: string; name: string };
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

	let inlinePartyOpen = $state(false);
	let inlinePartyName = $state('');

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

	async function createInlineParty() {
		if (!inlinePartyName.trim()) return;
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const id = await client.mutation(api.functions.parties.create, {
			name: inlinePartyName.trim(),
		});
		partyId = id;
		inlinePartyName = '';
		inlinePartyOpen = false;
		await loadData();
	}

	let inlineProductOpen = $state(false);
	let inlineProductIndex = $state(-1);

	async function handleInlineProductCreated(productId: string) {
		inlineProductOpen = false;
		await loadData();
		if (inlineProductIndex >= 0 && inlineProductIndex < items.length) {
			selectProduct(inlineProductIndex, productId);
		}
		inlineProductIndex = -1;
	}

	let selectedPartyName = $derived(parties.find((p) => p._id === partyId)?.name || '');
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
					<Label class="text-xs font-medium uppercase tracking-wider text-zinc-400">Supplier</Label>
					<div class="flex gap-2">
						<Select.Root type="single" bind:value={partyId}>
							<Select.Trigger class="flex-1 {errors.partyId ? 'border-red-400 ring-1 ring-red-400/30' : ''}">
								{selectedPartyName || 'Select supplier...'}
							</Select.Trigger>
							<Select.Content>
								{#each parties as party}
									<Select.Item value={party._id} label={party.name}>{party.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<InlineCreateDialog title="New Supplier" bind:open={inlinePartyOpen}>
							<div class="space-y-3 p-1">
								<div class="space-y-1.5">
									<Label for="si-party-name">Name</Label>
									<Input id="si-party-name" bind:value={inlinePartyName} placeholder="Supplier name" />
								</div>
								<Button
									class="w-full"
									disabled={!inlinePartyName.trim()}
									onclick={createInlineParty}
								>
									Create Supplier
								</Button>
							</div>
						</InlineCreateDialog>
					</div>
					{#if errors.partyId}
						<p class="text-xs text-red-500 mt-1">{errors.partyId}</p>
					{/if}
				</div>

				<!-- Date -->
				<div class="space-y-1.5">
					<Label class="text-xs font-medium uppercase tracking-wider text-zinc-400">Import Date</Label>
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
					No products found for this supplier. Create a product linked to this supplier first.
				</div>
			{/if}
		{/snippet}

		{#snippet productSelector({ item, index }: { item: LineItem; index: number })}
			<div class="flex gap-1">
				<Select.Root
					type="single"
					value={item.productId}
					onValueChange={(val) => selectProduct(index, val)}
				>
					<Select.Trigger class="h-8 flex-1 text-sm">
						{item.productTitle || 'Select product...'}
					</Select.Trigger>
					<Select.Content>
						{#each filteredProducts as product}
							<Select.Item value={product._id} label={product.title}>
								{product.title}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<Button
					variant="outline"
					size="icon"
					class="size-8 shrink-0"
					onclick={() => { inlineProductIndex = index; inlineProductOpen = true; }}
				>
					<Plus class="size-4" />
				</Button>
			</div>
		{/snippet}
	</BillForm>

	<Dialog.Root bind:open={inlineProductOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>New Product</Dialog.Title>
				<Dialog.Description>Create a product for this supplier</Dialog.Description>
			</Dialog.Header>
			<div class="p-1">
				<ProductForm
					inline
					initial={{ purchasePartyId: partyId }}
					onsaved={(id) => handleInlineProductCreated(id)}
				/>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
