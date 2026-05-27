<script lang="ts">
	import { page } from '$app/state'
	import { Settings2, Users, FileText, ArrowLeft } from '@lucide/svelte'

	const navItems = [
		{ label: 'General', href: '/settings', icon: Settings2, exact: true },
		{ label: 'Members', href: '/settings/members', icon: Users, exact: false },
		{ label: 'Bill Template', href: '/settings/bill-template', icon: FileText, exact: false },
	]

	function isActive(href: string, exact: boolean): boolean {
		return exact ? page.url.pathname === href : page.url.pathname.startsWith(href)
	}
</script>

<div class="flex min-h-full">
	<!-- Desktop left nav -->
	<nav class="hidden w-52 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex-col lg:flex">
		<div class="flex flex-1 flex-col gap-0.5 pt-8 px-3">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {isActive(item.href, item.exact) ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'}"
				>
					<item.icon class="size-4 shrink-0" />
					<span class="text-sm font-medium">{item.label}</span>
				</a>
			{/each}
		</div>
		<div class="px-3 pb-4">
			<a
				href="/dashboard"
				class="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
			>
				<ArrowLeft class="size-3.5" />
				Back to app
			</a>
		</div>
	</nav>
	<!-- Content -->
	<div class="flex-1 min-w-0">
		<slot />
	</div>
</div>
