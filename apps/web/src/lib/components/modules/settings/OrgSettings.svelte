<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Save, Loader2, AlertTriangle, RotateCcw, Store, Upload, Trash2, TriangleAlert } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import StickyActions from '$lib/components/shared/StickyActions.svelte';
	import { toast } from 'svelte-sonner';
	import { t } from '$lib/t.svelte';
	import { calculateFiscalYear } from '$lib/fiscal';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let { workosOrgName = '', orgMetadata = {} }: { workosOrgName?: string; orgMetadata?: Record<string, unknown> } = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	// Convex query — only for currentFiscalYear and logo
	const settings = useConvexQuery(client, api.functions.organizations.getSettings, () => ({}));
	const updateMutation = useConvexMutation(client, api.functions.organizations.updateSettings);
	const generateUploadUrlMutation = useConvexMutation(client, api.functions.organizations.generateUploadUrl);

	// WorkOS fields (from layout data)
	let businessName = $state(workosOrgName);
	let location = $state((orgMetadata.location as string) ?? '');
	let phone = $state((orgMetadata.phone as string) ?? '');
	let panNumber = $state((orgMetadata.panNumber as string) ?? '');
	let taxRate = $state(Number(orgMetadata.taxRate) || 13);
	let currency = $state((orgMetadata.currency as string) || 'NPR');

	// Convex fields
	let currentFiscalYear = $state(calculateFiscalYear());
	let lastSettingsId = $state<string | null>(null);

	let errors = $state<Record<string, string>>({});
	let uploading = $state(false);
	let saving = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	// Sync WorkOS fields when props change (e.g. after invalidateAll)
	let lastSyncedOrgName = $state(workosOrgName);
	let lastSyncedMetadata = $state(JSON.stringify(orgMetadata));
	$effect(() => {
		const metaStr = JSON.stringify(orgMetadata);
		if (workosOrgName !== lastSyncedOrgName || metaStr !== lastSyncedMetadata) {
			businessName = workosOrgName;
			location = (orgMetadata.location as string) ?? '';
			phone = (orgMetadata.phone as string) ?? '';
			panNumber = (orgMetadata.panNumber as string) ?? '';
			taxRate = Number(orgMetadata.taxRate) || 13;
			currency = (orgMetadata.currency as string) || 'NPR';
			lastSyncedOrgName = workosOrgName;
			lastSyncedMetadata = metaStr;
		}
	});

	// Sync Convex fields when settings data changes
	$effect(() => {
		if (settings.data) {
			const s = settings.data as any;
			const currentId = s._id ?? null;
			if (currentId !== lastSettingsId) {
				currentFiscalYear = s.currentFiscalYear || calculateFiscalYear();
				lastSettingsId = currentId;
			}
		}
	});

	function validate(): boolean {
		errors = {};
		if (!businessName.trim()) {
			errors.businessName = 'Business name is required';
		}
		if (!currentFiscalYear.trim()) {
			errors.currentFiscalYear = 'Fiscal year is required';
		}
		if (taxRate < 0 || taxRate > 100) {
			errors.taxRate = 'Tax rate must be between 0 and 100';
		}
		if (Object.keys(errors).length > 0) {
			toast.error(t('validation_form_errors'));
			return false;
		}
		return true;
	}

	let isDirty = $derived((() => {
		const nameChanged = businessName !== workosOrgName;
		const metaChanged =
			location !== ((orgMetadata.location as string) ?? '') ||
			phone !== ((orgMetadata.phone as string) ?? '') ||
			panNumber !== ((orgMetadata.panNumber as string) ?? '') ||
			taxRate !== (Number(orgMetadata.taxRate) || 13);
		const convexChanged = !!settings.data && lastSettingsId !== null &&
			currentFiscalYear !== ((settings.data as any).currentFiscalYear || calculateFiscalYear());
		return nameChanged || metaChanged || convexChanged;
	})());

	function resetForm() {
		businessName = workosOrgName;
		location = (orgMetadata.location as string) ?? '';
		phone = (orgMetadata.phone as string) ?? '';
		panNumber = (orgMetadata.panNumber as string) ?? '';
		taxRate = Number(orgMetadata.taxRate) || 13;
		if (settings.data) {
			currentFiscalYear = (settings.data as any).currentFiscalYear || calculateFiscalYear();
		}
		errors = {};
	}

	async function handleSave() {
		if (!validate()) return;
		saving = true;
		try {
			// Save WorkOS fields (name + metadata) via API
			const res = await fetch('/api/org/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: businessName.trim(),
					location: location.trim(),
					phone: phone.trim(),
					panNumber: panNumber.trim(),
					taxRate,
					currency,
				}),
			});
			if (!res.ok) {
				const { error } = await res.json();
				toast.error(error || 'Failed to update organization');
				saving = false;
				return;
			}

			// Save Convex fields (fiscal year)
			await updateMutation.mutate({
				currentFiscalYear,
			});

			toast.success(t('toast_settings_saved'));

			// Re-run layout load to refresh WorkOS data everywhere
			await invalidateAll();
		} catch (err) {
			toast.error(t('settings_save_error').replace('{error}', (err as Error).message));
		} finally {
			saving = false;
		}
	}

	async function handleLogoUpload(event: Event) {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file')
			return
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be under 5MB')
			return
		}

		uploading = true
		try {
			const uploadUrl = await generateUploadUrlMutation.mutate({})
			const uploadRes = await fetch(uploadUrl as string, {
				method: 'POST',
				headers: { 'Content-Type': file.type },
				body: file,
			})
			const { storageId } = await uploadRes.json()
			await updateMutation.mutate({ logoStorageId: storageId })
			toast.success(t('toast_logo_uploaded'))
		} catch (err) {
			toast.error('Failed to upload logo')
		} finally {
			uploading = false
			if (fileInput) fileInput.value = ''
		}
	}

	let deleteDialogOpen = $state(false);
	let deleteConfirmText = $state('');
	let deleting = $state(false);
	const deleteConfirmMatch = $derived(deleteConfirmText === workosOrgName);

	async function handleDeleteOrg() {
		if (!deleteConfirmMatch || deleting) return;
		deleting = true;
		try {
			const res = await fetch('/api/org/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organizationId: ($page.data as any)?.orgId }),
			});
			const result = await res.json();
			if (!res.ok) {
				toast.error(result.error || 'Failed to delete organization');
				deleting = false;
				return;
			}
			if (result.redirectUrl) {
				window.location.href = result.redirectUrl;
			}
		} catch {
			toast.error('Failed to delete organization');
			deleting = false;
		}
	}

	async function handleLogoRemove() {
		try {
			await updateMutation.mutate({ removeLogo: true })
			toast.success(t('toast_logo_removed'))
		} catch (err) {
			toast.error('Failed to remove logo')
		}
	}
