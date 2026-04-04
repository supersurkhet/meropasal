/**
 * Native camera capture via Tauri commands.
 * Preview uses browser-native getUserMedia (hardware-accelerated).
 * These Rust commands are only needed for high-res capture and device listing.
 */

export interface CameraDevice {
	index: number
	name: string
}

export interface CaptureResult {
	data: string // base64 JPEG
	width: number
	height: number
}

export async function listCameras(): Promise<CameraDevice[]> {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke<CameraDevice[]>('list_cameras')
}

export async function captureFrame(cameraIndex: number): Promise<CaptureResult> {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke<CaptureResult>('capture_frame', { cameraIndex })
}
