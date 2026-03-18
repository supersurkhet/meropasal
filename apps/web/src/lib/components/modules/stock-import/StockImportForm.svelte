<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import InlineCreateDialog from '$lib/components/shared/InlineCreateDialog.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { getConvexClient } from '$lib/convex';
	import { api } from '../../../../convex/_generated/api';

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

	async function handleSubmit() {
		if (!partyId || items.length === 0) return;
		const validItems = items.filter((i) => i.productId && i.quantity > 0);
		if (validItems.length === 0) return;

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
			goto('/stock-import');
		} catch (err) {
			console.error('Failed to create stock import:', err);
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
							<Select.Trigger class="flex-1">
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
				</div>

				<!-- Date -->
				<div class="space-y-1.5">
					<Label class="text-xs font-medium uppercase tracking-wider text-zinc-400">Import Date</Label>
					<Input type="date" bind:value={importDate} />
				</div>
			</div>

			{#if partyId && filteredProducts.length === 0}
				<div class="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
					No products found for this supplier. Create a product linked to this supplier first.
				</div>
			{/if}
		{/snippet}

		{#snippet productSelector({ item, index }: { item: LineItem; index: number })}
			<Select.Root
				type="single"
				value={item.productId}
				onValueChange={(val) => selectProduct(index, val)}
			>
				<Select.Trigger class="h-8 text-sm">
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
		{/snippet}
	</BillForm>
{/if}
