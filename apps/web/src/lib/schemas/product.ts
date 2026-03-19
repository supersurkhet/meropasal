import { z } from 'zod/v4'

export const productSchema = z.object({
	title: z.string().min(1, 'Product title is required'),
	purchasePartyId: z.string().min(1, 'Supplier is required'),
	unit: z.string().optional(),
	costPrice: z.number().min(0, 'Cost price must be positive'),
	sellingPrice: z.number().min(0, 'Selling price must be positive').optional(),
	openingStock: z.number().min(0, 'Opening stock must be 0 or more'),
	reorderLevel: z.number().min(0, 'Reorder level must be 0 or more').optional(),
	hsCode: z.string().optional(),
	barcode: z.string().optional(),
	sku: z.string().optional(),
	category: z.string().optional(),
	description: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
