/**
 * Native file operations via Tauri commands and plugins.
 * All heavy lifting (base64 encoding, spreadsheet/word parsing) happens in Rust.
 * Only import/call these functions when isDesktop() is true.
 */

export interface PickedFile {
	path: string
	name: string
}

export interface FileBase64Result {
	data: string
	mime_type: string
	size: number
}

const FILE_FILTERS = [
	{
		name: 'All Supported',
		extensions: [
			'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif',
			'pdf',
			'xlsx', 'xls', 'csv',
			'docx', 'doc',
		],
	},
	{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] },
	{ name: 'Documents', extensions: ['pdf', 'docx', 'doc'] },
	{ name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] },
	{ name: 'All Files', extensions: ['*'] },
]

// ── File picker (native OS dialog) ─────────────────────

export async function pickFile(): Promise<PickedFile | null> {
	const { open } = await import('@tauri-apps/plugin-dialog')
	const result = await open({
		multiple: false,
		filters: FILE_FILTERS,
	})
	if (!result) return null
	const path = result as string
	const name = path.split('/').pop() ?? path.split('\\').pop() ?? path
	return { path, name }
}

// ── File reading + base64 (Rust native) ────────────────

export async function readFileBase64(path: string): Promise<FileBase64Result> {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke<FileBase64Result>('read_file_base64', { path })
}

// ── Spreadsheet parsing (Rust calamine) ────────────────

export async function parseSpreadsheet(path: string): Promise<string> {
	const { invoke } = await import('@tauri-apps/api/core')
	const result = await invoke<{ text: string }>('parse_spreadsheet', { path })
	return result.text
}

// ── Word doc parsing (Rust zip + quick-xml) ────────────

export async function parseWordDoc(path: string): Promise<string> {
	const { invoke } = await import('@tauri-apps/api/core')
	const result = await invoke<{ text: string }>('parse_word_doc', { path })
	return result.text
}

// ── Clipboard (native via Tauri plugin) ────────────────

export async function readClipboardText(): Promise<string | null> {
	const { readText } = await import('@tauri-apps/plugin-clipboard-manager')
	try {
		const text = await readText()
		return text || null
	} catch {
		return null
	}
}

export async function readClipboardImage(): Promise<string | null> {
	const { readImage } = await import('@tauri-apps/plugin-clipboard-manager')
	try {
		const img = await readImage()
		if (!img) return null
		// img is an Image object with rgba() method — convert to base64 PNG
		const rgba = await img.rgba()
		const { invoke } = await import('@tauri-apps/api/core')
		// Encode the raw RGBA bytes as base64 directly
		// The clipboard image is already in a usable format
		// We'll pass the raw bytes to the server which can handle them
		let binary = ''
		for (let i = 0; i < rgba.length; i++) {
			binary += String.fromCharCode(rgba[i])
		}
		return btoa(binary)
	} catch {
		return null
	}
}

// ── Drag-and-drop (native Tauri events) ────────────────

export type DropHandler = {
	onDragEnter: () => void
	onDragLeave: () => void
	onDrop: (paths: string[]) => void
}

export async function listenForDrop(handlers: DropHandler): Promise<() => void> {
	const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
	const appWindow = getCurrentWebviewWindow()

	const unlisten = await appWindow.onDragDropEvent((event) => {
		if (event.payload.type === 'enter') {
			handlers.onDragEnter()
		} else if (event.payload.type === 'leave') {
			handlers.onDragLeave()
		} else if (event.payload.type === 'drop') {
			handlers.onDrop(event.payload.paths)
		}
	})

	return unlisten
}

export { isSpreadsheet, isWordDoc } from './file-kind'
