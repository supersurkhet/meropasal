<script lang="ts">
	import { page } from '$app/state';
	import { ChevronDown, ChevronRight, Home } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import { breadcrumbLabel } from '$lib/breadcrumb-label.svelte';
	import { breadcrumbViewToggle } from '$lib/breadcrumb-view-toggle.svelte';
	import ViewToggle from '$lib/components/shared/ViewToggle.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	const segmentKeyMap: Record<string, string> = {
		dashboard: 'nav_dashboard',
		parties: 'nav_parties',
		customers: 'nav_customers',
		products: 'nav_products',
		'stock-import': 'nav_stock_import',
		'stock-book': 'nav_stock_book',
		sales: 'nav_sales',
		orders: 'nav_orders',
		invoices: 'nav_invoices',
		ledger: 'nav_ledger',
		vehicles: 'nav_vehicles',
		trips: 'nav_trips',
		reports: 'nav_reports',
		settings: 'nav_settings',
		new: 'breadcrumb_new',
		entries: 'breadcrumb_entries',
		'fiscal-close': 'breadcrumb_fiscal_close',
		accounts: 'breadcrumb_accounts',
		members: 'settings_members',
		billing: 'settings_billing',
		'bill-template': 'settings_bill_template',
	};

	/** Matches Convex IDs (alphanumeric 20+ chars), UUIDs, or plain numbers */
	function isDynamicSegment(segment: string): boolean {
		return (
			segment.startsWith('[') ||
			/^[0-9a-f-]{8,}$/i.test(segment) ||
			/^\d+$/.test(segment) ||
			/^[a-z0-9]{20,}$/i.test(segment)
		);
	}

	type Crumb = {
		label: string;
		href: string;
	};

	type SectionLink = {
		label: string;
		href: string;
	};

	const topLevelSections = $derived.by((): SectionLink[] => [
		{ label: t('nav_dashboard'), href: '/dashboard' },
		{ label: t('nav_stock_import'), href: '/stock-import' },
		{ label: t('nav_sales'), href: '/sales' },
		{ label: t('nav_orders'), href: '/orders' },
		{ label: t('nav_invoices'), href: '/invoices' },
		{ label: t('nav_products'), href: '/products' },
		{ label: t('nav_parties'), href: '/parties' },
		{ label: t('nav_customers'), href: '/customers' },
		{ label: t('nav_ledger'), href: '/ledger' },
		{ label: t('nav_vehicles'), href: '/vehicles' },
		{ label: t('nav_trips'), href: '/trips' },
		{ label: t('nav_reports'), href: '/reports' },
		{ label: t('nav_settings'), href: '/settings' },
	]);

	const topLevelSectionByHref = $derived.by(() => {
		const map = new Map<string, SectionLink>();
		for (const s of topLevelSections) map.set(s.href, s);
		return map;
	});

	let crumbs = $derived.by(() => {
		const pathname = page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);
		const result: Crumb[] = [];

		let currentPath = '';
		for (const segment of segments) {
			currentPath += `/${segment}`;

			if (isDynamicSegment(segment)) {
				result.push({ label: $breadcrumbLabel ?? t('breadcrumb_detail'), href: currentPath });
				continue;
			}

			const key = segmentKeyMap[segment];
			const label = key ? t(key) : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
			result.push({ label, href: currentPath });
		}

		return result;
	});
</script>

{#if crumbs.length > 0}
	<nav aria-label="Breadcrumb" class="mb-4 flex items-center justify-between">
		<ol class="flex items-center gap-1.5 text-sm">
			<li class="flex items-center">
				<a
					href="/dashboard"
					class="flex items-center text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
				>
					<Home class="size-3.5" />
				</a>
			</li>

			{#each crumbs as crumb, i}
				{@const isLast = i === crumbs.length - 1}
				{@const isTopLevelSection = i === 0 && topLevelSectionByHref.has(crumb.href)}

				<li class="flex items-center gap-1.5">
					<ChevronRight class="size-3.5 text-zinc-300 dark:text-zinc-600" />

					{#if isTopLevelSection}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<a
										{...props}
										href={crumb.href}
										class="{isLast
											? 'font-medium text-zinc-700 dark:text-zinc-300'
											: 'text-zinc-400 dark:text-zinc-500'} flex items-center gap-1.5 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
									>
										<span>{crumb.label}</span>
										<ChevronDown class="size-3.5 opacity-70" />
									</a>
								{/snippet}
							</DropdownMenu.Trigger>

							<DropdownMenu.Content align="start">
								{#each topLevelSections as section}
									<DropdownMenu.Item>
										<a href={section.href} class="block w-full">{section.label}</a>
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else}
						<a
							href={crumb.href}
							class="{isLast
								? 'font-medium text-zinc-700 dark:text-zinc-300'
								: 'text-zinc-400 dark:text-zinc-500'} transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
						>
							{crumb.label}
						</a>
					{/if}
				</li>
			{/each}
		</ol>

		{#if breadcrumbViewToggle.config}
			<ViewToggle
				mode={breadcrumbViewToggle.config.mode}
				onchange={breadcrumbViewToggle.config.onchange}
			/>
		{/if}
	</nav>
{/if}
