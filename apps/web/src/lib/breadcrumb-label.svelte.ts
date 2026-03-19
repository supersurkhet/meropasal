import { writable } from 'svelte/store'

/** Set by detail pages to show a human-readable name in the breadcrumb instead of a raw ID. */
export const breadcrumbLabel = writable<string | null>(null)
