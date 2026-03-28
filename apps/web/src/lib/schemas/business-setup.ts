import { z } from 'zod/v4'
import { optionalNepaliPhone, optionalPanNumber, fiscalYear } from './shared'

export const businessSetupSchema = z.object({
	businessName: z.string().min(1, 'Business name is required'),
	businessType: z.enum(['retail', 'wholesale', 'service']),
	location: z.string().optional(),
	phone: optionalNepaliPhone,
	panNumber: optionalPanNumber,
	currentFiscalYear: fiscalYear,
})

export type BusinessSetupFormData = z.infer<typeof businessSetupSchema>
