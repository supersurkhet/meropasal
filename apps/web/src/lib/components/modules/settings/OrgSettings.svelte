<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Save, Loader2, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { t } from '$lib/t.svelte';
	import { settingsSchema } from '$lib/schemas/settings';
	import { calculateFiscalYear } from '$lib/fiscal';

	let { workosOrgName = '' }: { workosOrgName?: string } = $props();

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
	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (settings.data && !initialized) {
			const s = settings.data as any;
			// Use WorkOS org name as fallback when Convex has no businessName yet
			businessName = s.businessName || workosOrgName || '';
			location = s.location ?? '';
			phone = s.phone ?? '';
			panNumber = s.panNumber ?? '';
			currentFiscalYear = s.currentFiscalYear || calculateFiscalYear();
			taxRate = s.taxRate ?? 13;
			featureInvoicing = s.features?.invoicing ?? true;
			featureStockBook = s.features?.stockBook ?? true;
			featureLogistics = s.features?.logistics ?? false;
			featureLedger = s.features?.ledger ?? true;
			initialized = true;
		}
	});

	function validate(): boolean {
		const result = settingsSchema.safeParse({
			businessName,
			location: location || undefined,
			phone: phone || undefined,
			panNumber: panNumber || undefined,
			currentFiscalYear,
			taxRate,
			features: {
				invoicing: featureInvoicing,
				stockBook: featureStockBook,
				logistics: featureLogistics,
				ledger: featureLedger,
			},
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

	async function handleSave() {
		if (!validate()) return;
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
			toast.success(t('toast_settings_saved'));
		} catch (err) {
			toast.error(t('settings_save_error').replace('{error}', (err as Error).message));
		}
	}
</script>

{#if settings.isLoading}
	<div class="flex items-center justify-center py-12 text-zinc-500">
		<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
		<span class="ml-2 text-sm">{t('settings_loading')}</span>
	</div>
{:else if !settings.data}
	<div class="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950/30">
		<AlertTriangle class="mx-auto mb-4 size-10 text-amber-500" />
		<h3 class="text-lg font-semibold text-amber-900 dark:text-amber-200">
			{t('settings_not_initialized')}
		</h3>
		<p class="mt-2 text-sm text-amber-700 dark:text-amber-400">
			Complete the onboarding process to set up your organization.
		</p>
		<Button
			href="/onboarding"
			class="mt-6 w-full"
			size="lg"
		>
			{t('settings_go_to_onboarding')}
		</Button>
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
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_business_info')}</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="businessName" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_business_name')}</Label>
					<Input
						id="businessName"
						bind:value={businessName}
						placeholder="Your business name"
						class={errors.businessName ? 'border-red-400 ring-1 ring-red-400/30' : ''}
					/>
					{#if errors.businessName}
						<p class="text-xs text-red-500 mt-1">{errors.businessName}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="location" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_location')}</Label>
					<Input id="location" bind:value={location} placeholder="City, District" />
				</div>
				<div class="space-y-1.5">
					<Label for="phone" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_phone')}</Label>
					<Input id="phone" bind:value={phone} placeholder="+977-..." />
				</div>
				<div class="space-y-1.5">
					<Label for="panNumber" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_pan_number')}</Label>
					<Input id="panNumber" bind:value={panNumber} placeholder="PAN #" />
				</div>
			</div>
		</div>

		<Separator />

		<!-- Fiscal & Tax -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_fiscal_tax')}</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="fiscalYear" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_fiscal_year')}</Label>
					<Input
						id="fiscalYear"
						bind:value={currentFiscalYear}
						placeholder="82/83"
						class={errors.currentFiscalYear ? 'border-red-400 ring-1 ring-red-400/30' : ''}
					/>
					<p class="text-xs text-zinc-500">{t('settings_fiscal_year_hint')}</p>
					{#if errors.currentFiscalYear}
						<p class="text-xs text-red-500 mt-1">{errors.currentFiscalYear}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="taxRate" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_tax_rate')}</Label>
					<Input
						id="taxRate"
						type="number"
						bind:value={taxRate}
						min={0}
						max={100}
						step={0.5}
						class={errors.taxRate ? 'border-red-400 ring-1 ring-red-400/30' : ''}
					/>
					{#if errors.taxRate}
						<p class="text-xs text-red-500 mt-1">{errors.taxRate}</p>
					{/if}
				</div>
			</div>
		</div>

		<Separator />

		<!-- Feature Toggles -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_features')}</h3>
			<p class="text-sm text-zinc-500">{t('settings_features_desc')}</p>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
					<input type="checkbox" bind:checked={featureInvoicing} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('settings_feature_invoicing')}</span>
						<p class="text-xs text-zinc-500">{t('settings_feature_invoicing_desc')}</p>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
					<input type="checkbox" bind:checked={featureStockBook} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('settings_feature_stock_book')}</span>
						<p class="text-xs text-zinc-500">{t('settings_feature_stock_book_desc')}</p>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
					<input type="checkbox" bind:checked={featureLogistics} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('settings_feature_logistics')}</span>
						<p class="text-xs text-zinc-500">{t('settings_feature_logistics_desc')}</p>
					</div>
				</label>
				<label class="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
					<input type="checkbox" bind:checked={featureLedger} class="size-4 rounded border-zinc-300" />
					<div>
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('settings_feature_ledger')}</span>
						<p class="text-xs text-zinc-500">{t('settings_feature_ledger_desc')}</p>
					</div>
				</label>
			</div>
		</div>

		<div class="flex justify-end">
			<Button type="submit" disabled={updateMutation.isLoading} class="min-w-[120px] bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
				{#if updateMutation.isLoading}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					{t('settings_saving')}
				{:else}
					<Save class="mr-1.5 size-4" />
					{t('settings_save')}
				{/if}
			</Button>
		</div>
	</form>
{/if}
