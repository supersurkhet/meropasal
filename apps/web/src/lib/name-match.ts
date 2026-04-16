export function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b(pvt\.?|ltd\.?|llc|inc\.?|co\.?|corp\.?|private|limited)\b/gi, '')
		.replace(/&/g, ' and ')
		.replace(/\band\b/g, ' and ')
		.replace(/[''`]/g, '')
		.replace(/[.\-,]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

export function namesMatch(a: string, b: string): boolean {
	const na = normalizeName(a)
	const nb = normalizeName(b)
	if (na === nb) return true
	if (na.length >= 4 && nb.length >= 4) {
		const wordsA = na.split(' ')
		const wordsB = nb.split(' ')
		const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB
		const longer = wordsA.length <= wordsB.length ? wordsB : wordsA
		if (shorter.length > 0 && shorter.every((w, i) => longer[i] === w)) return true
	}
	return false
}
