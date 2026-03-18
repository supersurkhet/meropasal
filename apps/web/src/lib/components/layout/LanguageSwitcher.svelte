<script lang="ts">
	import { currentLanguage } from '$lib/t.svelte'

	function toggle() {
		currentLanguage.value = currentLanguage.value === 'en' ? 'ne' : 'en'
	}
</script>

<button
	onclick={toggle}
	class="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
	aria-label="Switch language between English and Nepali"
>
	<span
		class="transition-opacity {currentLanguage.value === 'en' ? 'opacity-100' : 'opacity-50'}"
	>
		EN
	</span>
	<span class="text-zinc-300 dark:text-zinc-600">/</span>
	<span
		class="transition-opacity {currentLanguage.value === 'ne' ? 'opacity-100' : 'opacity-50'}"
	>
		ने
	</span>
</button>
