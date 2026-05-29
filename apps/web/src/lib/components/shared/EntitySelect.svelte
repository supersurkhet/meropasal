<script lang="ts" generics="T">
	import { onDestroy } from 'svelte'
	import * as Popover from '$lib/components/ui/popover'
	import * as Command from '$lib/components/ui/command'
	import * as Dialog from '$lib/components/ui/dialog'
	import * as AlertDialog from '$lib/components/ui/alert-dialog'
	import { Check, ChevronsUpDown, Plus, Pencil, Trash2, Loader2 } from '@lucide/svelte'
	import { cn } from '$lib/utils'
	import { Button } from '$lib/components/ui/button'
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
		onDelete,
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
		onDelete?: (item: T) => Promise<void>
		itemContent?: Snippet<[{ item: T }]>
	} = $props()

	let open = $state(false)
	let createDialogOpen = $state(false)
	let editDialogOpen = $state(false)
	let editingItem = $state<T | null>(null)
	let deleteDialogOpen = $state(false)
	let deletingItem = $state<T | null>(null)
	let deleteLoading = $state(false)
	let destroyed = false
	let pendingRaf: number | undefined

	onDestroy(() => {
		destroyed = true
		if (pendingRaf) cancelAnimationFrame(pendingRaf)
		createDialogOpen = false
		editDialogOpen = false
		deleteDialogOpen = false
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

	function openDelete(item: T) {
		deletingItem = item
		open = false
		pendingRaf = requestAnimationFrame(() => {
			if (!destroyed) deleteDialogOpen = true
		})
	}

	async function confirmDelete() {
		if (!deletingItem || !onDelete) return
		deleteLoading = true
		try {
			await onDelete(deletingItem)
			if (getKey(deletingItem) === value) {
				value = ''
				onValueChange?.('')
			}
		} finally {
			deleteLoading = false
			deleteDialogOpen = false
			deletingItem = null
		}
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
		class="p-0 min-w-48 flex flex-col"
		style="width: var(--bits-popover-anchor-width, 12rem)"
		align="start"
		sideOffset={4}
	>
		<Command.Root class="flex flex-col overflow-hidden">
			<Command.Input placeholder="Search {entityName}..." />
			<!-- Scrollable list — max height keeps Add New pinned below -->
			<Command.List class="max-h-52 overflow-y-auto">
				<Command.Empty>No {entityName} found.</Command.Empty>
				{#each items as item (getKey(item))}
					<Command.Item
						value={getLabel(item)}
						onSelect={() => handleSelect(getKey(item))}
						class="group/entity pr-1"
					>
						<Check class={cn('size-4 shrink-0', value === getKey(item) ? 'opacity-100' : 'opacity-0')} />
						<span class="flex-1 truncate">
							{#if itemContent}
								{@render itemContent({ item })}
							{:else}
								{getLabel(item)}
							{/if}
						</span>
						<!-- Always-visible action buttons -->
						<span class="ml-auto flex shrink-0 items-center gap-0.5">
							{#if editForm}
								<button
									type="button"
									class="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
									title="Edit"
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
							{#if onDelete}
								<button
									type="button"
									class="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
									title="Delete"
									onpointerdown={(e) => e.stopPropagation()}
									onpointerup={(e) => e.stopPropagation()}
									onclick={(e) => {
										e.stopPropagation()
										e.preventDefault()
										openDelete(item)
									}}
								>
									<Trash2 class="size-3" />
								</button>
							{/if}
						</span>
					</Command.Item>
				{/each}
			</Command.List>
			<!-- Pinned Add New — always visible, never scrolls away -->
			{#if createForm}
				<div class="border-t border-border">
					<button
						type="button"
						class="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
						onclick={openCreate}
					>
						<Plus class="size-4 shrink-0" />
						Add new {entityName.toLowerCase()}
					</button>
				</div>
			{/if}
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

{#if onDelete}
	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete {entityName}?</AlertDialog.Title>
				<AlertDialog.Description>
					{deletingItem ? `"${getLabel(deletingItem)}" will be permanently removed.` : 'This item will be permanently removed.'}
					This action cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel onclick={() => { deleteDialogOpen = false; deletingItem = null }}>
					Cancel
				</AlertDialog.Cancel>
				<AlertDialog.Action
					onclick={confirmDelete}
					disabled={deleteLoading}
					class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				>
					{#if deleteLoading}<Loader2 class="mr-1.5 size-4 animate-spin" />{/if}
					Delete
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