</script>

{#if settings.isLoading}
	<div class="space-y-8">
		<!-- Logo -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_logo')}</h3>
			<div class="flex items-center gap-4">
				<div class="flex size-16 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
					<Store class="size-7 text-zinc-400 dark:text-zinc-500" />
				</div>
				<Skeleton class="h-8 w-28 rounded-md" />
			</div>
		</div>

		<Separator />

		<!-- Business Info -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_business_info')}</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_business_name')}</Label>
					<Skeleton class="h-10 w-full rounded-md" />
				</div>
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_location')}</Label>
					<Skeleton class="h-10 w-full rounded-md" />
				</div>
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_phone')}</Label>
					<Skeleton class="h-10 w-full rounded-md" />
				</div>
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_pan_number')}</Label>
					<Skeleton class="h-10 w-full rounded-md" />
				</div>
			</div>
		</div>

		<Separator />

		<!-- Fiscal & Tax -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_fiscal_tax')}</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_fiscal_year')}</Label>
					<Skeleton class="h-10 w-full rounded-md" />
					<p class="text-xs text-zinc-500">{t('settings_fiscal_year_hint')}</p>
				</div>
				<div class="space-y-1.5">
					<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings_tax_rate')}</Label>
					<Skeleton class="h-10 w-full rounded-md" />
				</div>
			</div>
		</div>
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
		<!-- Logo -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('settings_logo')}</h3>
			<div class="flex items-center gap-4">
				{#if settings.data?.logoUrl}
					<img
						src={settings.data.logoUrl}
						alt={workosOrgName}
						class="size-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
					/>
				{:else}
					<div class="flex size-16 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
						<Store class="size-7 text-zinc-400 dark:text-zinc-500" />
					</div>
				{/if}
				<div class="flex flex-col gap-2">
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handleLogoUpload}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => fileInput?.click()}
						disabled={uploading}
					>
						{#if uploading}
							<Loader2 class="mr-1.5 size-4 animate-spin" />
							{t('settings_uploading')}
						{:else}
							<Upload class="mr-1.5 size-4" />
							{settings.data?.logoUrl ? t('settings_change_logo') : t('settings_upload_logo')}
						{/if}
					</Button>
					{#if settings.data?.logoUrl}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
							onclick={handleLogoRemove}
						>
							<Trash2 class="mr-1.5 size-4" />
							{t('settings_remove_logo')}
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<Separator />

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

		<StickyActions>
			<Button type="button" onclick={resetForm} disabled={!isDirty}>
				<RotateCcw class="mr-1.5 size-4" />
				{t('action_reset_changes')}
			</Button>
			<Button type="submit" disabled={saving || !isDirty}>
				{#if saving}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
					{t('settings_saving')}
				{:else}
					<Save class="mr-1.5 size-4" />
					{t('settings_save')}
				{/if}
			</Button>
		</StickyActions>
	</form>

	<Separator class="my-4" />

	<!-- Delete Organization -->
	<div class="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
		<div class="flex items-start gap-3">
			<TriangleAlert class="mt-0.5 size-5 shrink-0 text-red-500 dark:text-red-400" />
			<div>
				<h3 class="text-base font-semibold text-red-900 dark:text-red-200">Delete Organization</h3>
				<p class="mt-1 text-sm text-red-700 dark:text-red-400">
					Permanently delete <span class="font-medium">{workosOrgName}</span> and all its data including products, invoices, ledger entries, and settings. This action cannot be undone.
				</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					class="mt-4"
					onclick={() => { deleteConfirmText = ''; deleteDialogOpen = true; }}
				>
					<Trash2 class="mr-1.5 size-4" />
					Delete Organization
				</Button>
			</div>
		</div>
	</div>

	<!-- Delete Confirmation Dialog -->
	<Dialog.Root bind:open={deleteDialogOpen}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
			<Dialog.Content class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
				<Dialog.Header>
					<Dialog.Title class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
						Delete Organization
					</Dialog.Title>
					<Dialog.Description class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
						This will permanently delete <span class="font-medium text-zinc-900 dark:text-zinc-100">{workosOrgName}</span> and all associated data. This cannot be undone.
					</Dialog.Description>
				</Dialog.Header>
				<div class="mt-4 space-y-3">
					<Label for="deleteConfirm" class="text-sm text-zinc-700 dark:text-zinc-300">
						Type <span class="font-mono font-medium text-zinc-900 dark:text-zinc-100">{workosOrgName}</span> to confirm
					</Label>
					<Input
						id="deleteConfirm"
						bind:value={deleteConfirmText}
						placeholder={workosOrgName}
						class="font-mono"
						autocomplete="off"
					/>
				</div>
				<Dialog.Footer class="mt-6 flex justify-end gap-3">
					<Button
						variant="outline"
						size="sm"
						onclick={() => { deleteDialogOpen = false; }}
						disabled={deleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onclick={handleDeleteOrg}
						disabled={!deleteConfirmMatch || deleting}
					>
						{#if deleting}
							<Loader2 class="mr-1.5 size-4 animate-spin" />
							Deleting...
						{:else}
							<Trash2 class="mr-1.5 size-4" />
							Delete Forever
						{/if}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
