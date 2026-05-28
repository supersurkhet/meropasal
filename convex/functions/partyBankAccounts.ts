import { query, mutation } from '../_generated/server'
import { v } from 'convex/values'
import { getOrg, requirePermission } from '../lib/orgGuard'

export const listByParty = query({
	args: { partyId: v.id('parties') },
	handler: async (ctx, { partyId }) => {
		const orgId = await getOrg(ctx)
		if (!orgId) return []
		const accounts = await ctx.db
			.query('partyBankAccounts')
			.withIndex('by_orgId_partyId', (q) => q.eq('orgId', orgId).eq('partyId', partyId))
			.collect()
		return accounts.filter((a) => a.isActive)
	},
})

export const create = mutation({
	args: {
		partyId: v.id('parties'),
		bankName: v.string(),
		accountNumber: v.string(),
		accountHolderName: v.string(),
		branch: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const orgId = await requirePermission(ctx, 'parties:manage')
		const party = await ctx.db.get(args.partyId)
		if (!party || party.orgId !== orgId) throw new Error('Party not found')
		return await ctx.db.insert('partyBankAccounts', { orgId, ...args, isActive: true })
	},
})

export const update = mutation({
	args: {
		id: v.id('partyBankAccounts'),
		bankName: v.optional(v.string()),
		accountNumber: v.optional(v.string()),
		accountHolderName: v.optional(v.string()),
		branch: v.optional(v.string()),
	},
	handler: async (ctx, { id, ...fields }) => {
		const orgId = await requirePermission(ctx, 'parties:manage')
		const account = await ctx.db.get(id)
		if (!account || account.orgId !== orgId) throw new Error('Account not found')
		const updates: Partial<{
			bankName: string
			accountNumber: string
			accountHolderName: string
			branch: string
		}> = {}
		if (fields.bankName !== undefined) updates.bankName = fields.bankName
		if (fields.accountNumber !== undefined) updates.accountNumber = fields.accountNumber
		if (fields.accountHolderName !== undefined) updates.accountHolderName = fields.accountHolderName
		if (fields.branch !== undefined) updates.branch = fields.branch
		await ctx.db.patch(id, updates)
	},
})

export const remove = mutation({
	args: { id: v.id('partyBankAccounts') },
	handler: async (ctx, { id }) => {
		const orgId = await requirePermission(ctx, 'parties:manage')
		const account = await ctx.db.get(id)
		if (!account || account.orgId !== orgId) throw new Error('Account not found')
		await ctx.db.patch(id, { isActive: false })
	},
})
