<script lang="ts">
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import CurrencyInput from '$lib/components/shared/CurrencyInput.svelte';
	import InlineCreateDialog from '$lib/components/shared/InlineCreateDialog.svelte';
	import { getConvexClient } from '$lib/convex';
	import { api } from '../../../../convex/_generated/api';
	import { Save, Loader2 } from '@lucide/svelte';

	type Party = { _id: string; name: string };

	let {
		initial,
		inline = false,
		onsaved,
	}: {
		initial?: {
			_id?: string;
			title?: string;
			purchasePartyId?: string;
			unit?: string;
			costPrice?: number;
			sellingPrice?: number;
			openingStock?: number;
			hsCode?: string;
			barcode?: string;
			sku?: string;
			category?: string;
			reorderLevel?: number;
			description?: string;
		};
		inline?: boolean;
		onsaved?: (id: string) => void;
	} = $props();

	let parties = $state<Party[]>([]);
	let loaded = $state(false);

	$effect(() => {
		loadParties();
	});

	async function loadParties() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		parties = await client.query(api.functions.parties.list, {});
		loaded = true;
	}

	let title = $state(initial?.title ?? '');
	let purchasePartyId = $state(initial?.purchasePartyId ?? '');
	let unit = $state(initial?.unit ?? '');
	let costPrice = $state(initial?.costPrice ?? 0);
	let sellingPrice = $state(initial?.sellingPrice ?? 0);
	let openingStock = $state(initial?.openingStock ?? 0);
	let hsCode = $state(initial?.hsCode ?? '');
	let barcode = $state(initial?.barcode ?? '');
	let sku = $state(initial?.sku ?? '');
	let category = $state(initial?.category ?? '');
	let reorderLevel = $state(initial?.reorderLevel ?? 0);
	let description = $state(initial?.description ?? '');
	let submitting = $state(false);

	let sellingPriceManual = $state(!!initial?.sellingPrice);

	// Smart default: selling price = cost x 1.10
	$effect(() => {
		if (!sellingPriceManual && costPrice > 0) {
			sellingPrice = Math.round(costPrice * 1.1 * 100) / 100;
		}
	});

	// Smart default: reorder level = ceil(openingStock x 0.1)
	let reorderLevelManual = $state(!!initial?.reorderLevel);
	$effect(() => {
		if (!reorderLevelManual && openingStock > 0) {
			reorderLevel = Math.ceil(openingStock * 0.1);
		}
	});

	async function handleSubmit() {
		if (!title.trim() || !purchasePartyId) return;
		submitting = true;
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
			const data: Record<string, unknown> = {
				title: title.trim(),
				purchasePartyId,
				costPrice,
				openingStock,
			};
			if (unit) data.unit = unit;
			if (sellingPrice > 0) data.sellingPrice = sellingPrice;
			if (hsCode) data.hsCode = hsCode;
			if (barcode) data.barcode = barcode;
			if (sku) data.sku = sku;
			if (category) data.category = category;
			if (reorderLevel > 0) data.reorderLevel = reorderLevel;
			if (description) data.description = description;

			if (initial?._id) {
				data.id = initial._id;
				await client.mutation(api.functions.products.update, data as any);
			} else {
				const id = await client.mutation(api.functions.products.create, data as any);
				if (onsaved) {
					onsaved(id);
					return;
				}
			}
			if (!inline) goto('/products');
		} catch (err) {
			console.error('Failed to save product:', err);
		} finally {
			submitting = false;
		}
	}

	let inlinePartyOpen = $state(false);
	let inlinePartyName = $state('');

	async function createInlineParty() {
		if (!inlinePartyName.trim()) return;
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const id = await client.mutation(api.functions.parties.create, {
			name: inlinePartyName.trim(),
		});
		purchasePartyId = id;
		inlinePartyName = '';
		inlinePartyOpen = false;
		await loadParties();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			handleSubmit();
		}
	}

	const categories = ['general', 'food', 'beverage', 'dairy', 'snacks', 'household', 'personal', 'stationery', 'other'];
</script>

<svelte:window onkeydown={handleKeydown} />

<form
	class="space-y-5 {inline ? '' : 'mx-auto max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950'}"
	onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
