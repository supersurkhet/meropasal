<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
	} from '$lib/components/ui/dialog'
	import { ScanLine, Download, Monitor, ArrowRight, MonitorSmartphone } from '@lucide/svelte'
	import { onMount } from 'svelte'
	import { isDesktop } from '$lib/platform.svelte'
	import AiScannerDialog from './AiScannerDialog.svelte'

	let {
		targetTable = 'mixed',
		onlineitems,
	}: {
		targetTable?: 'products' | 'parties' | 'customers' | 'mixed' | 'stock-import' | 'orders' | 'sales' | 'trips'
		onlineitems?: (items: any[], partyName?: string) => void
	} = $props()

	let scannerOpen = $state(false)
	let desktopPromptOpen = $state(false)

	const RELEASE_BASE = 'https://github.com/supersurkhet/meropasal/releases/download/v0.2.0'

	type Platform = 'macos' | 'windows' | 'linux' | 'unknown'

	let detectedPlatform = $state<Platform>('unknown')

	onMount(() => {
		const ua = navigator.userAgent.toLowerCase()
		if (ua.includes('mac')) detectedPlatform = 'macos'
		else if (ua.includes('win')) detectedPlatform = 'windows'
		else if (ua.includes('linux')) detectedPlatform = 'linux'
	})

	const platforms: Record<Exclude<Platform, 'unknown'>, { label: string; sublabel: string; file: string }> = {
		macos: { label: 'macOS', sublabel: 'Apple Silicon', file: 'MeroPasal_0.1.0_aarch64.dmg' },
		windows: { label: 'Windows', sublabel: 'x64 Installer', file: 'MeroPasal_0.1.0_x64-setup.exe' },
		linux: { label: 'Linux', sublabel: 'AppImage', file: 'MeroPasal_0.1.0_amd64.AppImage' },
	}

	const primaryDownload = $derived(
		detectedPlatform !== 'unknown' ? platforms[detectedPlatform] : platforms.macos
	)

	function handleClick() {
		if (isDesktop()) {
			scannerOpen = true
		} else {
			desktopPromptOpen = true
		}
	}
</script>

<Button
	variant="outline"
	size="sm"
	class="gap-2"
	onclick={handleClick}
>
	<ScanLine class="size-4" />
	AI Scan
</Button>

<AiScannerDialog bind:open={scannerOpen} {targetTable} {onlineitems} />

<Dialog bind:open={desktopPromptOpen}>
	<DialogContent class="sm:max-w-sm">
		<div class="flex flex-col items-center text-center pt-2">
			<div class="flex size-12 items-center justify-center rounded-full bg-amber-500/10 dark:bg-amber-500/15">
				<MonitorSmartphone class="size-6 text-amber-500" />
			</div>
			<h3 class="mt-4 text-base font-semibold">Desktop App Only</h3>
			<p class="mt-1.5 text-sm text-muted-foreground leading-relaxed">
				AI Scan requires the desktop app for camera access and local processing.
			</p>
		</div>

		<div class="mt-1">
			<a
				href="{RELEASE_BASE}/{primaryDownload.file}"
				class="group flex items-center gap-3 rounded-xl border border-primary/20 bg-primary p-3.5 transition-all hover:bg-primary/90"
			>
				<div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
					<Download class="size-4.5 text-primary-foreground" />
				</div>
				<div class="flex-1">
					<p class="text-sm font-semibold text-primary-foreground">
						Download for {primaryDownload.label}
					</p>
					<p class="text-[11px] text-primary-foreground/60">{primaryDownload.sublabel} &middot; v0.2.0</p>
				</div>
				<ArrowRight class="size-4 text-primary-foreground/50 transition-transform group-hover:translate-x-1" />
			</a>

			{#if detectedPlatform !== 'unknown'}
				<div class="mt-3 flex flex-wrap justify-center gap-2.5">
					{#each Object.entries(platforms).filter(([id]) => id !== detectedPlatform) as [id, platform]}
						<a
							href="{RELEASE_BASE}/{platform.file}"
							class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Monitor class="size-3" />
							{platform.label}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
