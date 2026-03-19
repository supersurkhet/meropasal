<script lang="ts">
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		Users,
		UserRound,
		Package,
		PackageOpen,
		ShoppingCart,
		ClipboardList,
		FileText,
		BookOpen,
		Landmark,
		Truck,
		Car,
		BarChart3,
		Settings,
		ChevronLeft,
		Store,
		MapPin,
		LogOut,
		ChevronsUpDown,
		Check,
		Loader2,
	} from '@lucide/svelte';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
		TooltipProvider,
	} from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t } from '$lib/t.svelte';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';

	type NavItem = {
		labelKey: string;
		href: string;
		icon: typeof LayoutDashboard;
	};

	type NavGroup = {
		titleKey: string;
		items: NavItem[];
	};

	const navGroups: NavGroup[] = [
		{
			titleKey: 'nav_dashboard',
			items: [
				{ labelKey: 'nav_dashboard', href: '/dashboard', icon: LayoutDashboard },
			],
		},
		{
			titleKey: 'nav_parties',
			items: [
				{ labelKey: 'nav_parties', href: '/parties', icon: Users },
				{ labelKey: 'nav_customers', href: '/customers', icon: UserRound },
			],
		},
		{
			titleKey: 'nav_products',
			items: [
				{ labelKey: 'nav_products', href: '/products', icon: Package },
				{ labelKey: 'nav_stock_import', href: '/stock-import', icon: PackageOpen },
				{ labelKey: 'nav_stock_book', href: '/stock-book', icon: BookOpen },
			],
		},
		{
			titleKey: 'nav_sales',
			items: [
				{ labelKey: 'nav_sales', href: '/sales', icon: ShoppingCart },
				{ labelKey: 'nav_orders', href: '/orders', icon: ClipboardList },
				{ labelKey: 'nav_invoices', href: '/invoices', icon: FileText },
			],
		},
		{
			titleKey: 'nav_ledger',
			items: [
				{ labelKey: 'nav_ledger', href: '/ledger', icon: Landmark },
				{ labelKey: 'nav_reports', href: '/reports', icon: BarChart3 },
			],
		},
		{
			titleKey: 'nav_trips',
			items: [
				{ labelKey: 'nav_trips', href: '/trips', icon: Truck },
				{ labelKey: 'nav_vehicles', href: '/vehicles', icon: Car },
			],
		},
	];

	let {
		collapsed = $bindable(false),
		user,
		workosOrgName = '',
		userOrgs = [],
		currentOrgId = '',
	} = $props<{
		collapsed?: boolean;
		user: { firstName: string | null; lastName: string | null; email: string } | null;
		workosOrgName?: string;
		userOrgs?: Array<{ id: string; name: string }>;
		currentOrgId?: string | null;
	}>();

	let orgSwitcherOpen = $state(false);
	let userMenuOpen = $state(false);
	let logoutDialogOpen = $state(false);
	let switchingTo = $state<string | null>(null);
	const hasMultipleOrgs = $derived(userOrgs.length > 1);

	async function switchOrg(orgId: string) {
		if (orgId === currentOrgId || switchingTo) return;
		switchingTo = orgId;
		try {
			const res = await fetch('/api/org/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organizationId: orgId }),
			});
			const { redirectUrl } = await res.json();
			if (redirectUrl) {
				window.location.href = redirectUrl;
			} else {
				switchingTo = null;
			}
		} catch {
			switchingTo = null;
		}
	}

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
	const orgSettings = useConvexQuery(client, api.functions.organizations.getSettings, () => ({}));
	const displayName = $derived(orgSettings.data?.businessName || workosOrgName || t('app_name'));

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	function getInitials(user: { firstName: string | null; lastName: string | null; email: string }): string {
		if (user.firstName && user.lastName) {
			return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
		}
		return user.email[0].toUpperCase();
	}
</script>

