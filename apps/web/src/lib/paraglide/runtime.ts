/**
 * Paraglide runtime stub.
 * Delegates to the custom t.svelte.ts i18n system until Paraglide is fully wired.
 */

import { currentLanguage } from '$lib/t.svelte';

export const sourceLanguageTag = 'en';
export const availableLanguageTags = ['en', 'ne'] as const;
export type AvailableLanguageTag = (typeof availableLanguageTags)[number];

let _tag: AvailableLanguageTag = sourceLanguageTag;
const listeners = new Set<(tag: AvailableLanguageTag) => void>();

export function languageTag(): AvailableLanguageTag {
	return currentLanguage.value ?? sourceLanguageTag;
}

export function setLanguageTag(tag: AvailableLanguageTag | (() => AvailableLanguageTag)): void {
	const next = typeof tag === 'function' ? tag() : tag;
	if (isAvailableLanguageTag(next)) {
		_tag = next;
		currentLanguage.value = next;
		listeners.forEach((fn) => fn(next));
	}
}

export function onSetLanguageTag(fn: (tag: AvailableLanguageTag) => void): void {
	listeners.add(fn);
}

export function isAvailableLanguageTag(tag: unknown): tag is AvailableLanguageTag {
	return typeof tag === 'string' && (availableLanguageTags as readonly string[]).includes(tag);
}
