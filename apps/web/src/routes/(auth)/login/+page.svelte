<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import { Store } from '@lucide/svelte';

	let { data } = $props();
</script>

<MetaTags title="Sign in — MeroPasal" />

<div class="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
	<div class="mx-auto w-full max-w-sm space-y-8 px-4">
		<!-- Logo -->
		<div class="flex flex-col items-center gap-3">
			<div class="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg dark:bg-zinc-100">
				<Store class="size-7 text-white dark:text-zinc-900" />
			</div>
			<div class="text-center">
				<h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
					MeroPasal
				</h1>
				<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					Modern retail management for Nepal
				</p>
			</div>
		</div>

		<!-- Sign in card -->
		<div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			<h2 class="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
				Sign in to your account
			</h2>
			<a href={data.authorizationUrl}>
				<Button class="w-full" size="lg">
					Continue with WorkOS
				</Button>
			</a>
		</div>

		<p class="text-center text-xs text-zinc-400 dark:text-zinc-500">
			Secure authentication powered by WorkOS AuthKit
		</p>
	</div>
</div>