<TooltipProvider delayDuration={0}>
	<aside
		class="group/sidebar relative flex h-screen flex-col border-r border-zinc-200 bg-zinc-50 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950"
		class:w-64={!collapsed}
		class:w-16={collapsed}
	>
		<!-- Logo / Brand / Org Switcher -->
		<Popover.Root bind:open={orgSwitcherOpen}>
			<Popover.Trigger
				disabled={!hasMultipleOrgs}
				class="flex h-14 w-full items-center gap-3 border-b border-zinc-200 px-4 text-left transition-colors dark:border-zinc-800 {hasMultipleOrgs ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900' : 'cursor-default'}"
			>
				{#if orgSettings.data?.logoUrl}
					<img
						src={orgSettings.data.logoUrl}
						alt={displayName}
						class="size-8 shrink-0 rounded-lg object-cover"
					/>
				{:else}
					<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
						<Store class="size-4 text-zinc-100 dark:text-zinc-900" />
					</div>
				{/if}
				{#if !collapsed}
					<div class="flex min-w-0 flex-1 flex-col overflow-hidden transition-opacity duration-200">
						<span class="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
							{displayName}
						</span>
						{#if orgSettings.data?.location}
							<span class="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
								<MapPin class="size-2.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
								<span class="truncate">{orgSettings.data.location}</span>
							</span>
						{/if}
					</div>
					{#if hasMultipleOrgs}
						<ChevronsUpDown class="size-4 shrink-0 text-zinc-400" />
					{/if}
				{/if}
			</Popover.Trigger>
			{#if hasMultipleOrgs}
				<Popover.Content
					side={collapsed ? 'right' : 'bottom'}
					align="center"
					sideOffset={collapsed ? 8 : 4}
					class="z-50 w-60 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
				>
					<div class="px-2 py-1.5">
						<p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
							{t('nav_switch_org')}
						</p>
					</div>
					{#each userOrgs as org}
						{@const isCurrent = org.id === currentOrgId}
						<button
							onclick={() => { orgSwitcherOpen = false; switchOrg(org.id); }}
							disabled={isCurrent || !!switchingTo}
							class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors
								{isCurrent
									? 'bg-zinc-100 dark:bg-zinc-800'
									: 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}
								{switchingTo ? 'opacity-50' : ''}"
						>
							<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
								<Store class="size-4 text-zinc-100 dark:text-zinc-900" />
							</div>
							<div class="flex min-w-0 flex-1 flex-col">
								<span class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
									{org.name}
								</span>
								{#if isCurrent && orgSettings.data?.location}
									<span class="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
										<MapPin class="size-2.5 shrink-0" />
										<span class="truncate">{orgSettings.data.location}</span>
									</span>
								{/if}
							</div>
							{#if switchingTo === org.id}
								<Loader2 class="size-4 shrink-0 animate-spin text-zinc-400" />
							{:else if isCurrent}
								<Check class="size-4 shrink-0 text-zinc-500" />
							{/if}
						</button>
					{/each}
				</Popover.Content>
			{/if}
		</Popover.Root>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3" aria-label="Main navigation">
			{#each navGroups as group, groupIndex}
				{#if groupIndex > 0}
					<Separator class="my-2 bg-zinc-200 dark:bg-zinc-800" />
				{/if}

				{#if !collapsed}
					<div class="mb-1 px-2 pt-1">
						<span class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
							{t(group.titleKey)}
						</span>
					</div>
				{/if}

				{#each group.items as item}
					{@const active = isActive(item.href)}

					{#if collapsed}
						<Tooltip>
							<TooltipTrigger>
								<a
									href={item.href}
									class="mb-0.5 flex size-10 items-center justify-center rounded-lg transition-colors mx-auto
										{active
											? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
											: 'text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
								>
									<item.icon class="size-[18px]" />
								</a>
							</TooltipTrigger>
							<TooltipContent side="right" class="font-medium">
								{t(item.labelKey)}
							</TooltipContent>
						</Tooltip>
					{:else}
						<a
							href={item.href}
							class="mb-0.5 flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors
								{active
									? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
									: 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
						>
							<item.icon class="size-[18px] shrink-0" />
							<span class="truncate">{t(item.labelKey)}</span>
						</a>
					{/if}
				{/each}
			{/each}
		</nav>

		<!-- Collapse Toggle -->
		<button
			onclick={() => (collapsed = !collapsed)}
			aria-label={collapsed ? t('a11y_expand_sidebar') : t('a11y_collapse_sidebar')}
			class="absolute -right-3 top-16 z-10 flex size-6 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
		>
			<span
				class="inline-flex transition-transform duration-200"
				style:transform={collapsed ? 'rotate(180deg)' : ''}
			>
				<ChevronLeft class="size-3.5 text-zinc-500" />
			</span>
		</button>

		<!-- Bottom: User Menu -->
		<div class="border-t border-zinc-200 p-2 dark:border-zinc-800">
			{#if user}
				<Popover.Root bind:open={userMenuOpen}>
					<Popover.Trigger
						class="flex w-full items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 {collapsed ? 'justify-center' : ''}"
					>
						<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
							{getInitials(user)}
						</div>
						{#if !collapsed}
							<div class="flex min-w-0 flex-1 flex-col text-left">
								<span class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
									{user.firstName ?? user.email.split('@')[0]}
								</span>
								<span class="truncate text-xs text-zinc-400">
									{user.email}
								</span>
							</div>
							<ChevronsUpDown class="size-4 shrink-0 text-zinc-400" />
						{/if}
					</Popover.Trigger>
					<Popover.Content
						side={collapsed ? 'right' : 'top'}
						align="center"
						sideOffset={8}
						class="z-50 w-60 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
					>
						<!-- User info header -->
						<div class="px-2 py-2">
							<p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
								{user.firstName ?? user.email.split('@')[0]}
							</p>
							<p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
								{user.email}
							</p>
						</div>
						<Separator class="my-1 bg-zinc-200 dark:bg-zinc-800" />
						<!-- Settings -->
						<a
							href="/settings"
							onclick={() => { userMenuOpen = false; }}
							class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
						>
							<Settings class="size-4 shrink-0" />
							<span>{t('nav_settings')}</span>
						</a>
						<Separator class="my-1 bg-zinc-200 dark:bg-zinc-800" />
						<!-- Logout -->
						<button
							onclick={() => { userMenuOpen = false; logoutDialogOpen = true; }}
							class="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
						>
							<LogOut class="size-4 shrink-0" />
							<span>{t('auth_logout')}</span>
						</button>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>

		<!-- Logout Confirmation Dialog -->
		<Dialog.Root bind:open={logoutDialogOpen}>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
				<Dialog.Content class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
					<Dialog.Header>
						<Dialog.Title class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
							{t('auth_logout_confirm_title')}
						</Dialog.Title>
						<Dialog.Description class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
							{t('auth_logout_confirm_desc')}
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer class="mt-6 flex justify-end gap-3">
						<Button
							variant="outline"
							size="sm"
							onclick={() => { logoutDialogOpen = false; }}
						>
							{t('action_cancel')}
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onclick={() => { window.location.href = '/logout'; }}
						>
							<LogOut class="mr-1.5 size-4" />
							{t('auth_logout')}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	</aside>
</TooltipProvider>
