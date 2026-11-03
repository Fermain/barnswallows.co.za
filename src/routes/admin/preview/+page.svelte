<script lang="ts">
	import '../../layout.css';
	import { Preview } from '@fermain/frame/preview';
	import config from '#lib/frame.config';
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<Preview {config} />
