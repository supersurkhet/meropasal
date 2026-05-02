<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScanLine, X, Camera } from '@lucide/svelte';
	import { tick } from 'svelte';

	let {
		onScan,
		placeholder = 'Scan or type barcode...',
	}: {
		onScan: (barcode: string) => void;
		placeholder?: string;
	} = $props();

	let barcode = $state('');
	let scanning = $state(false);
	let videoEl: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | null = null;
	let detector: BarcodeDetector | null = null;
	let rafId: number | null = null;

	const hasDetector = typeof BarcodeDetector !== 'undefined';

	async function startScan() {
		if (!hasDetector) {
			// Fallback: just focus the input
			return;
		}
		scanning = true;
		await tick();
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' },
			});
			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
			}
			if (typeof BarcodeDetector !== 'undefined') {
				detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_128', 'qr_code'] });
			}
			scanFrame();
		} catch {
			scanning = false;
		}
	}

	function stopScan() {
		scanning = false;
		if (rafId) cancelAnimationFrame(rafId);
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
		if (videoEl) videoEl.srcObject = null;
		detector = null;
	}

	async function scanFrame() {
		if (!scanning || !videoEl || !detector) return;
		try {
			const results = await detector.detect(videoEl);
			if (results.length > 0) {
				const code = results[0].rawValue;
				if (code) {
					barcode = code;
					stopScan();
					onScan(code);
					return;
				}
			}
		} catch {
			// ignore frame errors
		}
		rafId = requestAnimationFrame(scanFrame);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && barcode.trim()) {
			onScan(barcode.trim());
			barcode = '';
		}
	}
</script>

<div class="flex items-center gap-2">
	<div class="relative flex-1">
		<ScanLine class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
		<Input
			type="text"
			{placeholder}
			bind:value={barcode}
			onkeydown={handleKeydown}
			class="pl-8 text-sm"
		/>
	</div>
	{#if hasDetector}
		<Button
			size="icon"
			variant="outline"
			class="size-9"
			onclick={() => (scanning ? stopScan() : startScan())}
			title={scanning ? 'Stop scanning' : 'Scan with camera'}
		>
			{#if scanning}
				<X class="size-4" />
			{:else}
				<Camera class="size-4" />
			{/if}
		</Button>
	{/if}
</div>

{#if scanning}
	<div class="relative mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
		<video bind:this={videoEl} class="h-48 w-full object-cover" playsinline muted></video>
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="h-20 w-48 rounded border-2 border-white/50 bg-white/10"></div>
		</div>
	</div>
{/if}
