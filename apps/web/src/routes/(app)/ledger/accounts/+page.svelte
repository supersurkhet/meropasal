<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { getConvexClient } from '$lib/convex';
	import { useConvexQuery } from '$lib/convex-helpers.svelte';
	import { api } from '$lib/api';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, List, Lock } from '@lucide/svelte';

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL);

	const accounts = useConvexQuery(client, api.functions.ledger.listAccounts, () => ({}));

	const sortedAccounts = $derived.by(() => {
		if (!accounts.data) return [];
		return [...(accounts.data as any[])].sort((a, b) => a.code.localeCompare(b.code));
	});

	function typeBadgeClass(type: string) {
		switch (type) {
			case 'asset': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'liability': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			case 'equity': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
			case 'revenue': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'expense': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
			default: return 'bg-zinc-100 text-zinc-800';
		}
	}
</script>

<MetaTags title="Chart of Accounts" />

<div class="p-6">
	<div class="mb-6 flex items-center gap-3">
		<a href="/ledger">
			<Button variant="ghost" size="icon" class="size-8">
				<ArrowLeft class="size-4" />
			</Button>
		</a>
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<List class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Chart of Accounts</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">All accounts in the ledger system.</p>
			</div>
		</div>
	</div>

	{#if accounts.isLoading}
		<div class="flex items-center justify-center py-12 text-zinc-500">
			<div class="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
			<span class="ml-2 text-sm">Loading accounts...</span>
		</div>
	{:else if !sortedAccounts.length}
		<div class="flex flex-col items-center justify-center py-16 text-zinc-500">
			<List class="mb-3 size-10 opacity-40" />
			<p class="text-sm">No accounts configured</p>
			<p class="mt-1 text-xs text-zinc-400">Accounts are created during org initialization.</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-zinc-50 dark:bg-zinc-900/50">
						<Table.Head class="font-semibold">Code</Table.Head>
						<Table.Head class="font-semibold">Name</Table.Head>
						<Table.Head class="font-semibold">Type</Table.Head>
						<Table.Head class="text-center font-semibold">System</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each sortedAccounts as account}
						<Table.Row class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
							<Table.Cell class="font-mono text-sm font-medium">{account.code}</Table.Cell>
							<Table.Cell class="font-medium text-zinc-900 dark:text-zinc-100">{account.name}</Table.Cell>
							<Table.Cell>
								<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {typeBadgeClass(account.type)}">
									{account.type}
								</span>
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if account.isSystemAccount}
									<Lock class="mx-auto size-3.5 text-zinc-400" />
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
