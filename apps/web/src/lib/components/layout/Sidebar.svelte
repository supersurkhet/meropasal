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
		LogOut,
	} from '@lucide/svelte';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
		TooltipProvider,
	} from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/t.svelte';

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

	let { collapsed = $bindable(false), user } = $props<{
		collapsed?: boolean;
		user: { firstName: string | null; lastName: string | null; email: string } | null;
	}>();

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
		<!-- Logo / Brand -->
		<div class="flex h-14 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
			<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
				<Store class="size-4 text-zinc-100 dark:text-zinc-900" />
			</div>
			{#if !collapsed}
				<div class="flex flex-col overflow-hidden transition-opacity duration-200">
					<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('app_name')}</span>
					<span class="text-[10px] font-medium uppercase tracking-widest text-zinc-400">{t('app_tagline')}</span>
				</div>
			{/if}
		</div>

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

		<!-- Bottom: Settings + User -->
		<div class="border-t border-zinc-200 p-2 dark:border-zinc-800">
			{#if collapsed}
				<Tooltip>
					<TooltipTrigger>
						<a
							href="/settings"
							class="mb-1 flex size-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 mx-auto dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
						>
							<Settings class="size-[18px]" />
						</a>
					</TooltipTrigger>
					<TooltipContent side="right" class="font-medium">{t('nav_settings')}</TooltipContent>
				</Tooltip>
			{:else}
				<a
					href="/settings"
					class="mb-1 flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
				>
					<Settings class="size-[18px] shrink-0" />
					<span>{t('nav_settings')}</span>
				</a>
			{/if}

			<Separator class="my-1.5 bg-zinc-200 dark:bg-zinc-800" />

			<!-- User Profile -->
			{#if user}
				<div class="flex items-center gap-2.5 rounded-lg p-2 {collapsed ? 'justify-center' : ''}">
					<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
						{getInitials(user)}
					</div>
					{#if !collapsed}
						<div class="flex min-w-0 flex-1 flex-col">
							<span class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
								{user.firstName ?? user.email.split('@')[0]}
							</span>
							<span class="truncate text-xs text-zinc-400">
								{user.email}
							</span>
						</div>
						<a
							href="/logout"
							aria-label={t('auth_logout')}
							class="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
						>
							<LogOut class="size-3.5" />
							<span class="sr-only">{t('auth_logout')}</span>
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</aside>
</TooltipProvider>
