import { ConvexClient } from 'convex/browser';
import { anyApi } from 'convex/server';

let client: ConvexClient | null = null;

export function getConvexClient(url?: string): ConvexClient {
	if (!client) {
		const convexUrl = url || import.meta.env.VITE_CONVEX_URL;
		if (!convexUrl) throw new Error('VITE_CONVEX_URL not set');
		client = new ConvexClient(convexUrl);
	}
	return client;
}

export function setConvexAuth(token: string | null) {
	if (client) {
		if (token) {
			client.setAuth(() => Promise.resolve(token));
		} else {
			client.setAuth(() => Promise.resolve(null));
		}
	}
}

/**
 * Typed API reference for calling Convex functions by path.
 * Usage: api.functions.sales.create → anyApi['functions/sales']['create']
 */
export const api = anyApi;
