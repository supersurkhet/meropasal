<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { Store, Loader2 } from '@lucide/svelte';
</script>

<MetaTags title="Sign in — MeroPasal" />

<div class="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
	<div class="flex flex-col items-center gap-4">
		<div class="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg dark:bg-zinc-100">
			<Store class="size-7 text-white dark:text-zinc-900" />
		</div>
		<Loader2 class="size-5 animate-spin text-zinc-400" />
		<p class="text-sm text-zinc-500 dark:text-zinc-400">Redirecting to sign in...</p>
	</div>
</div>
