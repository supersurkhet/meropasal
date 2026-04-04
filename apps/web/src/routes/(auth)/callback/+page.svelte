<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import { Store, Clock, AlertTriangle } from '@lucide/svelte'
	import { Button } from '$lib/components/ui/button'

	let { data } = $props()
</script>

<MetaTags title="Authentication — MeroPasal" />

{#if data.error}
	<div class="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
		<div class="flex max-w-sm flex-col items-center gap-5 px-6 text-center">
			<div class="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg dark:bg-zinc-100">
				<Store class="size-7 text-white dark:text-zinc-900" />
			</div>

			{#if data.error === 'expired'}
				<Clock class="size-10 text-amber-500" />
				<div class="space-y-2">
					<h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Link Expired</h1>
					<p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
						{data.message}
					</p>
				</div>
			{:else}
				<AlertTriangle class="size-10 text-red-500" />
				<div class="space-y-2">
					<h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Authentication Failed</h1>
					<p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
						{data.message}
					</p>
				</div>
			{/if}

			<Button href="/login" class="mt-2 w-full">Sign in again</Button>
		</div>
	</div>
{/if}
