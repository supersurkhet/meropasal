<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import Topbar from './Topbar.svelte';
	import Breadcrumb from '$lib/components/shared/Breadcrumb.svelte';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { shortcuts } from '$lib/shortcuts';
	import { t } from '$lib/t.svelte';

	let {
		children,
		user,
		workosOrgName = '',
		userOrgs = [],
		currentOrgId = '',
	}: {
		children: import('svelte').Snippet;
		user: { firstName: string | null; lastName: string | null; email: string } | null;
		workosOrgName?: string;
		userOrgs?: Array<{ id: string; name: string }>;
		currentOrgId?: string | null;
	} = $props();

	let sidebarCollapsed = $state(false);
	let mobileOpen = $state(false);
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
>
	{t('a11y_skip_to_content')}
</a>

<svelte:window use:shortcuts />

<div class="flex h-screen bg-white dark:bg-zinc-950">
	<!-- Desktop sidebar -->
	<div class="hidden lg:block">
		<Sidebar bind:collapsed={sidebarCollapsed} {user} {workosOrgName} {userOrgs} {currentOrgId} />
	</div>

	<!-- Mobile sidebar (sheet) -->
	<Sheet bind:open={mobileOpen}>
		<SheetContent side="left" class="w-64 p-0">
			<Sidebar collapsed={false} {user} {workosOrgName} {userOrgs} {currentOrgId} />
		</SheetContent>
	</Sheet>

	<!-- Main content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<Topbar onToggleSidebar={() => (mobileOpen = !mobileOpen)} />

		<main id="main-content" tabindex="-1" class="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/50">
			<div class="px-4 pt-4 sm:px-6">
				<Breadcrumb />
			</div>
			{@render children()}
		</main>
	</div>
</div>
