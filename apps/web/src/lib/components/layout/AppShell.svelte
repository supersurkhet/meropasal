<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import Topbar from './Topbar.svelte';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';

	let {
		children,
		user,
	}: {
		children: import('svelte').Snippet;
		user: { firstName: string | null; lastName: string | null; email: string } | null;
	} = $props();

	let sidebarCollapsed = $state(false);
	let mobileOpen = $state(false);
</script>

<div class="flex h-screen bg-white dark:bg-zinc-950">
	<!-- Desktop sidebar -->
	<div class="hidden lg:block">
		<Sidebar bind:collapsed={sidebarCollapsed} {user} />
	</div>

	<!-- Mobile sidebar (sheet) -->
	<Sheet bind:open={mobileOpen}>
		<SheetContent side="left" class="w-64 p-0">
			<Sidebar collapsed={false} {user} />
		</SheetContent>
	</Sheet>

	<!-- Main content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<Topbar onToggleSidebar={() => (mobileOpen = !mobileOpen)} />

		<main class="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/50">
			{@render children()}
		</main>
	</div>
</div>
