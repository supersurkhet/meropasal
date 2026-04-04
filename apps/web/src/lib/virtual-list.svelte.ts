/**
 * Virtual list helpers wrapping @tanstack/svelte-virtual.
 * Components create their own virtualizer; this module provides
 * shared utilities for chunking, padding, and responsive lanes.
 */
import type { VirtualItem } from '@tanstack/svelte-virtual'

export { createVirtualizer } from '@tanstack/svelte-virtual'

/** Chunk a flat array into rows of `lanes` items (for grid views). */
export function chunkItems<T>(items: T[], lanes: number): T[][] {
	if (lanes <= 1) return items.map((item) => [item])
	const chunks: T[][] = []
	for (let i = 0; i < items.length; i += lanes) {
		chunks.push(items.slice(i, i + lanes))
	}
	return chunks
}

/** Row count for a given item count and lane count. */
export function rowCount(itemCount: number, lanes: number): number {
	return lanes <= 1 ? itemCount : Math.ceil(itemCount / lanes)
}

/** Compute top/bottom padding for table spacer <tr> rows. */
export function getTablePadding(items: VirtualItem[]) {
	if (items.length === 0) return { top: 0, bottom: 0 }
	return {
		top: items[0]!.start,
		bottom: 0, // computed by caller from totalSize - last.end
	}
}

/**
 * Reactive breakpoint-based lane count for grid views.
 * Tracks window width and returns the correct column count for each grid mode.
 */
export function useBreakpointLanes(mode: () => string) {
	let width = $state(typeof window !== 'undefined' ? window.innerWidth : 1024)

	$effect(() => {
		const onResize = () => { width = window.innerWidth }
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	})

	const lanes = $derived.by(() => {
		const m = mode()
		if (m === 'grid-3') {
			if (width >= 1024) return 3  // lg
			if (width >= 640) return 2   // sm
			return 1
		}
		if (m === 'grid-2') {
			if (width >= 768) return 2   // md
			return 1
		}
		return 1
	})

	return () => lanes
}
