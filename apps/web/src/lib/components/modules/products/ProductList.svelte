<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatNPR } from '$lib/currency';
	import { parseUnit } from '$lib/unit-price';
	import { getConvexClient } from '$lib/convex';
	import { api } from '../../../../convex/_generated/api';
	import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from '@lucide/svelte';

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

	async function handleDelete(id: string) {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		await client.mutation(api.functions.products.remove, { id: id as any });
		await loadData();
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Products</h1>
			<p class="mt-0.5 text-sm text-zinc-500">
				{products.length} product{products.length !== 1 ? 's' : ''} in inventory
			</p>
		</div>
		<Button href="/products/new" class="gap-2">
			<Plus class="size-4" />
			New Product
		</Button>
	</div>

	<!-- Search -->
	<div class="relative max-w-sm">
		<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
		<Input
			class="pl-9"
			placeholder="Search products..."
			bind:value={searchTerm}
		/>
	</div>

	<!-- Table -->
	{#if !loaded}
		<div class="flex items-center justify-center py-20">
			<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
		</div>
	{:else if filteredProducts.length === 0}
		<div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
			<Package class="mb-3 size-10 text-zinc-300 dark:text-zinc-600" />
			{#if searchTerm}
				<p class="text-sm text-zinc-500">No products match "{searchTerm}"</p>
			{:else}
				<p class="text-sm text-zinc-500">No products yet</p>
				<Button href="/products/new" variant="outline" size="sm" class="mt-3 gap-2">
					<Plus class="size-3.5" />
					Create your first product
				</Button>
			{/if}
		</div>
	{:else}
		<div class="rounded-lg border border-zinc-200 dark:border-zinc-800">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head>Title</Table.Head>
						<Table.Head>Supplier</Table.Head>
						<Table.Head class="text-right">Cost</Table.Head>
						<Table.Head class="text-right">Selling</Table.Head>
						<Table.Head class="text-center">Unit</Table.Head>
						<Table.Head class="text-right">Stock</Table.Head>
						<Table.Head>Category</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredProducts as product (product._id)}
						{@const parsed = parseUnit(product.unit)}
						<Table.Row>
							<Table.Cell class="font-medium">
								<a
									href="/products/{product._id}"
									class="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
								>
									{product.title}
								</a>
							</Table.Cell>
							<Table.Cell class="text-zinc-500">
								{getPartyName(product.purchasePartyId)}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums">
								{formatNPR(product.costPrice, true)}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums">
								{formatNPR(product.sellingPrice ?? 0, true)}
							</Table.Cell>
							<Table.Cell class="text-center">
								<Badge variant="secondary" class="font-mono text-xs">
									{parsed.baseUnit}{parsed.piecesPerUnit > 1 ? `:${parsed.piecesPerUnit}` : ''}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums">
								{product.openingStock}
							</Table.Cell>
							<Table.Cell>
								{#if product.category}
									<Badge variant="outline" class="text-xs capitalize">{product.category}</Badge>
								{:else}
									<span class="text-zinc-300 dark:text-zinc-600">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button variant="ghost" size="icon" class="size-8">
											<MoreHorizontal class="size-4" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<a href="/products/{product._id}">
											<DropdownMenu.Item class="gap-2">
												<Pencil class="size-3.5" />
												Edit
											</DropdownMenu.Item>
										</a>
										<DropdownMenu.Item
											class="gap-2 text-destructive focus:text-destructive"
											onclick={() => handleDelete(product._id)}
										>
											<Trash2 class="size-3.5" />
											Deactivate
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
