<script lang="ts">
	import NepaliDate from 'nepali-datetime';

	type Props = {
		value?: string;
		onchange?: (isoDate: string) => void;
		name?: string;
		disabled?: boolean;
		required?: boolean;
	};

	let { value = $bindable(''), onchange, name = '', disabled = false, required = false }: Props = $props();

	let mode = $state<'AD' | 'BS'>('AD');

	// Display value derived from the internal ISO string
	let displayValue = $derived.by(() => {
		if (!value) return '';
		if (mode === 'AD') return value;
		try {
			const adDate = new Date(value);
			const npDate = new NepaliDate(adDate);
			return npDate.format('YYYY-MM-DD');
		} catch {
			return value;
		}
	});

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value;

		if (mode === 'AD') {
			value = raw;
		} else {
			// Convert BS date string to AD ISO string
			try {
				const npDate = new NepaliDate(raw);
				const adDate = npDate.getDateObject();
				value = adDate.toISOString().split('T')[0];
			} catch {
				// If parsing fails, store raw value
				value = raw;
			}
		}

		onchange?.(value);
	}

	function toggleMode() {
		mode = mode === 'AD' ? 'BS' : 'AD';
	}
</script>

<div class="flex items-center gap-2">
	{#if mode === 'AD'}
		<input
			type="date"
			{name}
			{disabled}
			{required}
			value={displayValue}
			oninput={handleInput}
			class="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
		/>
	{:else}
		<input
			type="text"
			{name}
			{disabled}
			{required}
			value={displayValue}
			placeholder="YYYY-MM-DD (BS)"
			oninput={handleInput}
			class="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
		/>
	{/if}

	<button
		type="button"
		onclick={toggleMode}
		class="shrink-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
		aria-label="Toggle between AD and BS date format"
	>
		{mode}
	</button>
</div>
