<script lang="ts">
	import { PanelLeft, Bell, Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { t } from '$lib/t';

	let { onToggleSidebar }: { onToggleSidebar: () => void } = $props();
</script>

<header class="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
	<!-- Mobile sidebar toggle -->
	<Button
		variant="ghost"
		size="icon"
		class="size-8 lg:hidden"
		onclick={onToggleSidebar}
		aria-label={t('a11y_toggle_sidebar')}
	>
		<PanelLeft class="size-4" />
	</Button>

	<!-- Search (placeholder) -->
	<div class="flex flex-1 items-center">
		<div class="relative hidden w-full max-w-sm sm:block" role="search" aria-label={t('a11y_search')}>
			<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
			<input
				type="text"
				placeholder="{t('action_search')}... (⌘K)"
				aria-label={t('a11y_search')}
				class="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
			/>
		</div>
	</div>

	<!-- Right actions -->
	<div class="flex items-center gap-1.5">
		<LanguageSwitcher />
		<ThemeToggle />
		<Button variant="ghost" size="icon" class="relative size-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100" aria-label={t('a11y_notifications')}>
			<Bell class="size-4" />
			<span class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500"></span>
		</Button>
	</div>
</header>
