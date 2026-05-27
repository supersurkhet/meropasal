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
		ChevronLeft,
		ChevronDown,
		Settings2,
		Building2,
		FileSliders,
	} from '@lucide/svelte';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
		TooltipProvider,
	} from '$lib/components/ui/tooltip';
	import { OrganizationSwitcher } from 'svelte-clerk';
	import { t } from '$lib/t.svelte';

	type NavItem = {
		labelKey: string;
		href: string;
		icon: typeof LayoutDashboard;
		children?: NavItem[];
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
		{
			titleKey: 'nav_settings',
			items: [
				{
					labelKey: 'nav_settings',
					href: '/settings',
					icon: Settings2,
					children: [
						{ labelKey: 'nav_settings_organization', href: '/settings/organization', icon: Building2 },
						{ labelKey: 'nav_settings_bill_template', href: '/settings/bill-template', icon: FileSliders },
						{ labelKey: 'nav_settings_members', href: '/settings/members', icon: Users },
						{ labelKey: 'nav_settings_profile', href: '/settings/profile', icon: UserRound },
					],
				},
			],
		},
	];

	let {
		collapsed = $bindable(false),
	} = $props<{
		collapsed?: boolean;
	}>();

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	function isChildActive(item: NavItem): boolean {
		if (!item.children) return false;
		return item.children.some((c) => isActive(c.href));
	}

	// Expanded groups (by href). Auto-expand when a child route is active.
	let expanded = $state<Record<string, boolean>>({});

	function toggle(href: string) {
		expanded[href] = !expanded[href];
	}

	function isExpanded(item: NavItem): boolean {
		return expanded[item.href] ?? isChildActive(item);
	}
</script>

<TooltipProvider delayDuration={0}>
	<aside
		class="group/sidebar relative flex h-screen flex-col border-r border-zinc-200 bg-zinc-50 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950"
		class:w-64={!collapsed}
		class:w-16={collapsed}
	>
		<!-- Org Switcher (Clerk) -->
		<div class="flex h-14 items-center border-b border-zinc-200 px-3 dark:border-zinc-800 {collapsed ? 'justify-center' : ''}">
			<OrganizationSwitcher hidePersonal />
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
					{@const hasChildren = !!item.children?.length}
					{@const open = hasChildren && isExpanded(item)}

					{#if collapsed}
						<Tooltip>
							<TooltipTrigger>
								<a
									href={item.href}
									class="mb-0.5 flex size-10 items-center justify-center rounded-lg transition-colors mx-auto
										{active || isChildActive(item)
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
					{:else if hasChildren}
						<button
							type="button"
							onclick={() => toggle(item.href)}
							aria-expanded={open}
							class="mb-0.5 flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors
								{isChildActive(item)
									? 'text-zinc-900 dark:text-zinc-100'
									: 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
						>
							<item.icon class="size-[18px] shrink-0" />
							<span class="flex-1 truncate text-left">{t(item.labelKey)}</span>
							<ChevronDown class="size-3.5 shrink-0 transition-transform duration-150 {open ? '' : '-rotate-90'}" />
						</button>
						{#if open}
							<div class="mb-1 ml-3 flex flex-col border-l border-zinc-200 pl-2 dark:border-zinc-800">
								{#each item.children ?? [] as child}
									{@const childActive = isActive(child.href)}
									<a
										href={child.href}
										class="mb-0.5 flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors
											{childActive
												? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
												: 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
									>
										<child.icon class="size-4 shrink-0" />
										<span class="truncate">{t(child.labelKey)}</span>
									</a>
								{/each}
							</div>
						{/if}
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

	</aside>
</TooltipProvider>
