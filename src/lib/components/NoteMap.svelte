<script lang="ts">
	import { season as defaultSeason } from '#lib/site';

	let { mapUrl = defaultSeason.mapUrl }: { mapUrl?: string } = $props();
</script>

<div class="note-container">
	<div class="zapper">
		<img src="/zapper-paper.png" alt="Zapper QR Code" />
	</div>

	<div class="note">
		<img class="no-int" src="/note.png" alt="Note decoration" />
		<div class="note-content">
			<iframe
				src={mapUrl}
				title="Lake Victoria Barn Swallows Viewing Site Map"
				style="border:0;"
				allowfullscreen
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
			></iframe>
		</div>
	</div>
</div>
