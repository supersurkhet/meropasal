<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import BillForm from '$lib/components/shared/BillForm.svelte';
	import InlineCreateDialog from '$lib/components/shared/InlineCreateDialog.svelte';
	import VehicleForm from './VehicleForm.svelte';
	import { deriveUnitPrice, getAvailableUnits } from '$lib/unit-price';
	import { getConvexClient } from '$lib/convex';
	import { api } from '$lib/api';

	type Vehicle = { _id: string; name: string; licensePlate: string };
	type Product = {
		_id: string;
		title: string;
		unit?: string;
		sellingPrice: number;
		purchasePartyId: string;
	};

	type LineItem = {
		id: string;
		productId: string;
		productTitle: string;
		quantity: number;
		unit: string;
		unitStr: string;
		rate: number;
	};

	let vehicles = $state<Vehicle[]>([]);
	let products = $state<Product[]>([]);
	let loaded = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const [vehiclesData, productsData] = await Promise.all([
			client.query(api.functions.vehicles.list, {}),
			client.query(api.functions.products.list, {}),
		]);
		vehicles = vehiclesData;
		products = productsData;
		loaded = true;
	}

	let vehicleId = $state('');
	let dispatchTime = $state(new Date().toISOString().slice(0, 16));
	let destination = $state('');
	let items = $state<LineItem[]>([]);
	let submitting = $state(false);
	let error = $state('');

	let inlineVehicleOpen = $state(false);

	let nextId = 0;
	function genId() {
		return `item-${++nextId}-${Date.now()}`;
	}

	function addItem() {
		items = [
			...items,
			{
				id: genId(),
				productId: '',
				productTitle: '',
				quantity: 1,
				unit: '',
				unitStr: '',
				rate: 0,
			},
		];
	}

	function selectProduct(index: number, productId: string) {
		const product = products.find((p) => p._id === productId);
		if (!product) return;
		const units = getAvailableUnits(product.unit);
		const defaultUnit = units[0] || 'piece';
		const rate = deriveUnitPrice(product.sellingPrice, product.unit, defaultUnit);
		items[index] = {
			...items[index],
			productId: product._id,
			productTitle: product.title,
			unitStr: product.unit || '',
			unit: defaultUnit,
			rate: Math.round(rate * 100) / 100,
		};
	}

	async function handleSubmit() {
		if (!vehicleId || items.length === 0) return;
		error = '';
		const validItems = items.filter((i) => i.productId && i.quantity > 0);
		if (validItems.length === 0) return;

		submitting = true;
		try {
			const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
			await client.mutation(api.functions.trips.dispatch, {
				vehicleId: vehicleId as any,
				dispatchTime: new Date(dispatchTime).toISOString(),
				destination: destination.trim() || undefined,
				products: validItems.map((item) => ({
					productId: item.productId as any,
					productTitle: item.productTitle,
					quantity: item.quantity,
					unitPrice: item.rate,
					unit: item.unit || undefined,
				})),
			});
			goto('/trips');
		} catch (err: any) {
			error = err.message || 'Failed to dispatch trip';
		} finally {
			submitting = false;
		}
	}

	async function handleInlineVehicleCreate(data: { name: string; licensePlate: string; description?: string }) {
		const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);
		const id = await client.mutation(api.functions.vehicles.create, data);
		vehicleId = id;
		inlineVehicleOpen = false;
		await loadData();
	}

	let selectedVehicleName = $derived(() => {
		const v = vehicles.find((v) => v._id === vehicleId);
		return v ? `${v.name} (${v.licensePlate})` : '';
	});
</script>

{#if !loaded}
	<div class="flex items-center justify-center py-20">
		<div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"></div>
	</div>
{:else}
	{#if error}
		<div class="mx-auto mb-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
			{error}
		</div>
	{/if}

	<BillForm
		title="Trip Dispatch"
		submitLabel="Dispatch Trip"
		bind:items
		onadditem={addItem}
		onsubmit={handleSubmit}
		{submitting}
	>
		{#snippet headerSlot()}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<!-- Vehicle selector -->
				<div class="space-y-1.5">
					<Label class="text-xs font-medium uppercase tracking-wider text-zinc-400">Vehicle</Label>
					<div class="flex gap-2">
						<Select.Root type="single" bind:value={vehicleId}>
							<Select.Trigger class="flex-1">
								{selectedVehicleName() || 'Select vehicle...'}
							</Select.Trigger>
							<Select.Content>
								{#each vehicles as vehicle}
									<Select.Item value={vehicle._id} label="{vehicle.name} ({vehicle.licensePlate})">
										<div>
											<span class="font-medium">{vehicle.name}</span>
											<span class="ml-1.5 font-mono text-xs text-zinc-400">{vehicle.licensePlate}</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						<InlineCreateDialog title="New Vehicle" description="Add a vehicle for trip dispatch" bind:open={inlineVehicleOpen}>
							<div class="p-1">
								<VehicleForm
									inline
									onsubmit={handleInlineVehicleCreate}
									oncancel={() => (inlineVehicleOpen = false)}
								/>
							</div>
						</InlineCreateDialog>
					</div>
				</div>

				<!-- Dispatch Time -->
				<div class="space-y-1.5">
					<Label class="text-xs font-medium uppercase tracking-wider text-zinc-400">Dispatch Time</Label>
					<Input type="datetime-local" bind:value={dispatchTime} />
				</div>

				<!-- Destination -->
				<div class="space-y-1.5">
					<Label class="text-xs font-medium uppercase tracking-wider text-zinc-400">Destination</Label>
					<Input bind:value={destination} placeholder="e.g. Birendranagar Market" />
				</div>
			</div>
		{/snippet}

		{#snippet productSelector({ item, index }: { item: LineItem; index: number })}
			<Select.Root
				type="single"
				value={item.productId}
				onValueChange={(val) => selectProduct(index, val)}
			>
				<Select.Trigger class="h-8 text-sm">
					{item.productTitle || 'Select product...'}
				</Select.Trigger>
				<Select.Content>
					{#each products as product}
						<Select.Item value={product._id} label={product.title}>
							{product.title}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{/snippet}
	</BillForm>
{/if}
