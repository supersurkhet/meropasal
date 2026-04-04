<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import { MetaTags } from 'svelte-meta-tags'
	import { Button } from '$lib/components/ui/button'
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
		ArrowRight,
		Check,
		Download,
		Monitor,
		Smartphone,
		ChevronDown,
		ExternalLink,
	} from '@lucide/svelte'

	let { data } = $props()

	onMount(() => {
		if (data.user) {
			goto('/dashboard')
		}
	})

	const RELEASE_BASE = 'https://github.com/supersurkhet/meropasal/releases/download/v0.2.0'

	type Platform = 'macos' | 'windows' | 'linux' | 'android' | 'unknown'

	let detectedPlatform = $state<Platform>('unknown')
	let showAllPlatforms = $state(false)

	onMount(() => {
		const ua = navigator.userAgent.toLowerCase()
		if (ua.includes('android')) detectedPlatform = 'android'
		else if (ua.includes('mac')) detectedPlatform = 'macos'
		else if (ua.includes('win')) detectedPlatform = 'windows'
		else if (ua.includes('linux')) detectedPlatform = 'linux'
	})

	const platforms = [
		{
			id: 'macos' as Platform,
			label: 'macOS',
			sublabel: 'Apple Silicon',
			file: 'MeroPasal_0.1.0_aarch64.dmg',
			alt: { label: 'Intel Mac', file: 'MeroPasal_0.1.0_x64.dmg' },
		},
		{
			id: 'windows' as Platform,
			label: 'Windows',
			sublabel: 'x64 Installer',
			file: 'MeroPasal_0.1.0_x64-setup.exe',
			alt: { label: 'MSI Package', file: 'MeroPasal_0.1.0_x64_en-US.msi' },
		},
		{
			id: 'linux' as Platform,
			label: 'Linux',
			sublabel: 'AppImage',
			file: 'MeroPasal_0.1.0_amd64.AppImage',
			alt: { label: 'Debian (.deb)', file: 'MeroPasal_0.1.0_amd64.deb' },
		},
		{
			id: 'android' as Platform,
			label: 'Android',
			sublabel: 'APK',
			file: 'app-universal-release-unsigned.apk',
			alt: null,
		},
	]

	const primaryPlatform = $derived(platforms.find(p => p.id === detectedPlatform) ?? platforms[0])
	const otherPlatforms = $derived(platforms.filter(p => p.id !== detectedPlatform))

	const features = [
		{
			icon: Package,
			title: 'Inventory',
			nepali: 'सामान',
			description: 'Per-supplier stock tracking, compound units, barcodes, and automatic reorder alerts when you run low.',
		},
		{
			icon: Receipt,
			title: 'Invoicing',
			nepali: 'बिल',
			description: 'Auto-generated purchase and sales invoices. Partial payments, custom bill templates for thermal and A4.',
		},
		{
			icon: BookOpen,
			title: 'Ledger',
			nepali: 'खाता',
			description: 'Double-entry bookkeeping tied to every transaction. Trial balance, P&L, and fiscal year close in one click.',
		},
		{
			icon: Truck,
			title: 'Logistics',
			nepali: 'यातायात',
			description: 'Fleet management, dispatch tracking, return reconciliation. Every trip auto-generates invoices and stock entries.',
		},
		{
			icon: BarChart3,
			title: 'Reports',
			nepali: 'रिपोर्ट',
			description: 'Sales trends, top products, receivables and payables. Know exactly where your business stands.',
		},
		{
			icon: Shield,
			title: 'Multi-Org',
			nepali: 'संस्था',
			description: 'Run multiple businesses from one account. Each organization is fully isolated with role-based access.',
		},
	]
</script>

<MetaTags
	title="MeroPasal — मेरो पसल | Retail Management for Nepal"
	description="The complete retail management platform for Nepal. Inventory, invoicing, stock book, logistics, and accounting — all in one place."
/>

