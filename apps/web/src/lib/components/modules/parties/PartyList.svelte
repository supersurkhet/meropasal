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

	let filteredParties = $derived(
		parties.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.phone?.includes(searchQuery) ||
				p.address?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	async function handleDelete(id: string) {
		if (!ondelete) return;
		deletingId = id;
		try {
			await ondelete(id);
		} finally {
			deletingId = null;
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
				placeholder="Search parties..."
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
		<a href="/parties/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				New Party
			</Button>
		</a>
	</div>

	<!-- Table -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">Loading parties...</p>
			</div>
		</div>
	{:else if filteredParties.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
			<div class="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
				<Users class="size-6 text-zinc-400" />
			</div>
			<h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
				{searchQuery ? 'No parties found' : 'No parties yet'}
			</h3>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				{searchQuery ? 'Try a different search term' : 'Create your first supplier party to get started'}
			</p>
			{#if !searchQuery}
				<a href="/parties/new" class="mt-4">
					<Button
						size="sm"
						variant="outline"
						class="border-zinc-300 shadow-sm dark:border-zinc-700"
					>
						<Plus class="mr-1.5 size-4" />
						Add Party
					</Button>
				</a>
			{/if}
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">Name</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">PAN Number</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">Contact</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">Credit Limit</TableHead>
						<TableHead class="w-12"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredParties as party (party._id)}
						<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40">
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
											class="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
										>
											<MoreHorizontal class="size-4 text-zinc-500" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" class="w-40">
										<a href="/parties/{party._id}">
											<DropdownMenuItem class="cursor-pointer">
												<Pencil class="mr-2 size-4" />
												Edit
											</DropdownMenuItem>
										</a>
										{#if ondelete}
											<DropdownMenuItem
												class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
												disabled={deletingId === party._id}
												onclick={() => handleDelete(party._id)}
											>
												{#if deletingId === party._id}
													<Loader2 class="mr-2 size-4 animate-spin" />
												{:else}
													<Trash2 class="mr-2 size-4" />
												{/if}
												Deactivate
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
