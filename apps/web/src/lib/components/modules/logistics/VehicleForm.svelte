<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader2, Save, ArrowLeft } from '@lucide/svelte';

	type Vehicle = {
		_id: string;
		name: string;
		licensePlate: string;
		description?: string;
	};

	let {
		vehicle = undefined,
		onsubmit,
		oncancel,
		inline = false,
		loading = false,
	}: {
		vehicle?: Vehicle;
		onsubmit: (data: {
			name: string;
			licensePlate: string;
			description?: string;
		}) => Promise<void>;
		oncancel?: () => void;
		inline?: boolean;
		loading?: boolean;
	} = $props();

	let name = $state(vehicle?.name ?? '');
	let licensePlate = $state(vehicle?.licensePlate ?? '');
	let description = $state(vehicle?.description ?? '');
	let submitting = $state(false);
	let nameError = $state('');
	let plateError = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		nameError = '';
		plateError = '';

		if (!name.trim()) {
			nameError = 'Vehicle name is required';
			return;
		}
		if (!licensePlate.trim()) {
			plateError = 'License plate is required';
			return;
		}

		submitting = true;
		try {
			await onsubmit({
				name: name.trim(),
				licensePlate: licensePlate.trim(),
				description: description.trim() || undefined,
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
		<Label for="vehicle-name" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
			Name <span class="text-red-500">*</span>
		</Label>
		<Input
			id="vehicle-name"
			bind:value={name}
			placeholder="e.g. Delivery Truck"
			class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {nameError ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
		/>
		{#if nameError}
			<p class="text-xs text-red-500">{nameError}</p>
		{/if}
	</div>

	<!-- License Plate -->
	<div class="space-y-1.5">
		<Label for="license-plate" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
			License Plate <span class="text-red-500">*</span>
		</Label>
		<Input
			id="license-plate"
			bind:value={licensePlate}
			placeholder="e.g. Ba 1 Kha 1234"
			class="h-10 border-zinc-200 bg-white shadow-sm transition-shadow focus:shadow-md dark:border-zinc-700 dark:bg-zinc-900 {plateError ? 'border-red-400 ring-1 ring-red-400/30' : ''}"
		/>
		{#if plateError}
			<p class="text-xs text-red-500">{plateError}</p>
		{/if}
	</div>

	<!-- Description -->
	{#if !inline}
		<div class="space-y-1.5">
			<Label for="vehicle-desc" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Description
			</Label>
			<Textarea
				id="vehicle-desc"
				bind:value={description}
				placeholder="Additional details about this vehicle..."
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
				Saving...
			{:else}
				<Save class="mr-1.5 size-4" />
				{vehicle ? 'Update Vehicle' : 'Create Vehicle'}
			{/if}
		</Button>
	</div>
</form>
