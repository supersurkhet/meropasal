<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import CurrencyInput from '$lib/components/shared/CurrencyInput.svelte';
	import UnitBuilder from '$lib/components/shared/UnitBuilder.svelte';
	import InlineCreateDialog from '$lib/components/shared/InlineCreateDialog.svelte';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { Save, Loader2 } from '@lucide/svelte';
	import { productSchema } from '$lib/schemas/product';
	import { t } from '$lib/t.svelte';

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
	let errors = $state<Record<string, string>>({});

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

	function validate(): boolean {
		const result = productSchema.safeParse({
			title: title.trim(),
			purchasePartyId,
			unit: unit || undefined,
			costPrice,
			sellingPrice: sellingPrice > 0 ? sellingPrice : undefined,
			openingStock,
			reorderLevel: reorderLevel > 0 ? reorderLevel : undefined,
			hsCode: hsCode || undefined,
			barcode: barcode || undefined,
			sku: sku || undefined,
			category: category || undefined,
			description: description || undefined,
		})
		if (!result.success) {
			errors = {}
			for (const issue of result.error.issues) {
				const key = issue.path.join('.')
				if (!errors[key]) errors[key] = issue.message
			}
			toast.error(t('validation_form_errors'))
			return false
		}
		errors = {}
		return true
	}

	async function handleSubmit() {
		if (!validate()) return;
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
				toast.success(t('toast_product_updated'));
			} else {
				const id = await client.mutation(api.functions.products.create, data as any);
				toast.success(t('toast_product_created'));
				if (onsaved) {
					onsaved(id);
					return;
				}
			}
			if (!inline) goto('/products');
		} catch (err) {
			toast.error(`Failed to save product: ${(err as Error).message}`);
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
		<Label for="title" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Product Name <span class="text-red-500">*</span></Label>
		<Input
			id="title"
			bind:value={title}
			placeholder="e.g. Rice 25kg Basmati"
			required
			class={errors.title ? 'border-red-400 ring-1 ring-red-400/30' : ''}
		/>
		{#if errors.title}
			<p class="text-xs text-red-500 mt-1">{errors.title}</p>
		{/if}
	</div>

	<!-- Supplier -->
	<div class="space-y-1.5">
		<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Supplier <span class="text-red-500">*</span></Label>
		<div class="flex gap-2">
			<Select.Root type="single" bind:value={purchasePartyId}>
				<Select.Trigger class="flex-1 {errors.purchasePartyId ? 'border-red-400 ring-1 ring-red-400/30' : ''}">
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
		{#if errors.purchasePartyId}
			<p class="text-xs text-red-500 mt-1">{errors.purchasePartyId}</p>
		{/if}
	</div>

	<!-- Unit -->
	<div class="space-y-1.5">
		<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Unit</Label>
		<UnitBuilder bind:value={unit} />
	</div>

	<!-- Prices -->
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1.5">
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cost Price <span class="text-red-500">*</span></Label>
			<CurrencyInput bind:value={costPrice} placeholder="0.00" />
			{#if errors.costPrice}
				<p class="text-xs text-red-500 mt-1">{errors.costPrice}</p>
			{/if}
		</div>
		<div class="space-y-1.5">
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Selling Price</Label>
			<CurrencyInput bind:value={sellingPrice} placeholder="Auto: cost + 10%" onuserinput={() => { sellingPriceManual = true; }} />
			{#if !sellingPriceManual && costPrice > 0}
				<p class="text-xs text-emerald-600 dark:text-emerald-400">Auto: {costPrice} + 10% markup</p>
			{/if}
		</div>
	</div>

	<!-- Stock -->
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1.5">
			<Label for="openingStock" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Opening Stock <span class="text-red-500">*</span></Label>
			<Input
				id="openingStock"
				type="number"
				min="0"
				bind:value={openingStock}
				placeholder="0"
				class={errors.openingStock ? 'border-red-400 ring-1 ring-red-400/30' : ''}
			/>
			{#if errors.openingStock}
				<p class="text-xs text-red-500 mt-1">{errors.openingStock}</p>
			{/if}
		</div>
		<div class="space-y-1.5">
			<Label for="reorderLevel" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reorder Level</Label>
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
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</Label>
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
				<Label for="sku" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">SKU</Label>
				<Input id="sku" bind:value={sku} placeholder="Auto-generated" />
			</div>
			<div class="space-y-1.5">
				<Label for="barcode" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Barcode</Label>
				<Input id="barcode" bind:value={barcode} placeholder="Optional" />
			</div>
			<div class="space-y-1.5">
				<Label for="hsCode" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">HS Code</Label>
				<Input id="hsCode" bind:value={hsCode} placeholder="Optional" />
			</div>
		</div>

		<div class="space-y-1.5">
			<Label for="description" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</Label>
			<Textarea id="description" bind:value={description} placeholder="Product notes..." rows={3} />
		</div>
	{/if}

	<!-- Submit -->
	<div class="flex justify-end gap-3 pt-2">
		<Button
			type="submit"
			disabled={submitting}
			class="min-w-[120px] gap-2 bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
