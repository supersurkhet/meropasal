export const load = async ({ parent }: { parent: () => Promise<{ workosOrgName: string; orgMetadata: Record<string, unknown> }> }) => {
	const { workosOrgName, orgMetadata } = await parent()
	return { workosOrgName, orgMetadata }
}
