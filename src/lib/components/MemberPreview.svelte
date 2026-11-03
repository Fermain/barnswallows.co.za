<script lang="ts">
	import { formatMemberName, type Member } from '#lib/site';

	let { entry }: { entry?: Partial<Member> } = $props();

	const displayName = $derived(formatMemberName(entry?.name));
</script>

<div style="padding: 2rem; max-width: 500px; font-family: system-ui, sans-serif;">
	<div
		style="background: #fff; border: 1px solid #ddd; border-left: 6px solid #3b82f6; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
	>
		<div style="font-size: 0.85rem; color: #777; text-transform: uppercase; letter-spacing: 0.05em;">
			Mount Moreland Monitors Member
		</div>
		<h2 style="font-size: 1.5rem; margin: 0.5rem 0 0.2rem; color: #111; text-align: left;">
			{entry?.name || 'New Member'}
		</h2>
		<div style="font-size: 0.95rem; color: #555; margin-bottom: 1rem;">
			{entry?.email || 'No email entered'}
		</div>

		<div style="border-top: 1px solid #eee; padding-top: 1rem; margin-top: 1rem;">
			<div style="font-size: 0.8rem; color: #888; margin-bottom: 0.3rem;">
				Public Roster Display Name
			</div>
			<div style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 0.3rem 0.8rem; border-radius: 6px; font-weight: 600;">
				{displayName || '(Enter full name)'}
			</div>
			<p style="font-size: 0.75rem; color: #888; margin-top: 0.4rem;">
				For privacy, only first name and initial of last name are displayed on the public roster.
			</p>
		</div>
	</div>
</div>
