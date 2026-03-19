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
	import { tick } from 'svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

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
		submitLabel = t('action_save'),
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

	let tableEl: HTMLDivElement | undefined = $state();

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

	/** Auto-add an empty row when the user starts editing the last row */
	function ensureTrailingRow(index: number) {
		if (index === items.length - 1 && onadditem) {
			onadditem();
		}
	}

	/** Focus a specific cell by row index and column name */
	async function focusCell(rowIndex: number, column: 'qty' | 'rate') {
		await tick();
		if (!tableEl) return;
		const rows = tableEl.querySelectorAll('[data-row-index]');
		const row = rows[rowIndex] as HTMLElement | undefined;
		if (!row) return;
		const cell = row.querySelector(`[data-col="${column}"]`) as HTMLElement | undefined;
		if (!cell) return;
		const input = cell.querySelector('input') as HTMLInputElement | undefined;
		input?.focus();
		input?.select();
	}

	/** Handle Tab/Enter/Backspace navigation across cells */
	function handleCellKeydown(e: KeyboardEvent, rowIndex: number, column: 'qty' | 'rate') {
		if (e.key === 'Tab' && !e.shiftKey) {
			if (column === 'qty') {
				// qty -> rate in same row
				e.preventDefault();
				focusCell(rowIndex, 'rate');
			} else if (column === 'rate') {
				// rate -> qty in next row (auto-add if last)
				e.preventDefault();
				ensureTrailingRow(rowIndex);
				focusCell(rowIndex + 1, 'qty');
			}
		} else if (e.key === 'Tab' && e.shiftKey) {
			if (column === 'rate') {
				e.preventDefault();
				focusCell(rowIndex, 'qty');
			} else if (column === 'qty' && rowIndex > 0) {
				e.preventDefault();
				focusCell(rowIndex - 1, 'rate');
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			ensureTrailingRow(rowIndex);
			focusCell(rowIndex + 1, 'qty');
		} else if ((e.key === 'Backspace' || e.key === 'Delete') && !readonly) {
			const item = items[rowIndex];
			const input = e.target as HTMLInputElement;
			// Remove row if it's empty and there's more than one row
			if (!item.productId && item.quantity === 0 && item.rate === 0 && input.value === '' && items.length > 1) {
				e.preventDefault();
				removeItem(rowIndex);
				if (rowIndex > 0) {
					focusCell(rowIndex - 1, column);
				}
			}
		}
	}

	/** Handle paste of multi-cell data from spreadsheets */
	function handlePaste(e: ClipboardEvent, rowIndex: number, column: 'qty' | 'rate') {
		const text = e.clipboardData?.getData('text/plain');
		if (!text) return;

		const rows = text.split(/\r?\n/).filter(Boolean);
		if (rows.length <= 1 && !rows[0]?.includes('\t')) return; // Single value — let default handle it

		e.preventDefault();
		const columns: ('qty' | 'rate')[] = ['qty', 'rate'];
		const colStart = columns.indexOf(column);

		for (let r = 0; r < rows.length; r++) {
			const targetRow = rowIndex + r;
			// Ensure enough rows exist
			while (targetRow >= items.length && onadditem) {
				onadditem();
			}
			if (targetRow >= items.length) break;

			const cells = rows[r].split('\t');
			for (let c = 0; c < cells.length; c++) {
				const targetCol = colStart + c;
				if (targetCol >= columns.length) break;
				const val = parseFloat(cells[c].replace(/[^0-9.-]/g, ''));
				if (!Number.isFinite(val)) continue;

				if (columns[targetCol] === 'qty') {
					items[targetRow].quantity = val;
				} else if (columns[targetCol] === 'rate') {
					items[targetRow].rate = val;
				}
			}
		}
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
						{formatDate(new Date().toISOString().split('T')[0])}
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
		<div class="min-h-[200px]" bind:this={tableEl}>
			<!-- Table Header — printed receipt column headers -->
			<div class="grid grid-cols-[2.5rem_1fr_5rem_5rem_6rem_6.5rem_2rem] items-center gap-2 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
				<span class="text-center">{t('common_sn')}</span>
				<span>{t('product_title')}</span>
				<span class="text-center">{t('common_quantity')}</span>
				<span class="text-center">{t('product_unit')}</span>
				<span class="text-right">{t('common_rate')}</span>
				<span class="text-right">{t('common_amount')}</span>
				<span></span>
			</div>

			<!-- Line Items -->
			{#if items.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
					<div class="mb-2 text-3xl opacity-30">📋</div>
					<p class="text-sm">{t('bill_no_items')}</p>
					{#if !readonly}
						<p class="mt-1 text-xs">{t('bill_auto_add_hint')}</p>
					{/if}
				</div>
			{/if}

			{#each items as item, i (item.id)}
				{@const lineTotal = item.quantity * item.rate}
				<div
					data-row-index={i}
					class="group grid grid-cols-[2.5rem_1fr_5rem_5rem_6rem_6.5rem_2rem] items-center gap-2 border-b border-zinc-100 px-4 py-2 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/50"
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
						<div data-col="qty">
							<Input
								type="number"
								min="0"
								step="1"
								class="h-8 text-center font-mono text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								value={String(item.quantity)}
								oninput={(e) => updateItemQuantity(i, (e.target as HTMLInputElement).value)}
								onfocus={() => ensureTrailingRow(i)}
								onkeydown={(e) => handleCellKeydown(e, i, 'qty')}
								onpaste={(e) => handlePaste(e, i, 'qty')}
							/>
						</div>
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
						<div data-col="rate">
							<CurrencyInput
								bind:value={item.rate}
								class="[&_input]:h-8 [&_input]:text-sm [&_span]:text-xs"
								onkeydown={(e) => handleCellKeydown(e, i, 'rate')}
								onpaste={(e) => handlePaste(e, i, 'rate')}
								onfocus={() => ensureTrailingRow(i)}
							/>
						</div>
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
		</div>

		<!-- Bill Footer — totals like the bottom of a receipt -->
		<div class="border-t border-dashed border-zinc-300 dark:border-zinc-700">
			<!-- Subtotal -->
			<div class="flex items-center justify-between px-6 py-3">
				<span class="text-sm text-zinc-500">{t('invoice_subtotal')}</span>
				<span class="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
					{formatNPR(subtotal)}
				</span>
			</div>

			<!-- Grand Total -->
			<div class="border-t border-double border-zinc-300 px-6 py-3 dark:border-zinc-600">
				<div class="flex items-center justify-between">
					<span class="text-base font-bold text-zinc-900 dark:text-zinc-100">{t('common_total')}</span>
					<span class="font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
						{formatNPR(subtotal)}
					</span>
				</div>
			</div>
		</div>

	</div>
</div>

{#if !readonly}
	<div class="fab-group fixed bottom-8 right-0 z-30 flex items-stretch rounded-l-2xl bg-white dark:bg-zinc-900">
		<Button
			onclick={onsubmit}
			disabled={submitting || items.length === 0}
		>
			{#if submitting}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
				{t('action_saving')}
			{:else}
				<Save class="mr-1.5 size-4" />
				{submitLabel}
			{/if}
		</Button>
	</div>
{/if}

<style>
	.fab-group {
		box-shadow:
			-10px 10px 30px rgba(0, 0, 0, 0.12),
			-4px 4px 12px rgba(0, 0, 0, 0.08),
			-1px 1px 3px rgba(0, 0, 0, 0.06),
			inset 0 2px 0 rgba(255, 255, 255, 0.7),
			inset 2px 0 0 rgba(255, 255, 255, 0.4);
	}
	:global(.dark) .fab-group {
		box-shadow:
			-10px 10px 35px rgba(0, 0, 0, 0.55),
			-4px 4px 14px rgba(0, 0, 0, 0.35),
			-1px 1px 3px rgba(0, 0, 0, 0.25),
			inset 0 2px 0 rgba(255, 255, 255, 0.07),
			inset 2px 0 0 rgba(255, 255, 255, 0.04);
	}
	.fab-group :global([data-slot="button"]) {
		background: transparent;
		border: none;
		box-shadow: none;
		border-radius: 1rem 0 0 1rem;
		color: oklch(0.21 0.006 285.885);
		height: auto;
		padding: 0.75rem 1.25rem;
		font-weight: 600;
	}
	:global(.dark) .fab-group :global([data-slot="button"]) {
		color: oklch(0.985 0.002 286.067);
	}
	.fab-group :global([data-slot="button"]:hover:not(:disabled)) {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .fab-group :global([data-slot="button"]:hover:not(:disabled)) {
		background: rgba(255, 255, 255, 0.06);
	}
</style>
