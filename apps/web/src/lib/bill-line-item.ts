export type BillLineItem = {
	id: string
	productId: string
	productTitle: string
	quantity: number
	unit: string
	unitStr: string
	rate: number
	referenceRate?: number
	discountPercent?: number
}
