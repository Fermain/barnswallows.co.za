<script lang="ts">
	import Clipboard from '#lib/components/Clipboard.svelte';
	import NoteMap from '#lib/components/NoteMap.svelte';
	import { season } from '#lib/site';
</script>

<svelte:head>
	<title>Barn Swallows - Mount Moreland</title>
	<meta
		name="description"
		content="Lake Victoria Barn Swallows Viewing Site in Mount Moreland, KwaZulu-Natal."
	/>
</svelte:head>

<div class="grid">
	<div class="banner">
		<img
			class="no-int"
			src="/banner_bg.png"
			alt="Watercolour banner of a barn swallow swooping over rolling hills"
		/>
	</div>

	<div></div>

	{#if season.status === 'open'}
		<NoteMap mapUrl={season.mapUrl} />
	{/if}

	<div class="clipboard-container">
		<Clipboard entry={season} />
	</div>
</div>
