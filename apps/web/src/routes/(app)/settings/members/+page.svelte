<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { ArrowLeft, Users, UserPlus, Shield, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { t } from '$lib/t.svelte';

	let { data, form } = $props()

	const PERMISSION_GROUPS = [
		{
			label: 'Products',
			permissions: [
				{ key: 'products:create', label: 'Create products' },
				{ key: 'products:edit', label: 'Edit products' },
				{ key: 'products:delete', label: 'Delete products' },
			]
		},
		{
			label: 'Stock',
			permissions: [
				{ key: 'stock:import', label: 'Import stock' },
				{ key: 'stock:view', label: 'View stock' },
			]
		},
		{
			label: 'Sales & Orders',
			permissions: [
				{ key: 'sales:create', label: 'Create sales' },
				{ key: 'sales:view', label: 'View sales' },
				{ key: 'orders:create', label: 'Create orders' },
				{ key: 'orders:fulfill', label: 'Fulfill orders' },
				{ key: 'orders:cancel', label: 'Cancel orders' },
			]
		},
		{
			label: 'Finance',
			permissions: [
				{ key: 'invoices:view', label: 'View invoices' },
				{ key: 'ledger:view', label: 'View ledger' },
				{ key: 'ledger:edit', label: 'Edit ledger' },
				{ key: 'reports:view', label: 'View reports' },
			]
		},
		{
			label: 'Logistics',
			permissions: [
				{ key: 'vehicles:manage', label: 'Manage vehicles' },
				{ key: 'trips:dispatch', label: 'Dispatch trips' },
				{ key: 'trips:return', label: 'Return trips' },
			]
		},
		{
			label: 'Organization',
			permissions: [
				{ key: 'parties:manage', label: 'Manage suppliers' },
				{ key: 'customers:manage', label: 'Manage customers' },
				{ key: 'settings:edit', label: 'Edit settings' },
				{ key: 'members:manage', label: 'Manage members' },
			]
		},
	]

	let inviteOpen = $state(false)
	let inviteEmail = $state('')
	let inviteRole = $state<string>('sales')
	let selectedPermissions = $state<Set<string>>(new Set())
	let submitting = $state(false)

	function togglePermission(key: string) {
		const next = new Set(selectedPermissions)
		if (next.has(key)) {
			next.delete(key)
		} else {
			next.add(key)
		}
		selectedPermissions = next
	}

	function toggleGroup(group: typeof PERMISSION_GROUPS[number]) {
		const allSelected = group.permissions.every(p => selectedPermissions.has(p.key))
		const next = new Set(selectedPermissions)
		for (const p of group.permissions) {
			if (allSelected) {
				next.delete(p.key)
			} else {
				next.add(p.key)
			}
		}
		selectedPermissions = next
	}

	function selectAllPermissions() {
		const all = new Set<string>()
		for (const group of PERMISSION_GROUPS) {
			for (const p of group.permissions) {
				all.add(p.key)
			}
		}
		selectedPermissions = all
	}

	function clearAllPermissions() {
		selectedPermissions = new Set()
	}

	const roles = ['owner', 'manager', 'accountant', 'sales', 'warehouse', 'driver'] as const

	function roleBadgeClass(role: string) {
		switch (role) {
			case 'owner': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
			case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
			case 'accountant': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
			case 'sales': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
			case 'warehouse': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
			case 'driver': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
			default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
		}
	}

	function roleLabel(role: string) {
		return role.charAt(0).toUpperCase() + role.slice(1)
	}

	function memberInitials(member: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
		if (member.firstName) {
			return (member.firstName[0] ?? '') + (member.lastName?.[0] ?? '')
		}
		return member.email?.[0]?.toUpperCase() ?? '?'
	}

	function memberName(member: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
		if (member.firstName || member.lastName) {
			return [member.firstName, member.lastName].filter(Boolean).join(' ')
		}
		return member.email ?? 'Unknown'
	}

	$effect(() => {
		if (form?.success) {
			inviteOpen = false
			inviteEmail = ''
			inviteRole = 'sales'
			selectedPermissions = new Set()
		}
	})
</script>

<MetaTags title="{t('settings_members')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/settings">
				<Button variant="ghost" size="icon" class="size-8">
					<ArrowLeft class="size-4" />
				</Button>
			</a>
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm dark:bg-zinc-100">
					<Users class="size-5 text-white dark:text-zinc-900" />
				</div>
				<div>
					<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('settings_members')}</h1>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">Manage organization members and access control.</p>
				</div>
			</div>
		</div>

		<Button onclick={() => (inviteOpen = true)} class="shadow-sm hover:shadow-md dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
			<UserPlus class="mr-1.5 size-4" />
			Invite Member
		</Button>

		<Dialog bind:open={inviteOpen}>
			<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Invite a Member</DialogTitle>
					<DialogDescription>Send an email invitation with granular access control.</DialogDescription>
				</DialogHeader>
				<form
					method="POST"
					action="?/inviteMember"
					use:enhance={() => {
						submitting = true
						return async ({ update }) => {
							submitting = false
							await update()
						}
					}}
				>
					<div class="space-y-5 py-4">
						{#if form?.error}
							<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
								{form.error}
							</div>
						{/if}
						<div class="space-y-2">
							<label for="email" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="colleague@example.com"
								bind:value={inviteEmail}
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="role" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Base Role</label>
							<select
								id="role"
								name="role"
								bind:value={inviteRole}
								class="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
							>
								{#each roles as role}
									<option value={role}>{roleLabel(role)}</option>
								{/each}
							</select>
						</div>

						<!-- Granular Permissions -->
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Permissions</label>
								<div class="flex gap-2">
									<button type="button" onclick={selectAllPermissions} class="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">Select all</button>
									<span class="text-xs text-zinc-300 dark:text-zinc-600">|</span>
									<button type="button" onclick={clearAllPermissions} class="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">Clear all</button>
								</div>
							</div>
							<input type="hidden" name="permissions" value={JSON.stringify([...selectedPermissions])} />

							<div class="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
								{#each PERMISSION_GROUPS as group}
									{@const allSelected = group.permissions.every(p => selectedPermissions.has(p.key))}
									{@const someSelected = group.permissions.some(p => selectedPermissions.has(p.key))}
									<div>
										<label class="flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={allSelected}
												indeterminate={someSelected && !allSelected}
												onchange={() => toggleGroup(group)}
												class="size-3.5 rounded border-zinc-300 dark:border-zinc-600"
											/>
											<span class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{group.label}</span>
										</label>
										<div class="ml-5 mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
											{#each group.permissions as perm}
												<label class="flex items-center gap-2 cursor-pointer py-0.5">
													<input
														type="checkbox"
														checked={selectedPermissions.has(perm.key)}
														onchange={() => togglePermission(perm.key)}
														class="size-3.5 rounded border-zinc-300 dark:border-zinc-600"
													/>
													<span class="text-sm text-zinc-700 dark:text-zinc-300">{perm.label}</span>
												</label>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" type="button" onclick={() => (inviteOpen = false)}>Cancel</Button>
						<Button type="submit" disabled={submitting || !inviteEmail}>
							{submitting ? 'Sending...' : 'Send Invitation'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if form?.success && form?.message}
		<div class="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
			{form.message}
		</div>
	{/if}

	<!-- Members Table -->
	<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
		<Table>
			<TableHeader>
				<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
					<TableHead class="w-[50%] font-semibold text-zinc-600 dark:text-zinc-400">Member</TableHead>
					<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Role</TableHead>
					<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Status</TableHead>
					<TableHead class="w-[80px]"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each data.members as member (member.id)}
					<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40">
						<TableCell>
							<div class="flex items-center gap-3">
								<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
									{memberInitials(member)}
								</div>
								<div class="min-w-0">
									<p class="truncate font-medium text-zinc-900 dark:text-zinc-100">
										{memberName(member)}
									</p>
									{#if member.email}
										<p class="truncate text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
									{/if}
								</div>
							</div>
						</TableCell>
						<TableCell>
							{#if member.userId === data.user?.id || member.role === 'owner'}
								<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium {roleBadgeClass(member.role)}">
									<Shield class="size-3" />
									{roleLabel(member.role)}
								</span>
							{:else}
								<form method="POST" action="?/changeRole" use:enhance>
									<input type="hidden" name="membershipId" value={member.id} />
									<select
										name="role"
										class="rounded-full border-0 bg-transparent px-2.5 py-0.5 text-xs font-medium {roleBadgeClass(member.role)} cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:bg-transparent"
										value={member.role}
										onchange={(e) => e.currentTarget.form?.requestSubmit()}
									>
										{#each roles as role}
											<option value={role}>{roleLabel(role)}</option>
										{/each}
									</select>
								</form>
							{/if}
						</TableCell>
						<TableCell>
							<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {
								member.status === 'active'
									? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
									: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
							}">
								{member.status === 'active' ? 'Active' : 'Pending'}
							</span>
						</TableCell>
						<TableCell>
							{#if member.userId !== data.user?.id}
								<form method="POST" action="?/removeMember" use:enhance>
									<input type="hidden" name="membershipId" value={member.id} />
									<Button variant="ghost" size="icon" class="size-7 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500" type="submit">
										<Trash2 class="size-4" />
									</Button>
								</form>
							{/if}
						</TableCell>
					</TableRow>
				{:else}
					<TableRow>
						<TableCell colspan={4} class="py-8 text-center text-zinc-500 dark:text-zinc-400">
							No members found. Invite your team to get started.
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>

	<p class="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
		Permissions are enforced at the API level. Each member's access is determined by their role and individual permission grants.
	</p>
</div>
