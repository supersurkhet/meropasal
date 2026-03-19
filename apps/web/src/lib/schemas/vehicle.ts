import { z } from 'zod/v4'

export const vehicleSchema = z.object({
	name: z.string().min(1, 'Vehicle name is required'),
	licensePlate: z.string().min(1, 'License plate is required'),
	description: z.string().optional(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
