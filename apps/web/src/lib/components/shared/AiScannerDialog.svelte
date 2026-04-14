<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
	} from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Textarea } from '$lib/components/ui/textarea'
	import { getConvexClient } from '$lib/convex'
	import { useConvexMutation } from '$lib/convex-helpers.svelte'
	import { api } from '$lib/api'
	import { toast } from 'svelte-sonner'
	import { streamScan } from '$lib/ai-scanner-stream'
	import { GeminiLiveSession } from '$lib/gemini-live'
	import { LocalSpeechRecognizer } from '$lib/local-speech'
	import { fallbackSellingPrice, normalizeSellingPrice } from '$lib/pricing'
	import type { ScanResult } from '$lib/ai-schemas'
	import {
		Loader2,
		Check,
		X,
		Trash2,
		Mic,
		MicOff,
		ArrowLeft,
		FolderOpen,
		Camera,
		Aperture,
		RefreshCw,
		FileText,
		ImageIcon,
	} from '@lucide/svelte'
	import { onMount, onDestroy, tick } from 'svelte'
	import { isDesktop } from '$lib/platform.svelte'
	import EntitySelect from '$lib/components/shared/EntitySelect.svelte'
	import PartyForm from '$lib/components/modules/parties/PartyForm.svelte'
	import UnitBuilder from '$lib/components/shared/UnitBuilder.svelte'
	import PricePerUnitInput from '$lib/components/shared/PricePerUnitInput.svelte'
	import * as Select from '$lib/components/ui/select'

	type TargetTable = 'products' | 'parties' | 'customers' | 'mixed' | 'stock-import' | 'orders' | 'sales' | 'trips'
	type ExtractedLineItem = {
		productTitle: string
		productId: string
		quantity: number
		unit: string
		unitStr: string
		rate: number
		supplierName?: string
	}
	type ScanInputKind = 'text' | 'voice' | 'camera' | 'file' | 'mixed'

	let {
		open = $bindable(false),
		targetTable = 'mixed',
		onlineitems,
	}: {
		open?: boolean
		targetTable?: TargetTable
		/** Callback for bill-based modules: receives extracted line items instead of bulk importing */
		onlineitems?: (items: ExtractedLineItem[], partyName?: string) => void
	} = $props()

	const isBillMode = $derived(['stock-import', 'orders', 'sales', 'trips'].includes(targetTable))

	let billPrimaryHeading = $derived.by(() => {
		switch (targetTable) {
			case 'stock-import':
				return 'Stock import lines'
			case 'orders':
				return 'Order lines'
			case 'sales':
				return 'Sale lines'
			case 'trips':
				return 'Trip lines'
			default:
				return 'Lines'
		}
	})

	type Phase = 'idle' | 'active' | 'saving' | 'done' | 'error'

	let phase = $state<Phase>('idle')
	let showCamera = $state(false)
	let errorMessage = $state('')
	let streaming = $state(false)
	let streamComplete = $state(false)
	let extractionSessionId = $state(0)

	const categories = ['general', 'food', 'beverage', 'dairy', 'snacks', 'household', 'personal', 'stationery', 'other']

	// ── Name normalization for fuzzy matching ───────────────
	/** Normalize a name for comparison: lowercase, collapse whitespace, & ↔ and, strip suffixes */
	function normalizeName(name: string): string {
		return name
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim()
			.replace(/\b(pvt\.?|ltd\.?|llc|inc\.?|co\.?|corp\.?|private|limited)\b/gi, '')
			.replace(/&/g, ' and ')
			.replace(/\band\b/g, ' and ')
			.replace(/[''`]/g, '')       // normalize apostrophes
			.replace(/[.\-,]/g, ' ')     // dots/dashes/commas → space
			.replace(/\s+/g, ' ')
			.trim()
	}

	function namesMatch(a: string, b: string): boolean {
		const na = normalizeName(a)
		const nb = normalizeName(b)
		if (na === nb) return true
		if (na.length >= 4 && nb.length >= 4) {
			const wordsA = na.split(' ')
			const wordsB = nb.split(' ')
			const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB
			const longer = wordsA.length <= wordsB.length ? wordsB : wordsA
			if (shorter.length > 0 && shorter.every((w, i) => longer[i] === w)) return true
		}
		return false
	}

	// ── Existing entities for lookup/dedup ──────────────────
	type Party = { _id: string; name: string; panNumber?: string; address?: string; phone?: string; creditLimit?: number; paymentTerms?: string; notes?: string }
	type ExistingProduct = { _id: string; title: string; barcode?: string; sku?: string }
	type ExistingCustomer = { _id: string; name: string; panNumber?: string; phone?: string; email?: string }

	let existingParties = $state<Party[]>([])
	let existingProducts = $state<ExistingProduct[]>([])
	let existingCustomers = $state<ExistingCustomer[]>([])

	async function loadParties() {
		existingParties = await client.query(api.functions.parties.list, {})
	}

	async function loadProducts() {
		existingProducts = await client.query(api.functions.products.list, {})
	}

	async function loadCustomers() {
		existingCustomers = await client.query(api.functions.customers.list, {})
	}

	// Merge DB parties + AI-extracted new parties for the supplier dropdown
	let allParties = $derived.by(() => {
		const merged = [...existingParties]
		for (const ep of extractedParties) {
			// Only add truly new parties (not matched to existing)
			if (ep.name && !ep._existingId) {
				const alreadyAdded = merged.some((m) => namesMatch(m.name, ep.name))
				if (!alreadyAdded) {
					merged.push({
						_id: `__new__${ep.name}`,
						name: ep.name,
						panNumber: ep.panNumber,
						address: ep.address,
						phone: ep.phone,
					} as Party)
				}
			}
		}
		return merged
	})

	// AI extraction results
	let extractedParties = $state<any[]>([])
	let extractedProducts = $state<any[]>([])
	let extractedCustomers = $state<any[]>([])

	// Import summary
	let summary = $state({ parties: 0, products: 0, customers: 0 })
	let lastScanInputKind = $state<ScanInputKind>('text')

	// Text input
	let textInput = $state('')

	// Voice (Gemini Live API)
	let transcript = $state('')
	let localCommittedTranscript = $state('')
	let localInterimTranscript = $state('')
	let voiceTextBase = $state('')
	let liveSession: GeminiLiveSession | null = null
	let localSpeechRecognizer: LocalSpeechRecognizer | null = null
	let isListening = $state(false)
	let isConnecting = $state(false)
	let voiceError = $state('')

	// Camera (uses browser-native getUserMedia for hardware-accelerated preview)
	let videoEl = $state<HTMLVideoElement | null>(null)
	let mediaStream = $state<MediaStream | null>(null)
	let capturedImage = $state('')
	let cameraError = $state('')
	let isCapturing = $state(false)
	let cameraReady = $state(false)
	let cameraButtonEl = $state<HTMLButtonElement | null>(null)
	let cameraContainerEl = $state<HTMLDivElement | null>(null)
	let cameraAnimating = $state<'expanding' | 'collapsing' | null>(null)

	// Attached files & pasted images
	let attachedFiles = $state<Array<{ id: string; name: string; data: string; mimeType: string }>>([])

	let isDragOver = $state(false)
	let webDragDepth = $state(0)
	let unlistenDrop: (() => void) | null = null

	const SIZE_THRESHOLD = 10 * 1024 * 1024

	const client = getConvexClient(import.meta.env.VITE_CONVEX_URL)
	const generateUploadUrl = useConvexMutation(client, api.functions.organizations.generateUploadUrl)

	let textareaEl = $state<HTMLTextAreaElement | null>(null)
	let fileInputEl = $state<HTMLInputElement | null>(null)

	// Load all existing entities for dedup on dialog open
	$effect(() => {
		if (open) {
			loadParties()
			loadProducts()
			loadCustomers()
		}
	})

	onMount(async () => {
		if (!isDesktop()) return
		try {
			const { listenForDrop } = await import('$lib/tauri-file')
			unlistenDrop = await listenForDrop({
				onDragEnter: () => {
					if (open) isDragOver = true
				},
				onDragLeave: () => {
					isDragOver = false
				},
				onDrop: (paths) => {
					isDragOver = false
					if (!open || paths.length === 0) return
					if (streaming) return
					const path = paths[0]
					const name = path.split('/').pop() ?? path.split('\\').pop() ?? path
					processNativeFile(path, name)
				},
			})
		} catch {
		}
	})

	onDestroy(() => {
		unlistenDrop?.()
	})

	// ── Streaming extraction ────────────────────────────────

	/** Find an existing DB party by PAN or normalized name */
	function findExistingParty(extracted: { name?: string; panNumber?: string }): Party | null {
		if (!extracted.name && !extracted.panNumber) return null

		// 1. Exact PAN match (most reliable identifier)
		if (extracted.panNumber) {
			const panMatch = existingParties.find(
				(p) => p.panNumber && p.panNumber === extracted.panNumber
			)
			if (panMatch) return panMatch
		}

		// 2. Normalized name match (handles &/and, suffixes, whitespace, case)
		if (extracted.name) {
			const match = existingParties.find((p) => namesMatch(p.name, extracted.name!))
			if (match) return match
		}

		return null
	}

	/** Find an existing DB product by barcode, SKU, or normalized title */
	function findExistingProduct(extracted: { title?: string; barcode?: string; sku?: string }): ExistingProduct | null {
		if (!extracted.title && !extracted.barcode && !extracted.sku) return null

		// 1. Barcode match (unique identifier)
		if (extracted.barcode) {
			const match = existingProducts.find((p) => p.barcode && p.barcode === extracted.barcode)
			if (match) return match
		}

		// 2. SKU match
		if (extracted.sku) {
			const match = existingProducts.find((p) => p.sku && p.sku === extracted.sku)
			if (match) return match
		}

		// 3. Normalized title match
		if (extracted.title) {
			const match = existingProducts.find((p) => namesMatch(p.title, extracted.title!))
			if (match) return match
		}

		return null
	}

	/** Find an existing DB customer by PAN, phone, email, or normalized name */
	function findExistingCustomer(extracted: { name?: string; panNumber?: string; phone?: string; email?: string }): ExistingCustomer | null {
		if (!extracted.name && !extracted.panNumber && !extracted.phone && !extracted.email) return null

		// 1. PAN match
		if (extracted.panNumber) {
			const match = existingCustomers.find((c) => c.panNumber && c.panNumber === extracted.panNumber)
			if (match) return match
		}

		// 2. Phone match (strip non-digits for comparison)
		if (extracted.phone) {
			const digits = extracted.phone.replace(/\D/g, '')
			if (digits.length >= 7) {
				const match = existingCustomers.find((c) => c.phone && c.phone.replace(/\D/g, '').endsWith(digits.slice(-10)))
				if (match) return match
			}
		}

		// 3. Email match
		if (extracted.email) {
			const match = existingCustomers.find((c) => c.email && c.email.toLowerCase() === extracted.email!.toLowerCase())
			if (match) return match
		}

		// 4. Normalized name match
		if (extracted.name) {
			const match = existingCustomers.find((c) => namesMatch(c.name, extracted.name!))
			if (match) return match
		}

		return null
	}

	/** Try to match a supplier ref or name to an existing or extracted party ID */
	function resolvePartyId(supplierRef?: string, supplierName?: string): string {
		// 1. Ref-based resolution (from same extraction batch)
		if (supplierRef) {
			const refMatch = extractedParties.find((p) => p._ref === supplierRef)
			if (refMatch) {
				if (refMatch._existingId) return refMatch._existingId
				return `__new__${refMatch.name}`
			}
		}
		// 2. Name-based fallback
		if (!supplierName) return ''
		const match = findExistingParty({ name: supplierName })
		if (match) return match._id
		const extractedMatch = extractedParties.find(
			(p) => p.name && namesMatch(p.name, supplierName)
		)
		if (extractedMatch) return `__new__${extractedMatch.name}`
		return ''
	}

	/**
	 * Enrich extracted parties: deduplicate within batch, then check DB for existing matches.
	 */
	function enrichParties(parties: any[]): any[] {
		const seen = new Map<string, any>()
		const deduped: any[] = []

		for (const p of parties) {
			const norm = normalizeName(p.name || '')

			// Within-batch dedup: merge attributes from duplicate
			const batchKey = [...seen.keys()].find((k) => namesMatch(k, p.name || ''))
			if (batchKey) {
				const prev = seen.get(batchKey)!
				if (p.address && !prev.address) prev.address = p.address
				if (p.phone && !prev.phone) prev.phone = p.phone
				if (p.panNumber && !prev.panNumber) prev.panNumber = p.panNumber
				continue
			}

			const existing = findExistingParty(p)
			const enriched = {
				...p,
				_existingId: existing?._id ?? null,
				_existingName: existing?.name ?? null,
			}
			seen.set(norm, enriched)
			deduped.push(enriched)
		}
		return deduped
	}

	/** Enrich products: resolve supplier, check for existing, auto selling price */
	function enrichProducts(products: any[]): any[] {
		return products.map((p) => {
			const existing = findExistingProduct(p)
			const costPrice = Number(p.costPrice) || 0
			const sellingPrice = normalizeSellingPrice(costPrice, p.sellingPrice)
			const hasValidManualSellingPrice =
				p.sellingPrice !== undefined
				&& p.sellingPrice !== null
				&& Number.isFinite(p.sellingPrice)
				&& Number(p.sellingPrice) >= costPrice
			return {
				...p,
				purchasePartyId: p.purchasePartyId || resolvePartyId(p.supplierRef, p.supplierName),
				sellingPrice,
				category: p.category || '',
				_sellingPriceManual: hasValidManualSellingPrice,
				_existingId: existing?._id ?? null,
				_existingTitle: existing?.title ?? null,
			}
		})
	}

	/** Enrich customers: check for existing matches */
	function enrichCustomers(customers: any[]): any[] {
		return customers.map((c) => {
			const existing = findExistingCustomer(c)
			return {
				...c,
				_existingId: existing?._id ?? null,
				_existingName: existing?.name ?? null,
			}
		})
	}

	/** Update selling price when cost changes (if not manually set) */
	function onProductCostChange(product: any, value: number) {
		product.costPrice = value
		if (!product._sellingPriceManual || product.sellingPrice < value) {
			product.sellingPrice = fallbackSellingPrice(value)
			product._sellingPriceManual = false
			// Trigger reactivity
			extractedProducts = [...extractedProducts]
		}
	}

	/**
	 * Merge voice extraction data — each Gemini Live tool call should contain ALL data heard so far,
	 * but may occasionally drop fields from earlier calls. We merge to prevent data loss.
	 */
	function mergeVoiceData(prev: any[], incoming: any[], keyField: string): any[] {
		if (!incoming?.length) return prev
		const merged = new Map<string, any>()
		for (const item of prev) {
			const key = (item[keyField] || '').toLowerCase().trim()
			if (key) merged.set(key, item)
		}
		for (const item of incoming) {
			const key = (item[keyField] || '').toLowerCase().trim()
			if (key) merged.set(key, item) // incoming overrides prev
		}
		return [...merged.values()]
	}

	function handlePartial(data: Partial<ScanResult>) {
		if (data.parties) extractedParties = enrichParties([...data.parties])
		if (data.products) extractedProducts = enrichProducts([...data.products])
		if (data.customers) extractedCustomers = enrichCustomers([...data.customers])
	}

	function handleVoiceData(data: Partial<ScanResult>) {
		if (data.parties) {
			const merged = mergeVoiceData(extractedParties, data.parties, 'name')
			extractedParties = enrichParties(merged)
		}
		if (data.products) {
			const merged = mergeVoiceData(extractedProducts, data.products, 'title')
			extractedProducts = enrichProducts(merged)
		}
		if (data.customers) {
			const merged = mergeVoiceData(extractedCustomers, data.customers, 'name')
			extractedCustomers = enrichCustomers(merged)
		}
	}

	function handleStreamDone(data: ScanResult) {
		extractedParties = enrichParties(data.parties ?? [])
		extractedProducts = enrichProducts(data.products ?? [])
		extractedCustomers = enrichCustomers(data.customers ?? [])
		streaming = false
		streamComplete = true
	}

	function handleStreamError(err: string) {
		streaming = false
		phase = 'error'
		errorMessage = err
	}

	async function startStreaming(opts: { textContent?: string; fileUrl?: string; fileData?: string; mimeType: string }) {
		phase = 'active'
		streaming = true
		streamComplete = false
		lastScanInputKind = detectCurrentInputKind()
		extractionSessionId++
		const sessionId = extractionSessionId
		extractedParties = []
		extractedProducts = []
		extractedCustomers = []

		await streamScan({
			...opts,
			targetTable,
			onPartial: (data) => {
				if (extractionSessionId !== sessionId) return
				handlePartial(data)
			},
			onDone: (data) => {
				if (extractionSessionId !== sessionId) return
				handleStreamDone(data)
			},
			onError: (err) => {
				if (extractionSessionId !== sessionId) return
				handleStreamError(err)
			},
		})
	}

	async function attachOrUploadBinary(name: string, data: string, mime_type: string, size: number) {
		if (size < SIZE_THRESHOLD) {
			attachedFiles = [
				...attachedFiles,
				{ id: crypto.randomUUID(), name, data, mimeType: mime_type },
			]
		} else {
			const binary = atob(data)
			const bytes = new Uint8Array(binary.length)
			for (let i = 0; i < binary.length; i++) {
				bytes[i] = binary.charCodeAt(i)
			}
			const uploadUrl = await generateUploadUrl.mutate({})
			const uploadRes = await fetch(uploadUrl as string, {
				method: 'POST',
				headers: { 'Content-Type': mime_type },
				body: bytes,
			})
			const { storageId } = await uploadRes.json()
			const fileUrl = await client.query(api.functions.organizations.getStorageUrl, { storageId })
			await startStreaming({ fileUrl, mimeType: mime_type })
		}
	}

	async function openFilePicker() {
		if (isDesktop()) {
			try {
				const { pickFile } = await import('$lib/tauri-file')
				const file = await pickFile()
				if (!file) return
				await processNativeFile(file.path, file.name)
			} catch (err) {
				phase = 'error'
				errorMessage = err instanceof Error ? err.message : 'Failed to open file'
			}
		} else {
			fileInputEl?.click()
		}
	}

	async function onWebFileInputChange(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		input.value = ''
		if (!file) return
		await processBrowserFile(file)
	}

	async function processBrowserFile(file: File) {
		try {
			const { readFileForScan } = await import('$lib/web-file-import')
			const result = await readFileForScan(file)
			if (result.kind === 'text') {
				await startStreaming({ textContent: result.text, mimeType: result.mimeType })
			} else {
				await attachOrUploadBinary(file.name, result.data, result.mimeType, result.size)
			}
		} catch (err) {
			phase = 'error'
			errorMessage = err instanceof Error ? err.message : 'Failed to process file'
			toast.error(errorMessage)
		}
	}

	async function processNativeFile(path: string, name: string) {
		const { isSpreadsheet, isWordDoc, readFileBase64, parseSpreadsheet, parseWordDoc } = await import('$lib/tauri-file')

		try {
			if (isSpreadsheet(name)) {
				const text = await parseSpreadsheet(path)
				await startStreaming({ textContent: text, mimeType: 'text/csv' })
			} else if (isWordDoc(name)) {
				const text = await parseWordDoc(path)
				await startStreaming({ textContent: text, mimeType: 'text/plain' })
			} else {
				const result = await readFileBase64(path)
				await attachOrUploadBinary(name, result.data, result.mime_type, result.size)
			}
		} catch (err) {
			phase = 'error'
			errorMessage = err instanceof Error ? err.message : 'Failed to process file'
		}
	}

	function handleWebDragEnter(e: DragEvent) {
		if (isDesktop()) return
		e.preventDefault()
		e.stopPropagation()
		if (!e.dataTransfer?.types.includes('Files')) return
		webDragDepth++
		if (open) isDragOver = true
	}

	function handleWebDragLeave(e: DragEvent) {
		if (isDesktop()) return
		e.preventDefault()
		webDragDepth--
		if (webDragDepth <= 0) {
			webDragDepth = 0
			isDragOver = false
		}
	}

	function handleWebDragOver(e: DragEvent) {
		if (isDesktop()) return
		e.preventDefault()
		e.dataTransfer!.dropEffect = 'copy'
	}

	async function handleWebDrop(e: DragEvent) {
		if (isDesktop()) return
		e.preventDefault()
		webDragDepth = 0
		isDragOver = false
		const file = e.dataTransfer?.files?.[0]
		if (!file || !open || streaming) return
		await processBrowserFile(file)
	}

	// ── Camera ──────────────────────────────────────────────

	/** Compute the FLIP transform: from button origin to full container */
	function computeFlipOrigin(): { x: number; y: number; scaleX: number; scaleY: number } | null {
		if (!cameraButtonEl || !cameraContainerEl) return null
		const btn = cameraButtonEl.getBoundingClientRect()
		const container = cameraContainerEl.getBoundingClientRect()
		if (container.width === 0 || container.height === 0) return null
		return {
			x: btn.left + btn.width / 2 - (container.left + container.width / 2),
			y: btn.top + btn.height / 2 - (container.top + container.height / 2),
			scaleX: btn.width / container.width,
			scaleY: btn.height / container.height,
		}
	}

	async function startCameraPreview() {
		cameraError = ''
		capturedImage = ''
		cameraReady = false
		showCamera = true
		cameraAnimating = 'expanding'

		await tick()

		// FLIP expand: start from button position, animate to full size
		if (cameraContainerEl) {
			const flip = computeFlipOrigin()
			if (flip) {
				const el = cameraContainerEl
				el.style.transform = `translate(${flip.x}px, ${flip.y}px) scale(${flip.scaleX}, ${flip.scaleY})`
				el.style.opacity = '0.3'
				el.style.borderRadius = '1rem'

				requestAnimationFrame(() => {
					el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out, border-radius 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
					el.style.transform = 'translate(0, 0) scale(1, 1)'
					el.style.opacity = '1'
					el.style.borderRadius = '0.5rem'

					let cleaned = false
					const cleanup = () => {
						if (cleaned) return
						cleaned = true
						el.style.transition = ''
						el.style.transform = ''
						el.style.borderRadius = ''
						el.style.opacity = ''
						cameraAnimating = null
					}
					el.addEventListener('transitionend', cleanup, { once: true })
					setTimeout(cleanup, 450)
				})
			} else {
				cameraAnimating = null
			}
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false,
			})
			mediaStream = stream

			await tick()
			if (videoEl) {
				videoEl.srcObject = stream
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === 'NotAllowedError') {
				cameraError = 'Camera permission denied. Please grant access in System Settings > Privacy & Security > Camera.'
			} else if (err instanceof DOMException && err.name === 'NotFoundError') {
				cameraError = 'No camera detected'
			} else {
				cameraError = err instanceof Error ? err.message : 'Failed to start camera'
			}
		}
	}

	function handleVideoReady() {
		cameraReady = true
	}

	async function handleCameraCapture() {
		if (!videoEl || !mediaStream) return
		try {
			isCapturing = true
			const canvas = document.createElement('canvas')
			canvas.width = videoEl.videoWidth
			canvas.height = videoEl.videoHeight
			const ctx = canvas.getContext('2d')!
			ctx.drawImage(videoEl, 0, 0)

			const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1]
			attachedFiles = [
				...attachedFiles,
				{ id: crypto.randomUUID(), name: 'Camera capture', data: base64, mimeType: 'image/jpeg' },
			]
			stopMediaStream()
			showCamera = false
		} catch (err) {
			cameraError = err instanceof Error ? err.message : 'Capture failed'
		} finally {
			isCapturing = false
		}
	}

	function stopMediaStream() {
		if (mediaStream) {
			for (const track of mediaStream.getTracks()) {
				track.stop()
			}
			mediaStream = null
		}
		cameraReady = false
	}

	function exitCamera() {
		stopMediaStream()
		cameraAnimating = 'collapsing'

		if (cameraContainerEl) {
			const flip = computeFlipOrigin()
			if (flip) {
				const el = cameraContainerEl
				el.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.6, 1), border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
				el.style.transform = `translate(${flip.x}px, ${flip.y}px) scale(${flip.scaleX}, ${flip.scaleY})`
				el.style.opacity = '0'
				el.style.borderRadius = '1rem'

				let cleaned = false
				const cleanup = () => {
					if (cleaned) return
					cleaned = true
					el.style.transition = ''
					el.style.transform = ''
					el.style.opacity = ''
					el.style.borderRadius = ''
					showCamera = false
					capturedImage = ''
					cameraError = ''
					cameraAnimating = null
				}
				el.addEventListener('transitionend', cleanup, { once: true })
				setTimeout(cleanup, 400)
				return
			}
		}

		// Fallback if no FLIP data
		showCamera = false
		capturedImage = ''
		cameraError = ''
		cameraAnimating = null
	}

	// ── Paste handler ───────────────────────────────────────

	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items
		if (!items) return

		for (const item of items) {
			if (item.kind === 'file' && item.type.startsWith('image/')) {
				e.preventDefault()
				const file = item.getAsFile()
				if (!file) continue

				const reader = new FileReader()
				reader.onload = (event) => {
					const dataUrl = event.target?.result as string
					const base64 = dataUrl.split(',')[1]
					attachedFiles = [
						...attachedFiles,
						{ id: crypto.randomUUID(), name: 'Pasted image', data: base64, mimeType: file.type },
					]
				}
				reader.readAsDataURL(file)
				return
			}
		}
	}

	function removeAttachment(id: string) {
		attachedFiles = attachedFiles.filter((f) => f.id !== id)
	}

	// ── Voice: Gemini Live API ──────────────────────────────

	function toggleVoice() {
		if (isListening || isConnecting) {
			stopGeminiLive()
		} else {
			voiceError = ''
			startGeminiLive()
		}
	}

	function startGeminiLive() {
		isConnecting = true
		voiceError = ''
		transcript = ''
		localCommittedTranscript = ''
		localInterimTranscript = ''
		voiceTextBase = textInput.trim()

		if (LocalSpeechRecognizer.isSupported()) {
			localSpeechRecognizer = new LocalSpeechRecognizer({
				onTranscript: ({ committed, interim }) => {
					localCommittedTranscript = committed
					localInterimTranscript = interim
					syncVoiceText()
				},
				onError: (err) => {
					console.warn('[AI Scanner] Local speech recognizer error:', err)
				},
			})
			localSpeechRecognizer.start()
		} else {
			localSpeechRecognizer = null
		}

		liveSession = new GeminiLiveSession(
			{
				onConnected: () => {
					isConnecting = false
					isListening = true
					voiceError = ''
				},
				onTranscript: (text) => {
					transcript += text
					syncVoiceText()
				},
				onExtractedData: (data) => {
					handleVoiceData(data)
					streaming = true
				},
				onError: (err) => {
					isConnecting = false
					isListening = false
					voiceError = err
					console.error('[AI Scanner] Voice error:', err)
				},
				onDisconnected: () => {
					isListening = false
					isConnecting = false
				},
			},
			{ targetTable },
		)

		liveSession.connect()
	}

	function stopGeminiLive() {
		if (liveSession) {
			liveSession.disconnect()
			liveSession = null
		}
		if (localSpeechRecognizer) {
			localSpeechRecognizer.stop()
			localSpeechRecognizer = null
		}
		isListening = false
		isConnecting = false
	}

	function getProvisionalTail(authoritative: string, provisional: string): string {
		if (!provisional) return ''
		if (!authoritative) return provisional

		const authoritativeLower = authoritative.toLowerCase()
		const provisionalLower = provisional.toLowerCase()

		if (provisionalLower.startsWith(authoritativeLower)) {
			return provisional.slice(authoritative.length).trimStart()
		}
		if (authoritativeLower.startsWith(provisionalLower)) {
			return ''
		}

		const maxOverlap = Math.min(authoritative.length, provisional.length)
		for (let overlap = maxOverlap; overlap > 0; overlap--) {
			if (authoritativeLower.slice(-overlap) === provisionalLower.slice(0, overlap)) {
				return provisional.slice(overlap).trimStart()
			}
		}

		return provisional
	}

	function syncVoiceText() {
		const authoritative = transcript.trim()
		const provisional = [localCommittedTranscript.trim(), localInterimTranscript.trim()].filter(Boolean).join(' ').trim()
		const provisionalTail = getProvisionalTail(authoritative, provisional)
		const combinedVoice = [authoritative, provisionalTail].filter(Boolean).join(' ').trim()
		textInput = voiceTextBase ? `${voiceTextBase} ${combinedVoice}`.trim() : combinedVoice
	}

	// ── Submit (Extract & Scan) ─────────────────────────────

	async function handleExtract() {
		const hasText = textInput.trim().length > 0
		const hasFiles = attachedFiles.length > 0

		if (!hasText && !hasFiles) return

		if (hasFiles) {
			const firstFile = attachedFiles[0]
			await startStreaming({
				fileData: firstFile.data,
				mimeType: firstFile.mimeType,
				textContent: hasText ? textInput.trim() : undefined,
			})
		} else {
			await startStreaming({ textContent: textInput.trim(), mimeType: 'text/plain' })
		}
	}

	// ── Preview editing ─────────────────────────────────────

	function removeParty(index: number) {
		extractedParties = extractedParties.filter((_, i) => i !== index)
	}
	function removeProduct(index: number) {
		extractedProducts = extractedProducts.filter((_, i) => i !== index)
	}
	function removeCustomer(index: number) {
		extractedCustomers = extractedCustomers.filter((_, i) => i !== index)
	}

	// ── Bulk import ─────────────────────────────────────────

	async function confirmImport() {
		// Bill mode: pass line items back to parent form instead of bulk importing
		if (isBillMode && onlineitems) {
			const lineItems: ExtractedLineItem[] = extractedProducts
				.filter((p) => !p._existingId)
				.map((p) => {
					// Resolve product ID if it matches an existing product
					const existingProduct = existingProducts.find((ep) => namesMatch(ep.title, p.title))
					return {
						productTitle: p.title,
						productId: existingProduct?._id ?? '',
						quantity: Number(p.openingStock) || 1,
						unit: p.unit || 'piece',
						unitStr: p.unit || 'piece',
						rate: Number(p.costPrice) || 0,
						supplierName: p.supplierName || undefined,
					}
				})

			// Get the primary supplier name (from extracted parties or first product's supplier)
			const partyName = extractedParties[0]?.name
				|| extractedProducts.find((p) => p.supplierName)?.supplierName
				|| undefined

			onlineitems(lineItems, partyName)
			phase = 'done'
			summary = { parties: 0, products: lineItems.length, customers: 0 }
			toast.success(`Added ${lineItems.length} line items`)
			setTimeout(() => { open = false; reset() }, 500)
			return
		}

		phase = 'saving'
		try {
			const resolvedProducts = extractedProducts.map((p) => {
				let supplierName = p.supplierName || undefined
				if (p.purchasePartyId) {
					if (p.purchasePartyId.startsWith('__new__')) {
						// Temp ID from extracted party — use the name directly
						supplierName = p.purchasePartyId.replace('__new__', '')
					} else {
						const party = existingParties.find((e) => e._id === p.purchasePartyId)
						if (party) supplierName = party.name
					}
				}
				return {
					title: p.title,
					supplierName,
					costPrice: Number(p.costPrice) || 0,
					openingStock: Number(p.openingStock) || 0,
					sellingPrice: Number(p.sellingPrice) || undefined,
					unit: p.unit || undefined,
					category: p.category || undefined,
					barcode: p.barcode || undefined,
					sku: p.sku || undefined,
					hsCode: p.hsCode || undefined,
				}
			})

			// Only send entities that don't already exist in the DB
			const newParties = extractedParties
				.filter((p) => !p._existingId)
				.map((p) => ({
					name: p.name,
					panNumber: p.panNumber || undefined,
					address: p.address || undefined,
					phone: p.phone || undefined,
					creditLimit: p.creditLimit || undefined,
					paymentTerms: p.paymentTerms || undefined,
				}))

			const newProducts = resolvedProducts.filter((_, i) => !extractedProducts[i]?._existingId)

			const newCustomers = extractedCustomers
				.filter((c) => !c._existingId)
				.map((c) => ({
					name: c.name,
					panNumber: c.panNumber || undefined,
					address: c.address || undefined,
					phone: c.phone || undefined,
					email: c.email || undefined,
					creditLimit: c.creditLimit || undefined,
				}))

			const result = await client.action(api.aiScanner.bulkImport, {
				parties: newParties,
				products: newProducts,
				customers: newCustomers,
			})

			summary = result
			phase = 'done'
			toast.success(
				`Created ${result.parties} parties, ${result.products} products, ${result.customers} customers`
			)
		} catch (err) {
			phase = 'error'
			errorMessage = err instanceof Error ? err.message : 'Import failed'
		}
	}

	async function resumePreviewAfterError() {
		await loadParties()
		phase = 'active'
		errorMessage = ''
	}

	// ── Reset ───────────────────────────────────────────────

	function reset() {
		phase = 'idle'
		showCamera = false
		errorMessage = ''
		extractedParties = []
		extractedProducts = []
		extractedCustomers = []
		summary = { parties: 0, products: 0, customers: 0 }
		textInput = ''
		transcript = ''
		voiceTextBase = ''
		streaming = false
		streamComplete = false
		isDragOver = false
		attachedFiles = []
		capturedImage = ''
		cameraError = ''
		cameraAnimating = null
		stopGeminiLive()
		stopMediaStream()
	}

	function handleClose() {
		open = false
		setTimeout(reset, 200)
	}

	let totalExtracted = $derived(
		extractedParties.length + extractedProducts.length + extractedCustomers.length
	)

	function detectCurrentInputKind(): ScanInputKind {
		const hasFiles = attachedFiles.length > 0
		const hasText = textInput.trim().length > 0
		const hasVoice = transcript.trim().length > 0 || localCommittedTranscript.trim().length > 0 || localInterimTranscript.trim().length > 0
		const hasCameraCapture = attachedFiles.some((file) => file.name === 'Camera capture')

		if ((hasFiles && hasText) || (hasVoice && hasFiles)) return 'mixed'
		if (hasCameraCapture) return 'camera'
		if (hasFiles) return 'file'
		if (hasVoice) return 'voice'
		return 'text'
	}

	function getInputHint(inputKind: ScanInputKind) {
		switch (inputKind) {
			case 'camera':
				return 'Try again with a clearer photo, bill, label, or table.'
			case 'file':
				return 'Try again with a clearer file, export, bill, or table.'
			case 'voice':
				return 'Try saying the names, prices, units, and details a little more clearly.'
			case 'mixed':
				return 'Try again with a simpler message or a clearer file, photo, bill, or table.'
			default:
				return 'Try again with a clearer message, list, bill, or table.'
		}
	}

	function getInputLead(inputKind: ScanInputKind, subject: string) {
		switch (inputKind) {
			case 'camera':
				return `This photo does not seem to show ${subject}.`
			case 'file':
				return `This file does not seem to contain ${subject}.`
			case 'voice':
				return `I could not make out ${subject} from what you said.`
			case 'mixed':
				return `I could not find ${subject} in that.`
			default:
				return `I could not find ${subject} in that text.`
		}
	}

	function getEmptyStateCopy(target: TargetTable, inputKind: ScanInputKind) {
		const inputHint = getInputHint(inputKind)
		switch (target) {
			case 'products':
				return {
					title: 'No products found',
					description: `${getInputLead(inputKind, 'a product list or product details')} ${inputHint}`,
				}
			case 'stock-import':
				return {
					title: 'No stock items found',
					description: `${getInputLead(inputKind, 'a stock list or stock import table')} ${inputHint}`,
				}
			case 'parties':
				return {
					title: 'No suppliers found',
					description: `${getInputLead(inputKind, 'supplier details or a supplier list')} ${inputHint}`,
				}
			case 'customers':
				return {
					title: 'No customers found',
					description: `${getInputLead(inputKind, 'customer details or a customer list')} ${inputHint}`,
				}
			case 'orders':
				return {
					title: 'No order items found',
					description: `${getInputLead(inputKind, 'an order bill or order table')} ${inputHint}`,
				}
			case 'sales':
				return {
					title: 'No sale items found',
					description: `${getInputLead(inputKind, 'a sales bill or sales table')} ${inputHint}`,
				}
			case 'trips':
				return {
					title: 'No trip items found',
					description: `${getInputLead(inputKind, 'a trip list or dispatch table')} ${inputHint}`,
				}
			default:
				return {
					title: 'Nothing found',
					description: `${getInputLead(inputKind, 'products, suppliers, customers, or stock lines')} ${inputHint}`,
				}
		}
	}

	let emptyStateCopy = $derived(getEmptyStateCopy(targetTable, lastScanInputKind))
	let hasPreviewData = $derived(totalExtracted > 0)
	let canSubmit = $derived(textInput.trim().length > 0 || attachedFiles.length > 0)
	let inputCount = $derived(
		(textInput.trim().length > 0 ? 1 : 0) + attachedFiles.length
	)
</script>

<Dialog bind:open onOpenChange={(v) => { if (!v) handleClose() }}>
	<DialogContent
		class="relative sm:max-w-2xl max-h-[85vh] {showCamera ? 'overflow-hidden !p-0' : 'overflow-y-auto'} {isDragOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}"
		ondragenter={handleWebDragEnter}
		ondragleave={handleWebDragLeave}
		ondragover={handleWebDragOver}
		ondrop={handleWebDrop}
	>
		<input
			bind:this={fileInputEl}
			type="file"
			class="sr-only"
			accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.xlsx,.xls,.csv,.doc,.docx,image/*,application/pdf"
			onchange={onWebFileInputChange}
		/>
		<!-- ═══ Drag overlay (always available) ═══ -->
		{#if isDragOver}
			<div class="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-primary/5 backdrop-blur-sm border-2 border-dashed border-primary/40">
				<div class="flex flex-col items-center gap-2 text-primary">
					<FolderOpen class="size-10" />
					<p class="text-sm font-medium">Drop to scan</p>
				</div>
			</div>
		{/if}

		<!-- ═══ IDLE: Unified input surface ═══ -->
		{#if phase === 'idle'}
			{#if !showCamera}
				<DialogHeader class="pb-0">
					<DialogTitle class="text-base">AI Data Scanner</DialogTitle>
				</DialogHeader>
			{/if}

			<!-- Attached file chips (hidden when camera is active) -->
			{#if !showCamera && attachedFiles.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each attachedFiles as file (file.id)}
						<div class="group flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs">
							{#if file.mimeType.startsWith('image/')}
								<ImageIcon class="size-3 text-muted-foreground" />
							{:else}
								<FileText class="size-3 text-muted-foreground" />
							{/if}
							<span class="max-w-[120px] truncate">{file.name}</span>
							<button
								class="ml-0.5 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
								onclick={() => removeAttachment(file.id)}
							>
								<X class="size-3" />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Camera viewfinder (replaces textarea when active) -->
			{#if showCamera}
				<div bind:this={cameraContainerEl} class="will-change-transform">
					{#if cameraError}
						<div class="flex flex-col items-center gap-3 py-8">
							<Camera class="size-6 text-muted-foreground" />
							<p class="text-sm text-muted-foreground">{cameraError}</p>
							<Button variant="outline" size="sm" onclick={exitCamera}>Go back</Button>
						</div>
					{:else}
						<div class="relative overflow-hidden bg-black aspect-[4/3] flex items-center justify-center rounded-lg">
							<!-- svelte-ignore element_invalid_self_closing_tag -->
							<video
								bind:this={videoEl}
								autoplay
								playsinline
								muted
								onloadeddata={handleVideoReady}
								class="w-full h-full object-cover {cameraReady ? '' : 'hidden'}"
							/>
							{#if !cameraReady}
								<div class="flex flex-col items-center gap-2">
									<Loader2 class="size-6 animate-spin text-zinc-400" />
									<p class="text-xs text-zinc-500">Starting camera...</p>
								</div>
							{/if}
							<!-- Overlay controls on the viewfinder -->
							{#if cameraReady}
								<div class="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-4 bg-gradient-to-t from-black/60 to-transparent pt-12">
									<button
										class="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60"
										onclick={exitCamera}
									>
										<ArrowLeft class="size-3" />
										Back
									</button>
									<button
										class="flex size-14 items-center justify-center rounded-full border-[3px] border-white bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105 active:scale-95 disabled:opacity-50"
										onclick={handleCameraCapture}
										disabled={isCapturing}
									>
										<Aperture class="size-6 text-white" />
									</button>
									<div class="w-16"></div>
								</div>
							{/if}
						</div>
						{#if !cameraReady}
							<p class="text-center text-xs text-muted-foreground mt-3">Point at invoice, label, or document</p>
						{/if}
					{/if}
				</div>

			<!-- Unified text input -->
			{:else}
				<div class="relative">
					<textarea
						bind:this={textareaEl}
						bind:value={textInput}
						rows={5}
						placeholder="Type, paste text or images, or drop files here..."
						class="w-full max-h-40 resize-none overflow-y-auto rounded-lg border border-input bg-muted/30 px-3 pb-10 pt-3 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						onpaste={handlePaste}
					></textarea>

					<!-- Bottom toolbar inside textarea -->
					<div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
						<!-- Voice status -->
						<div class="flex items-center gap-2">
							{#if voiceError}
								<span class="flex items-center gap-1.5 text-xs text-destructive">
									<X class="size-3" />
									{voiceError}
								</span>
							{:else if isListening}
								<span class="flex items-center gap-1.5 text-xs text-red-500">
									<span class="relative flex size-1.5">
										<span class="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75"></span>
										<span class="relative inline-flex size-1.5 rounded-full bg-red-500"></span>
									</span>
									Listening...
								</span>
							{:else if isConnecting}
								<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Loader2 class="size-3 animate-spin" />
									Connecting...
								</span>
							{/if}
						</div>

						<!-- Action buttons -->
						<div class="flex items-center gap-1">
							<button
								bind:this={cameraButtonEl}
								class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								onclick={startCameraPreview}
								title="Camera"
							>
								<Camera class="size-4" />
							</button>
							<button
								class="rounded-md p-1.5 transition-colors {isListening ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
								onclick={toggleVoice}
								title={isListening ? 'Stop dictation' : 'Voice dictation'}
							>
								{#if isListening}
									<MicOff class="size-4" />
								{:else}
									<Mic class="size-4" />
								{/if}
							</button>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<p class="text-[11px] text-muted-foreground">
						Drop files anywhere
						<span class="mx-1 text-muted-foreground/40">&middot;</span>
						<button
							class="text-[11px] text-muted-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/40 transition-colors"
							onclick={openNativeFilePicker}
						>
							browse files
						</button>
					</p>
				</div>

				<Button
					class="w-full"
					onclick={handleExtract}
					disabled={!canSubmit}
				>
					{#if inputCount > 1}
						Extract & Scan ({inputCount} inputs)
					{:else}
						Extract & Scan
					{/if}
				</Button>
			{/if}

		<!-- ═══ ACTIVE: Streaming results ═══ -->
		{:else if phase === 'active'}
			<DialogHeader class="pb-0">
				<DialogTitle class="text-base">AI Data Scanner</DialogTitle>
			</DialogHeader>

			<!-- Input summary chips -->
			{#if attachedFiles.length > 0 || textInput.trim()}
				<div class="flex flex-wrap gap-1.5">
					{#each attachedFiles as file (file.id)}
						<div class="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
							{#if file.mimeType.startsWith('image/')}
								<ImageIcon class="size-3" />
							{:else}
								<FileText class="size-3" />
							{/if}
							<span class="max-w-[120px] truncate">{file.name}</span>
						</div>
					{/each}
					{#if textInput.trim()}
						<div class="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
							<FileText class="size-3" />
							<span class="max-w-[150px] truncate">"{textInput.trim().slice(0, 40)}..."</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Streaming indicator -->
			{#if streaming}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 class="size-4 animate-spin text-primary" />
					<span>Extracting{totalExtracted > 0 ? ` — ${totalExtracted} found` : ''}...</span>
				</div>
			{/if}

			<!-- ═══ LIVE PREVIEW ═══ -->
			{#if hasPreviewData}
				<div class="preview-panel space-y-4 border-t pt-4">
					{#if isBillMode && extractedProducts.length > 0}
						<div>
							<h4 class="text-sm font-medium mb-2">{billPrimaryHeading} ({extractedProducts.length})</h4>
							<div class="rounded-lg border overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b bg-muted/40 text-left text-[11px] font-medium text-muted-foreground">
											<th class="p-2">Product</th>
											<th class="p-2 w-14">Qty</th>
											<th class="p-2 w-24">Unit</th>
											<th class="p-2 w-24">Rate</th>
											<th class="p-2">Supplier</th>
										</tr>
									</thead>
									<tbody>
										{#each extractedProducts as product, bi (bi)}
											<tr class="border-b border-muted/50 last:border-0">
												<td class="p-2 font-medium">{product.title}</td>
												<td class="p-2 tabular-nums">{Number(product.openingStock) || 0}</td>
												<td class="p-2">{product.unit ?? '—'}</td>
												<td class="p-2 tabular-nums">{Number(product.costPrice) || 0}</td>
												<td class="p-2 text-xs text-muted-foreground">{product.supplierName ?? '—'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
					<!-- Parties -->
					{#if extractedParties.length > 0}
						<div>
							<h4 class="text-sm font-medium mb-2">Suppliers/Parties ({extractedParties.length})</h4>
							<div class="space-y-2">
								{#each extractedParties as party, i (i)}
									<div class="rounded-lg border p-3 row-enter {party._existingId ? 'border-emerald-500/30 bg-emerald-500/5' : ''}">
										{#if party._existingId}
											<div class="flex items-center justify-between">
												<div>
													<p class="text-sm font-medium">{party.name}</p>
													<p class="text-[11px] text-emerald-600 dark:text-emerald-400">Matched existing: {party._existingName}</p>
												</div>
												{#if streamComplete}
													<button class="p-1 text-muted-foreground hover:text-destructive" onclick={() => removeParty(i)}>
														<Trash2 class="size-3.5" />
													</button>
												{/if}
											</div>
										{:else}
											<div class="flex items-start gap-2">
												<div class="flex-1 space-y-2">
													<Input bind:value={party.name} class="h-8 text-sm font-medium" placeholder="Name" />
													<div class="grid grid-cols-3 gap-2">
														<div>
															<label class="text-[11px] text-muted-foreground">PAN</label>
															<Input bind:value={party.panNumber} class="h-7 text-sm" placeholder="—" />
														</div>
														<div>
															<label class="text-[11px] text-muted-foreground">Phone</label>
															<Input bind:value={party.phone} class="h-7 text-sm" placeholder="—" />
														</div>
														<div>
															<label class="text-[11px] text-muted-foreground">Address</label>
															<Input bind:value={party.address} class="h-7 text-sm" placeholder="—" />
														</div>
													</div>
													<p class="text-[11px] text-amber-500">New — will be created on import</p>
												</div>
												{#if streamComplete}
													<button class="mt-1 p-1 text-muted-foreground hover:text-destructive" onclick={() => removeParty(i)}>
														<Trash2 class="size-3.5" />
													</button>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Products -->
					{#if extractedProducts.length > 0}
						<div>
							<h4 class="text-sm font-medium mb-2">
								{#if isBillMode}
									Product records ({extractedProducts.length})
								{:else}
									Products ({extractedProducts.length})
								{/if}
							</h4>
							<div class="space-y-3">
								{#each extractedProducts as product, i (i)}
									<div class="rounded-lg border p-3 row-enter {product._existingId ? 'border-emerald-500/30 bg-emerald-500/5' : ''} {product._existingId ? '' : 'space-y-3'}">
										{#if product._existingId}
											<div class="flex items-center justify-between">
												<div>
													<p class="text-sm font-medium">{product.title}</p>
													<p class="text-[11px] text-emerald-600 dark:text-emerald-400">Already exists: "{product._existingTitle}" — will skip</p>
												</div>
												{#if streamComplete}
													<button class="p-1 text-muted-foreground hover:text-destructive" onclick={() => removeProduct(i)}>
														<Trash2 class="size-3.5" />
													</button>
												{/if}
											</div>
										{:else}
										<div class="flex items-start gap-2">
											<div class="flex-1 space-y-3">
												<!-- Title -->
												<div class="space-y-1">
													<label class="text-[11px] font-medium text-muted-foreground">Product name</label>
													<Input bind:value={product.title} class="h-8 text-sm" placeholder="e.g. Rice 25kg Basmati" />
												</div>

												<!-- Supplier (EntitySelect — same as ProductForm) -->
												<div class="space-y-1">
													<label class="text-[11px] font-medium text-muted-foreground">Supplier</label>
													<EntitySelect
														bind:value={product.purchasePartyId}
														items={allParties}
														getKey={(p) => p._id}
														getLabel={(p) => p.name}
														placeholder="Select supplier..."
														entityName="Supplier"
														small
													>
														{#snippet createForm({ close, onCreated })}
															<PartyForm
																inline
																onsubmit={async (data) => {
																	const id = await client.mutation(api.functions.parties.create, data)
																	await loadParties()
																	onCreated(id)
																}}
																oncancel={close}
															/>
														{/snippet}
														{#snippet editForm({ item, close })}
															<PartyForm
																inline
																party={item}
																onsubmit={async (data) => {
																	await client.mutation(api.functions.parties.update, { id: item._id, ...data })
																	await loadParties()
																	close()
																}}
																oncancel={close}
															/>
														{/snippet}
													</EntitySelect>
													{#if product.supplierName && !product.purchasePartyId}
														<p class="text-[11px] text-amber-500">AI detected: "{product.supplierName}" — select or create a matching supplier</p>
													{/if}
												</div>

												<!-- Unit (UnitBuilder — same as ProductForm) -->
												<div class="space-y-1">
													<label class="text-[11px] font-medium text-muted-foreground">Unit</label>
													<UnitBuilder bind:value={product.unit} />
												</div>

												<!-- Prices (PricePerUnitInput — same as ProductForm) -->
												<div class="grid grid-cols-2 gap-3">
													<div class="space-y-1">
														<label class="text-[11px] font-medium text-muted-foreground">Cost price</label>
														<PricePerUnitInput
															bind:value={product.costPrice}
															unitStr={product.unit}
															placeholder="0.00"
															onuserinput={(v) => onProductCostChange(product, v)}
														/>
													</div>
													<div class="space-y-1">
														<label class="text-[11px] font-medium text-muted-foreground">Selling price</label>
														<PricePerUnitInput
															bind:value={product.sellingPrice}
															unitStr={product.unit}
															placeholder="Auto: cost + 10%"
															onuserinput={() => { product._sellingPriceManual = true }}
														/>
														{#if !product._sellingPriceManual && product.costPrice > 0}
															<p class="text-[10px] text-emerald-600 dark:text-emerald-400">Auto: {product.costPrice} + 10%</p>
														{/if}
													</div>
												</div>

												<!-- Stock + Category -->
												<div class="grid grid-cols-2 gap-3">
													<div class="space-y-1">
														<label class="text-[11px] font-medium text-muted-foreground">Opening stock</label>
														<Input type="number" min="0" bind:value={product.openingStock} class="h-8 text-sm" placeholder="0" />
													</div>
													<div class="space-y-1">
														<label class="text-[11px] font-medium text-muted-foreground">Category</label>
														<Select.Root type="single" bind:value={product.category}>
															<Select.Trigger class="h-8 text-sm">
																{product.category ? product.category : 'Select...'}
															</Select.Trigger>
															<Select.Content>
																{#each categories as cat}
																	<Select.Item value={cat} label={cat}>
																		<span class="capitalize">{cat}</span>
																	</Select.Item>
																{/each}
															</Select.Content>
														</Select.Root>
													</div>
												</div>
											</div>

											{#if streamComplete}
												<button class="mt-1 p-1 text-muted-foreground hover:text-destructive shrink-0" onclick={() => removeProduct(i)}>
													<Trash2 class="size-3.5" />
												</button>
											{/if}
										</div>
									{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Customers -->
					{#if extractedCustomers.length > 0}
						<div>
							<h4 class="text-sm font-medium mb-2">Customers ({extractedCustomers.length})</h4>
							<div class="space-y-2">
								{#each extractedCustomers as customer, i (i)}
									<div class="rounded-lg border p-3 row-enter {customer._existingId ? 'border-emerald-500/30 bg-emerald-500/5' : ''}">
										{#if customer._existingId}
											<div class="flex items-center justify-between">
												<div>
													<p class="text-sm font-medium">{customer.name}</p>
													<p class="text-[11px] text-emerald-600 dark:text-emerald-400">Matched existing: {customer._existingName} — will skip</p>
												</div>
												{#if streamComplete}
													<button class="p-1 text-muted-foreground hover:text-destructive" onclick={() => removeCustomer(i)}>
														<Trash2 class="size-3.5" />
													</button>
												{/if}
											</div>
										{:else}
											<div class="flex items-start gap-2">
												<div class="flex-1 space-y-2">
													<Input bind:value={customer.name} class="h-8 text-sm font-medium" placeholder="Name" />
													<div class="grid grid-cols-2 gap-2">
														<div>
															<label class="text-[11px] text-muted-foreground">Phone</label>
															<Input bind:value={customer.phone} class="h-7 text-sm" placeholder="—" />
														</div>
														<div>
															<label class="text-[11px] text-muted-foreground">Email</label>
															<Input bind:value={customer.email} class="h-7 text-sm" placeholder="—" />
														</div>
													</div>
												</div>
												{#if streamComplete}
													<button class="mt-1 p-1 text-muted-foreground hover:text-destructive" onclick={() => removeCustomer(i)}>
														<Trash2 class="size-3.5" />
													</button>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Import button -->
					{#if streamComplete}
						<DialogFooter class="gap-2">
							<Button variant="outline" onclick={reset}>Start Over</Button>
							<Button onclick={confirmImport} disabled={totalExtracted === 0}>
								Import {totalExtracted} records
							</Button>
						</DialogFooter>
					{/if}
				</div>
			{:else if streamComplete}
				<div class="preview-panel border-t pt-4">
					<div class="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
						<div class="flex size-12 items-center justify-center rounded-full bg-muted">
							<FileText class="size-5 text-muted-foreground" />
						</div>
						<div class="space-y-1.5">
							<p class="text-sm font-medium">{emptyStateCopy.title}</p>
							<p class="max-w-md text-sm text-muted-foreground">
								{emptyStateCopy.description}
							</p>
						</div>
						<div class="flex items-center gap-2 pt-1">
							<Button variant="outline" onclick={reset}>
								<RefreshCw class="mr-1.5 size-4" />
								Try Again
							</Button>
						</div>
					</div>
				</div>
			{/if}

		<!-- ═══ SAVING ═══ -->
		{:else if phase === 'saving'}
			<div class="flex flex-col items-center gap-3 py-8">
				<Loader2 class="size-8 animate-spin text-primary" />
				<p class="text-sm text-muted-foreground">Creating records...</p>
			</div>

		<!-- ═══ DONE ═══ -->
		{:else if phase === 'done'}
			<div class="flex flex-col items-center gap-3 py-8">
				<div class="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
					<Check class="size-6 text-green-500" />
				</div>
				<p class="text-sm font-medium">Import complete!</p>
				<div class="text-sm text-muted-foreground text-center space-y-0.5">
					{#if summary.parties > 0}<p>Created {summary.parties} suppliers/parties</p>{/if}
					{#if summary.products > 0}<p>Created {summary.products} products</p>{/if}
					{#if summary.customers > 0}<p>Created {summary.customers} customers</p>{/if}
				</div>
			</div>
			<DialogFooter>
				<Button onclick={handleClose}>Done</Button>
			</DialogFooter>

		<!-- ═══ ERROR ═══ -->
		{:else if phase === 'error'}
			<div class="flex flex-col items-center gap-3 py-8">
				<div class="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
					<X class="size-6 text-destructive" />
				</div>
				<p class="text-sm font-medium text-destructive">Something went wrong</p>
				<p class="text-sm text-muted-foreground text-center max-w-md">{errorMessage}</p>
			</div>
			<DialogFooter class="gap-2">
				{#if streamComplete && hasPreviewData}
					<Button variant="outline" onclick={reset}>Start over</Button>
					<Button onclick={resumePreviewAfterError}>Back to review</Button>
				{:else}
					<Button variant="outline" onclick={reset}>Try again</Button>
				{/if}
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>

<style>
	@keyframes rowSlideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.row-enter) {
		animation: rowSlideIn 0.2s ease-out;
	}

	.preview-panel {
		animation: expandIn 0.3s ease-out;
	}

	@keyframes expandIn {
		from {
			opacity: 0;
			max-height: 0;
		}
		to {
			opacity: 1;
			max-height: 2000px;
		}
	}

</style>
