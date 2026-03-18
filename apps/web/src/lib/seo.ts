/**
 * Default SEO configuration for MeroPasal.
 */

export const defaultSeo = {
	title: 'MeroPasal',
	titleTemplate: '%s | MeroPasal',
	description:
		'Retail management platform for Nepali businesses — inventory, invoicing, logistics, and accounting in one place.',
	canonical: 'https://meropasal.com',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: 'https://meropasal.com',
		siteName: 'MeroPasal',
		title: 'MeroPasal — Retail Management, Simplified',
		description:
			'Manage inventory, invoices, logistics, and accounting for your retail business. Built for Nepal.',
	},
	twitter: {
		cardType: 'summary_large_image',
	},
} as const

export function buildPageSeo(overrides: {
	title?: string
	description?: string
	url?: string
	noindex?: boolean
}) {
	return {
		...defaultSeo,
		...overrides,
		title: overrides.title ?? defaultSeo.title,
		openGraph: {
			...defaultSeo.openGraph,
			...(overrides.title && { title: overrides.title }),
			...(overrides.description && { description: overrides.description }),
			...(overrides.url && { url: overrides.url }),
		},
	}
}
