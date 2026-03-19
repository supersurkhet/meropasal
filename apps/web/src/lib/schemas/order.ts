import { z } from 'zod/v4'

const orderItemSchema = z.object({
	productId: z.string().min(1, 'Product is required'),
	productTitle: z.string().min(1),
	quantity: z.number().min(1, 'Quantity must be at least 1'),
	rate: z.number().min(0, 'Rate must be positive'),
	unit: z.string().optional(),
})

const paymentSchema = z.object({
	paidAt: z.string().min(1, 'Payment date is required'),
	paidAmount: z.number().min(0, 'Payment amount must be positive'),
	paymentMethod: z.enum(['cash', 'card', 'bankTransfer', 'credit', 'online', 'check']),
	bankVoucherNumber: z.string().optional(),
})

export const orderSchema = z.object({
	customerId: z.string().optional(),
	orderDate: z.string().min(1, 'Order date is required'),
	items: z.array(orderItemSchema).min(1, 'At least one item is required'),
	payments: z.array(paymentSchema).optional(),
	notes: z.string().optional(),
})

export type OrderFormData = z.infer<typeof orderSchema>
