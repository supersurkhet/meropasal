/**
 * Cross-platform permission requests via Tauri commands.
 * Triggers OS-native permission dialogs on macOS.
 * On Windows/Linux, typically succeeds immediately.
 */

export interface PermissionResult {
	granted: boolean
	error: string | null
}

export async function requestMicrophonePermission(): Promise<PermissionResult> {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke<PermissionResult>('request_microphone_permission')
}

export async function requestCameraPermission(): Promise<PermissionResult> {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke<PermissionResult>('request_camera_permission')
}
