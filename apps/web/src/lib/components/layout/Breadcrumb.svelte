<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight, Home } from '@lucide/svelte';

	type Crumb = {
		label: string;
		href: string;
	};

	/** Map path segments to human-readable labels */
	const segmentLabels: Record<string, string> = {
		dashboard: 'Dashboard',
		parties: 'Parties',
		customers: 'Customers',
		products: 'Products',
		'stock-import': 'Stock Import',
		sales: 'Sales',
		orders: 'Orders',
		invoices: 'Invoices',
		'stock-book': 'Stock Book',
		ledger: 'Ledger',
		vehicles: 'Vehicles',
		trips: 'Trips',
		reports: 'Reports',
		settings: 'Settings',
		new: 'New',
		edit: 'Edit',
	};

	let crumbs = $derived.by((): Crumb[] => {
		const pathname = page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);
		const result: Crumb[] = [];

		let currentPath = '';
		for (const segment of segments) {
			currentPath += `/${segment}`;
			const label = segmentLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
			result.push({ label, href: currentPath });
		}

		return result;
	});
</script>

{#if crumbs.length > 0}
	<nav aria-label="Breadcrumb" class="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
		<a
			href="/dashboard"
			class="flex items-center rounded p-0.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
			aria-label="Home"
		>
			<Home class="size-3.5" />
		</a>

		{#each crumbs as crumb, i}
			<ChevronRight class="size-3.5 text-zinc-300 dark:text-zinc-600" />

			{#if i === crumbs.length - 1}
				<span class="font-medium text-zinc-900 dark:text-zinc-100" aria-current="page">
					{crumb.label}
				</span>
			{:else}
				<a
					href={crumb.href}
					class="rounded px-1 py-0.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
				>
					{crumb.label}
				</a>
			{/if}
		{/each}
	</nav>
{/if}
