<script lang="ts">
	import { Admin, hubStorage } from '@fermain/frame/admin';
	import config from '#lib/frame.config';

	const hub = import.meta.env.VITE_FRAME_HUB;
	const project = import.meta.env.VITE_FRAME_PROJECT;
	const storage = hub && project ? hubStorage({ hub, project }) : undefined;
</script>

<svelte:head>
	<title>Frame · Mount Moreland Barn Swallows</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if storage || import.meta.env.DEV}
	<Admin {config} {storage} previewUrl="/admin/preview/" />
{:else}
	<p style="padding: 2rem; font-family: system-ui, sans-serif">The editor is not connected yet.</p>
{/if}
