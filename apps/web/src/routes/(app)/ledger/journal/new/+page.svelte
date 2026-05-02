<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertTriangle } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import { toast } from 'svelte-sonner';
	import { formatNPR } from '$lib/currency';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const accounts = useConvexQuery(client, api.functions.ledger.listAccounts, () => ({}));

	let date = $state(new Date().toISOString().split('T')[0]);
	let narration = $state('');
	let submitting = $state(false);

	type Line = { accountCode: string; accountName: string; debit: number; credit: number };
	let lines = $state<Line[]>([
		{ accountCode: '', accountName: '', debit: 0, credit: 0 },
		{ accountCode: '', accountName: '', debit: 0, credit: 0 },
	]);

	function addLine() {
		lines = [...lines, { accountCode: '', accountName: '', debit: 0, credit: 0 }];
	}

	function removeLine(index: number) {
		lines = lines.filter((_, i) => i !== index);
	}

	function selectAccount(index: number, code: string) {
		const acc = (accounts.data ?? []).find((a: any) => a.code === code);
		if (!acc) return;
		lines[index] = { ...lines[index], accountCode: acc.code, accountName: acc.name };
	}

	function updateDebit(index: number, value: string) {
		const num = parseFloat(value) || 0;
		lines[index] = { ...lines[index], debit: num, credit: 0 };
	}

	function updateCredit(index: number, value: string) {
		const num = parseFloat(value) || 0;
		lines[index] = { ...lines[index], credit: num, debit: 0 };
	}

	const totalDebit = $derived(lines.reduce((sum, l) => sum + l.debit, 0));
	const totalCredit = $derived(lines.reduce((sum, l) => sum + l.credit, 0));
	const isBalanced = $derived(Math.abs(totalDebit - totalCredit) < 0.001);
	const isValid = $derived(isBalanced && totalDebit > 0 && lines.every((l) => l.accountCode && (l.debit > 0 || l.credit > 0)));

	async function handleSubmit() {
		if (!isValid) {
			toast.error('Please ensure debits equal credits and all lines are filled');
			return;
		}
		submitting = true;
		try {
			const voucherNumber = await client.mutation((api as any).functions.ledger.createJournalEntry, {
				date,
				narration,
				lines: lines.filter((l) => l.accountCode && (l.debit > 0 || l.credit > 0)),
			});
			toast.success(`Journal entry created: ${voucherNumber}`);
			goto('/ledger');
		} catch (err) {
			toast.error(`Failed to create journal entry: ${(err as Error).message}`);
		} finally {
			submitting = false;
		}
	}
</script>

<MetaTags title="New Journal Entry — MeroPasal" />

<div class="p-6 lg:p-8">
	<div class="mb-6">
		<a
			href="/ledger"
			class="mb-3 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
		>
			<ArrowLeft class="size-3" />
			Back to Ledger
		</a>
		<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
			New Journal Entry
		</h1>
		<p class="text-sm text-zinc-500 dark:text-zinc-400">
			Record a manual journal voucher
		</p>
	</div>

	<div class="mx-auto max-w-3xl space-y-6">
		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</Label>
				<DatePicker bind:value={date} class="w-full" />
			</div>
			<div class="space-y-1.5">
				<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Narration</Label>
				<Input bind:value={narration} placeholder="e.g., Depreciation for March" />
			</div>
		</div>

		<div class="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
							<th class="px-4 py-3">Account</th>
							<th class="px-4 py-3 text-right">Debit</th>
							<th class="px-4 py-3 text-right">Credit</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each lines as line, i}
							<tr class="border-b border-zinc-100 dark:border-zinc-800">
								<td class="px-4 py-2">
									{#if accounts.data}
										<EntitySelect
											value={line.accountCode}
											onValueChange={(val) => selectAccount(i, val)}
											items={accounts.data}
											getKey={(a: any) => a.code}
											getLabel={(a: any) => `${a.code} — ${a.name}`}
											placeholder="Select account"
											entityName="Account"
											small
										/>
									{:else}
										<span class="text-zinc-400">Loading...</span>
									{/if}
								</td>
								<td class="px-4 py-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={line.debit || ''}
										oninput={(e) => updateDebit(i, (e.target as HTMLInputElement).value)}
										class="text-right font-mono tabular-nums"
									/>
								</td>
								<td class="px-4 py-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={line.credit || ''}
										oninput={(e) => updateCredit(i, (e.target as HTMLInputElement).value)}
										class="text-right font-mono tabular-nums"
									/>
								</td>
								<td class="px-4 py-2">
									{#if lines.length > 2}
										<button
											type="button"
											class="flex size-6 items-center justify-center rounded text-zinc-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
											onclick={() => removeLine(i)}
										>
											<Trash2 class="size-3.5" />
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="border-t-2 border-zinc-200 font-semibold dark:border-zinc-700">
							<td class="px-4 py-3 text-right">Total</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums {Math.abs(totalDebit - totalCredit) < 0.001 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'}">
								{formatNPR(totalDebit)}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums {Math.abs(totalDebit - totalCredit) < 0.001 ? 'text-zinc-900 dark:text-zinc-100' : 'text-red-600 dark:text-red-400'}">
								{formatNPR(totalCredit)}
							</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>

		{#if !isBalanced}
			<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
				<AlertTriangle class="size-4 shrink-0" />
				Debits ({formatNPR(totalDebit)}) must equal credits ({formatNPR(totalCredit)})
			</div>
		{/if}

		<div class="flex items-center justify-between">
			<Button variant="outline" onclick={addLine}>
				<Plus class="mr-1.5 size-4" />
				Add Line
			</Button>
			<Button onclick={handleSubmit} disabled={submitting || !isValid}>
				{#if submitting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					Saving...
				{:else}
					<Save class="mr-1.5 size-4" />
					Create Journal Entry
				{/if}
			</Button>
		</div>
	</div>
</div>
