export const ROLES = ['owner', 'manager', 'accountant', 'sales', 'warehouse', 'driver'] as const
export type Role = typeof ROLES[number]

export const PERMISSIONS: Record<string, readonly Role[]> = {
	'products:create': ['owner', 'manager', 'warehouse'],
	'products:edit': ['owner', 'manager', 'warehouse'],
	'products:delete': ['owner', 'manager'],
	'stock:import': ['owner', 'manager', 'warehouse'],
	'stock:view': ['owner', 'manager', 'warehouse', 'accountant'],
	'sales:create': ['owner', 'manager', 'sales'],
	'sales:view': ['owner', 'manager', 'sales', 'accountant'],
	'orders:create': ['owner', 'manager', 'sales'],
	'orders:fulfill': ['owner', 'manager', 'sales', 'warehouse'],
	'orders:cancel': ['owner', 'manager'],
	'invoices:view': ['owner', 'manager', 'accountant'],
	'invoices:recordPayment': ['owner', 'manager', 'accountant', 'sales', 'warehouse'],
	'settings:edit': ['owner'],
	'members:manage': ['owner'],
	'reports:view': ['owner', 'manager', 'accountant'],
	'ledger:view': ['owner', 'manager', 'accountant'],
	'ledger:edit': ['owner', 'accountant'],
	'vehicles:manage': ['owner', 'manager', 'driver'],
	'trips:dispatch': ['owner', 'manager', 'driver'],
	'trips:return': ['owner', 'manager', 'driver'],
	'parties:manage': ['owner', 'manager', 'warehouse'],
	'customers:manage': ['owner', 'manager', 'sales'],
}

export type Permission = keyof typeof PERMISSIONS
