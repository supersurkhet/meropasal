import { z } from 'zod/v4'

export const partySchema = z.object({
	name: z.string().min(1, 'Name is required'),
	panNumber: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	creditLimit: z.number().min(0, 'Credit limit must be positive').optional(),
	paymentTerms: z.string().optional(),
	notes: z.string().optional(),
})

export type PartyFormData = z.infer<typeof partySchema>
