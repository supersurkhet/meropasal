/**
 * Paraglide runtime stub.
 * This will be replaced by the actual generated runtime when Paraglide is configured.
 * For now, provides the minimum exports needed by @inlang/paraglide-sveltekit.
 */

export const sourceLanguageTag = 'en';
export const availableLanguageTags = ['en', 'ne'] as const;
export type AvailableLanguageTag = (typeof availableLanguageTags)[number];

export function languageTag(): AvailableLanguageTag {
	return sourceLanguageTag;
}

export function setLanguageTag(_tag: AvailableLanguageTag | (() => AvailableLanguageTag)): void {
	// Stub — will be implemented by Paraglide generation
}

export function onSetLanguageTag(_fn: (tag: AvailableLanguageTag) => void): void {
	// Stub
}

export function isAvailableLanguageTag(tag: unknown): tag is AvailableLanguageTag {
	return typeof tag === 'string' && (availableLanguageTags as readonly string[]).includes(tag);
}
