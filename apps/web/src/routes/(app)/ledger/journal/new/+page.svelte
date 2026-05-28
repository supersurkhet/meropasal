<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { goto } from '$app/navigation';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ComboSelect from '$lib/components/shared/ComboSelect.svelte';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte';
	import { ArrowLeft, Trash2, Save, Loader2, AlertTriangle } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import { toast } from 'svelte-sonner';
	import { formatNPR } from '$lib/currency';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const accounts = useConvexQuery(client, api.functions.ledger.listAccounts, () => ({}));
	const parties = useConvexQuery(client, api.functions.parties.list, () => ({}));
	const customers = useConvexQuery(client, api.functions.customers.list, () => ({}));

	// Combined party list: suppliers + customers
	const allParties = $derived([
		...(parties.data ?? []).map((p: any) => ({ _id: p._id, name: p.name, type: 'supplier' as const })),
		...(customers.data ?? []).map((c: any) => ({ _id: c._id, name: c.name, type: 'customer' as const })),
	].sort((a, b) => a.name.localeCompare(b.name)));

	let date = $state(new Date().toISOString().split('T')[0]);
	let narration = $state('');
	let submitting = $state(false);

	// Inline create account state
	let newAccCode = $state('');
	let newAccName = $state('');
	let newAccType = $state<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('asset');
	let creatingAcc = $state(false);

	type Line = { accountCode: string; accountName: string; debit: number; credit: number; partyId?: string; partyName?: string };
	let lines = $state<Line[]>([
		{ accountCode: '', accountName: '', debit: 0, credit: 0 },
		{ accountCode: '', accountName: '', debit: 0, credit: 0 },
	]);

	const emptyLine = (): Line => ({ accountCode: '', accountName: '', debit: 0, credit: 0 });

	function ensureTrailingRows(index: number) {
		const emptyAfter = lines.slice(index + 1).filter((l) => !l.accountCode).length;
		if (emptyAfter < 1) lines = [...lines, emptyLine()];
	}

	function removeLine(index: number) {
		if (lines.length <= 2) return;
		lines = lines.filter((_, i) => i !== index);
	}

	function selectAccount(index: number, code: string) {
		const acc = (accounts.data ?? []).find((a: any) => a.code === code);
		if (!acc) return;
		lines[index] = { ...lines[index], accountCode: acc.code, accountName: acc.name };
		ensureTrailingRows(index);
	}

	async function handleCreateAccount(close: () => void, onCreated: (id: string) => void) {
		if (!newAccCode.trim() || !newAccName.trim()) {
			toast.error('Code and name are required');
			return;
		}
		creatingAcc = true;
		try {
			await client.mutation(api.functions.ledger.createAccount, {
				code: newAccCode.trim(),
				name: newAccName.trim(),
				type: newAccType,
			});
			toast.success(`Account ${newAccCode} created`);
			onCreated(newAccCode.trim());
			newAccCode = '';
			newAccName = '';
			newAccType = 'asset';
			close();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			creatingAcc = false;
		}
	}

	function updateDebit(index: number, value: string) {
		const num = parseFloat(value) || 0;
		lines[index] = { ...lines[index], debit: num, credit: 0 };
	}

	function updateCredit(index: number, value: string) {
		const num = parseFloat(value) || 0;
		lines[index] = { ...lines[index], credit: num, debit: 0 };
	}

	const filledLines = $derived(lines.filter((l) => l.accountCode || l.debit > 0 || l.credit > 0));
	const totalDebit = $derived(filledLines.reduce((sum, l) => sum + l.debit, 0));
	const totalCredit = $derived(filledLines.reduce((sum, l) => sum + l.credit, 0));
	const isBalanced = $derived(Math.abs(totalDebit - totalCredit) < 0.001);
	// Show imbalance once user has 2+ filled lines — not on the very first entry
	const showImbalanceError = $derived(filledLines.length >= 2 && !isBalanced);
	const isValid = $derived(
		isBalanced &&
		totalDebit > 0 &&
		filledLines.length >= 2 &&
		filledLines.every((l) => l.accountCode && (l.debit > 0 || l.credit > 0))
	);

	async function handleSubmit() {
		if (!isValid) {
			toast.error('Please ensure debits equal credits and all lines are filled');
			return;
		}
		submitting = true;
		try {
			const voucherNumber = await client.mutation(api.functions.ledger.createJournalEntry, {
				date,
				narration,
				lines: lines
					.filter((l) => l.accountCode && (l.debit > 0 || l.credit > 0))
					.map((l) => ({
						accountCode: l.accountCode,
						accountName: l.accountName,
						debit: l.debit,
						credit: l.credit,
						...(l.partyId ? { partyId: l.partyId, partyName: l.partyName } : {}),
					})),
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
							<th class="px-4 py-3 w-2/5">Account / Party</th>
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
										>
											{#snippet createForm({ close, onCreated })}
												<div class="space-y-3">
													<div class="grid grid-cols-2 gap-3">
														<div class="space-y-1.5">
															<Label class="text-xs">Code</Label>
															<Input bind:value={newAccCode} placeholder="e.g. 1050" class="h-8 text-sm" />
														</div>
														<div class="space-y-1.5">
															<Label class="text-xs">Type</Label>
															<ComboSelect
																bind:value={newAccType as string}
																items={[
																	{ value: 'asset', label: 'Asset' },
																	{ value: 'liability', label: 'Liability' },
																	{ value: 'equity', label: 'Equity' },
																	{ value: 'revenue', label: 'Revenue' },
																	{ value: 'expense', label: 'Expense' },
																]}
																size="sm"
															/>
														</div>
													</div>
													<div class="space-y-1.5">
														<Label class="text-xs">Name</Label>
														<Input bind:value={newAccName} placeholder="e.g. Petty Cash" class="h-8 text-sm" />
													</div>
													<div class="flex justify-end gap-2">
														<Button variant="outline" size="sm" onclick={close} disabled={creatingAcc}>Cancel</Button>
														<Button size="sm" onclick={() => handleCreateAccount(close, onCreated)} disabled={creatingAcc}>
															{#if creatingAcc}<Loader2 class="mr-1 size-3 animate-spin" />{/if}
															Create
														</Button>
													</div>
												</div>
											{/snippet}
										</EntitySelect>
									{:else}
										<span class="text-zinc-400">Loading...</span>
									{/if}
									<!-- Optional party link -->
									<EntitySelect
										value={line.partyId ?? ''}
										onValueChange={(val) => {
											const p = allParties.find((x) => x._id === val)
											lines[i] = { ...lines[i], partyId: val || undefined, partyName: p?.name }
										}}
										items={allParties}
										getKey={(p) => p._id}
										getLabel={(p) => p.name}
										placeholder="Party (optional)"
										entityName="Party"
										small
									/>
								</td>
								<td class="px-4 py-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={line.debit || ''}
										oninput={(e) => updateDebit(i, (e.target as HTMLInputElement).value)}
										class="text-right font-mono tabular-nums transition-opacity {line.credit > 0 ? 'opacity-30 cursor-not-allowed' : ''}"
										title={line.credit > 0 ? 'Clear credit first to enter debit' : ''}
									/>
								</td>
								<td class="px-4 py-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={line.credit || ''}
										oninput={(e) => updateCredit(i, (e.target as HTMLInputElement).value)}
										class="text-right font-mono tabular-nums transition-opacity {line.debit > 0 ? 'opacity-30 cursor-not-allowed' : ''}"
										title={line.debit > 0 ? 'Clear debit first to enter credit' : ''}
									/>
								</td>
								<td class="px-4 py-2">
									{#if lines.length > 2 && line.accountCode}
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
							<td class="px-4 py-3 text-right font-mono tabular-nums {showImbalanceError ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}">
								{formatNPR(totalDebit)}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums {showImbalanceError ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}">
								{formatNPR(totalCredit)}
							</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>

		{#if showImbalanceError}
			<div class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
				<AlertTriangle class="size-4 shrink-0" />
				{#if totalCredit === 0}
					No credit entries — add at least one credit line to balance the entry
				{:else if totalDebit === 0}
					No debit entries — add at least one debit line to balance the entry
				{:else}
					Difference: {formatNPR(Math.abs(totalDebit - totalCredit))} — debits and credits must balance
				{/if}
			</div>
		{/if}

		<div class="flex items-center justify-end">
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
