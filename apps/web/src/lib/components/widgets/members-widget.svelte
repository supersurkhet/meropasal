<script lang="ts">
	import { toast } from 'svelte-sonner'
	import { MoreHorizontal, UserPlus, Trash2, RefreshCw, X } from '@lucide/svelte'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table'
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog'
	import * as Select from '$lib/components/ui/select'
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu'

	let { token }: { token: string } = $props()

	// --- Types ---
	type MemberRole = { name: string; slug: string; description: string | null }
	type MemberStatus = 'Active' | 'Invited' | 'InviteExpired' | 'InviteRevoked' | 'NoInvite'
	type MemberAction = 'edit-role' | 'resend-invite' | 'revoke-invite' | 'revoke-membership'

	type Member = {
		id: string
		email: string
		emailVerified: boolean
		profilePictureUrl: string | null
		firstName: string | null
		lastName: string | null
		createdAt: string
		lastActivityAt: string | null
		status: MemberStatus
		actions: MemberAction[]
		isLoggedInUser: boolean | null
		roles: MemberRole[] | null
	}

	type ListMeta = { before: string | null; after: string | null }

	type ConfigRole = {
		name: string
		slug: string
		default: boolean
		description: string | null
	}

	// --- State ---
	let members = $state<Member[]>([])
	let listMeta = $state<ListMeta>({ before: null, after: null })
	let roles = $state<ConfigRole[]>([])
	let multipleRolesEnabled = $state(false)

	let loading = $state(true)
	let error = $state<string | null>(null)

	let search = $state('')
	let roleFilter = $state('')
	let cursorStack = $state<string[]>([]) // stack of 'after' cursors for Prev nav
	let currentAfter = $state<string | null>(null)

	// Invite dialog
	let inviteOpen = $state(false)
	let inviteEmail = $state('')
	let inviteRole = $state('')
	let inviteLoading = $state(false)

	// Mutation loading per member
	let mutatingId = $state<string | null>(null)

	// --- Debounce search ---
	let searchTimer: ReturnType<typeof setTimeout> | null = null

	const BASE = 'https://api.workos.com'

	function authHeaders(): HeadersInit {
		return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
	}

	async function apiGet<T>(path: string): Promise<T> {
		const res = await fetch(`${BASE}${path}`, { headers: authHeaders() })
		if (!res.ok) {
			const body = await res.json().catch(() => ({ message: res.statusText })) as { message: string }
			throw new Error(body.message)
		}
		return res.json() as Promise<T>
	}

	async function apiPost<T>(path: string, body: unknown): Promise<T> {
		const res = await fetch(`${BASE}${path}`, {
			method: 'POST',
			headers: authHeaders(),
			body: JSON.stringify(body),
		})
		if (!res.ok) {
			const b = await res.json().catch(() => ({ message: res.statusText })) as { message: string }
			throw new Error(b.message)
		}
		return res.json() as Promise<T>
	}

	async function apiDelete<T>(path: string): Promise<T> {
		const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() })
		if (!res.ok) {
			const b = await res.json().catch(() => ({ message: res.statusText })) as { message: string }
			throw new Error(b.message)
		}
		return res.json() as Promise<T>
	}

	async function fetchMembers(after: string | null = null) {
		loading = true
		error = null
		try {
			const params = new URLSearchParams({ limit: '20' })
			if (search) params.set('search', search)
			if (roleFilter) params.set('role', roleFilter)
			if (after) params.set('after', after)

			const data = await apiGet<{ data: Member[]; list_metadata: ListMeta }>(
				`/_widgets/UserManagement/members?${params}`,
			)
			members = data.data
			listMeta = data.list_metadata
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load members'
		} finally {
			loading = false
		}
	}

	async function fetchRoles() {
		try {
			const data = await apiGet<{ roles: ConfigRole[]; multipleRolesEnabled: boolean }>(
				'/_widgets/UserManagement/roles-and-config',
			)
			roles = data.roles
			multipleRolesEnabled = data.multipleRolesEnabled
			// Pre-select default role for invite
			const def = data.roles.find((r) => r.default)
			if (def) inviteRole = def.slug
		} catch {
			// non-fatal
		}
	}

	// Initial load
	$effect(() => {
		fetchMembers()
		fetchRoles()
	})

	// Debounced search / role filter re-fetch
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		search; roleFilter
		if (searchTimer) clearTimeout(searchTimer)
		searchTimer = setTimeout(() => {
			cursorStack = []
			currentAfter = null
			fetchMembers(null)
		}, 300)
		return () => {
			if (searchTimer) clearTimeout(searchTimer)
		}
	})

	function goNext() {
		if (!listMeta.after) return
		cursorStack = [...cursorStack, currentAfter ?? '']
		currentAfter = listMeta.after
		fetchMembers(currentAfter)
	}

	function goPrev() {
		if (!cursorStack.length) return
		const stack = [...cursorStack]
		const prev = stack.pop() ?? null
		cursorStack = stack
		currentAfter = prev
		fetchMembers(prev || null)
	}

	// --- Invite ---
	async function submitInvite() {
		if (!inviteEmail) return
		inviteLoading = true
		try {
			await apiPost('/_widgets/UserManagement/invite-user', {
				email: inviteEmail,
				roles: inviteRole ? [inviteRole] : [],
			})
			toast.success('Invitation sent')
			inviteOpen = false
			inviteEmail = ''
			fetchMembers(currentAfter)
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to send invite')
		} finally {
			inviteLoading = false
		}
	}

	// --- Per-member mutations ---
	async function updateRole(member: Member, slug: string) {
		mutatingId = member.id
		try {
			await apiPost(`/_widgets/UserManagement/members/${member.id}`, { roles: [slug] })
			toast.success('Role updated')
			fetchMembers(currentAfter)
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to update role')
		} finally {
			mutatingId = null
		}
	}

	async function revokeMembership(member: Member) {
		mutatingId = member.id
		try {
			await apiDelete(`/_widgets/UserManagement/members/${member.id}`)
			toast.success('Membership revoked')
			fetchMembers(currentAfter)
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to revoke membership')
		} finally {
			mutatingId = null
		}
	}

	async function resendInvite(member: Member) {
		mutatingId = member.id
		try {
			await apiPost(`/_widgets/UserManagement/invites/${member.id}/resend`, {})
			toast.success('Invite resent')
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to resend invite')
		} finally {
			mutatingId = null
		}
	}

	async function revokeInvite(member: Member) {
		mutatingId = member.id
		try {
			await apiDelete(`/_widgets/UserManagement/invites/${member.id}`)
			toast.success('Invite revoked')
			fetchMembers(currentAfter)
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to revoke invite')
		} finally {
			mutatingId = null
		}
	}

	// --- Helpers ---
	function initials(member: Member): string {
		const f = member.firstName?.[0] ?? ''
		const l = member.lastName?.[0] ?? ''
		return (f + l).toUpperCase() || member.email[0].toUpperCase()
	}

	function displayName(member: Member): string {
		if (member.firstName || member.lastName) {
			return [member.firstName, member.lastName].filter(Boolean).join(' ')
		}
		return member.email
	}

	const ROLE_COLORS: Record<string, string> = {
		owner: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
		manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
		accountant: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
		sales: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
		warehouse: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
		driver: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
	}

	function roleBadgeClass(slug: string): string {
		return ROLE_COLORS[slug] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
	}

	function statusBadgeClass(status: MemberStatus): string {
		switch (status) {
			case 'Active':
				return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
			case 'Invited':
				return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
			case 'InviteExpired':
				return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
			case 'InviteRevoked':
				return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
			default:
				return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
		}
	}

	function statusLabel(status: MemberStatus): string {
		switch (status) {
			case 'Active': return 'Active'
			case 'Invited': return 'Invited'
			case 'InviteExpired': return 'Expired'
			case 'InviteRevoked': return 'Revoked'
			case 'NoInvite': return 'No invite'
		}
	}

	const hasPrev = $derived(cursorStack.length > 0)
	const hasNext = $derived(!!listMeta.after)

	// Default role slug for invite select placeholder
	const defaultRoleSlug = $derived(roles.find((r) => r.default)?.slug ?? '')
