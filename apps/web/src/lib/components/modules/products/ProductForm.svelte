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
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { Save, Loader2 } from '@lucide/svelte';
	import StickyActions from '$lib/components/shared/StickyActions.svelte';
	import { productSchema } from '$lib/schemas/product';
	import { t } from '$lib/t.svelte';

	type Party = { _id: string; name: string; panNumber?: string; address?: string; phone?: string; creditLimit?: number; paymentTerms?: string; notes?: string };

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
	let isFeatured = $state((initial as any)?.isFeatured ?? false);
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
			if (isFeatured) data.isFeatured = true;

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
	class="space-y-5 {inline ? '' : 'mx-auto max-w-2xl'}"
	onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
>
	<!-- Title -->
	<div class="space-y-1.5">
		<Label for="title" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_name')} <span class="text-red-500">*</span></Label>
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
		<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_supplier')} <span class="text-red-500">*</span></Label>
		<EntitySelect
			bind:value={purchasePartyId}
			items={parties}
			getKey={(p) => p._id}
			getLabel={(p) => p.name}
			placeholder={t('stock_import_select_supplier')}
			entityName="Supplier"
			triggerClass={errors.purchasePartyId ? 'border-red-400 ring-1 ring-red-400/30' : ''}
		>
			{#snippet createForm({ close, onCreated })}
				<PartyForm
					inline
					onsubmit={async (data) => {
						const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
						const id = await client.mutation(api.functions.parties.create, data)
						await loadParties()
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
						await loadParties()
						close()
					}}
					oncancel={close}
				/>
			{/snippet}
		</EntitySelect>
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
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_cost_price')} <span class="text-red-500">*</span></Label>
			<CurrencyInput bind:value={costPrice} placeholder="0.00" />
			{#if errors.costPrice}
				<p class="text-xs text-red-500 mt-1">{errors.costPrice}</p>
			{/if}
		</div>
		<div class="space-y-1.5">
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_selling_price')}</Label>
			<CurrencyInput bind:value={sellingPrice} placeholder="Auto: cost + 10%" onuserinput={() => { sellingPriceManual = true; }} />
			{#if !sellingPriceManual && costPrice > 0}
				<p class="text-xs text-emerald-600 dark:text-emerald-400">Auto: {costPrice} + 10% markup</p>
			{/if}
		</div>
	</div>

	<!-- Stock -->
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1.5">
			<Label for="openingStock" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_opening_stock')} <span class="text-red-500">*</span></Label>
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
			<Label for="reorderLevel" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_reorder_level')}</Label>
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
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_category')}</Label>
			<Select.Root type="single" bind:value={category}>
				<Select.Trigger class={errors.category ? 'border-red-400 ring-1 ring-red-400/30' : ''}>
					{category || t('product_select_category')}
				</Select.Trigger>
				<Select.Content>
					{#each categories as cat}
						<Select.Item value={cat} label={cat}>
							<span class="capitalize">{cat}</span>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			{#if errors.category}
				<p class="text-xs text-red-500 mt-1">{errors.category}</p>
			{/if}
		</div>

		<div class="grid grid-cols-3 gap-4">
			<div class="space-y-1.5">
				<Label for="sku" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_sku')}</Label>
				<Input id="sku" bind:value={sku} placeholder="Auto-generated" />
			</div>
			<div class="space-y-1.5">
				<Label for="barcode" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_barcode')}</Label>
				<Input id="barcode" bind:value={barcode} placeholder="Optional" />
			</div>
			<div class="space-y-1.5">
				<Label for="hsCode" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_hs_code')}</Label>
				<Input id="hsCode" bind:value={hsCode} placeholder="Optional" />
			</div>
		</div>

		<!-- Featured Toggle -->
		<div class="flex items-center gap-3">
			<button
				type="button"
				role="switch"
				aria-checked={isFeatured}
				class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors {isFeatured ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-600'}"
				onclick={() => { isFeatured = !isFeatured }}
			>
				<span class="pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform {isFeatured ? 'translate-x-4' : 'translate-x-0'}"></span>
			</button>
			<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer" onclick={() => { isFeatured = !isFeatured }}>{t('product_featured')}</Label>
		</div>

		<div class="space-y-1.5">
			<Label for="description" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('product_description')}</Label>
			<Textarea id="description" bind:value={description} placeholder="Product notes..." rows={3} />
		</div>
	{/if}

	<!-- Submit -->
	<StickyActions {inline}>
		<Button type="submit" disabled={submitting}>
			{#if submitting}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
				{t('action_saving')}
			{:else}
				<Save class="mr-1.5 size-4" />
				{initial?._id ? t('action_update') : t('action_create')} {t('product_title')}
			{/if}
		</Button>
	</StickyActions>
</form>
