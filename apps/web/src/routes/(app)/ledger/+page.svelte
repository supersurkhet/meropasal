<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import LedgerView from '$lib/components/modules/ledger/LedgerView.svelte';
	import TrialBalance from '$lib/components/modules/ledger/TrialBalance.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { BookText, Scale, Plus } from '@lucide/svelte';
	import { t } from '$lib/t.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<MetaTags title={t('nav_ledger')} />

<div class="p-6 lg:p-8">
	<Tabs.Root value="entries">
		<div class="mb-4 flex items-center justify-between">
			<Tabs.List class="w-full">
				<Tabs.Trigger value="entries">
					<BookText class="size-4" />
					{t('ledger_entries')}
				</Tabs.Trigger>
				<Tabs.Trigger value="trial-balance">
					<Scale class="size-4" />
					{t('ledger_trial_balance')}
				</Tabs.Trigger>
			</Tabs.List>
			<Button href="/ledger/journal/new" size="sm">
				<Plus class="mr-1.5 size-4" />
				Journal Entry
			</Button>
		</div>

		<Tabs.Content value="entries">
			<LedgerView />
		</Tabs.Content>
		<Tabs.Content value="trial-balance">
			<TrialBalance />
		</Tabs.Content>
	</Tabs.Root>
</div>
