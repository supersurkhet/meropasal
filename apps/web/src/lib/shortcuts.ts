/**
 * Global keyboard shortcuts for MeroPasal.
 *
 * Usage in a component:
 *   import { shortcuts } from '$lib/shortcuts'
 *   <svelte:window use:shortcuts />
 *
 * Or attach to any element:
 *   <div use:shortcuts>...</div>
 */

export type ShortcutHandler = (e: KeyboardEvent) => void

const globalHandlers: Map<string, ShortcutHandler> = new Map()

/** Register a named global shortcut handler. Returns an unregister function. */
export function registerShortcut(name: string, handler: ShortcutHandler): () => void {
	globalHandlers.set(name, handler)
	return () => {
		globalHandlers.delete(name)
	}
}

/** Svelte action for global keyboard shortcuts. */
export function shortcuts(node: HTMLElement | Window) {
	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement
		const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

		// Cmd/Ctrl+K — focus search
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault()
			const search = document.querySelector<HTMLInputElement>('[role="search"] input')
			if (search) {
				search.focus()
				search.select()
			}
		}

		// Escape — close topmost dialog/sheet, or blur search
		if (e.key === 'Escape') {
			// Let dialogs handle their own escape first via bits-ui
			// If search is focused, blur it
			if (isInput && target.closest('[role="search"]')) {
				target.blur()
			}
		}

		// Run any registered global handlers
		for (const handler of globalHandlers.values()) {
			handler(e)
		}
	}

	const target = node instanceof Window ? node : node
	target.addEventListener('keydown', handleKeydown as EventListener)

	return {
		destroy() {
			target.removeEventListener('keydown', handleKeydown as EventListener)
		},
	}
}
