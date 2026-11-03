<script lang="ts">
	import Clipboard from './Clipboard.svelte';
	import type { SeasonSettings } from '#lib/site';

	let { entry }: { entry?: SeasonSettings } = $props();
</script>

<div style="padding: 2rem; display: flex; justify-content: center; background: #fffae5 url('/cardboard.png'); min-height: 100vh;">
	<div style="max-width: 420px; width: 100%;">
		<Clipboard {entry} />
	</div>
</div>
