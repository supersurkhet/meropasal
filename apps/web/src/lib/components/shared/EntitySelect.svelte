<script lang="ts" generics="T">
	import { onDestroy } from 'svelte'
	import * as Popover from '$lib/components/ui/popover'
	import * as Command from '$lib/components/ui/command'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Check, ChevronsUpDown, Plus, Pencil } from '@lucide/svelte'
	import { cn } from '$lib/utils'
	import type { Snippet } from 'svelte'

	let {
		value = $bindable(''),
		onValueChange,
		items,
		getKey,
		getLabel,
		placeholder = 'Select...',
		entityName = 'item',
		createTitle,
		editTitle,
		triggerClass = '',
		small = false,
		createForm,
		editForm,
		itemContent,
	}: {
		value?: string
		onValueChange?: (value: string) => void
		items: T[]
		getKey: (item: T) => string
		getLabel: (item: T) => string
		placeholder?: string
		entityName?: string
		createTitle?: string
		editTitle?: string
		triggerClass?: string
		small?: boolean
		createForm?: Snippet<[{ close: () => void; onCreated: (id: string) => void }]>
		editForm?: Snippet<[{ item: T; close: () => void }]>
		itemContent?: Snippet<[{ item: T }]>
	} = $props()

	let open = $state(false)
	let createDialogOpen = $state(false)
	let editDialogOpen = $state(false)
	let editingItem = $state<T | null>(null)
	let destroyed = false
	let pendingRaf: number | undefined

	onDestroy(() => {
		destroyed = true
		if (pendingRaf) cancelAnimationFrame(pendingRaf)
		createDialogOpen = false
		editDialogOpen = false
	})

	function handleSelect(key: string) {
		open = false
		value = key
		onValueChange?.(key)
	}

	function openCreate() {
		open = false
		pendingRaf = requestAnimationFrame(() => {
			if (!destroyed) createDialogOpen = true
		})
	}

	function openEdit(item: T) {
		editingItem = item
		open = false
		pendingRaf = requestAnimationFrame(() => {
			if (!destroyed) editDialogOpen = true
		})
	}

	function handleCreated(id: string) {
		createDialogOpen = false
		value = id
		onValueChange?.(id)
	}

	function closeCreate() { createDialogOpen = false }
	function closeEdit() {
		editDialogOpen = false
		editingItem = null as unknown as T
	}

	let displayItem = $derived(items.find((i) => getKey(i) === value))
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			'border-input dark:border-zinc-800 focus-visible:border-ring focus-visible:ring-ring/50 dark:hover:bg-accent/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 text-sm whitespace-nowrap shadow-xs dark:shadow-none transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px]',
			small ? 'h-8' : 'h-9',
			!displayItem && 'text-muted-foreground',
			triggerClass
		)}
	>
		<span class="flex-1 truncate text-left">
			{displayItem ? getLabel(displayItem) : placeholder}
		</span>
		<ChevronsUpDown class="size-4 shrink-0 opacity-50" />
	</Popover.Trigger>
	<Popover.Content
		class="p-0 min-w-48"
		style="width: var(--bits-popover-anchor-width, 12rem)"
		align="start"
		sideOffset={4}
	>
		<Command.Root>
			<Command.Input placeholder="Search {entityName}..." />
			<Command.List>
				<Command.Empty>No {entityName} found.</Command.Empty>
				{#each items as item (getKey(item))}
					<Command.Item
						value={getLabel(item)}
						onSelect={() => handleSelect(getKey(item))}
						class="group/entity"
					>
						<Check class={cn('size-4 shrink-0', value === getKey(item) ? 'opacity-100' : 'opacity-0')} />
						<span class="flex-1 truncate">
							{#if itemContent}
								{@render itemContent({ item })}
							{:else}
								{getLabel(item)}
							{/if}
						</span>
						{#if editForm}
							<button
								type="button"
								class="ml-auto shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-700 group-hover/entity:opacity-100 dark:hover:text-zinc-300"
								onpointerdown={(e) => e.stopPropagation()}
								onpointerup={(e) => e.stopPropagation()}
								onclick={(e) => {
									e.stopPropagation()
									e.preventDefault()
									openEdit(item)
								}}
							>
								<Pencil class="size-3" />
							</button>
						{/if}
					</Command.Item>
				{/each}
				{#if createForm}
					<Command.Separator />
					<Command.Item onSelect={openCreate} class="text-primary gap-2">
						<Plus class="size-4" />
						Add new {entityName.toLowerCase()}
					</Command.Item>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

{#if createForm}
	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>{createTitle ?? `New ${entityName}`}</Dialog.Title>
			</Dialog.Header>
			<div class="p-1">
				{@render createForm({ close: closeCreate, onCreated: handleCreated })}
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}

{#if editForm && editingItem}
	<Dialog.Root bind:open={editDialogOpen} onOpenChange={(o) => { if (!o) editingItem = null as unknown as T }}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>{editTitle ?? `Edit ${entityName}`}</Dialog.Title>
			</Dialog.Header>
			<div class="p-1">
				{@render editForm({ item: editingItem, close: closeEdit })}
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
