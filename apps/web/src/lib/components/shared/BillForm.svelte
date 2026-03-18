<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import CurrencyInput from './CurrencyInput.svelte';
	import UnitSelector from './UnitSelector.svelte';
	import { formatNPR, formatNumber } from '$lib/currency';
	import { deriveUnitPrice } from '$lib/unit-price';
	import { Plus, Trash2, Save, Loader2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type LineItem = {
		id: string;
		productId: string;
		productTitle: string;
		quantity: number;
		unit: string;
		unitStr: string;
		rate: number;
	};

	let {
		title = 'Invoice',
		headerSlot,
		items = $bindable<LineItem[]>([]),
		onadditem,
		onsubmit,
		submitting = false,
		submitLabel = 'Save',
		readonly = false,
		productSelector,
	}: {
		title?: string;
		headerSlot?: Snippet;
		items?: LineItem[];
		onadditem?: () => void;
		onsubmit?: () => void;
		submitting?: boolean;
		submitLabel?: string;
		readonly?: boolean;
		productSelector?: Snippet<[{ item: LineItem; index: number }]>;
	} = $props();

	let subtotal = $derived(
		items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
	);

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function updateItemQuantity(index: number, value: string) {
		const qty = parseFloat(value);
		if (Number.isFinite(qty) && qty >= 0) {
			items[index].quantity = qty;
		}
	}

	function updateItemRate(index: number, value: number) {
		items[index].rate = value;
	}

	function updateItemUnit(index: number, unit: string) {
		items[index].unit = unit;
		const baseRate = deriveUnitPrice(items[index].rate, items[index].unitStr, unit);
		items[index].rate = Math.round(baseRate * 100) / 100;
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			if (!readonly && onsubmit) onsubmit();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- The Bill/Receipt container — designed to feel like a physical invoice -->
<div class="mx-auto max-w-3xl">
	<div class="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

		<!-- Bill Header — like the top of a receipt -->
		<div class="border-b border-dashed border-zinc-300 px-6 py-5 dark:border-zinc-700">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
					<p class="mt-0.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
						{new Date().toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
					</p>
				</div>
				<div class="text-right text-xs text-zinc-400">
					<span class="font-mono">{items.length} item{items.length !== 1 ? 's' : ''}</span>
				</div>
			</div>

			<!-- Header slot for party/customer selectors -->
			{#if headerSlot}
				<div class="mt-4">
					{@render headerSlot()}
				</div>
			{/if}
		</div>

		<!-- Line Items Table — the receipt body -->
		<div class="min-h-[200px]">
			<!-- Table Header — printed receipt column headers -->
			<div class="grid grid-cols-[2.5rem_1fr_5rem_5rem_6rem_6.5rem_2rem] items-center gap-2 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
				<span class="text-center">SN</span>
				<span>Product</span>
				<span class="text-center">Qty</span>
				<span class="text-center">Unit</span>
				<span class="text-right">Rate</span>
				<span class="text-right">Amount</span>
				<span></span>
			</div>

			<!-- Line Items -->
			{#if items.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
					<div class="mb-2 text-3xl opacity-30">📋</div>
					<p class="text-sm">No items yet</p>
					{#if !readonly}
						<p class="mt-1 text-xs">Click "Add Item" to get started</p>
					{/if}
				</div>
			{/if}

			{#each items as item, i (item.id)}
				{@const lineTotal = item.quantity * item.rate}
				<div
					class="group grid grid-cols-[2.5rem_1fr_5rem_5rem_6rem_6.5rem_2rem] items-center gap-2 border-b border-zinc-100 px-4 py-2 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-900/30"
				>
					<!-- SN -->
					<span class="text-center font-mono text-xs tabular-nums text-zinc-400">
						{i + 1}.
					</span>

					<!-- Product -->
					<div class="min-w-0">
						{#if productSelector && !readonly}
							{@render productSelector({ item, index: i })}
						{:else}
							<span class="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
								{item.productTitle || '—'}
							</span>
						{/if}
					</div>

					<!-- Quantity -->
					{#if readonly}
						<span class="text-center font-mono text-sm tabular-nums">{item.quantity}</span>
					{:else}
						<Input
							type="number"
							min="0"
							step="1"
							class="h-8 text-center font-mono text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							value={String(item.quantity)}
							oninput={(e) => updateItemQuantity(i, (e.target as HTMLInputElement).value)}
						/>
					{/if}

					<!-- Unit -->
					{#if readonly}
						<span class="text-center text-sm text-zinc-500">{item.unit}</span>
					{:else}
						<UnitSelector
							unitStr={item.unitStr}
							bind:value={item.unit}
						/>
					{/if}

					<!-- Rate -->
					{#if readonly}
						<span class="text-right font-mono text-sm tabular-nums">{formatNumber(item.rate)}</span>
					{:else}
						<CurrencyInput
							bind:value={item.rate}
							class="[&_input]:h-8 [&_input]:text-sm [&_span]:text-xs"
						/>
					{/if}

					<!-- Amount -->
					<span class="text-right font-mono text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
						{formatNumber(lineTotal)}
					</span>

					<!-- Remove -->
					{#if !readonly}
						<button
							type="button"
							class="flex size-6 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950"
							onclick={() => removeItem(i)}
						>
							<Trash2 class="size-3.5" />
						</button>
					{:else}
						<span></span>
					{/if}
				</div>
			{/each}

			<!-- Add Item Row -->
			{#if !readonly}
				<div class="px-4 py-3">
					<Button
						variant="ghost"
						size="sm"
						class="h-8 gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						onclick={onadditem}
					>
						<Plus class="size-3.5" />
						Add Item
					</Button>
				</div>
			{/if}
		</div>

		<!-- Bill Footer — totals like the bottom of a receipt -->
		<div class="border-t border-dashed border-zinc-300 dark:border-zinc-700">
			<!-- Subtotal -->
			<div class="flex items-center justify-between px-6 py-3">
				<span class="text-sm text-zinc-500">Subtotal</span>
				<span class="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
					{formatNPR(subtotal)}
				</span>
			</div>

			<!-- Grand Total -->
			<div class="border-t border-double border-zinc-300 px-6 py-3 dark:border-zinc-600">
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-zinc-900 dark:text-zinc-100">Total</span>
					<span class="font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
						{formatNPR(subtotal)}
					</span>
				</div>
			</div>
		</div>

		<!-- Action Bar -->
		{#if !readonly}
			<div class="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
				<p class="text-xs text-zinc-400">
					<kbd class="rounded border border-zinc-200 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-zinc-700 dark:bg-zinc-800">⌘S</kbd>
					to save
				</p>
				<Button
					onclick={onsubmit}
					disabled={submitting || items.length === 0}
					class="gap-2"
				>
					{#if submitting}
						<Loader2 class="size-4 animate-spin" />
						Saving...
					{:else}
						<Save class="size-4" />
						{submitLabel}
					{/if}
				</Button>
			</div>
		{/if}
	</div>
</div>
