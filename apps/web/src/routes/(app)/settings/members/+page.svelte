<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import { OrganizationProfile } from 'svelte-clerk'
	import { t } from '$lib/t.svelte'
</script>

<MetaTags title="{t('settings_members')} — {t('app_name')}" />

<OrganizationProfile />
