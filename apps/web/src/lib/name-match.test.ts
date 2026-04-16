import { describe, it, expect } from 'vitest'
import { normalizeName, namesMatch } from './name-match'

describe('namesMatch', () => {
	it('matches ignoring ltd and punctuation', () => {
		expect(namesMatch('AB Suppliers', 'AB Suppliers Pvt Ltd')).toBe(true)
	})

	it('matches prefix words', () => {
		expect(namesMatch('Wai Wai Noodles', 'Wai Wai')).toBe(true)
	})

	it('does not match unrelated', () => {
		expect(namesMatch('Alpha', 'Beta')).toBe(false)
	})
})

describe('normalizeName', () => {
	it('lowercases and strips suffix', () => {
		const a = normalizeName('Test Co. Pvt. Ltd.')
		expect(a).not.toContain('ltd')
	})
})
