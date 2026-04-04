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
		orgMetadata = {},
		userOrgs = [],
		currentOrgId = '',
		impersonator = null,
	}: {
		children: import('svelte').Snippet;
		user: { firstName: string | null; lastName: string | null; email: string } | null;
		workosOrgName?: string;
		orgMetadata?: Record<string, unknown>;
		userOrgs?: Array<{ id: string; name: string }>;
		currentOrgId?: string | null;
		impersonator?: { email: string; reason: string | null } | null;
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

{#if impersonator}
	<div class="fixed inset-x-0 top-0 z-[200] flex items-center justify-between bg-amber-500 px-4 py-1.5 text-sm font-medium text-black">
		<span>
			Impersonating as <strong>{user?.email}</strong>
			{#if impersonator.reason}
				&mdash; {impersonator.reason}
			{/if}
			<span class="ml-2 opacity-70">(by {impersonator.email})</span>
		</span>
		<a
			href="/api/auth/stop-impersonating"
			class="rounded-md bg-black/10 px-3 py-0.5 font-semibold transition-colors hover:bg-black/20"
		>
			Stop Impersonating
		</a>
	</div>
{/if}

<div class="flex h-screen bg-white dark:bg-zinc-950 {impersonator ? 'pt-9' : ''}">
	<!-- Desktop sidebar -->
	<div class="hidden lg:block">
		<Sidebar bind:collapsed={sidebarCollapsed} {user} {workosOrgName} {orgMetadata} {userOrgs} {currentOrgId} />
	</div>

	<!-- Mobile sidebar (sheet) -->
	<Sheet bind:open={mobileOpen}>
		<SheetContent side="left" class="w-64 p-0" showClose={false}>
			<Sidebar collapsed={false} {user} {workosOrgName} {orgMetadata} {userOrgs} {currentOrgId} />
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
