interface ImportMeta {
	readonly glob: (
		pattern: string | string[],
		options?: { eager?: boolean }
	) => Record<string, () => Promise<unknown>>
}
