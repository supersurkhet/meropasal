/**
 * Gemini Multimodal Live API client.
 * Connects via WebSocket for real-time audio streaming + structured data extraction.
 *
 * Protocol:
 * 1. Connect to wss://generativelanguage.googleapis.com/ws/...?key=API_KEY
 * 2. Send setup message with model config + tool definition
 * 3. Stream PCM audio chunks (16-bit, 16kHz, mono)
 * 4. Receive inputTranscription (live transcript) + tool calls (extracted data)
 */

import type { ScanResult } from './ai-schemas'
import { isDesktop } from './platform.svelte'

const WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'
const MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025'

// JSON Schema matching our scanResultSchema for the tool definition
const EXTRACTION_TOOL_SCHEMA = {
	type: 'OBJECT',
	properties: {
		parties: {
			type: 'ARRAY',
			description: 'Suppliers/vendors mentioned',
			items: {
				type: 'OBJECT',
				properties: {
					_ref: { type: 'STRING', description: 'Short unique key for this party (e.g. "ab_suppliers"). Products reference via supplierRef.' },
					name: { type: 'STRING', description: 'Supplier/party name' },
					panNumber: { type: 'STRING', description: 'PAN/VAT number' },
					address: { type: 'STRING', description: 'Address' },
					phone: { type: 'STRING', description: 'Phone number' },
				},
				required: ['name'],
			},
		},
		products: {
			type: 'ARRAY',
			description: 'Products mentioned',
			items: {
				type: 'OBJECT',
				properties: {
					title: { type: 'STRING', description: 'Product name' },
					supplierName: { type: 'STRING', description: 'Supplier name' },
					supplierRef: { type: 'STRING', description: 'Matches a party _ref for exact linking' },
					costPrice: { type: 'NUMBER', description: 'Cost price in NPR — MUST be per container for compound units (multiply per-piece price × count)' },
					sellingPrice: { type: 'NUMBER', description: 'Selling price in NPR — MUST be per container for compound units' },
					openingStock: { type: 'NUMBER', description: 'Stock quantity' },
					unit: { type: 'STRING', description: 'ONLY: piece, box, kg, liter, pack, dozen, bag. Compound: box:20, pack:12. Map carton/cartoon → box, packet → pack' },
					category: { type: 'STRING', description: 'Product category' },
					barcode: { type: 'STRING', description: 'Barcode' },
				},
				required: ['title', 'costPrice', 'openingStock'],
			},
		},
		customers: {
			type: 'ARRAY',
			description: 'Customers mentioned',
			items: {
				type: 'OBJECT',
				properties: {
					name: { type: 'STRING', description: 'Customer name' },
					phone: { type: 'STRING', description: 'Phone number' },
					email: { type: 'STRING', description: 'Email' },
					address: { type: 'STRING', description: 'Address' },
				},
				required: ['name'],
			},
		},
	},
	required: ['parties', 'products', 'customers'],
}

const SYSTEM_INSTRUCTION = `You are a data extraction assistant for a Nepali retail management system.
The user will dictate product data, supplier info, or customer info in English or Nepali.
Listen carefully and extract ALL structured business data using the extract_business_data tool.

RULES:
- Prices are in NPR. Units: piece, box, kg, liter, pack, dozen, bag. Map carton→box, packet→pack, pcs→piece.
- Compound units: "box:20" = box of 20 pieces. costPrice/sellingPrice MUST be per-container.
  "13 per piece, carton of 20" → costPrice=260, unit="box:20"
- If sellingPrice not stated, set sellingPrice = round(costPrice × 1.10).
- If openingStock not stated, set to 0. costPrice must be > 0.
- Each supplier appears ONCE in parties with a _ref key. Products use supplierRef to link.
- Same supplier mentioned again → reuse same _ref. Different location → different _ref.
- Same product from different suppliers = separate products.
- Deduplicate: pick one canonical name per entity. "A and B" = "A&B" = same entity.
- If user corrects ("no wait", "actually", "not X, Y") → use corrected value.
- Ignore filler words. Transliterate Nepali to English.
- "costing X" = costPrice. "selling at X" = sellingPrice.
- Call the tool with ALL data heard so far when the user pauses or finishes.
- Call the tool multiple times as more data is dictated — include ALL data, not just new.`

export type GeminiLiveCallbacks = {
	onTranscript: (text: string) => void
	onExtractedData: (data: Partial<ScanResult>) => void
	onError: (error: string) => void
	onConnected: () => void
	onDisconnected: () => void
}

