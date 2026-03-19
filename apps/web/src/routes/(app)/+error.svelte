<script lang="ts">
	import { page } from '$app/stores'
	import { invalidateAll } from '$app/navigation'
	import { goto } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'

	const status = $derived($page.status)
	const message = $derived($page.error?.message ?? 'Something went wrong')

	function handleRetry() {
		invalidateAll()
	}

	function handleLogin() {
		goto('/login')
	}
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4">
	<div class="max-w-md text-center">
		{#if status === 401 || message.toLowerCase().includes('auth')}
			<div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
				<svg class="size-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m5-7V7a5 5 0 00-10 0v4a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2z" />
				</svg>
			</div>
			<h1 class="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Session Expired</h1>
			<p class="mb-6 text-zinc-500 dark:text-zinc-400">Your session has expired. Please sign in again to continue.</p>
			<div class="flex justify-center gap-3">
				<Button variant="outline" onclick={handleRetry}>Retry</Button>
				<Button onclick={handleLogin}>Sign In</Button>
			</div>
		{:else}
			<div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
				<svg class="size-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h1 class="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Error {status}</h1>
			<p class="mb-6 text-zinc-500 dark:text-zinc-400">{message}</p>
			<div class="flex justify-center gap-3">
				<Button variant="outline" onclick={handleRetry}>Try Again</Button>
				<Button onclick={() => goto('/dashboard')}>Go to Dashboard</Button>
			</div>
		{/if}
	</div>
</div>
