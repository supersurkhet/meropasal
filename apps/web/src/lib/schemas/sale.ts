import { z } from 'zod/v4'

const saleItemSchema = z.object({
	productId: z.string().min(1, 'Product is required'),
	productTitle: z.string().min(1),
	quantity: z.number().min(1, 'Quantity must be at least 1'),
	rate: z.number().min(0, 'Rate must be positive'),
	unit: z.string().optional(),
})

export const saleSchema = z.object({
	customerId: z.string().optional(),
	saleDate: z.string().min(1, 'Sale date is required'),
	items: z.array(saleItemSchema).min(1, 'At least one item is required'),
})

export type SaleFormData = z.infer<typeof saleSchema>
