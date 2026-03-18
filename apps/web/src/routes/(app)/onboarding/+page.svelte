<script lang="ts">
	import { enhance } from '$app/forms';
	import { MetaTags } from 'svelte-meta-tags';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import {
		Store,
		Building2,
		MapPin,
		Phone,
		FileText,
		Calendar,
		Check,
		ChevronRight,
		ChevronLeft,
		Loader2,
		Sparkles,
	} from '@lucide/svelte';

	let { form } = $props();

	// Show server-side errors
	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		}
	});

	// Wizard state
	let currentStep = $state(0);
	let saving = $state(false);

	// Form data
	let businessName = $state('');
	let businessType = $state<'retail' | 'wholesale' | 'service'>('retail');
	let location = $state('');
	let phone = $state('');
	let panNumber = $state('');
	let currentFiscalYear = $state('82/83');

	const steps = [
		{ title: 'Business Info', description: 'Tell us about your business' },
		{ title: 'Location & Contact', description: 'Where can customers find you?' },
		{ title: 'Fiscal Setup', description: 'Tax and fiscal year configuration' },
	];

	const businessTypes = [
		{ value: 'retail' as const, label: 'Retail', nepali: 'खुद्रा', description: 'Sell products directly to customers' },
		{ value: 'wholesale' as const, label: 'Wholesale', nepali: 'थोक', description: 'Sell products in bulk to other businesses' },
		{ value: 'service' as const, label: 'Service', nepali: 'सेवा', description: 'Provide services to customers' },
	];

	function canProceed(): boolean {
		if (currentStep === 0) return businessName.trim().length > 0;
		if (currentStep === 1) return true;
		if (currentStep === 2) return currentFiscalYear.trim().length > 0;
		return false;
	}

	function nextStep() {
		if (currentStep < steps.length - 1 && canProceed()) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}
</script>

<MetaTags title="Set Up Your Business — MeroPasal" />

