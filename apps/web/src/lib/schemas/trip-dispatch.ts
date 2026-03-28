import { z } from 'zod/v4'

const tripProductSchema = z.object({
	productId: z.string().min(1, 'Product is required'),
	productTitle: z.string().min(1),
	quantity: z.number().min(1, 'Quantity must be at least 1'),
	unitPrice: z.number().min(0, 'Price must be positive'),
	unit: z.string().optional(),
})

export const tripDispatchSchema = z.object({
	vehicleId: z.string().min(1, 'Vehicle is required'),
	dispatchTime: z.string().min(1, 'Dispatch time is required'),
	destination: z.string().optional(),
	products: z.array(tripProductSchema).min(1, 'At least one product is required'),
})

export type TripDispatchFormData = z.infer<typeof tripDispatchSchema>
