<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags'
	import { UserProfile } from 'svelte-clerk'
	import { t } from '$lib/t.svelte'
</script>

<MetaTags title="Profile — {t('app_name')}" />

<UserProfile />
