<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Pencil,
		Phone,
		Mail,
		MapPin,
		CreditCard,
		FileText,
		Loader2,
		Trash2,
	} from '@lucide/svelte';
	import { formatTimestamp } from '$lib/date-utils';
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
		_creationTime: number;
	};

	let {
		customer,
		onedit,
		ondelete,
	}: {
		customer: Customer;
		onedit?: () => void;
		ondelete?: () => Promise<void>;
	} = $props();

	let deleting = $state(false);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ne-NP', {
			style: 'currency',
			currency: 'NPR',
			maximumFractionDigits: 0,
		}).format(amount);
	}

	async function handleDelete() {
		if (!ondelete) return;
		deleting = true;
		try {
			await ondelete();
		} finally {
			deleting = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-3">
				<h2 class="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
					{customer.name}
				</h2>
				{#if customer.panNumber}
					<Badge variant="secondary" class="shrink-0 bg-zinc-100 font-mono text-xs dark:bg-zinc-800">
						PAN: {customer.panNumber}
					</Badge>
				{/if}
			</div>
			<p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
				{t('detail_added_date').replace('{date}', formatTimestamp(customer._creationTime))}
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if ondelete}
				<Button
					variant="ghost"
					size="sm"
					onclick={handleDelete}
					disabled={deleting}
					class="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
				>
					{#if deleting}
						<Loader2 class="mr-1.5 size-4 animate-spin" />
					{:else}
						<Trash2 class="mr-1.5 size-4" />
					{/if}
					Deactivate
				</Button>
			{/if}
			{#if onedit}
				<Button
					size="sm"
					onclick={onedit}
					class="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
				>
					<Pencil class="mr-1.5 size-4" />
					Edit
				</Button>
			{/if}
		</div>
	</div>

	<Separator class="bg-zinc-100 dark:bg-zinc-800" />

	<!-- Details grid -->
	<div class="grid gap-5 sm:grid-cols-2">
		{#if customer.phone}
			<div class="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/30">
				<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
					<Phone class="size-4 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-400">{t('customer_phone')}</p>
					<p class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.phone}</p>
				</div>
			</div>
		{/if}

		{#if customer.email}
			<div class="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/30">
				<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
					<Mail class="size-4 text-indigo-600 dark:text-indigo-400" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-400">{t('common_email')}</p>
					<p class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.email}</p>
				</div>
			</div>
		{/if}

		{#if customer.address}
			<div class="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/30">
				<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
					<MapPin class="size-4 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-400">{t('customer_address')}</p>
					<p class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.address}</p>
				</div>
			</div>
		{/if}

		{#if customer.creditLimit}
			<div class="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/30">
				<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
					<CreditCard class="size-4 text-amber-600 dark:text-amber-400" />
				</div>
				<div>
					<p class="text-xs font-medium uppercase tracking-wider text-zinc-400">{t('customer_credit_limit')}</p>
					<p class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(customer.creditLimit)}</p>
				</div>
			</div>
		{/if}
	</div>

	{#if customer.notes}
		<div class="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
			<div class="mb-2 flex items-center gap-2">
				<FileText class="size-4 text-zinc-400" />
				<p class="text-xs font-medium uppercase tracking-wider text-zinc-400">{t('customer_notes')}</p>
			</div>
			<p class="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{customer.notes}</p>
		</div>
	{/if}
</div>
