export const ROLES = ['admin', 'member'] as const
export type Role = typeof ROLES[number]

export const PERMISSIONS: Record<string, readonly Role[]> = {
	'products:create': ['admin', 'member'],
	'products:edit': ['admin', 'member'],
	'products:delete': ['admin'],
	'stock:import': ['admin', 'member'],
	'stock:view': ['admin', 'member'],
	'sales:create': ['admin', 'member'],
	'sales:view': ['admin', 'member'],
	'orders:create': ['admin', 'member'],
	'orders:fulfill': ['admin', 'member'],
	'orders:cancel': ['admin'],
	'invoices:view': ['admin'],
	'invoices:recordPayment': ['admin', 'member'],
	'settings:edit': ['admin'],
	'members:manage': ['admin'],
	'reports:view': ['admin'],
	'ledger:view': ['admin'],
	'ledger:edit': ['admin'],
	'vehicles:manage': ['admin', 'member'],
	'trips:dispatch': ['admin', 'member'],
	'trips:return': ['admin', 'member'],
	'parties:manage': ['admin', 'member'],
	'customers:manage': ['admin', 'member'],
}

export type Permission = keyof typeof PERMISSIONS
