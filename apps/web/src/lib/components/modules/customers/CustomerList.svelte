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
		Mail,
		UserRound,
		Loader2,
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { t } from '$lib/t.svelte';

	type Customer = {
		_id: string;
		name: string;
		panNumber?: string;
		address?: string;
		phone?: string;
		email?: string;
		creditLimit?: number;
		notes?: string;
		isActive: boolean;
	};

	let {
		customers,
		isLoading = false,
		ondelete,
	}: {
		customers: Customer[];
		isLoading?: boolean;
		ondelete?: (id: string) => Promise<void>;
	} = $props();

	let searchQuery = $state('');
	let deletingId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);
	let confirmOpen = $state(false);

	let filteredCustomers = $derived(
		customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.phone?.includes(searchQuery) ||
				c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.address?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function requestDelete(id: string) {
		confirmDeleteId = id;
		confirmOpen = true;
	}

	async function handleDelete() {
		if (!ondelete || !confirmDeleteId) return;
		deletingId = confirmDeleteId;
		try {
			await ondelete(confirmDeleteId);
			toast.success(t('toast_customer_deleted'));
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
				placeholder={t('search_customers')}
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
			/>
		</div>
		<a href="/customers/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('customer_create')}
			</Button>
		</a>
	</div>

	<!-- Table -->
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<Loader2 class="size-8 animate-spin text-zinc-400" />
				<p class="text-sm text-zinc-500">{t('common_loading_customers')}</p>
			</div>
		</div>
	{:else if filteredCustomers.length === 0}
		{#if searchQuery}
			<EmptyState
				icon={UserRound}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={UserRound}
				title={t('empty_customers')}
				description={t('empty_customers_desc')}
				actionLabel={t('action_add_customer')}
				actionHref="/customers/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('customer_name')}</TableHead>
						<TableHead class="font-semibold text-zinc-600 dark:text-zinc-400">{t('customer_pan_number')}</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 md:table-cell">{t('customer_phone')}</TableHead>
						<TableHead class="hidden font-semibold text-zinc-600 dark:text-zinc-400 lg:table-cell">{t('customer_credit_limit')}</TableHead>
						<TableHead class="w-12"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredCustomers as customer (customer._id)}
						<TableRow class="group border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-900/40">
							<TableCell>
								<a href="/customers/{customer._id}" class="block">
									<div class="font-medium text-zinc-900 dark:text-zinc-100">{customer.name}</div>
									{#if customer.address}
										<div class="mt-0.5 text-xs text-zinc-500">{customer.address}</div>
									{/if}
								</a>
							</TableCell>
							<TableCell>
								{#if customer.panNumber}
									<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
										{customer.panNumber}
									</Badge>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</TableCell>
							<TableCell class="hidden md:table-cell">
								<div class="space-y-0.5">
									{#if customer.phone}
										<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
											<Phone class="size-3.5" />
											{customer.phone}
										</div>
									{/if}
									{#if customer.email}
										<div class="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
											<Mail class="size-3.5" />
											{customer.email}
										</div>
									{/if}
									{#if !customer.phone && !customer.email}
										<span class="text-xs text-zinc-400">—</span>
									{/if}
								</div>
							</TableCell>
							<TableCell class="hidden lg:table-cell">
								{#if customer.creditLimit}
									<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
										{formatCurrency(customer.creditLimit)}
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
											aria-label="More options"
										>
											<MoreHorizontal class="size-4 text-zinc-500" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" class="w-40">
										<a href="/customers/{customer._id}">
											<DropdownMenuItem class="cursor-pointer">
												<Pencil class="mr-2 size-4" />
												{t('action_edit')}
											</DropdownMenuItem>
										</a>
										{#if ondelete}
											<DropdownMenuItem
												class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
												disabled={deletingId === customer._id}
												onclick={() => requestDelete(customer._id)}
											>
												{#if deletingId === customer._id}
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
			{filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
			{#if searchQuery}&middot; filtered from {customers.length}{/if}
		</p>
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('action_deactivate') + ' ' + t('customer_title')}
	description={t('confirm_delete_customer')}
	confirmLabel={t('action_deactivate')}
	loading={deletingId !== null}
	onconfirm={handleDelete}
	oncancel={() => { confirmDeleteId = null; }}
/>
