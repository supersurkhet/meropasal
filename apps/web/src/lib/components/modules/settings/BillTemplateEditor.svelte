<script lang="ts">
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import { formatNPR } from '$lib/currency';
	import { formatUnit } from '$lib/unit-price';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Save, Star, Trash2, Plus, Loader2, Eye } from '@lucide/svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { toast } from 'svelte-sonner';

	let { workosOrgName = '', orgMetadata = {} }: { workosOrgName?: string; orgMetadata?: Record<string, unknown> } = $props();

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const templates = useConvexQuery(client, api.functions.billTemplates.list, () => ({}));
	const createMutation = useConvexMutation(client, api.functions.billTemplates.create);
	const updateMutation = useConvexMutation(client, api.functions.billTemplates.update);
	const setDefaultMutation = useConvexMutation(client, api.functions.billTemplates.setDefault);
	const removeMutation = useConvexMutation(client, api.functions.billTemplates.remove);

	let selectedTemplateId = $state<string | null>(null);
	let templateName = $state('Default Template');
	let headerFields = $state<string[]>(['businessName', 'address', 'phone', 'pan']);
	let showLogo = $state(false);
	let logoPosition = $state<'left' | 'center' | 'right'>('left');
	let columnOrder = $state<string[]>(['sn', 'product', 'quantity', 'unit', 'rate', 'amount']);
	let showTax = $state(true);
	let showDiscount = $state(false);
	let footerText = $state('Thank you for your business!');
	let paperSize = $state<'a4' | 'a5' | 'thermal-80mm' | 'thermal-58mm'>('a4');
	let fontSize = $state<'small' | 'medium' | 'large'>('medium');
	let showPaymentDetails = $state(true);

	const allHeaderFields = [
		{ key: 'businessName', label: 'Business Name' },
		{ key: 'address', label: 'Address' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'pan', label: 'PAN Number' },
		{ key: 'logo', label: 'Logo' },
	];

	const allColumns = [
		{ key: 'sn', label: 'S.N.' },
		{ key: 'product', label: 'Product' },
		{ key: 'quantity', label: 'Quantity' },
		{ key: 'unit', label: 'Unit' },
		{ key: 'rate', label: 'Rate' },
		{ key: 'amount', label: 'Amount' },
	];

	function loadTemplate(template: any) {
		selectedTemplateId = template._id;
		templateName = template.templateName;
		const l = template.layout;
		headerFields = l.headerFields ?? ['businessName', 'address', 'phone', 'pan'];
		showLogo = l.showLogo ?? false;
		logoPosition = l.logoPosition ?? 'left';
		columnOrder = l.columnOrder ?? ['sn', 'product', 'quantity', 'unit', 'rate', 'amount'];
		showTax = l.showTax ?? true;
		showDiscount = l.showDiscount ?? false;
		footerText = l.footerText ?? '';
		paperSize = l.paperSize ?? 'a4';
		fontSize = l.fontSize ?? 'medium';
		showPaymentDetails = l.showPaymentDetails ?? true;
	}

	$effect(() => {
		if (templates.data && !selectedTemplateId) {
			const list = templates.data as any[];
			const def = list.find((t) => t.isDefault) ?? list[0];
			if (def) loadTemplate(def);
		}
	});

	function getLayout() {
		return {
			headerFields,
			showLogo,
			logoPosition,
			columnOrder,
			showTax,
			showDiscount,
			footerText: footerText || undefined,
			paperSize,
			fontSize,
			showPaymentDetails,
			customFields: [],
		};
	}

	async function handleSave() {
		try {
			if (selectedTemplateId) {
				await updateMutation.mutate({
					id: selectedTemplateId as any,
					templateName,
					layout: getLayout(),
				});
				toast.success('Template updated.');
			} else {
				await createMutation.mutate({
					templateName,
					isDefault: true,
					layout: getLayout(),
				});
				toast.success('Template created.');
			}
		} catch (err) {
			toast.error(`Failed to save: ${(err as Error).message}`);
		}
	}

	async function handleSetDefault() {
		if (!selectedTemplateId) return;
		try {
			await setDefaultMutation.mutate({ id: selectedTemplateId as any });
			toast.success('Set as default template.');
		} catch (err) {
			toast.error(`Failed: ${(err as Error).message}`);
		}
	}

	async function handleDelete() {
		if (!selectedTemplateId) return;
		try {
			await removeMutation.mutate({ id: selectedTemplateId as any });
			selectedTemplateId = null;
			toast.success('Template deleted.');
		} catch (err) {
			toast.error(`Failed: ${(err as Error).message}`);
		}
	}

	async function handleNew() {
		selectedTemplateId = null;
		templateName = 'New Template';
		headerFields = ['businessName', 'address', 'phone', 'pan'];
		showLogo = false;
		logoPosition = 'left';
		columnOrder = ['sn', 'product', 'quantity', 'unit', 'rate', 'amount'];
		showTax = true;
		showDiscount = false;
		footerText = 'Thank you for your business!';
		paperSize = 'a4';
		fontSize = 'medium';
		showPaymentDetails = true;
	}

	function toggleHeaderField(key: string) {
		if (headerFields.includes(key)) {
			headerFields = headerFields.filter((f) => f !== key);
		} else {
			headerFields = [...headerFields, key];
		}
	}

	function toggleColumn(key: string) {
		if (columnOrder.includes(key)) {
			columnOrder = columnOrder.filter((c) => c !== key);
		} else {
			columnOrder = [...columnOrder, key];
		}
	}

	function moveColumn(key: string, direction: -1 | 1) {
		const idx = columnOrder.indexOf(key);
		if (idx < 0) return;
		const newIdx = idx + direction;
		if (newIdx < 0 || newIdx >= columnOrder.length) return;
		const next = [...columnOrder];
		[next[idx], next[newIdx]] = [next[newIdx], next[idx]];
		columnOrder = next;
	}

	// Sample data for preview
	const sampleItems = [
		{ productTitle: 'Rice 25kg', quantity: 10, unit: 'bag', rate: 2000, total: 20000 },
		{ productTitle: 'Sugar 5kg', quantity: 20, unit: 'pack', rate: 450, total: 9000 },
		{ productTitle: 'Oil 1L', quantity: 15, unit: 'bottle', rate: 300, total: 4500 },
	];

	const sampleSubtotal = 33500;
	const sampleTax = 4355;
	const sampleTotal = 37855;

	const previewPaperClass = $derived.by(() => {
		switch (paperSize) {
			case 'a5': return 'max-w-[420px]';
			case 'thermal-80mm': return 'max-w-[300px]';
			case 'thermal-58mm': return 'max-w-[220px]';
			default: return 'max-w-[600px]';
		}
	});

	const previewFontClass = $derived.by(() => {
		switch (fontSize) {
			case 'small': return 'text-[10px]';
			case 'large': return 'text-sm';
			default: return 'text-xs';
		}
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<!-- Settings Panel (Right on large, top on mobile) -->
	<div class="order-2 lg:order-2 space-y-6">
		<!-- Template Selector -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold text-zinc-900 dark:text-zinc-100">Templates</h3>
				<Button variant="outline" size="sm" onclick={handleNew}>
					<Plus class="mr-1 size-3.5" />
					New
				</Button>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each (templates.data ?? []) as tmpl}
					{@const t = tmpl as any}
					<button
						class="rounded-lg border px-3 py-2 text-sm transition-colors {selectedTemplateId === t._id
							? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
							: 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'}"
						onclick={() => loadTemplate(t)}
					>
						{t.templateName}
						{#if t.isDefault}
							<Star class="ml-1 inline size-3 fill-current" />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<Separator />

		<!-- Template Name -->
		<div class="space-y-2">
			<Label for="templateName">Template Name</Label>
			<Input id="templateName" bind:value={templateName} />
		</div>

		<!-- Header Fields -->
		<div class="space-y-2">
			<Label>Header Fields</Label>
			<div class="flex flex-wrap gap-2">
				{#each allHeaderFields as field}
					<label class="flex items-center gap-2 rounded border border-zinc-200 px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
						<Checkbox
							checked={headerFields.includes(field.key)}
							onCheckedChange={() => toggleHeaderField(field.key)}
						/>
						{field.label}
					</label>
				{/each}
			</div>
		</div>

		<!-- Logo Settings -->
		<div class="space-y-2">
			<label class="flex items-center gap-2">
				<Checkbox bind:checked={showLogo} />
				<Label>Show Logo</Label>
			</label>
			{#if showLogo}
				<div class="flex gap-2">
					{#each (['left', 'center', 'right'] as const) as pos}
						<button
							class="rounded border px-3 py-1 text-xs capitalize {logoPosition === pos ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-700'}"
							onclick={() => { logoPosition = pos; }}
						>
							{pos}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Column Order -->
		<div class="space-y-2">
			<Label>Columns</Label>
			<div class="space-y-1">
				{#each allColumns as col}
					{@const isActive = columnOrder.includes(col.key)}
					{@const idx = columnOrder.indexOf(col.key)}
					<div class="flex items-center gap-2 rounded border border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
						<Checkbox
							checked={isActive}
							onCheckedChange={() => toggleColumn(col.key)}
						/>
						<span class="flex-1 text-sm">{col.label}</span>
						{#if isActive}
							<button
								class="text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
								disabled={idx === 0}
								onclick={() => moveColumn(col.key, -1)}
							>
								&#9650;
							</button>
							<button
								class="text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
								disabled={idx === columnOrder.length - 1}
								onclick={() => moveColumn(col.key, 1)}
							>
								&#9660;
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Display Options -->
		<div class="space-y-3">
			<Label>Display Options</Label>
			<div class="grid grid-cols-2 gap-2">
				<label class="flex items-center gap-2 text-sm">
					<Checkbox bind:checked={showTax} />
					Show Tax
				</label>
				<label class="flex items-center gap-2 text-sm">
					<Checkbox bind:checked={showDiscount} />
					Show Discount
				</label>
				<label class="flex items-center gap-2 text-sm">
					<Checkbox bind:checked={showPaymentDetails} />
					Show Payments
				</label>
			</div>
		</div>

		<!-- Paper Size -->
		<div class="space-y-2">
			<Label>Paper Size</Label>
			<div class="flex flex-wrap gap-2">
				{#each (['a4', 'a5', 'thermal-80mm', 'thermal-58mm'] as const) as size}
					<button
						class="rounded border px-3 py-1.5 text-xs uppercase {paperSize === size ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-700'}"
						onclick={() => { paperSize = size; }}
					>
						{size}
					</button>
				{/each}
			</div>
		</div>

		<!-- Font Size -->
		<div class="space-y-2">
			<Label>Font Size</Label>
			<div class="flex gap-2">
				{#each (['small', 'medium', 'large'] as const) as size}
					<button
						class="rounded border px-3 py-1.5 text-xs capitalize {fontSize === size ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-700'}"
						onclick={() => { fontSize = size; }}
					>
						{size}
					</button>
				{/each}
			</div>
		</div>

		<!-- Footer -->
		<div class="space-y-2">
			<Label for="footerText">Footer Text</Label>
			<Input id="footerText" bind:value={footerText} placeholder="Thank you for your business!" />
		</div>

		<!-- Actions -->
		<div class="flex gap-2">
			<Button onclick={handleSave} disabled={updateMutation.isLoading || createMutation.isLoading}>
				{#if updateMutation.isLoading || createMutation.isLoading}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{:else}
					<Save class="mr-1.5 size-4" />
				{/if}
				Save
			</Button>
			{#if selectedTemplateId}
				<Button variant="outline" onclick={handleSetDefault}>
					<Star class="mr-1.5 size-4" />
					Set Default
				</Button>
				<Button variant="destructive" size="icon" onclick={handleDelete}>
					<Trash2 class="size-4" />
				</Button>
			{/if}
		</div>
	</div>

	<!-- Live Preview (Left) -->
	<div class="order-1 lg:order-1">
		<div class="sticky top-6">
			<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
				<Eye class="size-4" />
				Live Preview
			</div>
			<div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
				<div class="{previewPaperClass} mx-auto rounded bg-white p-6 shadow-sm dark:bg-zinc-950">
					<div class={previewFontClass}>
						<!-- Header -->
						<div class="mb-4 text-center {logoPosition === 'left' ? 'text-left' : logoPosition === 'right' ? 'text-right' : 'text-center'}">
							{#if showLogo}
								<div class="mb-2 inline-block rounded bg-zinc-200 px-4 py-2 text-[10px] text-zinc-500 dark:bg-zinc-800">[LOGO]</div>
							{/if}
							{#if headerFields.includes('businessName')}
								<h2 class="font-bold text-base">{workosOrgName || 'Business Name'}</h2>
							{/if}
							{#if headerFields.includes('address')}
								<p class="text-zinc-600">{orgMetadata.location ?? 'Surkhet, Nepal'}</p>
							{/if}
							{#if headerFields.includes('phone')}
								<p class="text-zinc-600">Tel: {orgMetadata.phone ?? '+977-...'}</p>
							{/if}
							{#if headerFields.includes('pan')}
								<p class="text-zinc-600">PAN: {orgMetadata.panNumber ?? '000000000'}</p>
							{/if}
						</div>

						<div class="mb-3 border-b-2 border-black pb-1 text-center font-bold uppercase">Sales Invoice</div>

						<div class="mb-3 flex justify-between text-[10px]">
							<div>
								<p><strong>Invoice #:</strong> SAL-82/83-00001</p>
								<p><strong>Date:</strong> 2026-03-15</p>
							</div>
							<div class="text-right">
								<p><strong>FY:</strong> 82/83</p>
								<p><strong>Customer:</strong> Ram Grocery</p>
							</div>
						</div>

						<!-- Items -->
						<table class="mb-3 w-full border-collapse border border-zinc-300 text-[10px]">
							<thead>
								<tr class="bg-zinc-100 dark:bg-zinc-800">
									{#each columnOrder as col}
										{#if col === 'sn'}<th class="border border-zinc-300 px-1.5 py-0.5 text-left">S.N.</th>
										{:else if col === 'product'}<th class="border border-zinc-300 px-1.5 py-0.5 text-left">Product</th>
										{:else if col === 'quantity'}<th class="border border-zinc-300 px-1.5 py-0.5 text-center">Qty</th>
										{:else if col === 'unit'}<th class="border border-zinc-300 px-1.5 py-0.5 text-center">Unit</th>
										{:else if col === 'rate'}<th class="border border-zinc-300 px-1.5 py-0.5 text-right">Rate</th>
										{:else if col === 'amount'}<th class="border border-zinc-300 px-1.5 py-0.5 text-right">Amount</th>
										{/if}
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each sampleItems as item, i}
									<tr>
										{#each columnOrder as col}
											{#if col === 'sn'}<td class="border border-zinc-300 px-1.5 py-0.5">{i + 1}</td>
											{:else if col === 'product'}<td class="border border-zinc-300 px-1.5 py-0.5">{item.productTitle}</td>
											{:else if col === 'quantity'}<td class="border border-zinc-300 px-1.5 py-0.5 text-center">{item.quantity}</td>
											{:else if col === 'unit'}<td class="border border-zinc-300 px-1.5 py-0.5 text-center">{formatUnit(item.unit)}</td>
											{:else if col === 'rate'}<td class="border border-zinc-300 px-1.5 py-0.5 text-right">{formatNPR(item.rate)}</td>
											{:else if col === 'amount'}<td class="border border-zinc-300 px-1.5 py-0.5 text-right">{formatNPR(item.total)}</td>
											{/if}
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>

						<!-- Totals -->
						<div class="flex justify-end text-[10px]">
							<div class="w-36">
								<div class="flex justify-between border-b border-zinc-200 py-0.5">
									<span>Subtotal</span>
									<span>{formatNPR(sampleSubtotal)}</span>
								</div>
								{#if showTax}
									<div class="flex justify-between border-b border-zinc-200 py-0.5">
										<span>Tax (13%)</span>
										<span>{formatNPR(sampleTax)}</span>
									</div>
								{/if}
								<div class="flex justify-between py-0.5 font-bold">
									<span>Total</span>
									<span>{formatNPR(showTax ? sampleTotal : sampleSubtotal)}</span>
								</div>
							</div>
						</div>

						{#if showPaymentDetails}
							<div class="mt-2 text-[10px]">
								<p><strong>Payment:</strong> Cash — Rs. 37,855.00</p>
							</div>
						{/if}

						{#if footerText}
							<div class="mt-4 border-t border-zinc-300 pt-1 text-center text-[10px] text-zinc-500">
								{footerText}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