<form
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
	<input type="hidden" name="businessName" value={businessName} />
	<input type="hidden" name="businessType" value={businessType} />
	<input type="hidden" name="currentFiscalYear" value={currentFiscalYear} />
	<input type="hidden" name="location" value={location} />
	<input type="hidden" name="phone" value={phone} />
	<input type="hidden" name="panNumber" value={panNumber} />

	<div class="flex min-h-[80vh] items-center justify-center p-4">
		<div class="w-full max-w-2xl">
			<!-- Header -->
			<div class="mb-10 text-center">
				<div class="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg dark:bg-zinc-100">
					<Store class="size-7 text-white dark:text-zinc-900" />
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
					Welcome to MeroPasal
				</h1>
				<p class="mt-1 text-zinc-500 dark:text-zinc-400">Let's set up your business in a few quick steps</p>
			</div>

			<!-- Step Indicator -->
			<div class="mb-10">
				<!-- Progress bar -->
				<div class="relative mb-6 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
					<div
						class="absolute inset-y-0 left-0 rounded-full bg-zinc-900 transition-all duration-500 ease-out dark:bg-zinc-100"
						style="width: {((currentStep + 1) / steps.length) * 100}%"
					></div>
				</div>

				<!-- Step circles -->
				<div class="flex justify-between">
					{#each steps as step, i}
						<div class="flex flex-col items-center gap-2">
							<button
								type="button"
								onclick={() => { if (i < currentStep) currentStep = i; }}
								class="flex size-9 items-center justify-center rounded-full border-2 text-sm font-medium transition-all
									{i < currentStep
										? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer'
										: i === currentStep
											? 'border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-zinc-100'
											: 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500 cursor-default'}"
								disabled={i > currentStep}
							>
								{#if i < currentStep}
									<Check class="size-4" />
								{:else}
									{i + 1}
								{/if}
							</button>
							<div class="hidden text-center sm:block">
								<p class="text-xs font-medium {i <= currentStep ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}">{step.title}</p>
								<p class="text-xs text-zinc-400 dark:text-zinc-500">{step.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Form Card -->
			<div class="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<!-- Step 0: Business Info -->
				{#if currentStep === 0}
					<div class="space-y-6">
						<div>
							<label for="businessName" class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Business Name *
							</label>
							<div class="relative">
								<Building2 class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
								<input
									id="businessName"
									type="text"
									bind:value={businessName}
									placeholder="e.g. Sharma General Store"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
								/>
							</div>
						</div>

						<div>
							<p class="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Business Type *
							</p>
							<div class="grid gap-3 sm:grid-cols-3">
								{#each businessTypes as bt}
									<button
										type="button"
										onclick={() => { businessType = bt.value; }}
										class="rounded-xl border-2 p-4 text-left transition-all
											{businessType === bt.value
												? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
												: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'}"
									>
										<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{bt.label}</p>
										<p class="text-xs text-zinc-400 dark:text-zinc-500" style="font-family: 'Mukta', sans-serif;">{bt.nepali}</p>
										<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{bt.description}</p>
									</button>
								{/each}
							</div>
						</div>
					</div>

				<!-- Step 1: Location & Contact -->
				{:else if currentStep === 1}
					<div class="space-y-6">
						<div>
							<label for="location" class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Location
							</label>
							<div class="relative">
								<MapPin class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
								<input
									id="location"
									type="text"
									bind:value={location}
									placeholder="e.g. Birendranagar, Surkhet"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
								/>
							</div>
						</div>

						<div>
							<label for="phone" class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Phone Number
							</label>
							<div class="relative">
								<Phone class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
								<input
									id="phone"
									type="tel"
									bind:value={phone}
									placeholder="e.g. 083-520123"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
								/>
							</div>
						</div>

						<div>
							<label for="panNumber" class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								PAN Number
							</label>
							<div class="relative">
								<FileText class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
								<input
									id="panNumber"
									type="text"
									bind:value={panNumber}
									placeholder="e.g. 123456789"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
								/>
							</div>
						</div>
					</div>

				<!-- Step 2: Fiscal Setup -->
				{:else if currentStep === 2}
					<div class="space-y-6">
						<div>
							<label for="fiscalYear" class="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Current Fiscal Year (BS) *
							</label>
							<div class="relative">
								<Calendar class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
								<input
									id="fiscalYear"
									type="text"
									bind:value={currentFiscalYear}
									placeholder="e.g. 82/83"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
								/>
							</div>
							<p class="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Nepal's fiscal year runs from Shrawan 1 to Ashadh end (mid-July to mid-July)</p>
						</div>

						<!-- Summary -->
						<div class="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
							<div class="mb-3 flex items-center gap-2">
								<Sparkles class="size-4 text-zinc-500" />
								<h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Setup Summary</h3>
							</div>
							<dl class="space-y-2 text-sm">
								<div class="flex justify-between">
									<dt class="text-zinc-500 dark:text-zinc-400">Business</dt>
									<dd class="font-medium text-zinc-900 dark:text-zinc-100">{businessName || '—'}</dd>
								</div>
								<div class="flex justify-between">
									<dt class="text-zinc-500 dark:text-zinc-400">Type</dt>
									<dd class="font-medium capitalize text-zinc-900 dark:text-zinc-100">{businessType}</dd>
								</div>
								{#if location}
									<div class="flex justify-between">
										<dt class="text-zinc-500 dark:text-zinc-400">Location</dt>
										<dd class="font-medium text-zinc-900 dark:text-zinc-100">{location}</dd>
									</div>
								{/if}
								{#if phone}
									<div class="flex justify-between">
										<dt class="text-zinc-500 dark:text-zinc-400">Phone</dt>
										<dd class="font-medium text-zinc-900 dark:text-zinc-100">{phone}</dd>
									</div>
								{/if}
								{#if panNumber}
									<div class="flex justify-between">
										<dt class="text-zinc-500 dark:text-zinc-400">PAN</dt>
										<dd class="font-medium text-zinc-900 dark:text-zinc-100">{panNumber}</dd>
									</div>
								{/if}
								<div class="flex justify-between">
									<dt class="text-zinc-500 dark:text-zinc-400">Fiscal Year</dt>
									<dd class="font-medium text-zinc-900 dark:text-zinc-100">{currentFiscalYear}</dd>
								</div>
							</dl>
							<div class="mt-4 flex flex-wrap gap-2">
								<span class="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Invoicing</span>
								<span class="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Stock Book</span>
								<span class="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Ledger</span>
								<span class="rounded-full bg-zinc-200/50 px-2.5 py-0.5 text-xs text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500">Logistics (off)</span>
							</div>
							<p class="mt-3 text-xs text-zinc-400 dark:text-zinc-500">You can change these later in Settings.</p>
						</div>
					</div>
				{/if}

				<!-- Navigation -->
				<div class="mt-8 flex items-center justify-between border-t border-zinc-100 pt-6 dark:border-zinc-800">
					{#if currentStep > 0}
						<Button type="button" variant="ghost" onclick={prevStep}>
							<ChevronLeft class="size-4" />
							Back
						</Button>
					{:else}
						<div></div>
					{/if}

					{#if currentStep < steps.length - 1}
						<Button type="button" onclick={nextStep} disabled={!canProceed()}>
							Next
							<ChevronRight class="size-4" />
						</Button>
					{:else}
						<Button type="submit" disabled={!canProceed() || saving}>
							{#if saving}
								<Loader2 class="size-4 animate-spin" />
								Setting up...
							{:else}
								Complete Setup
								<Check class="size-4" />
							{/if}
						</Button>
					{/if}
				</div>
			</div>

			<!-- Step count on mobile -->
			<p class="mt-4 text-center text-xs text-zinc-400 sm:hidden dark:text-zinc-500">
				Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
			</p>
		</div>
	</div>
</form>
