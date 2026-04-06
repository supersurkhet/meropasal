class AudioCaptureProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super()
		this.chunkSamples = options.processorOptions?.chunkSamples ?? 1024
		this.buffer = new Int16Array(this.chunkSamples)
		this.offset = 0
	}

	process(inputs, outputs) {
		const input = inputs[0]?.[0]
		const output = outputs[0]?.[0]
		if (output) output.fill(0)
		if (!input) return true

		let sumSquares = 0
		for (let i = 0; i < input.length; i++) {
			const sample = Math.max(-1, Math.min(1, input[i]))
			sumSquares += sample * sample
			this.buffer[this.offset++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff

			if (this.offset === this.chunkSamples) {
				const rms = Math.sqrt(sumSquares / this.chunkSamples)
				this.port.postMessage({ pcm: this.buffer.buffer.slice(0), rms }, [this.buffer.buffer])
				this.buffer = new Int16Array(this.chunkSamples)
				this.offset = 0
				sumSquares = 0
			}
		}

		return true
	}
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor)
