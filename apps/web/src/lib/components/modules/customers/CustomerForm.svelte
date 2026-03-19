<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader2, Save, ArrowLeft } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';

	type Customer = {
		_id: string;
		name: string;
		panNumber?: string;
		address?: string;
		phone?: string;
		email?: string;
		creditLimit?: number;
		notes?: string;
	};

	let {
		customer = undefined,
		onsubmit,
		oncancel,
		inline = false,
		loading = false,
	}: {
		customer?: Customer;
		onsubmit: (data: {
			name: string;
			panNumber?: string;
			address?: string;
			phone?: string;
			email?: string;
			creditLimit?: number;
			notes?: string;
		}) => Promise<void>;
		oncancel?: () => void;
		inline?: boolean;
		loading?: boolean;
	} = $props();

	let name = $state(customer?.name ?? '');
	let panNumber = $state(customer?.panNumber ?? '');
	let address = $state(customer?.address ?? '');
	let phone = $state(customer?.phone ?? '');
	let email = $state(customer?.email ?? '');
	let creditLimit = $state(customer?.creditLimit?.toString() ?? '');
	let notes = $state(customer?.notes ?? '');
	let submitting = $state(false);
	let nameError = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		nameError = '';

		if (!name.trim()) {
			nameError = t('customer_name_required');
			return;
		}

		submitting = true;
		try {
			await onsubmit({
				name: name.trim(),
				panNumber: panNumber.trim() || undefined,
				address: address.trim() || undefined,
				phone: phone.trim() || undefined,
				email: email.trim() || undefined,
				creditLimit: creditLimit ? Number(creditLimit) : undefined,
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
			placeholder="e.g. Ram Grocery"
			class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {nameError ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
		/>
		{#if nameError}
			<p class="mt-1 text-xs text-red-500">{nameError}</p>
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
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
			/>
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
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	</div>

	<!-- Email & Address row -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="email" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Email
			</Label>
			<Input
				id="email"
				bind:value={email}
				type="email"
				placeholder="e.g. ram@example.com"
				class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>

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
	</div>

	<!-- Credit Limit -->
	<div class="max-w-xs space-y-1.5">
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
			class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
		/>
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
				placeholder="Additional notes about this customer..."
				rows={3}
				class="border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex items-center gap-3 pt-2 {inline ? 'justify-end' : ''}">
		{#if oncancel}
			<Button
				type="button"
				variant="ghost"
				onclick={oncancel}
				class="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
			>
				{#if !inline}<ArrowLeft class="mr-1.5 size-4" />{/if}
				Cancel
			</Button>
		{/if}
		<Button
			type="submit"
			disabled={submitting || loading}
			class="min-w-[120px] bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			{#if submitting || loading}
				<Loader2 class="mr-1.5 size-4 animate-spin" />
				{t('action_saving')}
			{:else}
				<Save class="mr-1.5 size-4" />
				{customer ? t('customer_update') : t('customer_create_new')}
			{/if}
		</Button>
	</div>
</form>
