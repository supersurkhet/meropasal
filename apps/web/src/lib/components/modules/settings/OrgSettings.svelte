<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Save, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const settings = useConvexQuery(client, api.functions.organizations.getSettings, () => ({}));
	const updateMutation = useConvexMutation(client, api.functions.organizations.updateSettings);

	let businessName = $state('');
	let location = $state('');
	let phone = $state('');
	let panNumber = $state('');
	let currentFiscalYear = $state('');
	let taxRate = $state(13);
	let featureInvoicing = $state(true);
	let featureStockBook = $state(true);
	let featureLogistics = $state(false);
	let featureLedger = $state(true);
	let initialized = $state(false);

	$effect(() => {
		if (settings.data && !initialized) {
			const s = settings.data as any;
			businessName = s.businessName ?? '';
			location = s.location ?? '';
			phone = s.phone ?? '';
			panNumber = s.panNumber ?? '';
			currentFiscalYear = s.currentFiscalYear ?? '';
			taxRate = s.taxRate ?? 13;
			featureInvoicing = s.features?.invoicing ?? true;
			featureStockBook = s.features?.stockBook ?? true;
			featureLogistics = s.features?.logistics ?? false;
			featureLedger = s.features?.ledger ?? true;
			initialized = true;
		}
	});

	async function handleSave() {
		try {
			await updateMutation.mutate({
				businessName,
				location,
				phone,
				panNumber,
				currentFiscalYear,
				taxRate,
				features: {
					invoicing: featureInvoicing,
					stockBook: featureStockBook,
					logistics: featureLogistics,
					ledger: featureLedger,
				},
			});
			toast.success('Settings saved successfully.');
		} catch (err) {
			toast.error(`Failed to save: ${(err as Error).message}`);
		}
	}
</script>

{#if settings.isLoading}
	<div class="flex items-center justify-center py-12 text-zinc-500">
		<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
		<span class="ml-2 text-sm">Loading settings...</span>
	</div>
{:else}
	<form
		class="space-y-8"
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
	>
		<!-- Business Info -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Business Information</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="businessName">Business Name</Label>
					<Input id="businessName" bind:value={businessName} placeholder="Your business name" />
				</div>
				<div class="space-y-2">
					<Label for="location">Location</Label>
					<Input id="location" bind:value={location} placeholder="City, District" />
				</div>
				<div class="space-y-2">
					<Label for="phone">Phone</Label>
					<Input id="phone" bind:value={phone} placeholder="+977-..." />
				</div>
				<div class="space-y-2">
					<Label for="panNumber">PAN Number</Label>
					<Input id="panNumber" bind:value={panNumber} placeholder="PAN #" />
				</div>
			</div>
		</div>

		<Separator />

		<!-- Fiscal & Tax -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Fiscal & Tax</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="fiscalYear">Current Fiscal Year</Label>
					<Input id="fiscalYear" bind:value={currentFiscalYear} placeholder="82/83" />
					<p class="text-xs text-zinc-500">Nepali BS format (e.g., 82/83)</p>
				</div>
				<div class="space-y-2">
					<Label for="taxRate">Tax Rate (%)</Label>
					<Input id="taxRate" type="number" bind:value={taxRate} min={0} max={100} step={0.5} />
				</div>
			</div>
		</div>

		<Separator />

		<!-- Feature Toggles -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Features</h3>
			<p class="text-sm text-zinc-500">Enable or disable modules for your business.</p>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/30">
					<input type="checkbox" bind:checked={featureInvoicing} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Invoicing</span>
						<p class="text-xs text-zinc-500">Auto-generate purchase and sale invoices</p>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/30">
					<input type="checkbox" bind:checked={featureStockBook} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Stock Book</span>
						<p class="text-xs text-zinc-500">Track stock movements and aggregation</p>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/30">
					<input type="checkbox" bind:checked={featureLogistics} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Logistics</span>
						<p class="text-xs text-zinc-500">Manage vehicles and delivery trips</p>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/30">
					<input type="checkbox" bind:checked={featureLedger} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Ledger</span>
						<p class="text-xs text-zinc-500">Double-entry bookkeeping and trial balance</p>
					</div>
				</label>
			</div>
		</div>

		<div class="flex justify-end">
			<Button type="submit" disabled={updateMutation.isLoading}>
				{#if updateMutation.isLoading}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					Saving...
				{:else}
					<Save class="mr-1.5 size-4" />
					Save Settings
				{/if}
			</Button>
		</div>
	</form>
{/if}
