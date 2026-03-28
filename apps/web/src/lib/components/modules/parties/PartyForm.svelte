<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader2, Save } from '@lucide/svelte';
	import StickyActions from '$lib/components/shared/StickyActions.svelte';
	import { toast } from 'svelte-sonner';
	import { partySchema } from '$lib/schemas/party';
	import { extractErrors } from '$lib/schemas/shared';
	import { t } from '$lib/t.svelte';

	type Party = {
		_id: string;
		name: string;
		panNumber?: string;
		address?: string;
		phone?: string;
		creditLimit?: number;
		paymentTerms?: string;
		notes?: string;
	};

	let {
		party = undefined,
		onsubmit,
		oncancel,
		inline = false,
		loading = false,
	}: {
		party?: Party;
		onsubmit: (data: {
			name: string;
			panNumber?: string;
			address?: string;
			phone?: string;
			creditLimit?: number;
			paymentTerms?: string;
			notes?: string;
		}) => Promise<void>;
		oncancel?: () => void;
		inline?: boolean;
		loading?: boolean;
	} = $props();

	let name = $state(party?.name ?? '');
	let panNumber = $state(party?.panNumber ?? '');
	let address = $state(party?.address ?? '');
	let phone = $state(party?.phone ?? '');
	let creditLimit = $state(party?.creditLimit?.toString() ?? '');
	let paymentTerms = $state(party?.paymentTerms ?? '');
	let notes = $state(party?.notes ?? '');
	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const result = partySchema.safeParse({
			name: name.trim(),
			panNumber,
			address: address.trim() || undefined,
			phone,
			creditLimit: creditLimit ? Number(creditLimit) : undefined,
			paymentTerms: paymentTerms.trim() || undefined,
			notes: notes.trim() || undefined,
		})
		if (!result.success) {
			errors = extractErrors(result.error.issues)
			toast.error(t('validation_form_errors'))
			return false
		}
		errors = {}
		return true
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!validate()) return;

		submitting = true;
		try {
			await onsubmit({
				name: name.trim(),
				panNumber: panNumber.trim() || undefined,
				address: address.trim() || undefined,
				phone: phone.trim() || undefined,
				creditLimit: creditLimit ? Number(creditLimit) : undefined,
				paymentTerms: paymentTerms.trim() || undefined,
				notes: notes.trim() || undefined,
			});
		} finally {
			submitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			const form = (e.target as HTMLElement).closest('form');
			form?.requestSubmit();
		}
		if (e.key === 'Escape' && oncancel) {
			oncancel();
		}
	}
</script>

<form
	onsubmit={handleSubmit}
	onkeydown={handleKeydown}
	class="space-y-5 {inline ? '' : 'max-w-2xl'}"
>
	<!-- Name -->
	<div class="space-y-1.5">
		<Label for="name" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
			Name <span class="text-red-500">*</span>
		</Label>
		<Input
			id="name"
			bind:value={name}
			placeholder="e.g. ABC Distributors"
			class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {errors.name ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
		/>
		{#if errors.name}
			<p class="mt-1 text-xs text-red-500">{errors.name}</p>
		{/if}
	</div>

	<!-- PAN & Phone row -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="panNumber" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				PAN Number
			</Label>
			<Input
				id="panNumber"
				bind:value={panNumber}
				placeholder="e.g. 123456789"
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {errors.panNumber ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
			/>
			{#if errors.panNumber}
				<p class="mt-1 text-xs text-red-500">{errors.panNumber}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label for="phone" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Phone
			</Label>
			<Input
				id="phone"
				bind:value={phone}
				type="tel"
				placeholder="e.g. 9841234567"
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {errors.phone ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
			/>
			{#if errors.phone}
				<p class="mt-1 text-xs text-red-500">{errors.phone}</p>
			{/if}
		</div>
	</div>

	<!-- Address -->
	<div class="space-y-1.5">
		<Label for="address" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
			Address
		</Label>
		<Input
			id="address"
			bind:value={address}
			placeholder="e.g. Surkhet, Birendranagar"
			class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
		/>
	</div>

	<!-- Credit Limit & Payment Terms row -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="creditLimit" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Credit Limit (NPR)
			</Label>
			<Input
				id="creditLimit"
				bind:value={creditLimit}
				type="number"
				min="0"
				step="100"
				placeholder="e.g. 50000"
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {errors.creditLimit ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
			/>
			{#if errors.creditLimit}
				<p class="mt-1 text-xs text-red-500">{errors.creditLimit}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label for="paymentTerms" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Payment Terms
			</Label>
			<Input
				id="paymentTerms"
				bind:value={paymentTerms}
				placeholder="e.g. Net 30"
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	</div>

	<!-- Notes -->
	{#if !inline}
		<div class="space-y-1.5">
			<Label for="notes" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Notes
			</Label>
			<Textarea
				id="notes"
				bind:value={notes}
				placeholder="Additional notes about this supplier..."
				rows={3}
				class="border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	{/if}

	<!-- Actions -->
	<StickyActions {inline}>
		{#if oncancel}
			<Button type="button" onclick={oncancel}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={submitting || loading}>
			{#if submitting || loading}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
				{t('action_saving')}
			{:else}
				<Save class="mr-1.5 size-4" />
				{party ? t('party_update') : t('party_create_new')}
			{/if}
		</Button>
	</StickyActions>
</form>
