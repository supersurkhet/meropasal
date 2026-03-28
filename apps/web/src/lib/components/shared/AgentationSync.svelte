<script lang="ts">
	import { page } from '$app/stores'
	import { Agentation } from 'sv-agentation'
	import type { AgentationAnnotationSnapshot } from 'sv-agentation'
	import { getConvexClient } from '$lib/convex'
	import { useConvexQuery, useConvexMutation } from '$lib/convex-helpers.svelte'
	import { api } from '$lib/api'

	// sv-agentation localStorage key format
	const NOTES_PREFIX = 'sv-agentation:notes:v1:'

	function buildStorageKey(pathname: string): string {
		return `${NOTES_PREFIX}${encodeURIComponent(pathname)}`
	}

	function readNotes(pathname: string): unknown[] {
		try {
			const raw = localStorage.getItem(buildStorageKey(pathname))
			if (!raw) return []
			const parsed = JSON.parse(raw)
			return Array.isArray(parsed) ? parsed : []
		} catch {
			return []
		}
	}

	function writeNotes(pathname: string, notes: unknown[]): void {
		localStorage.setItem(buildStorageKey(pathname), JSON.stringify(notes))
	}

	const client = getConvexClient()
	let pathname = $derived($page.url.pathname)

	// Convex real-time subscription for current page
	const feedback = useConvexQuery(client, api.functions.staffFeedback.listByPage, () => ({
		pathname,
	}))

	// Mutations
	const upsertMutation = useConvexMutation(client, api.functions.staffFeedback.upsert)
	const removeMutation = useConvexMutation(client, api.functions.staffFeedback.remove)
	const clearMutation = useConvexMutation(client, api.functions.staffFeedback.clearPage)

	// Version counter to force sv-agentation to re-read localStorage
	// Appending #sync=N to pageSessionKey triggers handlePageChange() internally
	// while normalizePageSessionKey strips the # fragment, keeping the same storage key
	let syncVersion = $state(0)
	let pageSessionKey = $derived(`${pathname}#sync=${syncVersion}`)

	// Track last sync hash to avoid redundant localStorage writes
	let lastSyncHash = ''
	// Flag to suppress outbound sync when inbound sync just wrote to localStorage
	let suppressOutbound = false

	// Inbound sync: Convex subscription → localStorage → sv-agentation re-read
	$effect(() => {
		const remoteData = feedback.data
		if (!remoteData) return

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const items = remoteData as any[]
		const newHash = items.map((n) => `${n.noteId}:${n.updatedAt}`).join('|')
		if (newHash === lastSyncHash) return
		lastSyncHash = newHash

		// Build merged note set: remote is source of truth
		const remoteNoteIds = new Set(items.map((n) => n.noteId as string))
		const remoteNotes = items.map((n) => {
			try {
				return JSON.parse(n.inspectorNoteJson)
			} catch {
				return null
			}
		}).filter(Boolean)

		// Preserve local-only notes (not yet persisted, race window)
		const localNotes = readNotes(pathname)
		const localOnly = localNotes.filter(
			(n) => (n as any)?.id && !remoteNoteIds.has((n as any).id)
		)

		const merged = [...remoteNotes, ...localOnly]

		suppressOutbound = true
		writeNotes(pathname, merged)
		syncVersion++

		// Reset suppress flag after a tick to allow future user interactions
		requestAnimationFrame(() => {
			suppressOutbound = false
		})
	})

	// Outbound callbacks: user action → read full InspectorNote from localStorage → Convex
	function handleAnnotationAdd(snapshot: AgentationAnnotationSnapshot) {
		if (suppressOutbound) return
		const allNotes = readNotes(pathname)
		const fullNote = allNotes.find((n: any) => n?.id === snapshot.id)
		if (!fullNote) return

		upsertMutation.mutate({
			pathname,
			noteId: snapshot.id,
			kind: snapshot.kind,
			comment: snapshot.comment,
			inspectorNoteJson: JSON.stringify(fullNote),
		})
	}

	function handleAnnotationUpdate(snapshot: AgentationAnnotationSnapshot) {
		if (suppressOutbound) return
		const allNotes = readNotes(pathname)
		const fullNote = allNotes.find((n: any) => n?.id === snapshot.id)
		if (!fullNote) return

		upsertMutation.mutate({
			pathname,
			noteId: snapshot.id,
			kind: snapshot.kind,
			comment: snapshot.comment,
			inspectorNoteJson: JSON.stringify(fullNote),
		})
	}

	function handleAnnotationDelete(snapshot: AgentationAnnotationSnapshot) {
		if (suppressOutbound) return
		removeMutation.mutate({ noteId: snapshot.id })
	}

	function handleAnnotationsClear() {
		if (suppressOutbound) return
		clearMutation.mutate({ pathname })
	}
</script>

<Agentation
	{pageSessionKey}
	onAnnotationAdd={handleAnnotationAdd}
	onAnnotationUpdate={handleAnnotationUpdate}
	onAnnotationDelete={handleAnnotationDelete}
	onAnnotationsClear={handleAnnotationsClear}
/>
