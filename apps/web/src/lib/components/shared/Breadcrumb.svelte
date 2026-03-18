<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight, Home } from '@lucide/svelte';
	import { t } from '$lib/t';

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

	type Crumb = {
		label: string;
		href: string;
	};

	let crumbs = $derived.by(() => {
		const pathname = page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);
		const result: Crumb[] = [];

		let currentPath = '';
		for (const segment of segments) {
			currentPath += `/${segment}`;

			// Skip dynamic segments like [id] — they look like UUIDs, numbers, etc.
			if (segment.startsWith('[') || /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)) {
				result.push({ label: t('breadcrumb_detail'), href: currentPath });
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
	<nav aria-label="Breadcrumb" class="mb-4">
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
				<li class="flex items-center gap-1.5">
					<ChevronRight class="size-3.5 text-zinc-300 dark:text-zinc-600" />

					{#if i === crumbs.length - 1}
						<span class="font-medium text-zinc-700 dark:text-zinc-300">
							{crumb.label}
						</span>
					{:else}
						<a
							href={crumb.href}
							class="text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
						>
							{crumb.label}
						</a>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}
