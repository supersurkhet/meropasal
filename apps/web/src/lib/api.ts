/**
 * Convex API function references.
 * Uses makeFunctionReference since _generated/api may not exist yet.
 */
import { makeFunctionReference } from 'convex/server';

export const api = {
	functions: {
		notifications: {
			list: makeFunctionReference<'query'>('functions/notifications:list'),
			unreadCount: makeFunctionReference<'query'>('functions/notifications:unreadCount'),
			markRead: makeFunctionReference<'mutation'>('functions/notifications:markRead'),
			markAllRead: makeFunctionReference<'mutation'>('functions/notifications:markAllRead'),
			create: makeFunctionReference<'mutation'>('functions/notifications:create'),
		},
		globalSearch: {
			search: makeFunctionReference<'query'>('functions/globalSearch:search'),
		},
		invoices: {
			list: makeFunctionReference<'query'>('functions/invoices:list'),
			getById: makeFunctionReference<'query'>('functions/invoices:getById'),
			getByParty: makeFunctionReference<'query'>('functions/invoices:getByParty'),
		},
		stockBook: {
			listEntries: makeFunctionReference<'query'>('functions/stockBook:listEntries'),
			getAggregation: makeFunctionReference<'query'>('functions/stockBook:getAggregation'),
			getBySource: makeFunctionReference<'query'>('functions/stockBook:getBySource'),
		},
		ledger: {
			listAccounts: makeFunctionReference<'query'>('functions/ledger:listAccounts'),
			createAccount: makeFunctionReference<'mutation'>('functions/ledger:createAccount'),
			listEntries: makeFunctionReference<'query'>('functions/ledger:listEntries'),
			createEntry: makeFunctionReference<'mutation'>('functions/ledger:createEntry'),
			createDoubleEntry: makeFunctionReference<'mutation'>('functions/ledger:createDoubleEntry'),
			trialBalance: makeFunctionReference<'query'>('functions/ledger:trialBalance'),
		},
		organizations: {
			getMyPermissions: makeFunctionReference<'query'>('functions/organizations:getMyPermissions'),
			getSettings: makeFunctionReference<'query'>('functions/organizations:getSettings'),
			updateSettings: makeFunctionReference<'mutation'>('functions/organizations:updateSettings'),
			generateUploadUrl: makeFunctionReference<'mutation'>('functions/organizations:generateUploadUrl'),
			deleteOrgData: makeFunctionReference<'mutation'>('functions/organizations:deleteOrgData'),
			initializeOrg: makeFunctionReference<'mutation'>('functions/organizations:initializeOrg'),
			savePendingOnboarding: makeFunctionReference<'mutation'>('functions/organizations:savePendingOnboarding'),
			consumePendingOnboarding: makeFunctionReference<'mutation'>('functions/organizations:consumePendingOnboarding'),
		},
		billTemplates: {
			list: makeFunctionReference<'query'>('functions/billTemplates:list'),
			getDefault: makeFunctionReference<'query'>('functions/billTemplates:getDefault'),
			getById: makeFunctionReference<'query'>('functions/billTemplates:getById'),
			create: makeFunctionReference<'mutation'>('functions/billTemplates:create'),
			update: makeFunctionReference<'mutation'>('functions/billTemplates:update'),
			setDefault: makeFunctionReference<'mutation'>('functions/billTemplates:setDefault'),
			remove: makeFunctionReference<'mutation'>('functions/billTemplates:remove'),
		},
		staffFeedback: {
			listByPage: makeFunctionReference<'query'>('functions/staffFeedback:listByPage'),
			upsert: makeFunctionReference<'mutation'>('functions/staffFeedback:upsert'),
			remove: makeFunctionReference<'mutation'>('functions/staffFeedback:remove'),
			clearPage: makeFunctionReference<'mutation'>('functions/staffFeedback:clearPage'),
		},
		reports: {
			dashboard: makeFunctionReference<'query'>('functions/reports:dashboard'),
			dashboardBreakdowns: makeFunctionReference<'query'>('functions/reports:dashboardBreakdowns'),
			salesByPeriod: makeFunctionReference<'query'>('functions/reports:salesByPeriod'),
			topProducts: makeFunctionReference<'query'>('functions/reports:topProducts'),
		},
		fiscalYear: {
			current: makeFunctionReference<'query'>('functions/fiscalYear:current'),
			closeFiscalYear: makeFunctionReference<'mutation'>('functions/fiscalYear:closeFiscalYear'),
		},
		products: {
			list: makeFunctionReference<'query'>('functions/products:list'),
			getById: makeFunctionReference<'query'>('functions/products:getById'),
			search: makeFunctionReference<'query'>('functions/products:search'),
			listByParty: makeFunctionReference<'query'>('functions/products:listByParty'),
			create: makeFunctionReference<'mutation'>('functions/products:create'),
			update: makeFunctionReference<'mutation'>('functions/products:update'),
			remove: makeFunctionReference<'mutation'>('functions/products:remove'),
		},
		stockImport: {
			list: makeFunctionReference<'query'>('functions/stockImport:list'),
			getById: makeFunctionReference<'query'>('functions/stockImport:getById'),
			create: makeFunctionReference<'mutation'>('functions/stockImport:create'),
		},
		sales: {
			list: makeFunctionReference<'query'>('functions/sales:list'),
			getById: makeFunctionReference<'query'>('functions/sales:getById'),
			create: makeFunctionReference<'mutation'>('functions/sales:create'),
		},
		orders: {
			list: makeFunctionReference<'query'>('functions/orders:list'),
			getById: makeFunctionReference<'query'>('functions/orders:getById'),
			create: makeFunctionReference<'mutation'>('functions/orders:create'),
			update: makeFunctionReference<'mutation'>('functions/orders:update'),
			addPayment: makeFunctionReference<'mutation'>('functions/orders:addPayment'),
			markDone: makeFunctionReference<'mutation'>('functions/orders:markDone'),
			cancel: makeFunctionReference<'mutation'>('functions/orders:cancel'),
		},
		parties: {
			list: makeFunctionReference<'query'>('functions/parties:list'),
			search: makeFunctionReference<'query'>('functions/parties:search'),
			getById: makeFunctionReference<'query'>('functions/parties:getById'),
			create: makeFunctionReference<'mutation'>('functions/parties:create'),
			update: makeFunctionReference<'mutation'>('functions/parties:update'),
			remove: makeFunctionReference<'mutation'>('functions/parties:remove'),
		},
		customers: {
			list: makeFunctionReference<'query'>('functions/customers:list'),
			search: makeFunctionReference<'query'>('functions/customers:search'),
			getById: makeFunctionReference<'query'>('functions/customers:getById'),
			create: makeFunctionReference<'mutation'>('functions/customers:create'),
			update: makeFunctionReference<'mutation'>('functions/customers:update'),
			remove: makeFunctionReference<'mutation'>('functions/customers:remove'),
		},
		vehicles: {
			list: makeFunctionReference<'query'>('functions/vehicles:list'),
			search: makeFunctionReference<'query'>('functions/vehicles:search'),
			getById: makeFunctionReference<'query'>('functions/vehicles:getById'),
			create: makeFunctionReference<'mutation'>('functions/vehicles:create'),
			update: makeFunctionReference<'mutation'>('functions/vehicles:update'),
			remove: makeFunctionReference<'mutation'>('functions/vehicles:remove'),
		},
		trips: {
			list: makeFunctionReference<'query'>('functions/trips:list'),
			getById: makeFunctionReference<'query'>('functions/trips:getById'),
			listByVehicle: makeFunctionReference<'query'>('functions/trips:listByVehicle'),
			dispatch: makeFunctionReference<'mutation'>('functions/trips:dispatch'),
			returnTrip: makeFunctionReference<'mutation'>('functions/trips:returnTrip'),
			cancel: makeFunctionReference<'mutation'>('functions/trips:cancel'),
		},
	},
};
