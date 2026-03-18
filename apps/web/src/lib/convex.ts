import { ConvexClient } from 'convex/browser';

let client: ConvexClient | null = null;

export function getConvexClient(url: string): ConvexClient {
	if (!client) {
		client = new ConvexClient(url);
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
