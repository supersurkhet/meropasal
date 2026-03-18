<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { ArrowLeft, Users, UserPlus, Shield } from '@lucide/svelte';

	let { data } = $props();

	const roles = ['owner', 'manager', 'accountant', 'sales', 'warehouse', 'driver'];

	function roleBadgeClass(role: string) {
		switch (role) {
			case 'owner': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
			case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'accountant': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'sales': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
			case 'warehouse': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
			case 'driver': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
			default: return 'bg-zinc-100 text-zinc-800';
		}
	}
</script>

<MetaTags title="Members" />

<div class="p-6">
	<div class="mb-6 flex items-center gap-3">
		<a href="/settings">
			<Button variant="ghost" size="icon" class="size-8">
				<ArrowLeft class="size-4" />
			</Button>
		</a>
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<Users class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Members</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">Manage organization members and roles.</p>
			</div>
		</div>
	</div>

	<!-- Current User -->
	<div class="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
					{data.user?.firstName?.[0] ?? '?'}{data.user?.lastName?.[0] ?? ''}
				</div>
				<div>
					<p class="font-medium text-zinc-900 dark:text-zinc-100">
						{data.user?.firstName ?? ''} {data.user?.lastName ?? ''}
					</p>
					<p class="text-sm text-zinc-500">{data.user?.email ?? ''}</p>
				</div>
			</div>
			<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium {roleBadgeClass('owner')}">
				<Shield class="size-3" />
				Owner
			</span>
		</div>
	</div>

	<!-- Invite Section -->
	<div class="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
		<UserPlus class="mx-auto mb-3 size-8 text-zinc-400" />
		<h3 class="font-semibold text-zinc-700 dark:text-zinc-300">Invite Team Members</h3>
		<p class="mt-1 text-sm text-zinc-500">
			Member invitations are managed through WorkOS. Members will receive an email invite to join your organization.
		</p>
		<p class="mt-3 text-xs text-zinc-400">
			Available roles: {roles.join(', ')}
		</p>
	</div>
</div>