export class GeminiLiveSession {
	private ws: WebSocket | null = null
	private mediaStream: MediaStream | null = null
	private audioContext: AudioContext | null = null
	private sourceNode: MediaStreamAudioSourceNode | null = null
	private processorNode: ScriptProcessorNode | null = null
	private unlistenAudio: (() => void) | null = null
	private callbacks: GeminiLiveCallbacks
	private setupComplete = false

	constructor(callbacks: GeminiLiveCallbacks) {
		this.callbacks = callbacks
	}

	async connect(): Promise<void> {
		try {
			// 1. Get API key from server
			console.log('[GeminiLive] Fetching ephemeral token...')
			const tokenRes = await fetch('/api/ai-scanner/token', { method: 'POST' })
			if (!tokenRes.ok) {
				const text = await tokenRes.text()
				console.error('[GeminiLive] Token fetch failed:', tokenRes.status, text)
				this.callbacks.onError(`Voice setup failed (${tokenRes.status})`)
				return
			}
			const { token } = await tokenRes.json()
			if (!token) {
				console.error('[GeminiLive] Token response missing token field')
				this.callbacks.onError('Voice setup failed — invalid token')
				return
			}
			console.log('[GeminiLive] Token acquired, opening WebSocket...')

			// 2. Open WebSocket with ephemeral token
			const url = `${WS_URL}?key=${token}`
			this.ws = new WebSocket(url)
			this.ws.binaryType = 'arraybuffer'

			this.ws.onopen = () => {
				console.log('[GeminiLive] WebSocket connected, sending setup...')
				this.sendSetup()
			}

			this.ws.onmessage = (event) => {
				console.log('[GeminiLive] Raw message type:', typeof event.data, event.data instanceof ArrayBuffer ? `ArrayBuffer(${event.data.byteLength})` : event.data instanceof Blob ? `Blob(${event.data.size})` : 'string')
				this.handleMessage(event.data)
			}

			this.ws.onerror = (event) => {
				console.error('[GeminiLive] WebSocket error:', event)
				this.callbacks.onError('Voice connection failed')
			}

			this.ws.onclose = (event) => {
				console.log('[GeminiLive] WebSocket closed:', event.code, event.reason)
				if (!this.setupComplete && event.code !== 1000) {
					this.callbacks.onError(`Voice connection closed (${event.code})`)
				}
				this.callbacks.onDisconnected()
			}
		} catch (err) {
			console.error('[GeminiLive] Connect error:', err)
			this.callbacks.onError(err instanceof Error ? err.message : 'Failed to connect')
		}
	}

	private sendSetup(): void {
		if (!this.ws) return

		const setup = {
			setup: {
				model: MODEL,
				generationConfig: {
					responseModalities: ['AUDIO'],
					speechConfig: {
						voiceConfig: {
							prebuiltVoiceConfig: {
								voiceName: 'Kore',
							},
						},
					},
				},
				realtimeInputConfig: {
					activityHandling: 'START_OF_ACTIVITY_INTERRUPTS',
					automaticActivityDetection: {
						disabled: false,
						startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
						endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
						prefixPaddingMs: 20,
						silenceDurationMs: 140,
					},
				},
				tools: [
					{
						functionDeclarations: [
							{
								name: 'extract_business_data',
								description: 'Extract structured business data (suppliers, products, customers) from the user dictation',
								parameters: EXTRACTION_TOOL_SCHEMA,
							},
						],
					},
				],
				systemInstruction: {
					parts: [{ text: SYSTEM_INSTRUCTION }],
				},
				inputAudioTranscription: {},
				outputAudioTranscription: {},
			},
		}

		console.log('[GeminiLive] Sending setup:', JSON.stringify(setup).slice(0, 200))
		this.ws.send(JSON.stringify(setup))
	}

	private handleMessage(data: string | ArrayBuffer | Blob): void {
		if (data instanceof Blob) {
			// Convert Blob to text, then re-process
			data.text().then((text) => this.handleMessage(text))
			return
		}
		if (data instanceof ArrayBuffer) {
			const text = new TextDecoder().decode(data)
			return this.handleMessage(text)
		}

		try {
			const msg = JSON.parse(data)
			console.log('[GeminiLive] Received message:', Object.keys(msg))

			// Setup complete acknowledgment
			if (msg.setupComplete) {
				this.setupComplete = true
				this.callbacks.onConnected()
				this.startAudioCapture()
				return
			}

			// Input transcription (what the user is saying)
			if (msg.serverContent?.inputTranscription?.text) {
				this.callbacks.onTranscript(msg.serverContent.inputTranscription.text)
			}

			// Tool call (extracted structured data)
			if (msg.toolCall) {
				for (const call of msg.toolCall.functionCalls || []) {
					if (call.name === 'extract_business_data' && call.args) {
						this.callbacks.onExtractedData(call.args as Partial<ScanResult>)

						// Send tool response to acknowledge
						this.ws?.send(
							JSON.stringify({
								toolResponse: {
									functionResponses: [
										{
											id: call.id,
											name: call.name,
											response: { result: 'ok' },
										},
									],
								},
							})
						)
					}
				}
			}

			// Check for model turn with function calls
			if (msg.serverContent?.modelTurn?.parts) {
				for (const part of msg.serverContent.modelTurn.parts) {
					if (part.functionCall) {
						const call = part.functionCall
						if (call.name === 'extract_business_data' && call.args) {
							this.callbacks.onExtractedData(call.args as Partial<ScanResult>)
						}
					}
				}
			}
		} catch {
			// Skip malformed messages
		}
	}

