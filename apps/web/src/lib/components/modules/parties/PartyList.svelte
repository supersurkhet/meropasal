<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import {
		Plus,
		Search,
		MoreHorizontal,
		Pencil,
		Trash2,
		Phone,
		MapPin,
		Users,
		Loader2,
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { t } from '$lib/t.svelte';

	type Party = {
		_id: string;
		name: string;
		panNumber?: string;
		address?: string;
		phone?: string;
		creditLimit?: number;
		paymentTerms?: string;
		notes?: string;
		isActive: boolean;
	};

	let {
		parties,
		isLoading = false,
		ondelete,
	}: {
		parties: Party[];
		isLoading?: boolean;
		ondelete?: (id: string) => Promise<void>;
	} = $props();

	let searchQuery = $state('');
	let deletingId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);
	let confirmOpen = $state(false);

	let filteredParties = $derived(
		parties.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.phone?.includes(searchQuery) ||
				p.address?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function requestDelete(id: string) {
		confirmDeleteId = id;
		confirmOpen = true;
	}

	async function handleDelete(id: string) {
		if (!ondelete) return;
		deletingId = id;
		try {
			await ondelete(id);
			toast.success(t('toast_party_deleted'));
		} finally {
			deletingId = null;
			confirmDeleteId = null;
			confirmOpen = false;
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ne-NP', {
			style: 'currency',
			currency: 'NPR',
			maximumFractionDigits: 0,
		}).format(amount);
	}
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
			<Input
				bind:value={searchQuery}
				placeholder={t('search_parties')}
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
		<a href="/parties/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('action_new_party')}
			</Button>
		</a>
	</div>

	<!-- Table -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">{t('common_loading_parties')}</p>
			</div>
		</div>
	{:else if filteredParties.length === 0}
		{#if searchQuery}
			<EmptyState
				icon={Users}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={Users}
				title={t('empty_parties')}
				description={t('empty_parties_desc')}
				actionLabel={t('action_add_party')}
				actionHref="/parties/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('party_name')}</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('party_pan_number')}</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">{t('party_phone')}</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">{t('party_credit_limit')}</TableHead>
						<TableHead class="w-12"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredParties as party (party._id)}
						<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
							<TableCell>
								<a href="/parties/{party._id}" class="block">
									<div class="font-medium text-zinc-900 dark:text-zinc-100">{party.name}</div>
									{#if party.address}
										<div class="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
											<MapPin class="size-3" />
											{party.address}
										</div>
									{/if}
								</a>
							</TableCell>
							<TableCell>
								{#if party.panNumber}
									<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
										{party.panNumber}
									</Badge>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</TableCell>
							<TableCell class="hidden md:table-cell">
								{#if party.phone}
									<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
										<Phone class="size-3.5" />
										{party.phone}
									</div>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</TableCell>
							<TableCell class="hidden lg:table-cell">
								{#if party.creditLimit}
									<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
										{formatCurrency(party.creditLimit)}
									</span>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</TableCell>
							<TableCell>
								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button
											variant="ghost"
											size="sm"
											class="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100" aria-label="More options"
										>
											<MoreHorizontal class="size-4 text-zinc-500" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" class="w-40">
										<a href="/parties/{party._id}">
											<DropdownMenuItem class="cursor-pointer">
												<Pencil class="mr-2 size-4" />
												{t('action_edit')}
											</DropdownMenuItem>
										</a>
										{#if ondelete}
											<DropdownMenuItem
												class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
												disabled={deletingId === party._id}
												onclick={() => requestDelete(party._id)}
											>
												{#if deletingId === party._id}
													<Loader2 class="mr-2 size-4 animate-spin" />
												{:else}
													<Trash2 class="mr-2 size-4" />
												{/if}
												{t('action_deactivate')}
											</DropdownMenuItem>
										{/if}
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
		<p class="text-xs text-zinc-400 dark:text-zinc-500">
			{filteredParties.length} {filteredParties.length === 1 ? 'party' : 'parties'}
			{#if searchQuery}&middot; filtered from {parties.length}{/if}
		</p>
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('action_deactivate') + ' ' + t('party_title')}
	description={t('confirm_delete_party')}
	confirmLabel={t('action_deactivate')}
	loading={deletingId !== null}
	onconfirm={() => {
		if (confirmDeleteId) handleDelete(confirmDeleteId);
	}}
	oncancel={() => {
		confirmDeleteId = null;
	}}
/>
