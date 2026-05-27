<script lang="ts">
	import { page } from '$app/state'
	import { Building2, FileSliders, Users, UserRound } from '@lucide/svelte'

	let { children } = $props()

	const tabs = [
		{ label: 'Organization', href: '/settings/organization', icon: Building2 },
		{ label: 'Bill Template', href: '/settings/bill-template', icon: FileSliders },
		{ label: 'Members', href: '/settings/members', icon: Users },
		{ label: 'Profile', href: '/settings/profile', icon: UserRound },
	]

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/')
	}
</script>

<div class="flex min-h-full flex-col">
	<div class="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
		<nav class="flex gap-1 overflow-x-auto px-4 lg:px-6" aria-label="Settings sections">
			{#each tabs as tab}
				{@const active = isActive(tab.href)}
				<a
					href={tab.href}
					data-active={active}
					class="group flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors
						{active
							? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
							: 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
				>
					<tab.icon class="size-4 shrink-0" />
					{tab.label}
				</a>
			{/each}
		</nav>
	</div>
	<div class="flex-1 p-6 lg:p-8">
		{@render children()}
	</div>
</div>
