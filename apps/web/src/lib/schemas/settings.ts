import { z } from 'zod/v4'
import { fiscalYear } from './shared'

export const settingsSchema = z.object({
	currentFiscalYear: fiscalYear,
})

export type SettingsFormData = z.infer<typeof settingsSchema>
