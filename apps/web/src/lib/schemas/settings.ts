import { z } from 'zod/v4'

export const settingsSchema = z.object({
	businessName: z.string().min(1, 'Business name is required'),
	location: z.string().optional(),
	phone: z.string().optional(),
	panNumber: z.string().optional(),
	currentFiscalYear: z.string().min(1, 'Fiscal year is required'),
	taxRate: z.number().min(0, 'Tax rate must be positive').max(100, 'Tax rate cannot exceed 100'),
	features: z.object({
		invoicing: z.boolean(),
		stockBook: z.boolean(),
		logistics: z.boolean(),
		ledger: z.boolean(),
	}).optional(),
})

export type SettingsFormData = z.infer<typeof settingsSchema>
