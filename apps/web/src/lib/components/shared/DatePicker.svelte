<script lang="ts">
	import { currentLanguage } from '$lib/t.svelte'
	import { Input } from '$lib/components/ui/input'
	import * as Popover from '$lib/components/ui/popover'
	import { Calendar, ChevronLeft, ChevronRight } from '@lucide/svelte'
	import {
		getBsCalendarData,
		bsToAdIso,
		adToBsComponents,
		getTodayBs,
		BS_MONTHS_NE,
		BS_DAYS_SHORT_NE,
		toDevanagari,
		formatDate,
	} from '$lib/date-utils'

	type Props = {
		value?: string
		onchange?: (isoDate: string) => void
		name?: string
		disabled?: boolean
		required?: boolean
		class?: string
		placeholder?: string
	}

	let {
		value = $bindable(''),
		onchange,
		name = '',
		disabled = false,
		required = false,
		class: className = '',
		placeholder = '',
	}: Props = $props()

	let open = $state(false)

	// BS calendar navigation state
	let navYear = $state(0)
	let navMonth = $state(0)

	// Initialize nav to current value or today
	$effect(() => {
		if (currentLanguage.value === 'ne') {
			if (value) {
				try {
					const bs = adToBsComponents(value)
					navYear = bs.year
					navMonth = bs.month
				} catch {
					const today = getTodayBs()
					navYear = today.year
					navMonth = today.month
				}
			} else {
				const today = getTodayBs()
				navYear = today.year
				navMonth = today.month
			}
		}
	})

	let calendarData = $derived(
		currentLanguage.value === 'ne' && navYear > 0
			? getBsCalendarData(navYear, navMonth)
			: null,
	)

	// Selected BS day for highlighting
	let selectedBs = $derived.by(() => {
		if (!value || currentLanguage.value !== 'ne') return null
		try {
			return adToBsComponents(value)
		} catch {
			return null
		}
	})

	let todayBs = $derived(currentLanguage.value === 'ne' ? getTodayBs() : null)

	// Display text for the BS trigger button
	let displayText = $derived.by(() => {
		if (!value) return placeholder || 'मिति छान्नुहोस्'
		return formatDate(value, 'medium')
	})

	function handleAdInput(e: Event) {
		const input = e.target as HTMLInputElement
		value = input.value
		onchange?.(value)
	}

	function selectBsDay(day: number) {
		const iso = bsToAdIso(navYear, navMonth, day)
		value = iso
		onchange?.(iso)
		open = false
	}

	function prevMonth() {
		if (navMonth === 0) {
			navMonth = 11
			navYear -= 1
		} else {
			navMonth -= 1
		}
	}

	function nextMonth() {
		if (navMonth === 11) {
			navMonth = 0
			navYear += 1
		} else {
			navMonth += 1
		}
	}

	function goToday() {
		const today = getTodayBs()
		navYear = today.year
		navMonth = today.month
		selectBsDay(today.day)
	}

	function isSelected(day: number): boolean {
		return (
			selectedBs !== null &&
			selectedBs.year === navYear &&
			selectedBs.month === navMonth &&
			selectedBs.day === day
		)
	}

	function isToday(day: number): boolean {
		return (
			todayBs !== null &&
			todayBs.year === navYear &&
			todayBs.month === navMonth &&
			todayBs.day === day
		)
	}
</script>

{#if currentLanguage.value === 'ne'}
	<!-- Nepali BS Calendar Picker -->
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					{disabled}
					class="inline-flex h-9 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 shadow-xs transition-colors hover:bg-zinc-50 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:border-zinc-500 {className}"
				>
					<Calendar class="size-4 shrink-0 text-zinc-400" />
					<span class={value ? '' : 'text-zinc-400'}>{displayText}</span>
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			{#if calendarData}
				<div class="p-3">
					<!-- Header: month/year navigation -->
					<div class="mb-2 flex items-center justify-between">
						<button
							type="button"
							onclick={prevMonth}
							class="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
							aria-label="Previous month"
						>
							<ChevronLeft class="size-4" />
						</button>
						<span class="text-sm font-semibold">
							{BS_MONTHS_NE[navMonth]} {toDevanagari(navYear)}
						</span>
						<button
							type="button"
							onclick={nextMonth}
							class="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
							aria-label="Next month"
						>
							<ChevronRight class="size-4" />
						</button>
					</div>

					<!-- Day headers -->
					<div class="grid grid-cols-7 gap-0">
						{#each BS_DAYS_SHORT_NE as dayName}
							<div class="flex h-8 items-center justify-center text-xs font-medium text-zinc-400">
								{dayName}
							</div>
						{/each}
					</div>

					<!-- Day grid -->
					<div class="grid grid-cols-7 gap-0">
						<!-- Empty cells for offset -->
						{#each Array(calendarData.firstDayOfWeek) as _}
							<div class="h-8"></div>
						{/each}

						<!-- Day cells -->
						{#each Array(calendarData.daysInMonth) as _, i}
							{@const day = i + 1}
							<button
								type="button"
								onclick={() => selectBsDay(day)}
								class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors
									{isSelected(day)
										? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
										: isToday(day)
											? 'bg-zinc-100 font-semibold dark:bg-zinc-800'
											: 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
							>
								{toDevanagari(day)}
							</button>
						{/each}
					</div>

					<!-- Today button -->
					<div class="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
						<button
							type="button"
							onclick={goToday}
							class="w-full rounded-md px-2 py-1 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						>
							आज
						</button>
					</div>
				</div>
			{/if}
		</Popover.Content>
	</Popover.Root>
	{#if name}
		<input type="hidden" {name} value={value} />
	{/if}
{:else}
	<!-- English AD native date input -->
	<Input
		type="date"
		{name}
		{disabled}
		{required}
		value={value}
		oninput={handleAdInput}
		class={className}
		{placeholder}
	/>
{/if}
