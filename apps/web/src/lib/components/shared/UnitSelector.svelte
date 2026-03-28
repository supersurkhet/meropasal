<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from '$lib/components/ui/select';
	import { getAvailableUnits, parseUnit } from '$lib/unit-price';

	let {
		unitStr,
		value = $bindable(''),
		disabled = false,
		onValueChange,
	}: {
		unitStr: string | null | undefined;
		value?: string;
		disabled?: boolean;
		onValueChange?: (unit: string) => void;
	} = $props();

	let units = $derived(getAvailableUnits(unitStr));
	let parsed = $derived(parseUnit(unitStr));

	$effect(() => {
		if (!value && units.length > 0) {
			value = units[0];
		}
	});
</script>

{#if units.length <= 1}
	<span class="inline-flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
		{parsed.baseUnit}
	</span>
{:else}
	<Select type="single" bind:value {disabled} onValueChange={onValueChange}>
		<SelectTrigger class="w-24">
			{value || parsed.baseUnit}
		</SelectTrigger>
		<SelectContent>
			{#each units as unit}
				<SelectItem value={unit} label={unit}>
					{unit}
					{#if unit === 'piece' && parsed.piecesPerUnit > 1}
						<span class="ml-1 text-xs text-muted-foreground">(1/{parsed.piecesPerUnit})</span>
					{/if}
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>
{/if}
