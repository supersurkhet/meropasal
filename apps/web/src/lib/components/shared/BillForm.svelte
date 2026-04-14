<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import CurrencyInput from './CurrencyInput.svelte';
	import UnitSelector from './UnitSelector.svelte';
	import { formatNPR, formatNumber } from '$lib/currency';
	import { formatUnit } from '$lib/unit-price';
	import { Trash2, Save, Loader2 } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';
	import { formatDate } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';
	import {
		syncFromRate,
		syncFromDiscount,
		discountPercentFromRates,
	} from '$lib/line-discount';
	import type { BillLineItem } from '$lib/bill-line-item';

	type LineItem = BillLineItem;

	let {
		title = 'Invoice',
		headerSlot,
		items = $bindable<LineItem[]>([]),
		onadditem,
		onsubmit,
		onunitchange,
		submitting = false,
		submitLabel = t('action_save'),
		readonly = false,
		productSelector,
		lineDiscountEnabled = false,
	}: {
		title?: string;
		headerSlot?: Snippet;
		items?: LineItem[];
		onadditem?: () => void;
		onsubmit?: () => void;
		onunitchange?: (index: number, unit: string) => void;
		submitting?: boolean;
		submitLabel?: string;
		readonly?: boolean;
		productSelector?: Snippet<[{ item: LineItem; index: number }]>;
		lineDiscountEnabled?: boolean;
	} = $props();

	let tableEl: HTMLDivElement | undefined = $state();

	let filledItems = $derived(items.filter((i) => i.productId));
	let subtotal = $derived(
		items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
	);

	let rowGridClass = $derived(
		lineDiscountEnabled
			? 'grid grid-cols-[2rem_1fr_4.5rem_4rem_4.5rem_3.25rem_4.5rem_1.5rem] items-stretch border-b transition-colors'
			: 'grid grid-cols-[2rem_1fr_4.5rem_4rem_5rem_4.5rem_1.5rem] items-stretch border-b transition-colors',
	);

	let headerGridClass = $derived(
		lineDiscountEnabled
			? 'sticky top-0 z-10 grid grid-cols-[2rem_1fr_4.5rem_4rem_4.5rem_3.25rem_4.5rem_1.5rem] items-stretch border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
			: 'sticky top-0 z-10 grid grid-cols-[2rem_1fr_4.5rem_4rem_5rem_4.5rem_1.5rem] items-stretch border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
	);

	function getRef(item: LineItem) {
		return item.referenceRate ?? 0;
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function updateItemQuantity(index: number, value: string) {
		const qty = parseFloat(value);
		if (Number.isFinite(qty) && qty >= 0) {
			items[index].quantity = qty;
		}
	}

	function onRateUserInput(index: number) {
		if (!lineDiscountEnabled) return;
		const item = items[index];
		const s = syncFromRate(getRef(item), item.rate);
		item.rate = s.rate;
		item.discountPercent = s.discountPercent;
	}

	function onDiscountInput(index: number, raw: string) {
		const v = parseFloat(raw);
		const d = Number.isFinite(v) ? v : 0;
		const item = items[index];
		const s = syncFromDiscount(getRef(item), d);
		item.rate = s.rate;
		item.discountPercent = s.discountPercent;
	}

	function afterPasteSyncRow(index: number) {
		if (!lineDiscountEnabled) return;
		const item = items[index];
		const s = syncFromRate(getRef(item), item.rate);
		item.rate = s.rate;
		item.discountPercent = s.discountPercent;
	}

	function updateItemUnit(index: number, unit: string) {
		if (onunitchange) {
			onunitchange(index, unit);
		} else {
			items[index].unit = unit;
		}
	}

	const MIN_TRAILING = 3;

	function ensureTrailingRows(index: number) {
		if (!onadditem) return;
		const emptyAfter = items.slice(index + 1).filter((i) => !i.productId).length;
		const needed = MIN_TRAILING - emptyAfter;
		for (let n = 0; n < needed; n++) onadditem();
	}

	type ColKey = 'qty' | 'rate' | 'discount';

	async function focusCell(rowIndex: number, column: ColKey) {
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

	function handleCellKeydown(e: KeyboardEvent, rowIndex: number, column: ColKey) {
		const refOk = lineDiscountEnabled && getRef(items[rowIndex]) > 0;
		if (e.key === 'Tab' && !e.shiftKey) {
			if (column === 'qty') {
				e.preventDefault();
				focusCell(rowIndex, 'rate');
			} else if (column === 'rate') {
				e.preventDefault();
				if (refOk) {
					focusCell(rowIndex, 'discount');
				} else {
					ensureTrailingRows(rowIndex);
					focusCell(rowIndex + 1, 'qty');
				}
			} else if (column === 'discount') {
				e.preventDefault();
				ensureTrailingRows(rowIndex);
				focusCell(rowIndex + 1, 'qty');
			}
		} else if (e.key === 'Tab' && e.shiftKey) {
			if (column === 'discount') {
				e.preventDefault();
				focusCell(rowIndex, 'rate');
			} else if (column === 'rate') {
				e.preventDefault();
				focusCell(rowIndex, 'qty');
			} else if (column === 'qty' && rowIndex > 0) {
				e.preventDefault();
				if (lineDiscountEnabled && getRef(items[rowIndex - 1]) > 0) {
					focusCell(rowIndex - 1, 'discount');
				} else {
					focusCell(rowIndex - 1, 'rate');
				}
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			ensureTrailingRows(rowIndex);
			focusCell(rowIndex + 1, 'qty');
		} else if ((e.key === 'Backspace' || e.key === 'Delete') && !readonly) {
			const item = items[rowIndex];
			const input = e.target as HTMLInputElement;
			const disc = item.discountPercent ?? 0;
			const emptyDisc = !lineDiscountEnabled || getRef(item) <= 0 || disc === 0;
			if (
				!item.productId &&
				item.quantity === 0 &&
				item.rate === 0 &&
				emptyDisc &&
				input.value === '' &&
				items.length > 1
			) {
				e.preventDefault();
				removeItem(rowIndex);
				if (rowIndex > 0) {
					focusCell(rowIndex - 1, column);
				}
			}
		}
	}

	function handlePaste(e: ClipboardEvent, rowIndex: number, column: ColKey) {
		const text = e.clipboardData?.getData('text/plain');
		if (!text) return;

		const rows = text.split(/\r?\n/).filter(Boolean);
		if (rows.length <= 1 && !rows[0]?.includes('\t')) return;

		e.preventDefault();
		const columns: ColKey[] = lineDiscountEnabled
			? ['qty', 'rate', 'discount']
			: ['qty', 'rate'];
		const colStart = columns.indexOf(column);

		for (let r = 0; r < rows.length; r++) {
			const targetRow = rowIndex + r;
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
					afterPasteSyncRow(targetRow);
				} else if (columns[targetCol] === 'discount') {
					onDiscountInput(targetRow, String(val));
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

	function readonlyDiscountDisplay(item: LineItem) {
		if (!lineDiscountEnabled) return '';
		const ref = getRef(item);
		if (ref <= 0) return '—';
		if (item.discountPercent != null) return formatNumber(item.discountPercent);
		return formatNumber(discountPercentFromRates(ref, item.rate));
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto max-w-4xl">
	<div class="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">

		<div class="border-b border-dashed border-zinc-300 px-6 py-5 dark:border-zinc-700">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
					<p class="mt-0.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
						{formatDate(new Date().toISOString().split('T')[0])}
					</p>
				</div>
				<div class="text-right text-xs text-zinc-400">
					<span class="font-mono">{filledItems.length} item{filledItems.length !== 1 ? 's' : ''}</span>
				</div>
			</div>

			{#if headerSlot}
				<div class="mt-4">
					{@render headerSlot()}
				</div>
			{/if}
		</div>

		<div class="bill-grid max-h-[30vh] overflow-y-auto" bind:this={tableEl}>
			<div class={headerGridClass}>
				<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_sn')}</span>
				<span class="flex items-center border-r border-zinc-200 px-3 py-2 dark:border-zinc-800">{t('product_title')}</span>
				<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_quantity')}</span>
				<span class="flex items-center justify-center border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('product_unit')}</span>
				<span class="flex items-center justify-end border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('common_rate')}</span>
				{#if lineDiscountEnabled}
					<span class="flex items-center justify-end border-r border-zinc-200 px-2 py-2 dark:border-zinc-800">{t('line_discount_percent')}</span>
				{/if}
				<span class="flex items-center justify-end px-2 py-2">{t('common_amount')}</span>
				<span></span>
			</div>

			{#if items.length === 0 && readonly}
				<div class="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500">
					<div class="mb-2 text-3xl opacity-30">📋</div>
					<p class="text-sm">{t('bill_no_items')}</p>
				</div>
			{/if}

			{#each items as item, i (item.id)}
				{@const ddRead = readonlyDiscountDisplay(item)}
				{@const lineTotal = item.quantity * item.rate}
				{@const filled = !!item.productId}
				{@const vb = filled ? 'border-r border-zinc-200/60 dark:border-zinc-700/50' : 'border-r border-zinc-100/30 dark:border-zinc-800/20'}
				<div
					data-row-index={i}
					class="{rowGridClass} {filled ? 'border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50' : 'border-zinc-100/30 dark:border-zinc-800/20'}"
				>
					<span class="{vb} flex items-center justify-center px-2 font-mono text-xs tabular-nums {filled ? 'text-zinc-400' : 'text-zinc-300 dark:text-zinc-600'}">
						{i + 1}
					</span>

					<div class="flex min-w-0 items-stretch overflow-hidden {vb}">
						{#if productSelector && !readonly}
							{@render productSelector({ item, index: i })}
						{:else}
							<span class="flex items-center truncate px-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
								{item.productTitle || '—'}
							</span>
						{/if}
					</div>

					{#if readonly}
						<span class="flex items-center justify-center {vb} px-2 font-mono text-sm tabular-nums">{item.quantity}</span>
					{:else}
						<div data-col="qty" class="flex items-stretch {vb}">
							<Input
								type="number"
								min="0"
								step="1"
								class="h-auto rounded-none border-0 bg-transparent text-center font-mono text-sm tabular-nums shadow-none ring-0 focus-visible:bg-zinc-50 focus-visible:ring-0 dark:focus-visible:bg-zinc-800/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								value={String(item.quantity)}
								oninput={(e) => updateItemQuantity(i, (e.target as HTMLInputElement).value)}
								onfocus={() => ensureTrailingRows(i)}
								onkeydown={(e) => handleCellKeydown(e, i, 'qty')}
								onpaste={(e) => handlePaste(e, i, 'qty')}
							/>
						</div>
					{/if}

					{#if readonly}
						<span class="flex items-center justify-center {vb} px-2 text-sm text-zinc-500">{formatUnit(item.unit)}</span>
					{:else}
						<div class="flex items-stretch {vb}">
							<UnitSelector
								unitStr={item.unitStr}
								value={item.unit}
								onValueChange={(unit) => updateItemUnit(i, unit)}
							/>
						</div>
					{/if}

					{#if readonly}
						<span class="flex items-center justify-end {vb} px-2 font-mono text-sm tabular-nums">{formatNumber(item.rate)}</span>
					{:else}
						<div data-col="rate" class="flex items-stretch {vb}">
							<CurrencyInput
								bind:value={item.rate}
								class="[&_input]:text-sm [&_span]:text-xs"
								onuserinput={() => onRateUserInput(i)}
								onkeydown={(e) => handleCellKeydown(e, i, 'rate')}
								onpaste={(e) => handlePaste(e, i, 'rate')}
								onfocus={() => ensureTrailingRows(i)}
							/>
						</div>
					{/if}

					{#if lineDiscountEnabled}
						{#if readonly}
							<span class="flex items-center justify-end {vb} px-2 font-mono text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
								{ddRead}{#if ddRead !== '—'}%{/if}
							</span>
						{:else if getRef(item) <= 0}
							<span class="flex items-center justify-center {vb} px-2 text-sm text-zinc-400">—</span>
						{:else}
							<div data-col="discount" class="flex items-stretch {vb}">
								<Input
									type="number"
									min="0"
									max="15"
									step="0.01"
									class="h-auto rounded-none border-0 bg-transparent text-right font-mono text-sm tabular-nums shadow-none ring-0 focus-visible:bg-zinc-50 focus-visible:ring-0 dark:focus-visible:bg-zinc-800/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
									value={String(item.discountPercent ?? 0)}
									oninput={(e) => onDiscountInput(i, (e.target as HTMLInputElement).value)}
									onkeydown={(e) => handleCellKeydown(e, i, 'discount')}
									onpaste={(e) => handlePaste(e, i, 'discount')}
									onfocus={() => ensureTrailingRows(i)}
								/>
							</div>
						{/if}
					{/if}

					<span class="flex items-center justify-end px-2 font-mono text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
						{lineTotal > 0 ? formatNumber(lineTotal) : ''}
					</span>

					<div class="flex items-center justify-center">
						{#if !readonly && filled}
							<button
								type="button"
								class="flex size-6 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950"
								onclick={() => removeItem(i)}
							>
								<Trash2 class="size-3.5" />
							</button>
						{/if}
					</div>
				</div>
			{/each}

		</div>

		<div class="border-t border-dashed border-zinc-300 dark:border-zinc-700">
			<div class="flex items-center justify-between px-6 py-3">
				<span class="text-sm text-zinc-500">{t('invoice_subtotal')}</span>
				<span class="font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
					{formatNPR(subtotal)}
				</span>
			</div>

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
	.bill-grid :global([data-slot="select-trigger"]) {
		border: none !important;
		border-radius: 0 !important;
		box-shadow: none !important;
		height: 100% !important;
		width: 100% !important;
		background: transparent !important;
	}
	.bill-grid :global([data-slot="select-trigger"]:hover),
	.bill-grid :global([data-slot="select-trigger"]:focus-visible),
	.bill-grid :global([data-slot="select-trigger"]:focus) {
		background: oklch(0.967 0.003 264.542 / 0.5) !important;
		outline: none !important;
		--tw-ring-shadow: none !important;
		--tw-ring-color: transparent !important;
	}
	:global(.dark) .bill-grid :global([data-slot="select-trigger"]:hover),
	:global(.dark) .bill-grid :global([data-slot="select-trigger"]:focus-visible),
	:global(.dark) .bill-grid :global([data-slot="select-trigger"]:focus) {
		background: oklch(0.274 0.006 286.033 / 0.5) !important;
	}
	.bill-grid :global(.relative) {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
	}
	.bill-grid :global(.relative input),
	.bill-grid :global(input) {
		border: none !important;
		border-radius: 0 !important;
		box-shadow: none !important;
		background: transparent !important;
		height: 100% !important;
		outline: none !important;
		--tw-ring-shadow: none !important;
		--tw-ring-color: transparent !important;
	}
	.bill-grid :global(.relative input:focus-visible),
	.bill-grid :global(.relative input:focus),
	.bill-grid :global(input:focus-visible),
	.bill-grid :global(input:focus) {
		background: oklch(0.967 0.003 264.542 / 0.5) !important;
		outline: none !important;
		box-shadow: none !important;
		--tw-ring-shadow: none !important;
	}
	:global(.dark) .bill-grid :global(.relative input:focus-visible),
	:global(.dark) .bill-grid :global(.relative input:focus),
	:global(.dark) .bill-grid :global(input:focus-visible),
	:global(.dark) .bill-grid :global(input:focus) {
		background: oklch(0.274 0.006 286.033 / 0.5) !important;
	}
	.bill-grid :global(span.inline-flex) {
		border: none !important;
		border-radius: 0 !important;
		background: transparent !important;
		height: 100% !important;
		width: 100% !important;
		justify-content: center;
	}

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
