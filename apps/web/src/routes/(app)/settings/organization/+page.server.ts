export const load = async ({ parent }: { parent: () => Promise<{ currentOrgName: string; orgMetadata: Record<string, unknown> }> }) => {
	const { currentOrgName, orgMetadata } = await parent()
	return { currentOrgName, orgMetadata }
}
