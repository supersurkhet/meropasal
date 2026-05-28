<script lang="ts">
	import * as Popover from '$lib/components/ui/popover'
	import * as Command from '$lib/components/ui/command'
	import { Check, ChevronsUpDown } from '@lucide/svelte'
	import { cn } from '$lib/utils'

	let {
		value = $bindable(''),
		onValueChange,
		items,
		placeholder = 'Select...',
		class: className = '',
		disabled = false,
		size = 'default',
	}: {
		value?: string
		onValueChange?: (value: string) => void
		items: { value: string; label: string }[]
		placeholder?: string
		class?: string
		disabled?: boolean
		size?: 'default' | 'sm'
	} = $props()

	let open = $state(false)

	let displayLabel = $derived(items.find((i) => i.value === value)?.label ?? '')

	function handleSelect(v: string) {
		open = false
		value = v
		onValueChange?.(v)
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		{disabled}
		class={cn(
			'border-input dark:border-zinc-800 focus-visible:border-ring focus-visible:ring-ring/50 dark:hover:bg-accent/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 text-sm whitespace-nowrap shadow-xs dark:shadow-none transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
			size === 'sm' ? 'h-8' : 'h-9',
			!displayLabel && 'text-muted-foreground',
			className
		)}
	>
		<span class="flex-1 truncate text-left">{displayLabel || placeholder}</span>
		<ChevronsUpDown class="size-4 shrink-0 opacity-50" />
	</Popover.Trigger>
	<Popover.Content
		class="p-0 min-w-32"
		style="width: var(--bits-popover-anchor-width, 10rem)"
		align="start"
		sideOffset={4}
	>
		<Command.Root>
			<Command.Input placeholder="Search..." />
			<Command.List>
				<Command.Empty>No results.</Command.Empty>
				{#each items as item (item.value)}
					<Command.Item value={item.label} onSelect={() => handleSelect(item.value)}>
						<Check class={cn('size-4 shrink-0', value === item.value ? 'opacity-100' : 'opacity-0')} />
						{item.label}
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
