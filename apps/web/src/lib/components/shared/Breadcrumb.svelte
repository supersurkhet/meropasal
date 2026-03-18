<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight, Home } from '@lucide/svelte';

	const labelMap: Record<string, string> = {
		dashboard: 'Dashboard',
		parties: 'Parties',
		customers: 'Customers',
		products: 'Products',
		'stock-import': 'Stock Import',
		'stock-book': 'Stock Book',
		sales: 'Sales',
		orders: 'Orders',
		invoices: 'Invoices',
		ledger: 'Ledger',
		vehicles: 'Vehicles',
		trips: 'Trips',
		reports: 'Reports',
		settings: 'Settings',
		new: 'New',
		entries: 'Entries',
		'fiscal-close': 'Fiscal Close',
		accounts: 'Accounts',
		members: 'Members',
		billing: 'Billing',
		'bill-template': 'Bill Template',
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
				result.push({ label: 'Details', href: currentPath });
				continue;
			}

			const label = labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
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
