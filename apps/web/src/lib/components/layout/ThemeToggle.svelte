<script lang="ts">
	import { Sun, Moon, Monitor } from '@lucide/svelte'
	import { onMount } from 'svelte'

	type Theme = 'light' | 'dark' | 'system'

	const STORAGE_KEY = 'meropasal-theme'

	let theme = $state<Theme>('system')

	function apply(t: Theme) {
		const isDark =
			t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
		document.documentElement.classList.toggle('dark', isDark)
	}

	function cycle() {
		const order: Theme[] = ['light', 'dark', 'system']
		const next = order[(order.indexOf(theme) + 1) % order.length]
		theme = next
		localStorage.setItem(STORAGE_KEY, next)
		apply(next)
	}

	onMount(() => {
		theme = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system'
		apply(theme)

		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		const onChange = () => {
			if (theme === 'system') apply('system')
		}
		mq.addEventListener('change', onChange)
		return () => mq.removeEventListener('change', onChange)
	})
</script>

<button
	onclick={cycle}
	class="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
	aria-label="Toggle theme: {theme}"
	title="Theme: {theme}"
>
	{#if theme === 'light'}
		<Sun class="size-3.5" />
	{:else if theme === 'dark'}
		<Moon class="size-3.5" />
	{:else}
		<Monitor class="size-3.5" />
	{/if}
</button>
