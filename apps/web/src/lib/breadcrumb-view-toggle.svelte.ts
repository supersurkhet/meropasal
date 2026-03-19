import type { ViewMode } from '$lib/view-preference.svelte'

type ViewToggleConfig = {
	get mode(): ViewMode
	onchange: (m: ViewMode) => void
}

let config = $state<ViewToggleConfig | null>(null)

export const breadcrumbViewToggle = {
	get config() {
		return config
	},
	set(c: ViewToggleConfig) {
		config = c
	},
	clear() {
		config = null
	},
}
