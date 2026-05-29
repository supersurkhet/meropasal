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
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte';
	import CustomerForm from '$lib/components/modules/customers/CustomerForm.svelte';
	import { ArrowLeft, Trash2, Save, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { formatNPR } from '$lib/currency';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const parties = useConvexQuery(client, api.functions.parties.list, () => ({}));
	const customers = useConvexQuery(client, api.functions.customers.list, () => ({}));

	const allParties = $derived([
		...(parties.data ?? []).map((p: any) => ({ _id: p._id as string, name: p.name as string, _type: 'party' as const })),
		...(customers.data ?? []).map((c: any) => ({ _id: c._id as string, name: c.name as string, _type: 'customer' as const })),
	].sort((a, b) => a.name.localeCompare(b.name)))

	function isParty(id: string) { return (parties.data ?? []).some((p: any) => p._id === id) }
	function getPartyData(id: string) { return (parties.data ?? []).find((p: any) => p._id === id) }
	function getCustomerData(id: string) { return (customers.data ?? []).find((c: any) => c._id === id) };

	let date = $state(new Date().toISOString().split('T')[0]);
	let narration = $state('');
	let submitting = $state(false);

	type Line = { partyId: string; partyName: string; debit: number; credit: number };
	let lines = $state<Line[]>([
		{ partyId: '', partyName: '', debit: 0, credit: 0 },
		{ partyId: '', partyName: '', debit: 0, credit: 0 },
	]);

	const emptyLine = (): Line => ({ partyId: '', partyName: '', debit: 0, credit: 0 });

	function ensureTrailingRow(index: number) {
		const emptyAfter = lines.slice(index + 1).filter((l) => !l.partyId).length;
		if (emptyAfter < 1) lines = [...lines, emptyLine()];
	}

	function removeLine(index: number) {
		if (lines.length <= 2) return;
		lines = lines.filter((_, i) => i !== index);
	}

	function selectParty(index: number, id: string) {
		const p = allParties.find((x) => x._id === id);
		if (!p) return;
		lines[index] = { ...lines[index], partyId: p._id, partyName: p.name };
		ensureTrailingRow(index);
	}

	function updateDebit(index: number, value: string) {
		const num = parseFloat(value) || 0;
		lines[index] = { ...lines[index], debit: num, credit: 0 };
	}

	function updateCredit(index: number, value: string) {
		const num = parseFloat(value) || 0;
		lines[index] = { ...lines[index], credit: num, debit: 0 };
	}

	const filledLines = $derived(lines.filter((l) => l.partyId && (l.debit > 0 || l.credit > 0)));
	const totalDebit = $derived(filledLines.reduce((sum, l) => sum + l.debit, 0));
	const totalCredit = $derived(filledLines.reduce((sum, l) => sum + l.credit, 0));
	const isValid = $derived(filledLines.length >= 1);

	async function handleSubmit() {
		if (!isValid) {
			toast.error('Add at least one line with a party and amount');
			return;
		}
		submitting = true;
		try {
			const voucherNumber = await client.mutation(api.functions.ledger.createPartyEntries, {
				date,
				narration,
				lines: filledLines.map((l) => ({
					partyId: l.partyId,
					partyName: l.partyName,
					debit: l.debit,
					credit: l.credit,
				})),
			});
			toast.success(`Entry recorded: ${voucherNumber}`);
			goto('/ledger');
		} catch (err) {
			toast.error(`Failed: ${(err as Error).message}`);
		} finally {
			submitting = false;
		}
	}
</script>

<MetaTags title="New Ledger Entry — MeroPasal" />

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
			New Ledger Entry
		</h1>
		<p class="text-sm text-zinc-500 dark:text-zinc-400">
			Record debits and credits against parties
		</p>
	</div>

	<div class="mx-auto max-w-2xl space-y-6">
		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</Label>
				<DatePicker bind:value={date} class="w-full" />
			</div>
			<div class="space-y-1.5">
				<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Narration</Label>
				<Input bind:value={narration} placeholder="e.g., Loan given to parties" />
			</div>
		</div>

		<div class="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
							<th class="px-4 py-3">Party</th>
							<th class="px-4 py-3 text-right">Debit (Dr)</th>
							<th class="px-4 py-3 text-right">Credit (Cr)</th>
							<th class="px-4 py-3 w-8"></th>
						</tr>
					</thead>
					<tbody>
						{#each lines as line, i}
							<tr class="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
								<td class="px-4 py-2">
									<EntitySelect
										value={line.partyId}
										onValueChange={(val) => selectParty(i, val)}
										items={allParties}
										getKey={(p) => p._id}
										getLabel={(p) => p.name}
										placeholder="Select party"
										entityName="Party"
										small
										onDelete={async (item) => {
											if (isParty(item._id)) {
												await client.mutation(api.functions.parties.remove, { id: item._id as any })
											} else {
												await client.mutation(api.functions.customers.remove, { id: item._id as any })
											}
										}}
									>
										{#snippet createForm({ close, onCreated })}
											<PartyForm
												inline
												onsubmit={async (data) => {
													const id = await client.mutation(api.functions.parties.create, data)
													onCreated(id)
												}}
												oncancel={close}
											/>
										{/snippet}
										{#snippet editForm({ item, close })}
											{#if isParty(item._id)}
												<PartyForm
													inline
													party={getPartyData(item._id)}
													onsubmit={async (data) => {
														await client.mutation(api.functions.parties.update, { id: item._id as any, ...data })
														close()
													}}
													oncancel={close}
												/>
											{:else}
												<CustomerForm
													inline
													customer={getCustomerData(item._id)}
													onsubmit={async (data) => {
														await client.mutation(api.functions.customers.update, { id: item._id as any, ...data })
														close()
													}}
													oncancel={close}
												/>
											{/if}
										{/snippet}
									</EntitySelect>
								</td>
								<td class="px-4 py-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={line.debit || ''}
										oninput={(e) => updateDebit(i, (e.target as HTMLInputElement).value)}
										class="text-right font-mono tabular-nums transition-opacity {line.credit > 0 ? 'opacity-30' : ''}"
										placeholder="0"
									/>
								</td>
								<td class="px-4 py-2">
									<Input
										type="number"
										min="0"
										step="0.01"
										value={line.credit || ''}
										oninput={(e) => updateCredit(i, (e.target as HTMLInputElement).value)}
										class="text-right font-mono tabular-nums transition-opacity {line.debit > 0 ? 'opacity-30' : ''}"
										placeholder="0"
									/>
								</td>
								<td class="px-4 py-2">
									{#if lines.length > 2 && line.partyId}
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
							<td class="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Total</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
								{formatNPR(totalDebit)}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
								{formatNPR(totalCredit)}
							</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>

		<div class="flex items-center justify-end">
			<Button onclick={handleSubmit} disabled={submitting || !isValid}>
				{#if submitting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					Saving...
				{:else}
					<Save class="mr-1.5 size-4" />
					Save Entry
				{/if}
			</Button>
		</div>
	</div>
</div>
