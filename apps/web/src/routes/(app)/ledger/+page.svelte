<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import LedgerView from '$lib/components/modules/ledger/LedgerView.svelte';
	import TrialBalance from '$lib/components/modules/ledger/TrialBalance.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { BookText, Scale } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
</script>

<MetaTags title={t('nav_ledger')} />

<div class="p-6 lg:p-8">
	<Tabs.Root value="entries">
		<Tabs.List class="mb-6 w-full">
			<Tabs.Trigger value="entries">
				<BookText class="size-4" />
				{t('ledger_entries')}
			</Tabs.Trigger>
			<Tabs.Trigger value="trial-balance">
				<Scale class="size-4" />
				{t('ledger_trial_balance')}
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="entries">
			<LedgerView />
		</Tabs.Content>
		<Tabs.Content value="trial-balance">
			<TrialBalance />
		</Tabs.Content>
	</Tabs.Root>
</div>
