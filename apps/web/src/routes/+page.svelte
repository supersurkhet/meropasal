<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import {
		Store,
		Package,
		Receipt,
		BookOpen,
		Truck,
		BarChart3,
		Shield,
		Zap,
		Globe,
		ChevronRight,
		ArrowRight,
		Check,
		Star,
	} from '@lucide/svelte';

	let { data } = $props();

	onMount(() => {
		if (data.user) {
			goto('/dashboard');
		}
	});

	const features = [
		{
			icon: Package,
			title: 'Inventory Management',
			nepali: 'सामान व्यवस्थापन',
			description: 'Track stock levels per supplier, compound units, barcode scanning, and automatic reorder alerts.',
		},
		{
			icon: Receipt,
			title: 'Invoicing & Sales',
			nepali: 'बिल र बिक्री',
			description: 'Auto-generated invoices, partial payments, customizable bill templates for thermal & A4 printers.',
		},
		{
			icon: BookOpen,
			title: 'Stock Book & Ledger',
			nepali: 'स्टक बुक र खाता',
			description: 'Double-entry bookkeeping, fiscal year management with Nepali BS calendar, and trial balance.',
		},
		{
			icon: Truck,
			title: 'Logistics & Trips',
			nepali: 'यातायात व्यवस्थापन',
			description: 'Vehicle fleet tracking, dispatch & return management, auto-invoicing for trip sales.',
		},
		{
			icon: BarChart3,
			title: 'Reports & Analytics',
			nepali: 'रिपोर्ट र विश्लेषण',
			description: 'Sales analytics, inventory reports, P&L statements, receivables and payables tracking.',
		},
		{
			icon: Shield,
			title: 'Multi-Tenant & Secure',
			nepali: 'सुरक्षित प्रणाली',
			description: 'Organization-level data isolation, role-based access, enterprise SSO via WorkOS.',
		},
	];

	const highlights = [
		{ label: 'Real-time sync across all devices', icon: Zap },
		{ label: 'Nepali calendar (BS) & NPR currency', icon: Globe },
		{ label: 'Works offline with desktop app', icon: Shield },
		{ label: 'Customizable bill templates', icon: Receipt },
	];
</script>

<MetaTags
	title="MeroPasal — मेरो पसल | Retail Management for Nepal"
	description="The complete retail management platform for Nepal. Inventory, invoicing, stock book, logistics, and accounting — all in one place."
/>

