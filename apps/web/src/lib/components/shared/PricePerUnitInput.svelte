<script lang="ts">
	import { Input } from '$lib/components/ui/input'
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from '$lib/components/ui/select'
	import { getAvailableUnits, parseUnit } from '$lib/unit-price'

	let {
		value = $bindable(0),
		unitStr = '',
		placeholder = '0.00',
		disabled = false,
		class: className = '',
		onuserinput,
	}: {
		value?: number
		unitStr?: string
		placeholder?: string
		disabled?: boolean
		class?: string
		onuserinput?: (value: number) => void
	} = $props()

	let editing = $state(false)
	let displayValue = $state(value ? value.toFixed(2) : '')
	let selectedUnit = $state('')

	let parsed = $derived(parseUnit(unitStr))
	let units = $derived(getAvailableUnits(unitStr))
	let isCompound = $derived(units.length > 1)

	// Default to base unit; reset when unit string changes
	$effect(() => {
		selectedUnit = units.length > 0 ? units[0] : ''
	})

	// The display value represents what the user sees (may be per-piece)
	// The bound `value` is always the base unit price (per box)

	// When value changes externally, update display
	$effect(() => {
		if (!editing) {
			const displayPrice = toDisplayPrice(value)
			displayValue = displayPrice > 0 ? displayPrice.toFixed(2) : ''
		}
	})

	function toDisplayPrice(basePrice: number): number {
		if (!isCompound || selectedUnit === parsed.baseUnit || !selectedUnit) {
			return basePrice
		}
		// Show per-piece price
		return parsed.piecesPerUnit > 0
			? Math.round((basePrice / parsed.piecesPerUnit) * 100) / 100
			: basePrice
	}

	function toBasePrice(displayPrice: number): number {
		if (!isCompound || selectedUnit === parsed.baseUnit || !selectedUnit) {
			return displayPrice
		}
		// Convert per-piece to per-box
		return Math.round(displayPrice * parsed.piecesPerUnit * 100) / 100
	}

	function handleInput(e: Event) {
		editing = true
		const target = e.target as HTMLInputElement
		const raw = target.value.replace(/[^0-9.]/g, '')
		displayValue = raw
		const displayParsed = parseFloat(raw)
		const displayNum = Number.isFinite(displayParsed) ? Math.max(0, Math.round(displayParsed * 100) / 100) : 0
		value = toBasePrice(displayNum)
		onuserinput?.(value)
	}

	function handleBlur() {
		editing = false
		const displayPrice = toDisplayPrice(value)
		displayValue = displayPrice > 0 ? displayPrice.toFixed(2) : ''
	}

	function handleUnitChange(unit: string) {
		selectedUnit = unit
		// Recalculate display from the stored base price
		const displayPrice = toDisplayPrice(value)
		displayValue = displayPrice > 0 ? displayPrice.toFixed(2) : ''
	}
</script>

<div class="relative {className}">
	<span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
		Rs.
	</span>
	<Input
		type="text"
		inputmode="decimal"
		class="{isCompound ? 'pl-7 pr-[5.5rem] tabular-nums' : 'pl-7 tabular-nums'}"
		{placeholder}
		{disabled}
		value={displayValue}
		oninput={handleInput}
		onblur={handleBlur}
		onfocus={() => { editing = true }}
	/>
	{#if isCompound}
		<div class="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
			<span class="text-xs text-muted-foreground">per</span>
			<Select type="single" value={selectedUnit} onValueChange={handleUnitChange}>
				<SelectTrigger class="h-7 w-[3.5rem] border-0 bg-transparent text-xs shadow-none focus:ring-0 px-1">
					<span class="capitalize">{selectedUnit}</span>
				</SelectTrigger>
				<SelectContent>
					{#each units as unit}
						<SelectItem value={unit} label={unit}>
							<span class="capitalize">{unit}</span>
							{#if unit === 'piece' && parsed.piecesPerUnit > 1}
								<span class="ml-1 text-xs text-muted-foreground">(1/{parsed.piecesPerUnit})</span>
							{/if}
						</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>
	{/if}
</div>
