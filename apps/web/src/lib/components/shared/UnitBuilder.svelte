<script lang="ts">
	import * as Select from '$lib/components/ui/select'
	import { Input } from '$lib/components/ui/input'
	import { parseUnit } from '$lib/unit-price'

	let {
		value = $bindable(''),
	}: {
		value?: string
	} = $props()

	const baseUnits = ['piece', 'box', 'kg', 'liter', 'pack', 'dozen', 'bag'] as const
	const compoundUnits = ['box', 'pack', 'dozen', 'bag'] as const

	const initial = parseUnit(value)
	let baseUnit = $state(initial.baseUnit || 'piece')
	let piecesPerUnit = $state(initial.piecesPerUnit > 1 ? initial.piecesPerUnit : 12)

	let isCompound = $derived(
		(compoundUnits as readonly string[]).includes(baseUnit)
	)

	$effect(() => {
		const parsed = parseUnit(value)
		const nextBaseUnit = parsed.baseUnit || 'piece'
		const nextPiecesPerUnit = parsed.piecesPerUnit > 1 ? parsed.piecesPerUnit : piecesPerUnit

		if (baseUnit !== nextBaseUnit) {
			baseUnit = nextBaseUnit
		}
		if (parsed.piecesPerUnit > 1 && piecesPerUnit !== nextPiecesPerUnit) {
			piecesPerUnit = nextPiecesPerUnit
		}
	})

	// Build the output string
	function updateValue() {
		if (isCompound && piecesPerUnit > 1) {
			value = `${baseUnit}:${piecesPerUnit}`
		} else {
			value = baseUnit
		}
	}

	function onBaseUnitChange(unit: string) {
		baseUnit = unit
		updateValue()
	}

	function onPiecesChange(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value)
		if (Number.isFinite(val) && val > 0) {
			piecesPerUnit = val
		}
		updateValue()
	}
</script>

<div class="flex items-center gap-2">
	<Select.Root type="single" value={baseUnit} onValueChange={onBaseUnitChange}>
		<Select.Trigger class="w-28">
			<span class="capitalize">{baseUnit}</span>
		</Select.Trigger>
		<Select.Content>
			{#each baseUnits as unit}
				<Select.Item value={unit} label={unit}>
					<span class="capitalize">{unit}</span>
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	{#if isCompound}
		<div class="flex items-center gap-1.5">
			<span class="text-xs text-zinc-500 whitespace-nowrap">of</span>
			<Input
				type="number"
				min="1"
				class="h-9 w-16 text-center font-mono text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				value={String(piecesPerUnit)}
				oninput={onPiecesChange}
			/>
			<span class="text-xs text-zinc-500 whitespace-nowrap">pcs</span>
		</div>
	{/if}
</div>

{#if isCompound && piecesPerUnit > 1}
	<p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
		1 {baseUnit} = {piecesPerUnit} pieces
	</p>
{/if}
