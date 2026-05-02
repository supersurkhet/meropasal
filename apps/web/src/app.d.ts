// See https://svelte.dev/docs/kit/types#app.d.ts
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
		interface Locals {
			user: {
				id: string;
				email: string;
				firstName: string | null;
				lastName: string | null;
				profilePictureUrl: string | null;
			} | null;
			orgId: string | null;
			convexToken: string | null;
			isInternalStaff: boolean;
			impersonator: {
				email: string;
				reason: string | null;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
