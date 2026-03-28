<script lang="ts" generics="T">
	import { onDestroy } from 'svelte'
	import * as Select from '$lib/components/ui/select'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Plus, Pencil } from '@lucide/svelte'
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

	let selectOpen = $state(false)
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

	function openCreate() {
		selectOpen = false
		// Delay to avoid portal/focus conflicts
		pendingRaf = requestAnimationFrame(() => {
			if (!destroyed) createDialogOpen = true
		})
	}

	function openEdit(item: T) {
		editingItem = item
		selectOpen = false
		pendingRaf = requestAnimationFrame(() => {
			if (!destroyed) editDialogOpen = true
		})
	}

	function handleCreated(id: string) {
		createDialogOpen = false
		value = id
		onValueChange?.(id)
	}

	function closeCreate() {
		createDialogOpen = false
	}

	function closeEdit() {
		editDialogOpen = false
		editingItem = null as any
	}

	let displayItem = $derived(items.find((i) => getKey(i) === value))
</script>

<Select.Root
	type="single"
	bind:value
	bind:open={selectOpen}
	onValueChange={onValueChange}
>
	<Select.Trigger class="{small ? 'h-8 text-sm' : ''} flex-1 {triggerClass}">
		{displayItem ? getLabel(displayItem) : placeholder}
	</Select.Trigger>
	<Select.Content>
		{#each items as item (getKey(item))}
			<Select.Item value={getKey(item)} label={getLabel(item)} class="group/entity">
				<div class="flex w-full items-center">
					{#if itemContent}
						<span class="flex-1 truncate">
							{@render itemContent({ item })}
						</span>
					{:else}
						<span class="flex-1 truncate">{getLabel(item)}</span>
					{/if}
					{#if editForm}
						<button
							type="button"
							class="ml-2 shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-700 group-hover/entity:opacity-100 group-data-[highlighted]/entity:opacity-100 dark:hover:text-zinc-300"
							onpointerdown={(e) => e.stopPropagation()}
							onpointerup={(e) => e.stopPropagation()}
							onclick={(e) => {
								e.stopPropagation()
								e.preventDefault()
								openEdit(item)
							}}
						>
							<Pencil class="size-3 !pointer-events-auto" />
						</button>
					{/if}
				</div>
			</Select.Item>
		{/each}
		{#if createForm}
			<Select.Separator />
			<button
				type="button"
				class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent cursor-default"
				onpointerdown={(e) => e.stopPropagation()}
				onclick={(e) => {
					e.stopPropagation()
					e.preventDefault()
					openCreate()
				}}
			>
				<Plus class="size-3.5 !pointer-events-auto" />
				Add new {entityName.toLowerCase()}
			</button>
		{/if}
	</Select.Content>
</Select.Root>

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
	<Dialog.Root bind:open={editDialogOpen} onOpenChange={(open) => { if (!open) { editingItem = null as any } }}>
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
