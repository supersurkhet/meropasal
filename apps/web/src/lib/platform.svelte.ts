import { browser } from '$app/environment'

export function isDesktop(): boolean {
	if (!browser) return false
	return '__TAURI_INTERNALS__' in window
}
