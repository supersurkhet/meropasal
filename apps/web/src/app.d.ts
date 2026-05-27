// See https://svelte.dev/docs/kit/types#app.d.ts
/// <reference types="svelte-clerk/env" />

declare global {
	interface BarcodeDetector {
		detect(source: HTMLVideoElement | HTMLImageElement | ImageBitmap | Blob): Promise<Array<{ rawValue: string; format: string }>>;
	}
	interface BarcodeDetectorConstructor {
		new (options?: { formats?: string[] }): BarcodeDetector;
	}
	var BarcodeDetector: BarcodeDetectorConstructor | undefined;

	namespace App {
		// interface Error {}
		// `auth: (options?) => SessionAuthObject` is provided ambiently by
		// svelte-clerk/env — do not redeclare here; this interface is merged
		// with the one in node_modules/svelte-clerk/dist/env.d.ts.
		interface Locals {
			userId: string | null;
			orgId: string | null;
			convexToken: string | null;
			isInternalStaff: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
