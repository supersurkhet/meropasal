<script lang="ts">
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'meropasal-lang';

	let currentLang = $state<'en' | 'ne'>(
		browser ? (localStorage.getItem(STORAGE_KEY) as 'en' | 'ne') ?? 'en' : 'en'
	);

	function toggle() {
		currentLang = currentLang === 'en' ? 'ne' : 'en';
		if (browser) {
			localStorage.setItem(STORAGE_KEY, currentLang);
			document.documentElement.lang = currentLang;
			// Dispatch a custom event so other components can react to the language change
			window.dispatchEvent(new CustomEvent('languagechange', { detail: currentLang }));
		}
	}
</script>

<button
	onclick={toggle}
	class="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
	aria-label="Switch language between English and Nepali"
>
	<span
		class="transition-opacity {currentLang === 'en' ? 'opacity-100' : 'opacity-50'}"
	>
		EN
	</span>
	<span class="text-zinc-300 dark:text-zinc-600">/</span>
	<span
		class="transition-opacity {currentLang === 'ne' ? 'opacity-100' : 'opacity-50'}"
	>
		ने
	</span>
</button>