<!-- Skip if authenticated (handled in onMount) -->
{#if !data.user}
<div class="min-h-screen bg-white dark:bg-zinc-950">
	<!-- Navigation -->
	<nav class="fixed top-0 z-50 w-full border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
			<div class="flex items-center gap-3">
				<div class="flex size-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100">
					<Store class="size-5 text-white dark:text-zinc-900" />
				</div>
				<span class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">MeroPasal</span>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="ghost" href="/login" class="text-zinc-600 dark:text-zinc-400">Sign in</Button>
				<Button href="/login" size="sm">
					Get Started
					<ArrowRight class="size-4" />
				</Button>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="relative overflow-hidden pt-16">
		<!-- Gradient background -->
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div class="absolute -top-[40%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-100 to-transparent opacity-60 dark:from-zinc-900 dark:opacity-40"></div>
			<div class="absolute top-[20%] left-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-50 to-transparent opacity-40 blur-3xl dark:from-blue-950 dark:opacity-20"></div>
			<div class="absolute top-[30%] right-[10%] h-[300px] w-[300px] rounded-full bg-gradient-to-bl from-amber-50 to-transparent opacity-40 blur-3xl dark:from-amber-950 dark:opacity-20"></div>
		</div>

		<div class="relative mx-auto max-w-7xl px-6 pb-24 pt-24 sm:pb-32 sm:pt-32 lg:pt-40">
			<div class="mx-auto max-w-3xl text-center">
				<!-- Badge -->
				<div class="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
					<span class="relative flex size-2">
						<span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
					</span>
					Now in active development
				</div>

				<!-- Title -->
				<h1 class="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-zinc-50">
					MeroPasal
					<span class="mt-2 block font-semibold text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif;">
						मेरो पसल
					</span>
				</h1>

				<!-- Subtitle -->
				<p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
					The complete retail management platform for Nepal.
					<span class="text-zinc-900 dark:text-zinc-200">Inventory, invoicing, stock book, logistics, and accounting</span>
					— all in one place.
				</p>

				<!-- CTA Buttons -->
				<div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button href="/login" size="lg" class="h-12 px-8 text-base shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/5">
						Start Free
						<ArrowRight class="size-5" />
					</Button>
					<Button href="#features" variant="outline" size="lg" class="h-12 px-8 text-base">
						See Features
						<ChevronRight class="size-5" />
					</Button>
				</div>

				<!-- Social proof -->
				<div class="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500 dark:text-zinc-500">
					<div class="flex items-center gap-1.5">
						<Check class="size-4 text-emerald-500" />
						<span>Free to start</span>
					</div>
					<div class="flex items-center gap-1.5">
						<Check class="size-4 text-emerald-500" />
						<span>Nepali calendar built-in</span>
					</div>
					<div class="flex items-center gap-1.5">
						<Check class="size-4 text-emerald-500" />
						<span>Real-time sync</span>
					</div>
				</div>
			</div>

			<!-- Dashboard Preview -->
			<div class="relative mx-auto mt-20 max-w-5xl">
				<div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 shadow-2xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/50">
					<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
						<!-- Fake browser chrome -->
						<div class="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
							<div class="flex gap-1.5">
								<div class="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
								<div class="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
								<div class="size-3 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
							</div>
							<div class="ml-4 flex-1 rounded-md bg-zinc-100 px-3 py-1 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
								app.meropasal.com/dashboard
							</div>
						</div>
						<!-- Dashboard mockup content -->
						<div class="p-6 sm:p-8">
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
								{#each [
									{ label: 'Revenue', value: 'Rs. 4,52,380', change: '+12.5%', color: 'text-emerald-600 dark:text-emerald-400' },
									{ label: 'Expenses', value: 'Rs. 2,18,450', change: '-3.2%', color: 'text-emerald-600 dark:text-emerald-400' },
									{ label: 'Net Income', value: 'Rs. 2,33,930', change: '+18.7%', color: 'text-emerald-600 dark:text-emerald-400' },
									{ label: 'Low Stock', value: '7 items', change: '', color: 'text-amber-600 dark:text-amber-400' },
								] as kpi}
									<div class="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
										<p class="text-xs text-zinc-500 dark:text-zinc-400">{kpi.label}</p>
										<p class="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{kpi.value}</p>
										{#if kpi.change}
											<p class="mt-0.5 text-xs {kpi.color}">{kpi.change}</p>
										{/if}
									</div>
								{/each}
							</div>
							<!-- Chart placeholder -->
							<div class="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
								<div class="mb-4 flex items-center justify-between">
									<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sales (Last 14 Days)</span>
									<span class="text-xs text-zinc-400">Bikram Sambat 2082</span>
								</div>
								<div class="flex h-32 items-end gap-1.5 sm:gap-2">
									{#each [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95, 70, 80] as height}
										<div
											class="flex-1 rounded-t bg-zinc-900 dark:bg-zinc-100 transition-all"
											style="height: {height}%"
										></div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
				<!-- Decorative glow -->
				<div class="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-zinc-100/50 via-transparent to-transparent blur-2xl dark:from-zinc-800/30"></div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="relative border-t border-zinc-100 bg-zinc-50/50 py-24 sm:py-32 dark:border-zinc-900 dark:bg-zinc-900/30">
		<div class="mx-auto max-w-7xl px-6">
			<div class="mx-auto max-w-2xl text-center">
				<p class="text-sm font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">Everything you need</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
					Built for Nepali retail businesses
				</h2>
				<p class="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
					From a single pasal to a wholesale network — manage your entire operation in one platform.
				</p>
			</div>

			<div class="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					<div class="group relative rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-zinc-950/50">
						<div class="flex size-11 items-center justify-center rounded-xl bg-zinc-100 transition-colors group-hover:bg-zinc-900 dark:bg-zinc-800 dark:group-hover:bg-zinc-100">
							<feature.icon class="size-5 text-zinc-600 transition-colors group-hover:text-white dark:text-zinc-400 dark:group-hover:text-zinc-900" />
						</div>
						<h3 class="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
						<p class="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif;">{feature.nepali}</p>
						<p class="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Highlights / Why MeroPasal -->
	<section class="border-t border-zinc-100 py-24 sm:py-32 dark:border-zinc-900">
		<div class="mx-auto max-w-7xl px-6">
			<div class="grid items-center gap-16 lg:grid-cols-2">
				<div>
					<p class="text-sm font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400">Why MeroPasal</p>
					<h2 class="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
						Designed for how you actually work
					</h2>
					<p class="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
						No more juggling spreadsheets, paper khatas, and separate billing software. MeroPasal understands Nepali retail — from bikram sambat dates to Rs. currency formatting.
					</p>
					<div class="mt-10 space-y-5">
						{#each highlights as highlight}
							<div class="flex items-center gap-4">
								<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
									<highlight.icon class="size-5 text-zinc-600 dark:text-zinc-400" />
								</div>
								<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{highlight.label}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Feature detail card -->
				<div class="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
					<div class="space-y-6">
						<div class="flex items-start gap-4">
							<div class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
								<Star class="size-4 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<h4 class="font-semibold text-zinc-900 dark:text-zinc-100">Smart Automation</h4>
								<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Auto-generated invoices, stock entries from purchases and sales, fiscal year closing with one click.</p>
							</div>
						</div>
						<div class="border-t border-zinc-100 dark:border-zinc-800"></div>
						<div class="flex items-start gap-4">
							<div class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
								<Globe class="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h4 class="font-semibold text-zinc-900 dark:text-zinc-100">Bilingual Interface</h4>
								<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Full English and Nepali support. Switch languages anytime — dates, currency, and labels all adapt.</p>
							</div>
						</div>
						<div class="border-t border-zinc-100 dark:border-zinc-800"></div>
						<div class="flex items-start gap-4">
							<div class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
								<Zap class="size-4 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<h4 class="font-semibold text-zinc-900 dark:text-zinc-100">Real-time Everything</h4>
								<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Powered by Convex — changes sync instantly across all your devices. No refresh needed.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="border-t border-zinc-100 dark:border-zinc-900">
		<div class="mx-auto max-w-7xl px-6 py-24 sm:py-32">
			<div class="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-16 text-center sm:px-16 dark:bg-zinc-100">
				<!-- Subtle grid pattern -->
				<div class="pointer-events-none absolute inset-0 opacity-[0.03]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);"></div>
				<h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl dark:text-zinc-900">
					Ready to modernize your pasal?
				</h2>
				<p class="mx-auto mt-4 max-w-xl text-lg text-zinc-400 dark:text-zinc-600">
					Set up your business in under 2 minutes. No credit card required.
				</p>
				<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button
						href="/login"
						size="lg"
						class="h-12 bg-white px-8 text-base text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
					>
						Get Started Free
						<ArrowRight class="size-5" />
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-zinc-100 py-12 dark:border-zinc-900">
		<div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
			<div class="flex items-center gap-2">
				<div class="flex size-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
					<Store class="size-4 text-white dark:text-zinc-900" />
				</div>
				<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">MeroPasal</span>
				<span class="text-sm text-zinc-400" style="font-family: 'Mukta', sans-serif;">मेरो पसल</span>
			</div>
			<p class="text-sm text-zinc-400 dark:text-zinc-500">
				Built with care for Nepali businesses.
			</p>
		</div>
	</footer>
</div>
{/if}
