<script lang="ts">
	import { goto } from '$app/navigation'
	import { getConvexClient } from '$lib/convex'
	import { api } from '$lib/api'
	import { t } from '$lib/t.svelte'
	import * as Command from '$lib/components/ui/command'
	import {
		LayoutDashboard,
		Package,
		Users,
		Truck,
		FileText,
		BookOpen,
		ShoppingCart,
		ClipboardList,
		ArrowDownToLine,
		Receipt,
		Route,
		BarChart3,
		Settings,
		Plus,
		Search,
	} from '@lucide/svelte'
	import type { Component } from 'svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()

	let searchTerm = $state('')
	let debouncedTerm = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined

	type SearchResult = {
		type: 'product' | 'customer' | 'party' | 'invoice' | 'vehicle'
		id: string
		label: string
		subtitle: string | null
	}

	let searchResults = $state<SearchResult[]>([])
	let isSearching = $state(false)

	const navItems: { label: () => string, href: string, icon: Component }[] = [
		{ label: () => t('nav_dashboard'), href: '/dashboard', icon: LayoutDashboard },
		{ label: () => t('nav_products'), href: '/products', icon: Package },
		{ label: () => t('nav_customers'), href: '/customers', icon: Users },
		{ label: () => t('nav_parties'), href: '/parties', icon: Truck },
		{ label: () => t('nav_sales'), href: '/sales', icon: ShoppingCart },
		{ label: () => t('nav_orders'), href: '/orders', icon: ClipboardList },
		{ label: () => t('nav_stock_import'), href: '/stock-import', icon: ArrowDownToLine },
		{ label: () => t('nav_stock_book'), href: '/stock-book', icon: BookOpen },
		{ label: () => t('nav_invoices'), href: '/invoices', icon: FileText },
		{ label: () => t('nav_vehicles'), href: '/vehicles', icon: Truck },
		{ label: () => t('nav_trips'), href: '/trips', icon: Route },
		{ label: () => t('nav_ledger'), href: '/ledger', icon: Receipt },
		{ label: () => t('nav_reports'), href: '/reports', icon: BarChart3 },
		{ label: () => t('nav_settings'), href: '/settings', icon: Settings },
	]

	const actionItems: { label: () => string, href: string, icon: Component }[] = [
		{ label: () => t('sale_create'), href: '/sales/new', icon: Plus },
		{ label: () => t('order_create'), href: '/orders/new', icon: Plus },
		{ label: () => t('stock_import_create'), href: '/stock-import/new', icon: Plus },
	]

	const typeIcons: Record<SearchResult['type'], Component> = {
		product: Package,
		customer: Users,
		party: Truck,
		invoice: FileText,
		vehicle: Truck,
	}

	const typeLabels: Record<SearchResult['type'], () => string> = {
		product: () => t('product_title'),
		customer: () => t('customer_title'),
		party: () => t('party_title'),
		invoice: () => t('invoice_title'),
		vehicle: () => t('vehicle_title'),
	}

	const typeRoutes: Record<SearchResult['type'], string> = {
		product: '/products',
		customer: '/customers',
		party: '/parties',
		invoice: '/invoices',
		vehicle: '/vehicles',
	}

	$effect(() => {
		if (debounceTimer) clearTimeout(debounceTimer)
		const term = searchTerm
		if (!term.trim()) {
			debouncedTerm = ''
			searchResults = []
			isSearching = false
			return
		}
		isSearching = true
		debounceTimer = setTimeout(() => {
			debouncedTerm = term
		}, 300)
		return () => {
			if (debounceTimer) clearTimeout(debounceTimer)
		}
	})

	$effect(() => {
		const term = debouncedTerm
		if (!term.trim()) {
			searchResults = []
			isSearching = false
			return
		}
		const client = getConvexClient()
		client
			.query(api.functions.globalSearch.search, { searchTerm: term })
			.then((results: SearchResult[]) => {
				searchResults = results
				isSearching = false
			})
			.catch(() => {
				isSearching = false
			})
	})

	function navigate(href: string) {
		open = false
		searchTerm = ''
		searchResults = []
		goto(href)
	}
</script>

<Command.Dialog bind:open>
	<Command.Input
		placeholder="{t('action_search')}..."
		oninput={(e: Event) => {
			searchTerm = (e.target as HTMLInputElement).value
		}}
	/>
	<Command.List>
		<Command.Empty>{t('common_no_results')}</Command.Empty>

		{#if searchResults.length > 0}
			<Command.Group heading={t('action_search')}>
				{#each searchResults as result (result.id)}
					<Command.Item
						value="{result.type}:{result.label}"
						onSelect={() => navigate(`${typeRoutes[result.type]}/${result.id}`)}
					>
						{@const Icon = typeIcons[result.type]}
						<Icon class="size-4" />
						<span class="flex-1">{result.label}</span>
						{#if result.subtitle}
							<span class="text-muted-foreground text-xs">{result.subtitle}</span>
						{/if}
						<span class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
							{typeLabels[result.type]()}
						</span>
					</Command.Item>
				{/each}
			</Command.Group>
			<Command.Separator />
		{/if}

		{#if isSearching}
			<Command.Loading>{t('common_loading')}</Command.Loading>
		{/if}

		<Command.Group heading={t('nav_dashboard')}>
			{#each navItems as item (item.href)}
				<Command.Item
					value={item.label()}
					onSelect={() => navigate(item.href)}
				>
					{@const Icon = item.icon}
					<Icon class="size-4" />
					<span>{item.label()}</span>
				</Command.Item>
			{/each}
		</Command.Group>

		<Command.Separator />

		<Command.Group heading={t('action_create')}>
			{#each actionItems as item (item.href)}
				<Command.Item
					value={item.label()}
					onSelect={() => navigate(item.href)}
				>
					{@const Icon = item.icon}
					<Icon class="size-4" />
					<span>{item.label()}</span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
