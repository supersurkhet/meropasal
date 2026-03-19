<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, Car, FileText, Loader2 } from '@lucide/svelte';
	import { formatTimestamp } from '$lib/date-utils';
	import { t } from '$lib/t.svelte';

	type Vehicle = {
		_id: string;
		name: string;
		licensePlate: string;
		description?: string;
		isActive: boolean;
		_creationTime: number;
	};

	let {
		vehicle,
		onedit,
		ondelete,
	}: {
		vehicle: Vehicle;
		onedit: () => void;
		ondelete: () => Promise<void>;
	} = $props();

	let deleting = $state(false);

	async function handleDelete() {
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
	<div class="flex items-start justify-between">
		<div>
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{vehicle.name}
			</h2>
			<p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
				{t('detail_created_date').replace('{date}', formatTimestamp(vehicle._creationTime))}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={onedit}
				class="border-zinc-300 dark:border-zinc-700"
			>
				<Pencil class="mr-1.5 size-4" />
				Edit
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={handleDelete}
				disabled={deleting}
				class="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
			>
				{#if deleting}
					<Loader2 class="mr-1.5 size-4 animate-spin" />
				{:else}
					<Trash2 class="mr-1.5 size-4" />
				{/if}
				Deactivate
			</Button>
		</div>
	</div>

	<!-- Info cards -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
			<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
				<Car class="size-4" />
				License Plate
			</div>
			<p class="mt-1 font-mono text-base font-medium text-zinc-900 dark:text-zinc-100">
				{vehicle.licensePlate}
			</p>
		</div>

		<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
			<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
				<Badge variant="secondary" class="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
					Active
				</Badge>
			</div>
			<p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
				This vehicle is available for trips
			</p>
		</div>
	</div>

	<!-- Description -->
	{#if vehicle.description}
		<div class="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
			<div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
				<FileText class="size-4" />
				Description
			</div>
			<p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
				{vehicle.description}
			</p>
		</div>
	{/if}
</div>
