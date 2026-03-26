<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import OrderList from '$lib/components/modules/orders/OrderList.svelte'
	import OrderKanban from '$lib/components/modules/orders/OrderKanban.svelte'
	import { t } from '$lib/t.svelte'
	import { Button } from '$lib/components/ui/button'
	import { List, Columns3 } from '@lucide/svelte'

	let viewMode = $state<'list' | 'kanban'>('list')
</script>

<MetaTags title="{t('nav_orders')} — {t('app_name')}" />

<div class="p-6 lg:p-8">
	<!-- View Toggle -->
	<div class="mb-4 flex items-center justify-end gap-1">
		<Button
			variant={viewMode === 'list' ? 'default' : 'ghost'}
			size="sm"
			class="h-8 gap-1.5 text-xs"
			onclick={() => (viewMode = 'list')}
		>
			<List class="size-3.5" />
			{t('order_list_view')}
		</Button>
		<Button
			variant={viewMode === 'kanban' ? 'default' : 'ghost'}
			size="sm"
			class="h-8 gap-1.5 text-xs"
			onclick={() => (viewMode = 'kanban')}
		>
			<Columns3 class="size-3.5" />
			{t('order_kanban_view')}
		</Button>
	</div>

	{#if viewMode === 'kanban'}
		<OrderKanban />
	{:else}
		<OrderList />
	{/if}
</div>
