<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatNPR } from '$lib/currency';
	import { parseUnit } from '$lib/unit-price';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';
	import { toast } from 'svelte-sonner';
	import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from '@lucide/svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { t } from '$lib/t.svelte';

	type Product = {
		_id: string;
		title: string;
		purchasePartyId: string;
		unit?: string;
		costPrice: number;
		sellingPrice?: number;
		openingStock: number;
		category?: string;
		sku?: string;
		isActive: boolean;
	};

	type Party = {
		_id: string;
		name: string;
	};

	let products = $state<Product[]>([]);
	let parties = $state<Party[]>([]);
	let loaded = $state(false);
	let searchTerm = $state('');

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const [productsData, partiesData] = await Promise.all([
			client.query(api.functions.products.list, {}),
			client.query(api.functions.parties.list, {}),
		]);
		products = productsData;
		parties = partiesData;
		loaded = true;
	}

	function getPartyName(partyId: string): string {
		return parties.find((p) => p._id === partyId)?.name ?? '—';
	}

	let filteredProducts = $derived(
		searchTerm
			? products.filter((p) =>
					p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
					(p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
				)
			: products,
	);

	let confirmDeleteId = $state<string | null>(null);
	let confirmOpen = $state(false);
	let deleting = $state(false);

	function requestDelete(id: string) {
		confirmDeleteId = id;
		confirmOpen = true;
	}

	async function handleDelete() {
		if (!confirmDeleteId) return;
		deleting = true;
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
			await client.mutation(api.functions.products.remove, { id: confirmDeleteId as any });
			toast.success(t('toast_product_deleted'));
			await loadData();
		} finally {
			deleting = false;
			confirmOpen = false;
			confirmDeleteId = null;
		}
	}
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center justify-between gap-3">
		<div class="relative max-w-sm flex-1">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
			<Input
				class="h-9 border-zinc-200 bg-white pl-9 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
				placeholder={t('search_products')}
				bind:value={searchTerm}
			/>
		</div>
		<a href="/products/new">
			<Button
				size="sm"
				class="bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
			>
				<Plus class="mr-1.5 size-4" />
				{t('product_create')}
			</Button>
		</a>
	</div>

	<!-- Table -->
	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
		</div>
	{:else if filteredProducts.length === 0}
		{#if searchTerm}
			<EmptyState
				icon={Package}
				title={t('empty_search')}
				description={t('empty_search_desc')}
			/>
		{:else}
			<EmptyState
				icon={Package}
				title={t('empty_products')}
				description={t('empty_products_desc')}
				actionLabel={t('product_create')}
				actionHref="/products/new"
				actionIcon={Plus}
			/>
		{/if}
	{:else}
		<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('product_name')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('product_supplier')}</Table.Head>
						<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('table_cost')}</Table.Head>
						<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('table_selling')}</Table.Head>
						<Table.Head class="text-center font-semibold text-zinc-600 dark:text-zinc-400">{t('product_unit')}</Table.Head>
						<Table.Head class="text-right font-semibold text-zinc-600 dark:text-zinc-400">{t('table_stock')}</Table.Head>
						<Table.Head class="font-semibold text-zinc-600 dark:text-zinc-400">{t('product_category')}</Table.Head>
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredProducts as product (product._id)}
						{@const parsed = parseUnit(product.unit)}
						<Table.Row class="group border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
							<Table.Cell>
								<a
									href="/products/{product._id}"
									class="block font-medium text-zinc-900 dark:text-zinc-100"
								>
									{product.title}
								</a>
							</Table.Cell>
							<Table.Cell class="text-sm text-zinc-600 dark:text-zinc-400">
								{getPartyName(product.purchasePartyId)}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
								{formatNPR(product.costPrice, true)}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
								{formatNPR(product.sellingPrice ?? 0, true)}
							</Table.Cell>
							<Table.Cell class="text-center">
								<Badge variant="secondary" class="bg-zinc-100 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
									{parsed.baseUnit}{parsed.piecesPerUnit > 1 ? `:${parsed.piecesPerUnit}` : ''}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
								{product.openingStock}
							</Table.Cell>
							<Table.Cell>
								{#if product.category}
									<Badge variant="outline" class="text-xs capitalize border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300">{product.category}</Badge>
								{:else}
									<span class="text-xs text-zinc-400">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button
											variant="ghost"
											size="sm"
											class="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
											aria-label="More options"
										>
											<MoreHorizontal class="size-4 text-zinc-500" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-40">
										<a href="/products/{product._id}">
											<DropdownMenu.Item class="cursor-pointer">
												<Pencil class="mr-2 size-4" />
												{t('action_edit')}
											</DropdownMenu.Item>
										</a>
										<DropdownMenu.Item
											class="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
											onclick={() => requestDelete(product._id)}
										>
											<Trash2 class="mr-2 size-4" />
											{t('action_deactivate')}
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<p class="text-xs text-zinc-400 dark:text-zinc-500">
			{filteredProducts.length} {filteredProducts.length === 1 ? t('product_title') : t('product_title_plural')}
			{#if searchTerm}&middot; {t('common_filtered_from')} {products.length}{/if}
		</p>
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={t('action_deactivate') + ' ' + t('product_title')}
	description={t('confirm_delete_product')}
	confirmLabel={t('action_deactivate')}
	loading={deleting}
	onconfirm={handleDelete}
/>
