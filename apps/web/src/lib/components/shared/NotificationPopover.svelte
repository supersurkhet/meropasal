<script lang="ts">
	import { goto } from '$app/navigation'
	import { getConvexClient } from '$lib/convex'
	import { api } from '$lib/api'
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte'
	import { t } from '$lib/t.svelte'
	import * as Popover from '$lib/components/ui/popover'
	import { Button } from '$lib/components/ui/button'
	import {
		Bell,
		PackageX,
		ShoppingCart,
		AlertCircle,
		Info,
		CheckCheck,
		Inbox,
	} from '@lucide/svelte'

	const client = getConvexClient()

	const notifications = useConvexQuery(client, api.functions.notifications.list, () => ({}))
	const unreadCount = useConvexQuery(client, api.functions.notifications.unreadCount, () => ({}))
	const markReadMutation = useConvexMutation(client, api.functions.notifications.markRead)
	const markAllReadMutation = useConvexMutation(client, api.functions.notifications.markAllRead)

	let open = $state(false)

	const count = $derived(unreadCount.data ?? 0)

	function getIcon(type: string) {
		switch (type) {
			case 'low_stock':
				return PackageX
			case 'order_status':
				return ShoppingCart
			case 'payment_due':
				return AlertCircle
			default:
				return Info
		}
	}

	function getIconColor(type: string) {
		switch (type) {
			case 'low_stock':
				return 'text-orange-500'
			case 'order_status':
				return 'text-blue-500'
			case 'payment_due':
				return 'text-red-500'
			default:
				return 'text-zinc-500'
		}
	}

	function getRoute(notification: { type: string; entityType?: string; entityId?: string }) {
		if (notification.entityType === 'products') return '/products'
		if (notification.entityType === 'invoices' && notification.entityId)
			return `/invoices/${notification.entityId}`
		if (notification.entityType === 'orders') return '/orders'
		return null
	}

	function relativeTime(isoDate: string): string {
		const now = Date.now()
		const then = new Date(isoDate).getTime()
		const diffSec = Math.floor((now - then) / 1000)
		if (diffSec < 60) return 'just now'
		const diffMin = Math.floor(diffSec / 60)
		if (diffMin < 60) return `${diffMin}m ago`
		const diffHr = Math.floor(diffMin / 60)
		if (diffHr < 24) return `${diffHr}h ago`
		const diffDay = Math.floor(diffHr / 24)
		return `${diffDay}d ago`
	}

	async function handleClick(notification: { _id: string; isRead: boolean; type: string; entityType?: string; entityId?: string }) {
		if (!notification.isRead) {
			await markReadMutation.mutate({ id: notification._id as any })
		}
		const route = getRoute(notification)
		if (route) {
			open = false
			goto(route)
		}
	}

	async function handleMarkAllRead() {
		await markAllReadMutation.mutate({} as any)
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon"
				class="relative size-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
				aria-label={t('a11y_notifications')}
				{...props}
			>
				<Bell class="size-4" />
				{#if count > 0}
					<span class="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
						{count > 9 ? '9+' : count}
					</span>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			class="w-80 rounded-lg border border-zinc-200 bg-white p-0 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
			align="end"
			sideOffset={8}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
				<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					{t('a11y_notifications')}
				</h3>
				{#if count > 0}
					<button
						class="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						onclick={handleMarkAllRead}
					>
						<CheckCheck class="size-3.5" />
						Mark all read
					</button>
				{/if}
			</div>

			<!-- Notification list -->
			<div class="max-h-80 overflow-y-auto">
				{#if notifications.isLoading}
					<div class="flex items-center justify-center py-8">
						<span class="text-sm text-zinc-400">{t('common_loading')}</span>
					</div>
				{:else if !notifications.data?.length}
					<div class="flex flex-col items-center justify-center py-8">
						<Inbox class="mb-2 size-8 text-zinc-300 dark:text-zinc-600" />
						<span class="text-sm text-zinc-400 dark:text-zinc-500">No notifications</span>
					</div>
				{:else}
					{#each notifications.data as notification (notification._id)}
						{@const Icon = getIcon(notification.type)}
						{@const iconColor = getIconColor(notification.type)}
						<button
							class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 {notification.isRead ? 'opacity-60' : ''}"
							onclick={() => handleClick(notification)}
						>
							<div class="mt-0.5 shrink-0">
								<Icon class="size-4 {iconColor}" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 {notification.isRead ? 'font-normal' : ''}">
									{notification.title}
								</p>
								<p class="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
									{notification.message}
								</p>
								<p class="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
									{relativeTime(notification.createdAt)}
								</p>
							</div>
							{#if !notification.isRead}
								<div class="mt-2 shrink-0">
									<span class="size-2 rounded-full bg-blue-500 block"></span>
								</div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
