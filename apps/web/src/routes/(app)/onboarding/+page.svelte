<script lang="ts">
	import { enhance } from '$app/forms'
	import { MetaTags } from 'svelte-meta-tags'
	import { toast } from 'svelte-sonner'
	import BusinessSetupWizard, { type BusinessFormData } from '$lib/components/shared/BusinessSetupWizard.svelte'

	let { form } = $props()

	// Show server-side errors
	$effect(() => {
		if (form?.error) {
			toast.error(form.error)
		}
	})

	let saving = $state(false)

	// Hidden form fields for progressive enhancement
	let hiddenBusinessName = $state('')
	let hiddenBusinessType = $state('')
	let hiddenCurrentFiscalYear = $state('')
	let hiddenLocation = $state('')
	let hiddenPhone = $state('')
	let hiddenPanNumber = $state('')

	let formEl: HTMLFormElement | undefined = $state()

	async function handleSubmit(data: BusinessFormData) {
		hiddenBusinessName = data.businessName
		hiddenBusinessType = data.businessType
		hiddenCurrentFiscalYear = data.currentFiscalYear
		hiddenLocation = data.location
		hiddenPhone = data.phone
		hiddenPanNumber = data.panNumber
		// Wait for Svelte to update the DOM with new hidden field values
		await new Promise((r) => setTimeout(r, 0))
		formEl?.requestSubmit()
	}
</script>

<MetaTags title="Set Up Your Business — MeroPasal" />

<form
	bind:this={formEl}
	method="POST"
	action="?/createBusiness"
	use:enhance={() => {
		saving = true
		return async ({ update }) => {
			saving = false
			await update()
		}
	}}
>
	<!-- Hidden fields to carry all form data -->
	<input type="hidden" name="businessName" value={hiddenBusinessName} />
	<input type="hidden" name="businessType" value={hiddenBusinessType} />
	<input type="hidden" name="currentFiscalYear" value={hiddenCurrentFiscalYear} />
	<input type="hidden" name="location" value={hiddenLocation} />
	<input type="hidden" name="phone" value={hiddenPhone} />
	<input type="hidden" name="panNumber" value={hiddenPanNumber} />
</form>

<BusinessSetupWizard compact={false} {saving} onsubmit={handleSubmit} />
