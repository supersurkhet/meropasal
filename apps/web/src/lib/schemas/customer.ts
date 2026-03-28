import { z } from 'zod/v4'
import { optionalNepaliPhone, optionalPanNumber } from './shared'

export const customerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	panNumber: optionalPanNumber,
	address: z.string().optional(),
	phone: optionalNepaliPhone,
	email: z.email('Invalid email address').optional(),
	creditLimit: z.number().min(0, 'Credit limit must be positive').optional(),
	notes: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>
