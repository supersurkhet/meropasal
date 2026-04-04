<script lang="ts">
	import { Input } from '$lib/components/ui/input';

	let {
		value = $bindable(0),
		placeholder = '0.00',
		disabled = false,
		class: className = '',
		onuserinput,
		onkeydown,
		onpaste,
		onfocus,
	}: {
		value?: number;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onuserinput?: (value: number) => void;
		onkeydown?: (e: KeyboardEvent) => void;
		onpaste?: (e: ClipboardEvent) => void;
		onfocus?: () => void;
	} = $props();

	let editing = $state(false);
	let displayValue = $state(value ? value.toFixed(2) : '');

	// Sync displayValue when parent changes value externally (not during user editing)
	$effect(() => {
		if (!editing) {
			displayValue = value > 0 ? value.toFixed(2) : '';
		}
	});

	function handleInput(e: Event) {
		editing = true;
		const target = e.target as HTMLInputElement;
		const raw = target.value.replace(/[^0-9.]/g, '');
		displayValue = raw;
		const parsed = parseFloat(raw);
		value = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100) / 100) : 0;
		onuserinput?.(value);
	}

	function handleBlur() {
		editing = false;
		if (value > 0) {
			displayValue = value.toFixed(2);
		} else {
			displayValue = '';
		}
	}
</script>

<div class="relative {className}">
	<span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
		Rs.
	</span>
	<Input
		type="text"
		inputmode="decimal"
		class="pl-7 text-right tabular-nums"
		{placeholder}
		{disabled}
		value={displayValue}
		oninput={handleInput}
		onblur={handleBlur}
		{onkeydown}
		{onpaste}
		onfocus={() => { editing = true; onfocus?.(); }}
	/>
</div>
