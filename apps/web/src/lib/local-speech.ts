type TranscriptState = {
	committed: string
	interim: string
}

type LocalSpeechCallbacks = {
	onTranscript: (state: TranscriptState) => void
	onError?: (message: string) => void
}

type SpeechRecognitionAlt = {
	transcript: string
}

type SpeechRecognitionResultAltList = {
	[index: number]: SpeechRecognitionAlt
	length: number
}

type SpeechRecognitionResultLike = {
	isFinal: boolean
	[index: number]: SpeechRecognitionAlt
	length: number
}

type SpeechRecognitionResultListLike = {
	[index: number]: SpeechRecognitionResultLike
	length: number
}

type SpeechRecognitionEventLike = Event & {
	resultIndex: number
	results: SpeechRecognitionResultListLike
}

type SpeechRecognitionErrorEventLike = Event & {
	error: string
	message?: string
}

type SpeechRecognitionLike = EventTarget & {
	continuous: boolean
	interimResults: boolean
	lang: string
	start: () => void
	stop: () => void
	onresult: ((event: SpeechRecognitionEventLike) => void) | null
	onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
	onend: ((event: Event) => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

declare global {
	interface Window {
		SpeechRecognition?: SpeechRecognitionCtor
		webkitSpeechRecognition?: SpeechRecognitionCtor
	}
}

export class LocalSpeechRecognizer {
	private recognition: SpeechRecognitionLike | null = null
	private active = false
	private callbacks: LocalSpeechCallbacks

	constructor(callbacks: LocalSpeechCallbacks) {
		this.callbacks = callbacks
	}

	static isSupported(): boolean {
		return typeof window !== 'undefined'
			&& !!(window.SpeechRecognition || window.webkitSpeechRecognition)
	}

	start(): boolean {
		const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
		if (!Recognition) return false

		this.active = true
		this.recognition = new Recognition()
		this.recognition.continuous = true
		this.recognition.interimResults = true
		this.recognition.lang = navigator.language || 'en-US'

		this.recognition.onresult = (event) => {
			let committed = ''
			let interim = ''

			for (let i = 0; i < event.results.length; i++) {
				const result = event.results[i]
				const transcript = result[0]?.transcript?.trim()
				if (!transcript) continue
				if (result.isFinal) {
					committed = committed ? `${committed} ${transcript}` : transcript
				} else {
					interim = interim ? `${interim} ${transcript}` : transcript
				}
			}

			this.callbacks.onTranscript({ committed, interim })
		}

		this.recognition.onerror = (event) => {
			if (!this.active) return
			this.callbacks.onError?.(event.message || event.error || 'Local speech recognition failed')
		}

		this.recognition.onend = () => {
			if (!this.active || !this.recognition) return
			try {
				this.recognition.start()
			} catch {
				// Ignore duplicate start errors while the recognizer settles.
			}
		}

		try {
			this.recognition.start()
			return true
		} catch (err) {
			this.active = false
			this.callbacks.onError?.(err instanceof Error ? err.message : 'Could not start local speech recognition')
			return false
		}
	}

	stop(): void {
		this.active = false
		if (!this.recognition) return
		this.recognition.onend = null
		this.recognition.onresult = null
		this.recognition.onerror = null
		try {
			this.recognition.stop()
		} catch {
			// Best-effort stop.
		}
		this.recognition = null
	}
}
