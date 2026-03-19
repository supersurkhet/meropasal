<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import LedgerView from '$lib/components/modules/ledger/LedgerView.svelte';
	import TrialBalance from '$lib/components/modules/ledger/TrialBalance.svelte';
	import { BookText, Scale } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';

	let activeTab = $state<'entries' | 'trial-balance'>('entries');
</script>

<MetaTags title={t('nav_ledger')} />

<div class="p-6 lg:p-8">
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
