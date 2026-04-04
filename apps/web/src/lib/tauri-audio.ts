/**
 * Native audio capture via Tauri commands.
 * Only import/call these functions when isDesktop() is true.
 * Uses dynamic imports so @tauri-apps/api doesn't break browser builds.
 */

export interface AudioDevice {
	name: string
	is_default: boolean
}

export async function listAudioDevices(): Promise<AudioDevice[]> {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke<AudioDevice[]>('list_audio_devices')
}

export async function startAudioCapture(deviceName?: string): Promise<void> {
	const { invoke } = await import('@tauri-apps/api/core')
	await invoke('start_audio_capture', { deviceName: deviceName ?? null })
}

export async function stopAudioCapture(): Promise<void> {
	const { invoke } = await import('@tauri-apps/api/core')
	await invoke('stop_audio_capture')
}

export async function onAudioChunk(
	callback: (base64Data: string) => void,
): Promise<() => void> {
	const { listen } = await import('@tauri-apps/api/event')
	const unlisten = await listen<{ data: string }>('audio-chunk', (event) => {
		callback(event.payload.data)
	})
	return unlisten
}
