<script lang="ts">
	import { Input } from '$lib/components/ui/input';

	let {
		value = $bindable(0),
		placeholder = '0.00',
		disabled = false,
		class: className = '',
	}: {
		value?: number;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	let displayValue = $state(value ? String(value) : '');

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const raw = target.value.replace(/[^0-9.]/g, '');
		displayValue = raw;
		const parsed = parseFloat(raw);
		value = Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
	}

	function handleBlur() {
		if (value > 0) {
			displayValue = value.toFixed(2);
		} else {
			displayValue = '';
		}
	}

	$effect(() => {
		if (value > 0 && displayValue === '') {
			displayValue = value.toFixed(2);
		}
	});
</script>

<div class="relative {className}">
	<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
		Rs.
	</span>
	<Input
		type="text"
		inputmode="decimal"
		class="pl-9 text-right tabular-nums"
		{placeholder}
		{disabled}
		value={displayValue}
		oninput={handleInput}
		onblur={handleBlur}
	/>
</div>
