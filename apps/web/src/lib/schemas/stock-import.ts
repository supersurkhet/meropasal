import { z } from 'zod/v4'

const stockImportItemSchema = z.object({
	productId: z.string().min(1, 'Product is required'),
	productTitle: z.string().min(1),
	quantity: z.number().min(1, 'Quantity must be at least 1'),
	rate: z.number().min(0, 'Rate must be positive'),
	unit: z.string().optional(),
})

export const stockImportSchema = z.object({
	partyId: z.string().min(1, 'Supplier is required'),
	importDate: z.string().min(1, 'Import date is required'),
	items: z.array(stockImportItemSchema).min(1, 'At least one item is required'),
})

export type StockImportFormData = z.infer<typeof stockImportSchema>
