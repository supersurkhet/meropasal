<script lang="ts">
	import { PanelLeft, Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import ThemeToggle from './ThemeToggle.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import CommandPalette from '$lib/components/shared/CommandPalette.svelte';
	import NotificationPopover from '$lib/components/shared/NotificationPopover.svelte';
	import { t } from '$lib/t.svelte';

	let { onToggleSidebar }: { onToggleSidebar: () => void } = $props();

	let commandOpen = $state(false);

	function onkeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			commandOpen = !commandOpen;
		}
	}
</script>

<svelte:window {onkeydown} />

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

	<!-- Search trigger -->
	<div class="flex flex-1 items-center">
		<button
			type="button"
			onclick={() => (commandOpen = true)}
			class="hidden h-9 w-full max-w-sm cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-white sm:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-950"
		>
			<Search class="size-4" />
			<span class="flex-1 text-left">{t('action_search')}...</span>
			<kbd class="pointer-events-none rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
				⌘K
			</kbd>
		</button>
	</div>

	<!-- Right actions -->
	<div class="flex items-center gap-1.5">
		<LanguageSwitcher />
		<ThemeToggle />
		<NotificationPopover />
	</div>
</header>

<CommandPalette bind:open={commandOpen} />