</script>

<!-- Invite dialog -->
<Dialog bind:open={inviteOpen}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Invite Member</DialogTitle>
			<DialogDescription>Send an invitation to join your organisation.</DialogDescription>
		</DialogHeader>
		<div class="flex flex-col gap-4 py-2">
			<div class="flex flex-col gap-1.5">
				<label for="invite-email" class="text-sm font-medium">Email</label>
				<Input
					id="invite-email"
					type="email"
					placeholder="colleague@example.com"
					bind:value={inviteEmail}
				/>
			</div>
			{#if roles.length > 0}
				<div class="flex flex-col gap-1.5">
					<label for="invite-role" class="text-sm font-medium">Role</label>
					<Select.Root type="single" bind:value={inviteRole}>
						<Select.Trigger id="invite-role" class="w-full">
							{roles.find((r) => r.slug === inviteRole)?.name ?? 'Select role'}
						</Select.Trigger>
						<Select.Content>
							{#each roles as role (role.slug)}
								<Select.Item value={role.slug}>{role.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => (inviteOpen = false)}>Cancel</Button>
			<Button onclick={submitInvite} disabled={inviteLoading || !inviteEmail}>
				{inviteLoading ? 'Sending…' : 'Send Invite'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Main widget -->
<div class="flex flex-col gap-4">
	<!-- Toolbar -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-1 gap-2">
			<Input
				placeholder="Search members…"
				bind:value={search}
				class="max-w-xs"
			/>
			{#if roles.length > 0}
				<Select.Root type="single" bind:value={roleFilter}>
					<Select.Trigger class="w-40">
						{roles.find((r) => r.slug === roleFilter)?.name ?? 'All roles'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All roles</Select.Item>
						{#each roles as role (role.slug)}
							<Select.Item value={role.slug}>{role.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
		<Button onclick={() => (inviteOpen = true)} class="shrink-0 gap-2">
			<UserPlus class="size-4" />
			Invite Member
		</Button>
	</div>

	<!-- Error banner -->
	{#if error}
		<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
			{error}
		</div>
	{/if}

	<!-- Table -->
	<div class="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
		<Table>
			<TableHeader>
				<TableRow class="bg-zinc-50/80 dark:bg-zinc-900/50">
					<TableHead class="w-[260px]">Member</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Last active</TableHead>
					<TableHead class="w-12"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if loading}
					{#each { length: 5 } as _, i (i)}
						<TableRow>
							<TableCell>
								<div class="flex items-center gap-3">
									<div class="size-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
									<div class="flex flex-col gap-1.5">
										<div class="h-3.5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></div>
										<div class="h-3 w-36 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900"></div>
									</div>
								</div>
							</TableCell>
							<TableCell><div class="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"></div></TableCell>
							<TableCell><div class="h-5 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"></div></TableCell>
							<TableCell><div class="h-3.5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></div></TableCell>
							<TableCell></TableCell>
						</TableRow>
					{/each}
				{:else if members.length === 0}
					<TableRow>
						<TableCell colspan={5}>
							<div class="flex flex-col items-center gap-2 py-12 text-zinc-500 dark:text-zinc-400">
								<p class="text-sm">No members yet. Invite your team to get started.</p>
							</div>
						</TableCell>
					</TableRow>
				{:else}
					{#each members as member (member.id)}
						<TableRow class="group">
							<!-- Member info -->
							<TableCell>
								<div class="flex items-center gap-3">
									{#if member.profilePictureUrl}
										<img
											src={member.profilePictureUrl}
											alt={displayName(member)}
											class="size-8 rounded-full object-cover"
										/>
									{:else}
										<div class="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
											{initials(member)}
										</div>
									{/if}
									<div class="flex flex-col">
										<span class="text-sm font-medium leading-tight">
											{displayName(member)}
											{#if member.isLoggedInUser}
												<span class="ml-1 text-xs text-zinc-400">(you)</span>
											{/if}
										</span>
										{#if member.firstName || member.lastName}
											<span class="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</span>
										{/if}
									</div>
								</div>
							</TableCell>

							<!-- Status -->
							<TableCell>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusBadgeClass(member.status)}">
									{statusLabel(member.status)}
								</span>
							</TableCell>

							<!-- Role -->
							<TableCell>
								{#if member.actions.includes('edit-role') && !member.isLoggedInUser && !multipleRolesEnabled}
									<Select.Root
										type="single"
										value={member.roles?.[0]?.slug ?? ''}
										onValueChange={(slug) => {
											if (slug) updateRole(member, slug)
										}}
									>
										<Select.Trigger class="h-7 w-36 text-xs" disabled={mutatingId === member.id}>
											{member.roles?.[0]?.name ?? 'No role'}
										</Select.Trigger>
										<Select.Content>
											{#each roles as role (role.slug)}
												<Select.Item value={role.slug}>{role.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{:else if member.roles && member.roles.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each member.roles as role (role.slug)}
											<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {roleBadgeClass(role.slug)}">
												{role.name}
											</span>
										{/each}
									</div>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</TableCell>

							<!-- Last active -->
							<TableCell class="text-xs text-zinc-500 dark:text-zinc-400">
								{#if member.lastActivityAt}
									{new Date(member.lastActivityAt).toLocaleDateString()}
								{:else}
									—
								{/if}
							</TableCell>

							<!-- Actions -->
							<TableCell>
								{#if member.actions.length > 0}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
										class="inline-flex size-8 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-zinc-100 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-zinc-800"
										disabled={mutatingId === member.id}
									>
										<MoreHorizontal class="size-4" />
									</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end" class="w-44">
											{#if member.actions.includes('resend-invite')}
												<DropdownMenu.Item
													onclick={() => resendInvite(member)}
													class="gap-2 text-sm"
												>
													<RefreshCw class="size-3.5" />
													Resend invite
												</DropdownMenu.Item>
											{/if}
											{#if member.actions.includes('revoke-invite')}
												<DropdownMenu.Item
													onclick={() => revokeInvite(member)}
													class="gap-2 text-sm text-orange-600 focus:text-orange-600 dark:text-orange-400"
												>
													<X class="size-3.5" />
													Revoke invite
												</DropdownMenu.Item>
											{/if}
											{#if member.actions.includes('revoke-membership')}
												<DropdownMenu.Item
													onclick={() => revokeMembership(member)}
													class="gap-2 text-sm text-red-600 focus:text-red-600 dark:text-red-400"
												>
													<Trash2 class="size-3.5" />
													Remove member
												</DropdownMenu.Item>
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</div>

	<!-- Pagination -->
	{#if hasPrev || hasNext}
		<div class="flex items-center justify-end gap-2">
			<Button variant="outline" size="sm" onclick={goPrev} disabled={!hasPrev || loading}>
				Previous
			</Button>
			<Button variant="outline" size="sm" onclick={goNext} disabled={!hasNext || loading}>
				Next
			</Button>
		</div>
	{/if}
</div>
