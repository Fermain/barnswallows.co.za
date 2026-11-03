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

<div style="padding: 1.5rem; max-width: 440px; margin: 1rem auto; font-family: system-ui, -apple-system, sans-serif;">
	<div
		style="background: #ffffff; border: 1px solid #e2d9cc; border-left: 6px solid {assigned ? '#10b981' : '#f59e0b'}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.06);"
	>
		<div style="font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
			Site Duty Shift
		</div>
		<div style="font-size: 1.5rem; margin: 0.5rem 0 0.2rem; color: #222; text-align: left; font-weight: 700;">
			{entry?.date ? formatDayName(entry.date) : 'Select date'}
		</div>
		<div style="font-size: 1rem; color: #555; margin-bottom: 0.4rem;">
			{entry?.date ? formatDate(entry.date) : ''}
		</div>
		<div style="font-size: 0.9rem; color: #666; margin-bottom: 1.2rem;">
			<strong>Time:</strong> 17:00 – 19:00
		</div>

		<div style="border-top: 1px solid #eee; padding-top: 1rem;">
			<div style="font-size: 0.8rem; color: #888; margin-bottom: 0.35rem; font-weight: 500;">
				Assigned Member
			</div>
			{#if assigned}
				<div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
					<span
						style="background: #e8f5e9; color: #1b5e20; border: 1px solid #c8e6c9; padding: 0.35rem 0.8rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem;"
					>
						✓ {formatMemberName(assigned.name)}
					</span>
					<span style="font-size: 0.85rem; color: #666;">({assigned.email})</span>
				</div>
			{:else}
				<span
					style="display: inline-block; background: #fff3e0; color: #b78103; border: 1px solid #ffe0b2; padding: 0.35rem 0.8rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem;"
				>
					Needs Volunteer
				</span>
			{/if}
		</div>

		{#if entry?.note}
			<div style="margin-top: 1rem; padding: 0.6rem 0.8rem; background: #faf8f5; border: 1px solid #eee; border-radius: 6px; font-size: 0.85rem; color: #555;">
				<strong>Note:</strong> {entry.note}
			</div>
		{/if}
	</div>
</div>
