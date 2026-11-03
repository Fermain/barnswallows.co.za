<script lang="ts">
	import {
		formatDate,
		formatDayName,
		formatMemberName,
		members,
		type Shift
	} from '#lib/site';

	let { entry }: { entry?: Partial<Shift> } = $props();

	const memberMap = new Map(members.map((m) => [m.slug, m]));
	const assigned = $derived(entry?.member ? memberMap.get(entry.member) : null);
</script>

<div style="padding: 2rem; max-width: 500px; font-family: system-ui, sans-serif;">
	<div
		style="background: #fff; border: 1px solid #ddd; border-left: 6px solid {assigned ? '#10b981' : '#f59e0b'}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
	>
		<div style="font-size: 0.85rem; color: #777; text-transform: uppercase; letter-spacing: 0.05em;">
			Site Duty Shift
		</div>
		<h2 style="font-size: 1.4rem; margin: 0.5rem 0 0.2rem; color: #222; text-align: left;">
			{entry?.date ? formatDayName(entry.date) : 'Select date'}
		</h2>
		<div style="font-size: 1.1rem; color: #555; margin-bottom: 0.5rem;">
			{entry?.date ? formatDate(entry.date) : ''}
		</div>
		<div style="font-size: 0.95rem; color: #666; margin-bottom: 1.2rem;">
			<strong>Time:</strong> 17:00 – 19:00
		</div>

		<div style="border-top: 1px solid #eee; padding-top: 1rem;">
			<div style="font-size: 0.8rem; color: #888; margin-bottom: 0.3rem;">Assigned Member</div>
			{#if assigned}
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					<span
						style="background: #e8f5e9; color: #1b5e20; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 600;"
					>
						✓ {formatMemberName(assigned.name)}
					</span>
					<span style="font-size: 0.85rem; color: #777;">({assigned.email})</span>
				</div>
			{:else}
				<span
					style="background: #fff3e0; color: #b78103; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 600; font-style: italic;"
				>
					Unassigned / Needs Volunteer
				</span>
			{/if}
		</div>

		{#if entry?.note}
			<div style="margin-top: 1rem; padding: 0.6rem 0.8rem; background: #fafafa; border-radius: 4px; font-size: 0.85rem; color: #555;">
				<strong>Note:</strong> {entry.note}
			</div>
		{/if}
	</div>
</div>
