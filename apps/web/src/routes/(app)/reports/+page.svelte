<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import {
		BarChart3,
		TrendingUp,
		Package,
		DollarSign,
		ArrowRight,
	} from '@lucide/svelte';

	const reports = [
		{
			title: 'Sales Report',
			description: 'Sales by period, top selling products, and revenue trends',
			href: '/reports/sales',
			icon: TrendingUp,
			iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
			iconColor: 'text-emerald-600 dark:text-emerald-400',
		},
		{
			title: 'Inventory Report',
			description: 'Stock levels, low stock alerts, and stock value summary',
			href: '/reports/inventory',
			icon: Package,
			iconBg: 'bg-amber-100 dark:bg-amber-900/30',
			iconColor: 'text-amber-600 dark:text-amber-400',
		},
		{
			title: 'Financial Report',
			description: 'Revenue vs expenses, profit/loss, receivables and payables',
			href: '/reports/financial',
			icon: DollarSign,
			iconBg: 'bg-blue-100 dark:bg-blue-900/30',
			iconColor: 'text-blue-600 dark:text-blue-400',
		},
	] as const;
</script>

<MetaTags title="Reports — MeroPasal" />

<div class="p-6 lg:p-8">
	<div class="mb-8">
		<div class="flex items-center gap-3">
			<div
				class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100"
			>
				<BarChart3 class="size-5 text-white dark:text-zinc-900" />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					Reports
				</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">
					Analyze your business performance
				</p>
			</div>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each reports as report}
			<a
				href={report.href}
				class="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
			>
				<div class="mb-4 flex items-center justify-between">
					<div
						class="flex size-10 items-center justify-center rounded-lg {report.iconBg}"
					>
						<report.icon class="size-5 {report.iconColor}" />
					</div>
					<ArrowRight
						class="size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5"
					/>
				</div>
				<h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
					{report.title}
				</h2>
				<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					{report.description}
				</p>
			</a>
		{/each}
	</div>
</div>
