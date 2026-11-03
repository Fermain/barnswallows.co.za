<script lang="ts">
	import { related } from '@fermain/frame';
	import {
		formatDate,
		formatMemberName,
		members,
		season,
		seasonShifts,
		type Assignment,
		type Member
	} from '#lib/site';

	let { entry }: { entry?: { assignments?: Assignment[] } } = $props();

	const rows = $derived(entry?.assignments ?? []);
	const shifts = $derived(seasonShifts(rows));
	const byDate = $derived(new Map(shifts.map((s) => [s.date, s])));
	const closed = $derived(new Set(season.closedDates ?? []));
	const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });

	const covered = $derived(shifts.filter((s) => s.members.length > 0).length);

	/** Rows the editor should fix: the date picker can't stop them being entered. */
	const problems = $derived.by(() => {
		const list: string[] = [];
		const seen = new Set<string>();
		rows.forEach((row, i) => {
			const n = `Row ${i + 1}`;
			const member = row.member ? related(row.member, members) : undefined;
			if (!row.date) return list.push(`${n}: no date`);
			if (!member) return list.push(`${n} (${formatDate(row.date)}): no member chosen`);
			if (!byDate.has(row.date)) {
				const why = closed.has(row.date) ? 'a closed date' : 'not a duty day';
				return list.push(`${n}: ${formatDate(row.date)} is ${why}`);
			}
			const key = `${row.date}|${member.slug}`;
			if (seen.has(key)) list.push(`${n}: ${member.name} is already on ${formatDate(row.date)}`);
			seen.add(key);
		});
		return list;
	});
	const badDates = $derived(new Set(rows.filter((r) => r.date && !byDate.has(r.date)).map((r) => r.date)));

	/** Upcoming shifts per member, so the load can be spread fairly. */
	const tally = $derived(
		members
			.map((m: Member) => ({
				name: formatMemberName(m.name),
				count: shifts.filter((s) => s.date >= today && s.members.some((x) => x.slug === m.slug)).length
			}))
			.sort((a, b) => b.count - a.count)
	);

	/** Calendar grids, Monday first, for each month of the season. */
	const months = $derived.by(() => {
		if (!season.opens || !season.closes) return [];
		const result: Array<{ label: string; cells: Array<string | null> }> = [];
		const cursor = new Date(`${season.opens.slice(0, 7)}-01T12:00:00Z`);
		const end = season.closes.slice(0, 7);
		while (cursor.toISOString().slice(0, 7) <= end) {
			const label = cursor.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' });
			const cells: Array<string | null> = Array((cursor.getUTCDay() + 6) % 7).fill(null);
			const month = cursor.getUTCMonth();
			for (const d = new Date(cursor); d.getUTCMonth() === month; d.setUTCDate(d.getUTCDate() + 1)) {
				cells.push(d.toISOString().slice(0, 10));
			}
			result.push({ label, cells });
			cursor.setUTCMonth(month + 1);
		}
		return result;
	});

	const firstName = (m: Member) => formatMemberName(m.name);
</script>

<div class="roster">
	<header>
		<h2>Duty Roster</h2>
		<p>{covered} of {shifts.length} shifts covered</p>
		<div class="bar"><span style="width: {shifts.length ? (covered / shifts.length) * 100 : 0}%"></span></div>
	</header>

	{#if problems.length}
		<section class="problems">
			<strong>Check these assignments</strong>
			<ul>
				{#each problems as problem}<li>{problem}</li>{/each}
			</ul>
		</section>
	{/if}

	<section class="tally">
		{#each tally as t}
			<span class="chip" class:none={t.count === 0}>{t.name} <b>{t.count}</b></span>
		{/each}
	</section>

	<div class="legend">
		<span><i class="sw open"></i>Needs volunteer</span>
		<span><i class="sw filled"></i>Covered</span>
		<span><i class="sw closed"></i>Closed</span>
	</div>

	{#each months as month (month.label)}
		<section class="month">
			<h3>{month.label}</h3>
			<div class="grid">
				{#each ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as d}<div class="dow">{d}</div>{/each}
				{#each month.cells as date}
					{#if !date}
						<div></div>
					{:else}
						{@const shift = byDate.get(date)}
						<div
							class="day"
							class:shift={!!shift}
							class:open={shift && !shift.members.length}
							class:filled={shift && shift.members.length}
							class:closed={closed.has(date)}
							class:bad={badDates.has(date)}
							class:past={date < today}
							title={shift ? `${formatDate(date)} ${shift.start}–${shift.end}` : formatDate(date)}
						>
							<span class="num">{Number(date.slice(8))}</span>
							{#if shift}
								{#each shift.members as m}<span class="who">{firstName(m)}</span>{/each}
							{:else if closed.has(date)}
								<span class="who">Closed</span>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.roster {
		padding: 1.5rem;
		max-width: 640px;
		margin: 0 auto;
		font-family: system-ui, -apple-system, sans-serif;
		color: #2b1f15;
	}

	header h2 {
		margin: 0;
		font-size: 1.4rem;
		text-align: left;
	}

	header p {
		margin: 0.25rem 0 0.5rem;
		color: #6b5b4e;
		font-size: 0.9rem;
	}

	.bar {
		height: 6px;
		background: #fff3e0;
		border-radius: 3px;
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		background: #10b981;
	}

	.problems {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #fef3f2;
		border: 1px solid #fecdca;
		border-radius: 8px;
		color: #912018;
		font-size: 0.85rem;
	}

	.problems ul {
		margin: 0.35rem 0 0;
		padding-left: 1.1rem;
	}

	.tally {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 1rem;
	}

	.chip {
		font-size: 0.78rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: #e8f5e9;
		color: #1b5e20;
	}

	.chip.none {
		background: #f4ede2;
		color: #7c6855;
	}

	.legend {
		display: flex;
		gap: 1rem;
		margin: 1rem 0 0.5rem;
		font-size: 0.75rem;
		color: #6b5b4e;
	}

	.sw {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
		margin-right: 0.3rem;
		vertical-align: -1px;
	}

	.month h3 {
		margin: 1.25rem 0 0.4rem;
		font-size: 0.95rem;
		text-align: left;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 3px;
	}

	.dow {
		font-size: 0.7rem;
		color: #928173;
		text-align: center;
	}

	.day {
		min-height: 3rem;
		padding: 0.2rem 0.25rem;
		border-radius: 4px;
		font-size: 0.7rem;
		color: #b3a596;
		overflow: hidden;
	}

	.num {
		display: block;
		font-weight: 600;
	}

	.who {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 600;
	}

	.open,
	.sw.open {
		background: #fff3e0;
		color: #b78103;
		box-shadow: inset 0 0 0 1px #ffe0b2;
	}

	.filled,
	.sw.filled {
		background: #e8f5e9;
		color: #1b5e20;
		box-shadow: inset 0 0 0 1px #c8e6c9;
	}

	.closed,
	.sw.closed {
		background: #eee8e0;
		color: #8a7a6a;
	}

	.bad {
		box-shadow: inset 0 0 0 2px #f04438;
		color: #b42318;
	}

	.past {
		opacity: 0.45;
	}
</style>
