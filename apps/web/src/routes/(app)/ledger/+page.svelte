<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import LedgerView from '$lib/components/modules/ledger/LedgerView.svelte';
	import TrialBalance from '$lib/components/modules/ledger/TrialBalance.svelte';
	import { Button } from '$lib/components/ui/button';
	import { BookText, Scale, List } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';

	let activeTab = $state<'entries' | 'trial-balance'>('entries');
</script>

<MetaTags title={t('nav_ledger')} />

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
				<BookText class="size-5 text-zinc-600 dark:text-zinc-400" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('nav_ledger')}</h1>
				<p class="text-sm text-zinc-500 dark:text-zinc-400">{t('page_ledger_desc')}</p>
			</div>
		</div>
		<a href="/ledger/accounts">
			<Button variant="outline" size="sm">
				<List class="mr-1.5 size-4" />
				{t('ledger_chart_of_accounts')}
			</Button>
		</a>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeTab === 'entries'
				? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
				: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
			onclick={() => { activeTab = 'entries'; }}
		>
			<span class="inline-flex items-center gap-1.5">
				<BookText class="size-4" />
				{t('ledger_entries')}
			</span>
		</button>
		<button
			class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {activeTab === 'trial-balance'
				? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
				: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
			onclick={() => { activeTab = 'trial-balance'; }}
		>
			<span class="inline-flex items-center gap-1.5">
				<Scale class="size-4" />
				{t('ledger_trial_balance')}
			</span>
		</button>
	</div>

	{#if activeTab === 'entries'}
		<LedgerView />
	{:else}
		<TrialBalance />
	{/if}
</div>
