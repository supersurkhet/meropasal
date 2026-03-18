/**
 * Convex API function references.
 * Uses makeFunctionReference since _generated/api may not exist yet.
 */
import { makeFunctionReference } from 'convex/server';

export const api = {
	functions: {
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
			getSettings: makeFunctionReference<'query'>('functions/organizations:getSettings'),
			updateSettings: makeFunctionReference<'mutation'>('functions/organizations:updateSettings'),
			initializeOrg: makeFunctionReference<'mutation'>('functions/organizations:initializeOrg'),
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
		fiscalYear: {
			current: makeFunctionReference<'query'>('functions/fiscalYear:current'),
			closeFiscalYear: makeFunctionReference<'mutation'>('functions/fiscalYear:closeFiscalYear'),
		},
		products: {
			list: makeFunctionReference<'query'>('functions/products:list'),
		},
		parties: {
			list: makeFunctionReference<'query'>('functions/parties:list'),
			getById: makeFunctionReference<'query'>('functions/parties:getById'),
			create: makeFunctionReference<'mutation'>('functions/parties:create'),
			update: makeFunctionReference<'mutation'>('functions/parties:update'),
			remove: makeFunctionReference<'mutation'>('functions/parties:remove'),
		},
		customers: {
			list: makeFunctionReference<'query'>('functions/customers:list'),
			getById: makeFunctionReference<'query'>('functions/customers:getById'),
			create: makeFunctionReference<'mutation'>('functions/customers:create'),
			update: makeFunctionReference<'mutation'>('functions/customers:update'),
			remove: makeFunctionReference<'mutation'>('functions/customers:remove'),
		},
	},
};
