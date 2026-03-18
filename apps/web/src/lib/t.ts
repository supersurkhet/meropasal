import { browser } from '$app/environment'
import en from '../../messages/en.json'
import ne from '../../messages/ne.json'

const STORAGE_KEY = 'meropasal-lang'

type Lang = 'en' | 'ne'
type Messages = Record<string, string>

const messages: Record<Lang, Messages> = { en, ne }

let _lang = $state<Lang>(
	browser ? (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'en' : 'en',
)

export const currentLanguage = {
	get value(): Lang {
		return _lang
	},
	set value(v: Lang) {
		_lang = v
		if (browser) {
			localStorage.setItem(STORAGE_KEY, v)
			document.documentElement.lang = v
		}
	},
}

export function t(key: string): string {
	return messages[_lang]?.[key] ?? messages.en[key] ?? key
}
