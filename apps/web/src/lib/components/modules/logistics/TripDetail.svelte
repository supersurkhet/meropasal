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
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { formatNPR, formatNumber } from '$lib/currency';
	import {
		Truck,
		MapPin,
		Clock,
		Package,
		RotateCcw,
		CheckCircle2,
		XCircle,
		FileText,
		Loader2,
		ArrowRight,
	} from '@lucide/svelte';

	type TripProduct = {
		productId: string;
		productTitle: string;
		quantity: number;
		unitPrice: number;
		unit?: string;
	};

	type Trip = {
		_id: string;
		vehicleId: string;
		dispatchTime: string;
		returnTime?: string;
		destination?: string;
		status: 'dispatched' | 'returned' | 'cancelled';
		products: TripProduct[];
		returnedProducts: TripProduct[];
		invoiceIds?: string[];
	};

	type Vehicle = {
		_id: string;
		name: string;
		licensePlate: string;
	};

	let {
		trip,
		vehicle,
		onreturn,
		oncancel,
	}: {
		trip: Trip;
		vehicle?: Vehicle | null;
		onreturn: (data: { returnTime: string; returnedProducts: TripProduct[] }) => Promise<void>;
		oncancel: () => Promise<void>;
	} = $props();

	let returning = $state(false);
	let cancelling = $state(false);
	let returnTime = $state(new Date().toISOString().slice(0, 16));

	// Pre-fill returned quantities with dispatched quantities (user reduces for sold items)
	let returnQuantities = $state<Record<string, number>>(
		Object.fromEntries(trip.products.map((p) => [p.productId, p.quantity]))
	);

	const statusConfig = {
		dispatched: { label: 'Dispatched', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Truck },
		returned: { label: 'Returned', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
		cancelled: { label: 'Cancelled', class: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400', icon: XCircle },
	};

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleDateString('en-NP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function markAllReturned() {
		returnQuantities = Object.fromEntries(
			trip.products.map((p) => [p.productId, p.quantity])
		);
	}

	function updateReturnQty(productId: string, value: string) {
		const qty = parseFloat(value);
		const dispatched = trip.products.find((p) => p.productId === productId)?.quantity ?? 0;
		if (Number.isFinite(qty) && qty >= 0 && qty <= dispatched) {
			returnQuantities[productId] = qty;
		}
	}

	async function handleReturn() {
		returning = true;
		try {
			const returnedProducts: TripProduct[] = trip.products
				.map((p) => ({
					productId: p.productId,
					productTitle: p.productTitle,
					quantity: returnQuantities[p.productId] ?? 0,
					unitPrice: p.unitPrice,
					unit: p.unit,
				}))
				.filter((p) => p.quantity > 0);

			await onreturn({
				returnTime: new Date(returnTime).toISOString(),
				returnedProducts,
			});
		} finally {
			returning = false;
		}
	}

	async function handleCancel() {
		cancelling = true;
		try {
			await oncancel();
		} finally {
			cancelling = false;
		}
	}

	// Sold summary for returned trips
	let soldSummary = $derived(
		trip.status === 'returned'
			? trip.products.map((p) => {
					const returned = trip.returnedProducts.find((r) => r.productId === p.productId);
					const returnedQty = returned?.quantity ?? 0;
					const soldQty = p.quantity - returnedQty;
					return {
						...p,
						returnedQty,
						soldQty,
						soldAmount: soldQty * p.unitPrice,
					};
				})
			: []
	);

	let totalDispatched = $derived(
		trip.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
	);

	let totalSold = $derived(
		soldSummary.reduce((sum, p) => sum + p.soldAmount, 0)
	);

	const cfg = statusConfig[trip.status];
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-3">
				<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
					Trip to {trip.destination || 'N/A'}
				</h2>
				<Badge variant="secondary" class={cfg.class}>
					{cfg.label}
				</Badge>
			</div>
			{#if vehicle}
				<p class="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
					<Truck class="size-4" />
					{vehicle.name}
					<span class="font-mono text-xs">({vehicle.licensePlate})</span>
				</p>
			{/if}
		</div>
		{#if trip.status === 'dispatched'}
			<Button
				variant="outline"
				size="sm"
				onclick={handleCancel}
				disabled={cancelling}
				class="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
			>
				{#if cancelling}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{:else}
					<XCircle class="mr-1.5 size-4" />
				{/if}
				Cancel Trip
			</Button>
		{/if}
	</div>

	<!-- Info cards -->
	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
			<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
				<Clock class="size-4" />
				Dispatch Time
			</div>
			<p class="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
				{formatDateTime(trip.dispatchTime)}
			</p>
		</div>
		{#if trip.destination}
			<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
				<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
					<MapPin class="size-4" />
					Destination
				</div>
				<p class="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
					{trip.destination}
				</p>
			</div>
		{/if}
		{#if trip.returnTime}
			<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
				<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
					<RotateCcw class="size-4" />
					Return Time
				</div>
				<p class="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
					{formatDateTime(trip.returnTime)}
				</p>
			</div>
		{/if}
	</div>

	<!-- Dispatched Products (read-only) -->
	<div>
		<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
			<Package class="size-4" />
			Dispatched Products
		</h3>
		<div class="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
			<Table>
				<TableHeader>
					<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
						<TableHead class="text-xs font-semibold text-zinc-500">Product</TableHead>
						<TableHead class="text-center text-xs font-semibold text-zinc-500">Qty</TableHead>
						<TableHead class="text-xs font-semibold text-zinc-500">Unit</TableHead>
						<TableHead class="text-right text-xs font-semibold text-zinc-500">Rate</TableHead>
						<TableHead class="text-right text-xs font-semibold text-zinc-500">Amount</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each trip.products as product}
						<TableRow class="border-zinc-100 dark:border-zinc-800">
							<TableCell class="font-medium text-zinc-900 dark:text-zinc-100">{product.productTitle}</TableCell>
							<TableCell class="text-center font-mono">{product.quantity}</TableCell>
							<TableCell class="text-zinc-500">{product.unit || 'piece'}</TableCell>
							<TableCell class="text-right font-mono">{formatNumber(product.unitPrice)}</TableCell>
							<TableCell class="text-right font-mono font-medium">{formatNumber(product.quantity * product.unitPrice)}</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
			<div class="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/30">
				<span class="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Dispatched</span>
				<span class="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatNPR(totalDispatched)}</span>
			</div>
		</div>
	</div>

	<!-- Return Section (only for dispatched trips) -->
	{#if trip.status === 'dispatched'}
		<Separator />
		<div class="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 dark:border-amber-700 dark:bg-amber-950/20">
			<h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
				<RotateCcw class="size-5 text-amber-600 dark:text-amber-400" />
				Return Trip
			</h3>

			<!-- Return Time -->
			<div class="mb-4 max-w-xs space-y-1.5">
				<Label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Return Time</Label>
				<Input type="datetime-local" bind:value={returnTime} />
			</div>

			<!-- Returned Products -->
			<div class="mb-4">
				<div class="mb-2 flex items-center justify-between">
					<p class="text-sm text-zinc-600 dark:text-zinc-400">
						Adjust quantities below — reduce for items that were sold on the trip.
					</p>
					<Button
						variant="outline"
						size="sm"
						onclick={markAllReturned}
						class="text-xs"
					>
						Mark All Returned
					</Button>
				</div>

				<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
					<Table>
						<TableHeader>
							<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
								<TableHead class="text-xs font-semibold text-zinc-500">Product</TableHead>
								<TableHead class="text-center text-xs font-semibold text-zinc-500">Dispatched</TableHead>
								<TableHead class="text-center text-xs font-semibold text-zinc-500">Returned</TableHead>
								<TableHead class="text-center text-xs font-semibold text-zinc-500">Sold</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each trip.products as product}
								{@const returnedQty = returnQuantities[product.productId] ?? 0}
								{@const soldQty = product.quantity - returnedQty}
								<TableRow class="border-zinc-100 dark:border-zinc-800">
									<TableCell class="font-medium text-zinc-900 dark:text-zinc-100">
										{product.productTitle}
									</TableCell>
									<TableCell class="text-center font-mono text-zinc-500">
										{product.quantity}
									</TableCell>
									<TableCell class="text-center">
										<Input
											type="number"
											min="0"
											max={product.quantity}
											step="1"
											class="mx-auto h-8 w-20 text-center font-mono text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
											value={String(returnedQty)}
											oninput={(e) => updateReturnQty(product.productId, (e.target as HTMLInputElement).value)}
										/>
									</TableCell>
									<TableCell class="text-center">
										{#if soldQty > 0}
											<Badge variant="secondary" class="bg-green-100 font-mono text-green-700 dark:bg-green-900/30 dark:text-green-400">
												{soldQty} sold
											</Badge>
										{:else}
											<span class="font-mono text-sm text-zinc-400">0</span>
										{/if}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</div>

			<!-- Return action -->
			<Button
				onclick={handleReturn}
				disabled={returning}
				class="gap-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
			>
				{#if returning}
					<Loader2 class="size-4 animate-spin" />
					Processing Return...
				{:else}
					<RotateCcw class="size-4" />
					Complete Return
				{/if}
			</Button>
		</div>
	{/if}

	<!-- Sold Summary (for returned trips) -->
	{#if trip.status === 'returned'}
		<div>
			<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
				<CheckCircle2 class="size-4 text-green-600 dark:text-green-400" />
				Trip Summary
			</h3>
			<div class="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
				<Table>
					<TableHeader>
						<TableRow class="border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
							<TableHead class="text-xs font-semibold text-zinc-500">Product</TableHead>
							<TableHead class="text-center text-xs font-semibold text-zinc-500">Dispatched</TableHead>
							<TableHead class="text-center text-xs font-semibold text-zinc-500">Returned</TableHead>
							<TableHead class="text-center text-xs font-semibold text-zinc-500">Sold</TableHead>
							<TableHead class="text-right text-xs font-semibold text-zinc-500">Sold Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each soldSummary as row}
							<TableRow class="border-zinc-100 dark:border-zinc-800">
								<TableCell class="font-medium text-zinc-900 dark:text-zinc-100">{row.productTitle}</TableCell>
								<TableCell class="text-center font-mono">{row.quantity}</TableCell>
								<TableCell class="text-center font-mono">{row.returnedQty}</TableCell>
								<TableCell class="text-center">
									{#if row.soldQty > 0}
										<Badge variant="secondary" class="bg-green-100 font-mono text-green-700 dark:bg-green-900/30 dark:text-green-400">
											{row.soldQty}
										</Badge>
									{:else}
										<span class="font-mono text-zinc-400">0</span>
									{/if}
								</TableCell>
								<TableCell class="text-right font-mono font-medium">
									{row.soldAmount > 0 ? formatNPR(row.soldAmount) : '—'}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
				{#if totalSold > 0}
					<div class="flex items-center justify-between border-t border-zinc-200 bg-green-50/50 px-4 py-2.5 dark:border-zinc-800 dark:bg-green-950/20">
						<span class="text-sm font-medium text-green-700 dark:text-green-400">Total Sold</span>
						<span class="font-mono text-sm font-bold text-green-700 dark:text-green-400">{formatNPR(totalSold)}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Invoice link -->
		{#if trip.invoiceIds && trip.invoiceIds.length > 0}
			<div class="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
				<div class="flex items-center gap-2">
					<FileText class="size-4 text-blue-600 dark:text-blue-400" />
					<span class="text-sm font-medium text-blue-700 dark:text-blue-300">Auto-generated Invoice</span>
				</div>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each trip.invoiceIds as invoiceId}
						<a
							href="/invoices/{invoiceId}"
							class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-400 dark:hover:bg-blue-950"
						>
							View Invoice
							<ArrowRight class="size-3.5" />
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