>
	{#if !inline}
		<div class="mb-6">
			<h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
				{initial?._id ? 'Edit Product' : 'New Product'}
			</h2>
			<p class="mt-0.5 text-sm text-zinc-500">
				{initial?._id ? 'Update product details' : 'Add a new product to your inventory'}
			</p>
		</div>
	{/if}

	<!-- Title -->
	<div class="space-y-1.5">
		<Label for="title">Product Name <span class="text-destructive">*</span></Label>
		<Input
			id="title"
			bind:value={title}
			placeholder="e.g. Rice 25kg Basmati"
			required
		/>
	</div>

	<!-- Supplier -->
	<div class="space-y-1.5">
		<Label>Supplier <span class="text-destructive">*</span></Label>
		<div class="flex gap-2">
			<Select.Root type="single" bind:value={purchasePartyId}>
				<Select.Trigger class="flex-1">
					{parties.find((p) => p._id === purchasePartyId)?.name || 'Select supplier...'}
				</Select.Trigger>
				<Select.Content>
					{#each parties as party}
						<Select.Item value={party._id} label={party.name}>{party.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<InlineCreateDialog title="New Supplier" description="Create a new supplier party" bind:open={inlinePartyOpen}>
				<div class="space-y-3 p-1">
					<div class="space-y-1.5">
						<Label for="inline-party-name">Name</Label>
						<Input id="inline-party-name" bind:value={inlinePartyName} placeholder="Supplier name" />
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

	<!-- Unit -->
	<div class="space-y-1.5">
		<Label for="unit">Unit</Label>
		<Input
			id="unit"
			bind:value={unit}
			placeholder="e.g. piece, box:12, kg"
		/>
		<p class="text-xs text-zinc-400">Use "box:12" for compound units (12 pieces per box)</p>
	</div>

	<!-- Prices -->
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1.5">
			<Label>Cost Price <span class="text-destructive">*</span></Label>
			<CurrencyInput bind:value={costPrice} placeholder="0.00" />
		</div>
		<div class="space-y-1.5">
			<Label>Selling Price</Label>
			<CurrencyInput bind:value={sellingPrice} placeholder="Auto: cost + 10%" />
			{#if !sellingPriceManual && costPrice > 0}
				<p class="text-xs text-emerald-600 dark:text-emerald-400">Auto: {costPrice} + 10% markup</p>
			{/if}
		</div>
	</div>

	<!-- Stock -->
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1.5">
			<Label for="openingStock">Opening Stock <span class="text-destructive">*</span></Label>
			<Input
				id="openingStock"
				type="number"
				min="0"
				bind:value={openingStock}
				placeholder="0"
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="reorderLevel">Reorder Level</Label>
			<Input
				id="reorderLevel"
				type="number"
				min="0"
				bind:value={reorderLevel}
				placeholder="Auto: 10% of stock"
				oninput={() => { reorderLevelManual = true; }}
			/>
			{#if !reorderLevelManual && openingStock > 0}
				<p class="text-xs text-emerald-600 dark:text-emerald-400">Auto: 10% of opening stock</p>
			{/if}
		</div>
	</div>

	<!-- Optional fields (not shown in inline mode) -->
	{#if !inline}
		<div class="space-y-1.5">
			<Label>Category</Label>
			<Select.Root type="single" bind:value={category}>
				<Select.Trigger>
					{category || 'Select category...'}
				</Select.Trigger>
				<Select.Content>
					{#each categories as cat}
						<Select.Item value={cat} label={cat}>
							<span class="capitalize">{cat}</span>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="grid grid-cols-3 gap-4">
			<div class="space-y-1.5">
				<Label for="sku">SKU</Label>
				<Input id="sku" bind:value={sku} placeholder="Auto-generated" />
			</div>
			<div class="space-y-1.5">
				<Label for="barcode">Barcode</Label>
				<Input id="barcode" bind:value={barcode} placeholder="Optional" />
			</div>
			<div class="space-y-1.5">
				<Label for="hsCode">HS Code</Label>
				<Input id="hsCode" bind:value={hsCode} placeholder="Optional" />
			</div>
		</div>

		<div class="space-y-1.5">
			<Label for="description">Description</Label>
			<Textarea id="description" bind:value={description} placeholder="Product notes..." rows={3} />
		</div>
	{/if}

	<!-- Submit -->
	<div class="flex justify-end gap-3 pt-2">
		<Button
			type="submit"
			disabled={submitting || !title.trim() || !purchasePartyId}
			class="gap-2"
		>
			{#if submitting}
				<Loader2 class="size-4 animate-spin" />
				Saving...
			{:else}
				<Save class="size-4" />
				{initial?._id ? 'Update' : 'Create'} Product
			{/if}
		</Button>
	</div>
</form>