	private async startAudioCapture(): Promise<void> {
		console.log('[GeminiLive] Starting audio capture via Web Audio API')
		// Always use Web Audio API — works in both browser and Tauri WKWebView,
		// and properly triggers the OS permission dialog on all platforms.
		await this.startWebCapture()
	}

	/** Native Rust audio capture via Tauri commands + events */
	private async startNativeCapture(): Promise<void> {
		try {
			const { startAudioCapture, onAudioChunk } = await import('./tauri-audio')

			let chunkCount = 0
			this.unlistenAudio = await onAudioChunk((base64Data) => {
				if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.setupComplete) return
				chunkCount++
				if (chunkCount <= 3) console.log(`[GeminiLive] Audio chunk #${chunkCount}, size: ${base64Data.length}`)

				this.ws.send(
					JSON.stringify({
						realtimeInput: {
							audio: {
								data: base64Data,
								mimeType: 'audio/pcm;rate=16000',
							},
						},
					})
				)
			})

			console.log('[GeminiLive] Starting native audio capture...')
			await startAudioCapture()
			console.log('[GeminiLive] Native audio capture started')
		} catch (err) {
			console.error('[GeminiLive] Native audio capture failed:', err)
			this.callbacks.onError(
				err instanceof Error ? err.message : 'Microphone access failed — check System Settings > Privacy > Microphone'
			)
		}
	}

	/** Web Audio API capture (browser fallback) */
	private async startWebCapture(): Promise<void> {
		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
				},
			})

			this.audioContext = new AudioContext({ sampleRate: 16000 })
			this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)

			// Use ScriptProcessorNode (deprecated but widely supported)
			// AudioWorklet would be better but requires a separate file served over HTTPS
			const bufferSize = 4096
			this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

			this.processorNode.onaudioprocess = (event) => {
				if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.setupComplete) return

				const inputData = event.inputBuffer.getChannelData(0)

				// Convert Float32 to Int16
				const pcm16 = new Int16Array(inputData.length)
				for (let i = 0; i < inputData.length; i++) {
					const s = Math.max(-1, Math.min(1, inputData[i]))
					pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
				}

				// Base64 encode
				const bytes = new Uint8Array(pcm16.buffer)
				let binary = ''
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i])
				}
				const base64 = btoa(binary)

				// Send audio chunk
				this.ws.send(
					JSON.stringify({
						realtimeInput: {
							audio: {
								data: base64,
								mimeType: 'audio/pcm;rate=16000',
							},
						},
					})
				)
			}

			this.sourceNode.connect(this.processorNode)
			this.processorNode.connect(this.audioContext.destination)
		} catch (err) {
			console.error('[GeminiLive] Web audio capture failed:', err)
			const msg = err instanceof Error && err.name === 'NotAllowedError'
				? 'Microphone permission denied — allow in browser settings'
				: 'Could not access microphone'
			this.callbacks.onError(msg)
		}
	}

	disconnect(): void {
		// Stop native audio capture (if active)
		if (this.unlistenAudio) {
			this.unlistenAudio()
			this.unlistenAudio = null
			import('./tauri-audio').then(({ stopAudioCapture }) => stopAudioCapture()).catch(() => {})
		}

		// Stop web audio capture (if active)
		if (this.processorNode) {
			this.processorNode.disconnect()
			this.processorNode = null
		}
		if (this.sourceNode) {
			this.sourceNode.disconnect()
			this.sourceNode = null
		}
		if (this.audioContext) {
			this.audioContext.close()
			this.audioContext = null
		}
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((t) => t.stop())
			this.mediaStream = null
		}

		// Close WebSocket
		if (this.ws) {
			if (this.ws.readyState === WebSocket.OPEN) {
				this.ws.close()
			}
			this.ws = null
		}

		this.setupComplete = false
	}
}
