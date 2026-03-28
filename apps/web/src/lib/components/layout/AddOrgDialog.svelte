<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog'
	import BusinessSetupWizard, { type BusinessFormData } from '$lib/components/shared/BusinessSetupWizard.svelte'
	import { toast } from 'svelte-sonner'
	import { t } from '$lib/t.svelte'

	let { open = $bindable(false) }: { open?: boolean } = $props()

	let saving = $state(false)

	async function handleSubmit(data: BusinessFormData) {
		saving = true
		try {
			const res = await fetch('/api/org/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					businessName: data.businessName,
					businessType: data.businessType,
					currentFiscalYear: data.currentFiscalYear,
					location: data.location || undefined,
					phone: data.phone || undefined,
					panNumber: data.panNumber || undefined,
				}),
			})
			const result = await res.json()
			if (!res.ok) {
				toast.error(result.error || 'Failed to create organization')
				saving = false
				return
			}
			if (result.redirectUrl) {
				window.location.href = result.redirectUrl
			} else {
				saving = false
			}
		} catch {
			toast.error('Failed to create organization')
			saving = false
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Content class="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 max-h-[90vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
					{t('org_add_title')}
				</Dialog.Title>
				<Dialog.Description class="text-sm text-zinc-500 dark:text-zinc-400">
					{t('org_add_desc')}
				</Dialog.Description>
			</Dialog.Header>
			<div class="mt-4">
				<BusinessSetupWizard compact={true} {saving} onsubmit={handleSubmit} />
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
