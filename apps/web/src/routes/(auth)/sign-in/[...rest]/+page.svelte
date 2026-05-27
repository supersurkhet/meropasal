<script lang="ts">
	import { SignIn, GoogleOneTap } from 'svelte-clerk'
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-zinc-950">
	<GoogleOneTap />
	<SignIn />
</div>