{#if !data.user}
<div class="min-h-screen bg-white dark:bg-zinc-950">

	<!-- ─── Navigation ─── -->
	<nav class="fixed top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-zinc-950/70">
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
			<a href="/" class="flex items-center gap-2.5">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary">
					<Store class="size-4 text-primary-foreground" />
				</div>
				<span class="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">MeroPasal</span>
			</a>
			<div class="flex items-center gap-1">
				<a href="#features" class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-zinc-100">Features</a>
				<a href="#download" class="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-zinc-100">Download</a>
				<div class="ml-2 h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
				<a href="/login" class="ml-2 rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Sign in</a>
				<Button href="/login" size="sm" class="ml-1 h-8 rounded-lg px-3.5 text-[13px]">
					Get Started
				</Button>
			</div>
		</div>
	</nav>

	<!-- ─── Hero ─── -->
	<section class="relative overflow-hidden pt-14">
		<div class="pointer-events-none absolute inset-0">
			<div class="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-50/80 via-transparent to-transparent blur-3xl dark:from-amber-950/20"></div>
		</div>

		<div class="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-36">
			<div class="mx-auto max-w-[680px] text-center">
				<h1 class="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-zinc-900 dark:text-zinc-50">
					Run your pasal,<br>
					<span class="text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif; font-weight: 600;">
						not spreadsheets.
					</span>
				</h1>

				<p class="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-zinc-500 dark:text-zinc-400">
					Inventory, invoicing, ledger, logistics — one platform built for Nepali retail. In English and नेपाली.
				</p>

				<div class="mt-8 flex items-center justify-center gap-3">
					<Button href="/login" size="lg" class="h-11 rounded-xl px-6 text-sm shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/5">
						Start Free
						<ArrowRight class="ml-1 size-4" />
					</Button>
					<Button href="#download" variant="outline" size="lg" class="h-11 rounded-xl px-6 text-sm">
						<Download class="mr-1 size-4" />
						Download App
					</Button>
				</div>

				<div class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-zinc-400 dark:text-zinc-500">
					<span class="flex items-center gap-1.5"><Check class="size-3.5 text-emerald-500" /> Free to use</span>
					<span class="flex items-center gap-1.5"><Check class="size-3.5 text-emerald-500" /> Nepali calendar</span>
					<span class="flex items-center gap-1.5"><Check class="size-3.5 text-emerald-500" /> Real-time sync</span>
				</div>
			</div>

			<!-- Dashboard Preview -->
			<div class="relative mx-auto mt-16 max-w-4xl sm:mt-20">
				<div class="rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-2xl shadow-zinc-900/8 ring-1 ring-zinc-900/5 dark:border-zinc-800/80 dark:bg-zinc-900 dark:shadow-black/30 dark:ring-white/5">
					<div class="overflow-hidden rounded-[10px] border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
						<!-- Browser chrome -->
						<div class="flex items-center gap-2 border-b border-zinc-200/80 px-4 py-2.5 dark:border-zinc-800/80">
							<div class="flex gap-1.5">
								<div class="size-[10px] rounded-full bg-red-400/80 dark:bg-red-500/60"></div>
								<div class="size-[10px] rounded-full bg-amber-400/80 dark:bg-amber-500/60"></div>
								<div class="size-[10px] rounded-full bg-emerald-400/80 dark:bg-emerald-500/60"></div>
							</div>
							<div class="mx-auto max-w-xs flex-1 rounded-md bg-zinc-100 px-3 py-1 text-center text-[11px] text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
								pasal.surkhet.app/dashboard
							</div>
						</div>
						<!-- Dashboard content -->
						<div class="p-5 sm:p-6">
							<div class="mb-5 flex items-center justify-between">
								<div>
									<p class="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">Dashboard</p>
									<p class="text-[11px] text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif;">बि.सं. २०८२ माघ</p>
								</div>
								<div class="rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">FY 82/83</div>
							</div>
							<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{#each [
									{ label: 'Revenue', value: 'Rs. 4,52,380', change: '+12.5%', up: true },
									{ label: 'Expenses', value: 'Rs. 2,18,450', change: '-3.2%', up: true },
									{ label: 'Net Income', value: 'Rs. 2,33,930', change: '+18.7%', up: true },
									{ label: 'Low Stock', value: '7 items', change: 'Action needed', up: false },
								] as kpi}
									<div class="rounded-lg border border-zinc-100 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900/80">
										<p class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{kpi.label}</p>
										<p class="mt-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{kpi.value}</p>
										<p class="mt-0.5 text-[11px] {kpi.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">{kpi.change}</p>
									</div>
								{/each}
							</div>
							<!-- Chart -->
							<div class="mt-4 rounded-lg border border-zinc-100 p-4 dark:border-zinc-800">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-[12px] font-medium text-zinc-600 dark:text-zinc-300">Sales — Last 14 days</span>
									<span class="text-[11px] text-zinc-400 dark:text-zinc-500">बिक्री</span>
								</div>
								<div class="flex h-24 items-end gap-[3px] sm:gap-1.5">
									{#each [35, 58, 42, 75, 48, 65, 88, 55, 72, 82, 45, 92, 68, 78] as h, i}
										<div
											class="flex-1 rounded-t bg-primary transition-all duration-500"
											style="height: {h}%; opacity: {0.4 + (i / 14) * 0.6}; animation: grow 0.6s ease-out {i * 0.04}s both;"
										></div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
				<!-- Glow -->
				<div class="pointer-events-none absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-b from-amber-100/30 via-transparent to-transparent blur-2xl dark:from-amber-900/10"></div>
			</div>
		</div>
	</section>

	<!-- ─── Features ─── -->
	<section id="features" class="border-t border-zinc-100 py-20 sm:py-28 dark:border-zinc-900">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mx-auto max-w-lg text-center">
				<p class="text-[13px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">सबै एकैठाउँमा</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
					Everything in one place
				</h2>
			</div>

			<div class="mx-auto mt-14 grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature, i}
					<div class="flex flex-col bg-card p-6 transition-colors hover:bg-accent" style="animation: fadeUp 0.5s ease-out {i * 0.08}s both;">
						<div class="flex items-center gap-3">
							<feature.icon class="size-5 text-zinc-400 dark:text-zinc-500" />
							<div>
								<h3 class="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
								<span class="text-[12px] text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif;">{feature.nepali}</span>
							</div>
						</div>
						<p class="mt-3 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ─── Why MeroPasal ─── -->
	<section class="border-t border-zinc-100 py-20 sm:py-28 dark:border-zinc-900">
		<div class="mx-auto max-w-6xl px-6">
			<div class="grid items-start gap-12 lg:grid-cols-5 lg:gap-16">
				<div class="lg:col-span-2">
					<p class="text-[13px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">किन MeroPasal?</p>
					<h2 class="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-[2.25rem] dark:text-zinc-50">
						Your khata,<br>modernized.
					</h2>
					<p class="mt-4 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
						Stop juggling spreadsheets, paper registers, and billing software. One platform that understands बिक्रम सम्बत dates, रुपैयाँ formatting, and how Nepali retail actually works.
					</p>
				</div>

				<div class="space-y-3 lg:col-span-3">
					{#each [
						{ icon: Zap, title: 'Real-time sync', description: 'Changes appear instantly across all devices. Powered by Convex — no manual refresh, no stale data.', color: 'text-amber-500' },
						{ icon: Globe, title: 'Bilingual by default', description: 'Full English and नेपाली interface. Dates in BS, currency in NPR. Switch anytime — everything adapts.', color: 'text-blue-500' },
						{ icon: Shield, title: 'Enterprise security', description: 'Organization-level data isolation, role-based access control, and SSO. Your data stays yours.', color: 'text-emerald-500' },
						{ icon: Receipt, title: 'Auto-generated everything', description: 'Import stock and invoices auto-create. Sell something and ledger entries write themselves. Close fiscal year in one click.', color: 'text-rose-500' },
					] as item}
						<div class="group flex gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:bg-accent hover:shadow-sm">
							<div class="mt-0.5 shrink-0">
								<item.icon class="size-5 {item.color}" />
							</div>
							<div>
								<h4 class="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h4>
								<p class="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Download ─── -->
	<section id="download" class="border-t border-zinc-100 py-20 sm:py-28 dark:border-zinc-900">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mx-auto max-w-2xl text-center">
				<p class="text-[13px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">डाउनलोड</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
					Get the app
				</h2>
				<p class="mt-3 text-[15px] text-zinc-500 dark:text-zinc-400">
					Available on every platform. Or just use the web — no install needed.
				</p>
			</div>

			<div class="mx-auto mt-12 max-w-lg">
				<!-- Primary download for detected platform -->
				<a
					href="{RELEASE_BASE}/{primaryPlatform.file}"
					class="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary p-5 transition-all hover:bg-primary/90"
				>
					<div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
						<Download class="size-6 text-primary-foreground" />
					</div>
					<div class="flex-1">
						<p class="text-[15px] font-semibold text-primary-foreground">
							Download for {primaryPlatform.label}
						</p>
						<p class="text-[13px] text-primary-foreground/60">{primaryPlatform.sublabel} &middot; v0.2.0</p>
					</div>
					<ArrowRight class="size-5 text-primary-foreground/50 transition-transform group-hover:translate-x-1" />
				</a>

				{#if primaryPlatform.alt}
					<a
						href="{RELEASE_BASE}/{primaryPlatform.alt.file}"
						class="mt-2 block text-center text-[13px] text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
					>
						Also available: {primaryPlatform.alt.label}
					</a>
				{/if}

				<!-- Web app option -->
				<a
					href="/login"
					class="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-[14px] font-medium text-foreground transition-all hover:bg-accent"
				>
					<Globe class="size-4 text-zinc-400" />
					Use the web app instead
					<ExternalLink class="ml-0.5 size-3.5 text-zinc-400" />
				</a>

				<!-- Other platforms toggle -->
				<div class="mt-6">
					<button
						onclick={() => showAllPlatforms = !showAllPlatforms}
						class="mx-auto flex items-center gap-1.5 text-[13px] font-medium text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
					>
						All platforms
						<ChevronDown class="size-3.5 transition-transform {showAllPlatforms ? 'rotate-180' : ''}" />
					</button>

					{#if showAllPlatforms}
						<div class="mt-4 grid gap-2 sm:grid-cols-2" style="animation: fadeUp 0.2s ease-out;">
							{#each otherPlatforms as platform}
								<a
									href="{RELEASE_BASE}/{platform.file}"
									class="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all hover:bg-accent"
								>
									<Monitor class="size-4 text-muted-foreground" />
									<div class="flex-1">
										<p class="text-[13px] font-medium text-foreground">{platform.label}</p>
										<p class="text-[11px] text-muted-foreground">{platform.sublabel}</p>
									</div>
									<Download class="size-3.5 text-muted-foreground/50" />
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Final CTA ─── -->
	<section class="border-t border-border">
		<div class="mx-auto max-w-6xl px-6 py-20 sm:py-28">
			<div class="text-center">
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Ready to modernize your pasal?
				</h2>
				<p class="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
					Set up in under 2 minutes. Free to start, no credit card.
				</p>
				<div class="mt-7">
					<Button
						href="/login"
						size="lg"
						class="h-11 rounded-xl px-7 text-sm"
					>
						Get Started
						<ArrowRight class="ml-1 size-4" />
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── Footer ─── -->
	<footer class="border-t border-zinc-100 py-10 dark:border-zinc-900">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
				<div class="flex items-center gap-2.5">
					<div class="flex size-7 items-center justify-center rounded-lg bg-primary">
						<Store class="size-3.5 text-primary-foreground" />
					</div>
					<span class="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">MeroPasal</span>
					<span class="text-[13px] text-zinc-300 dark:text-zinc-700">/</span>
					<span class="text-[13px] text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif;">मेरो पसल</span>
				</div>
				<nav class="flex flex-wrap items-center gap-5 text-[13px]">
					<a href="#features" class="text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">Features</a>
					<a href="#download" class="text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">Download</a>
					<a href="/login" class="text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">Sign in</a>
				</nav>
			</div>
			<div class="mt-6 border-t border-zinc-100 pt-6 text-center text-[12px] text-zinc-400 dark:border-zinc-900 dark:text-zinc-600">
				Built for Nepali businesses &middot; नेपाली व्यापारको लागि बनाइएको
			</div>
		</div>
	</footer>
</div>
{/if}

<style>
	@keyframes grow {
		from { height: 0%; }
	}
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
