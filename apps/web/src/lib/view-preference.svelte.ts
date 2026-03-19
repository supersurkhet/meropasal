export type ViewMode = 'grid-3' | 'grid-2' | 'list' | 'table'

export function createViewPreference(moduleKey: string, defaultMode: ViewMode = 'table') {
	const storageKey = `view-${moduleKey}`
	let mode = $state<ViewMode>(
		(typeof localStorage !== 'undefined'
			? (localStorage.getItem(storageKey) as ViewMode) ?? defaultMode
			: defaultMode),
	)

	return {
		get mode() {
			return mode
		},
		set mode(v: ViewMode) {
			mode = v
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(storageKey, v)
			}
		},
	}
}
