<script lang="ts">
	import { onMount } from 'svelte';
	import { HONEYPOT, submitForm } from '@fermain/frame/forms';
	import {
		shifts,
		members,
		season,
		formatMemberName,
		formatDate,
		formatDayName,
		formatMonthYear,
		type Shift
	} from '#lib/site';
	import { onDuty } from '#lib/ics';
	import signup from '../../../content/settings/signup.json';

	const hub = import.meta.env.VITE_FRAME_HUB;
	const project = import.meta.env.VITE_FRAME_PROJECT;
	const canSignUp = signup.enabled;

	type Filter = 'all' | 'open' | 'mine';
	let filter = $state<Filter>('all');
	let me = $state('');
	let today = $state('');
	let origin = $state('');

	// Browser-only values: the prerendered page doesn't know today's date, the host, or who you are.
	onMount(() => {
		today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' });
		origin = location.host;
		try {
			me = localStorage.getItem('roster-me') ?? '';
		} catch {}
	});

	function chooseMe(slug: string) {
		me = slug;
		if (!slug && filter === 'mine') filter = 'all';
		try {
			localStorage.setItem('roster-me', slug);
		} catch {}
	}

	const myself = $derived(members.find((m) => m.slug === me));
	const upcoming = $derived(shifts.filter((s) => s.date >= today));
	const isMine = (s: Shift) => s.members.some((m) => m.slug === me);

	const visible = $derived(
		upcoming.filter((s) =>
			filter === 'open' ? s.members.length === 0 : filter === 'mine' ? isMine(s) : true
		)
	);

	/** The Friday that starts a shift's weekend, and a label like "06 – 08 Nov". */
	function weekendOf(date: string) {
		const d = new Date(`${date}T12:00:00Z`);
		const fri = new Date(d);
		fri.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 2) % 7));
		const sun = new Date(fri);
		sun.setUTCDate(fri.getUTCDate() + 2);
		const fmt = (x: Date, opts: Intl.DateTimeFormatOptions) =>
			x.toLocaleDateString('en-ZA', { ...opts, timeZone: 'UTC' });
		const sameMonth = fri.getUTCMonth() === sun.getUTCMonth();
		const label = sameMonth
			? `${fmt(fri, { day: '2-digit' })} – ${fmt(sun, { day: '2-digit', month: 'short' })}`
			: `${fmt(fri, { day: '2-digit', month: 'short' })} – ${fmt(sun, { day: '2-digit', month: 'short' })}`;
		return { key: fri.toISOString().slice(0, 10), label };
	}

	const months = $derived.by(() => {
		const result: Array<{ month: string; weekends: Array<{ key: string; label: string; shifts: Shift[] }> }> = [];
		for (const shift of visible) {
			const month = formatMonthYear(shift.date);
			const { key, label } = weekendOf(shift.date);
			let m = result.at(-1);
			if (m?.month !== month) result.push((m = { month, weekends: [] }));
			let w = m.weekends.at(-1);
			if (w?.key !== key) m.weekends.push((w = { key, label, shifts: [] }));
			w.shifts.push(shift);
		}
		return result;
	});

	const openCount = $derived(upcoming.filter((s) => s.members.length === 0).length);
	const myCount = $derived(upcoming.filter(isMine).length);

	// Calendar subscriptions
	const feed = (path: string) => `webcal://${origin}${path}`;
	const google = (path: string) =>
		`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed(path))}`;

	// Signing up for an open shift
	let requesting = $state<string | null>(null);
	let sending = $state(false);
	let problem = $state('');
	let requested = $state<Set<string>>(new Set());

	async function requestShift(event: SubmitEvent, shift: Shift) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const data = new FormData(form);
		data.set('date', shift.date);
		data.set(
			'message',
			`Please put me down for site duty on ${formatDayName(shift.date)} ${formatDate(shift.date)}, ${shift.start}–${shift.end}.`
		);

		if (!hub || !project) {
			problem = `Sign-ups aren't connected yet. Please email ${season.contact.email} to take this shift.`;
			return;
		}

		sending = true;
		problem = '';
		const result = await submitForm({ hub, project, form: 'roster' }, data);
		sending = false;

		if (result.sent) {
			requested = new Set([...requested, shift.date]);
			requesting = null;
		} else {
			problem = result.problem;
		}
	}
</script>

<svelte:head>
	<title>Site Duty Roster · Mount Moreland Barn Swallows</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="roster-page">
	<div class="roster-card">
		<header class="roster-header">
			<h1 class="fondamento-regular roster-title">Site Duty Roster</h1>

			<div class="controls-bar">
				<label class="me">
					<span>I am</span>
					<select value={me} onchange={(e) => chooseMe(e.currentTarget.value)}>
						<option value="">Choose your name…</option>
						{#each members as member}
							<option value={member.slug}>{member.name}</option>
						{/each}
					</select>
				</label>

				<div class="filter-tabs">
					<button class="tab-btn" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
						All ({upcoming.length})
					</button>
					<button class="tab-btn" class:active={filter === 'open'} onclick={() => (filter = 'open')}>
						Open ({openCount})
					</button>
					{#if myself}
						<button class="tab-btn" class:active={filter === 'mine'} onclick={() => (filter = 'mine')}>
							Mine ({myCount})
						</button>
					{/if}
				</div>
			</div>

			{#if origin}
				<div class="subscribe">
					{#if myself}
						<span>Add your shifts to your calendar:</span>
						<a class="action-btn" href={google(`/roster/${myself.slug}.ics`)} target="_blank" rel="noopener noreferrer">Google</a>
						<a class="action-btn" href={feed(`/roster/${myself.slug}.ics`)}>Apple / Outlook</a>
					{:else}
						<span>Add the whole roster to your calendar:</span>
						<a class="action-btn" href={google('/roster.ics')} target="_blank" rel="noopener noreferrer">Google</a>
						<a class="action-btn" href={feed('/roster.ics')}>Apple / Outlook</a>
					{/if}
				</div>
			{/if}
		</header>

		{#if months.length === 0}
			<div class="empty-state handlee-regular">
				<p>
					{#if filter === 'mine'}
						You have no upcoming shifts.
					{:else if filter === 'open'}
						Every upcoming shift is covered. Thank you!
					{:else}
						No upcoming shifts this season.
					{/if}
				</p>
			</div>
		{:else}
			<div class="months-container">
				{#each months as month (month.month)}
					<section class="month-section">
						<h2 class="month-heading fondamento-regular">{month.month}</h2>

						<div class="weekends-list">
							{#each month.weekends as weekend (weekend.key)}
								<div class="weekend-block">
									<div class="weekend-header">
										<span class="weekend-label">Weekend: {weekend.label}</span>
									</div>

									<div class="shifts-list">
										{#each weekend.shifts as shift (shift.date)}
											{@const filled = shift.members.length > 0}
											<div class="shift-row" class:filled class:open={!filled} class:mine={isMine(shift)}>
												<div class="shift-when">
													<span class="shift-day">{formatDayName(shift.date)}</span>
													<span class="shift-date">{formatDate(shift.date)}</span>
													<span class="shift-time">{shift.start} – {shift.end}</span>
												</div>

												<div class="shift-who">
													<span class="volunteer-pill" class:filled class:open={!filled}>
														{filled ? `✓ ${onDuty(shift)}` : 'Needs volunteer'}
													</span>
												</div>

												<div class="shift-actions">
													{#if !filled && canSignUp}
														{#if requested.has(shift.date)}
															<span class="requested">Requested</span>
														{:else if requesting !== shift.date}
															<button class="action-btn" onclick={() => { requesting = shift.date; problem = ''; }}>
																Take this shift
															</button>
														{/if}
													{/if}
												</div>

												{#if requesting === shift.date}
													<form class="signup" onsubmit={(e) => requestShift(e, shift)}>
														<input name="name" placeholder="Your name" required value={myself?.name ?? ''} />
														<input name="email" type="email" placeholder="Your email" required value={myself?.email ?? ''} />
														<input name={HONEYPOT} class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
														<div class="signup-actions">
															<button class="action-btn primary" disabled={sending}>
																{sending ? 'Sending…' : signup.submit}
															</button>
															<button type="button" class="action-btn" onclick={() => (requesting = null)}>Cancel</button>
														</div>
														{#if problem}<p class="problem">{problem}</p>{/if}
													</form>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{/if}

		{#if requested.size > 0}
			<p class="success handlee-regular">{signup.success}</p>
		{/if}
	</div>
</div>

<style>
	.roster-page {
		min-height: 100vh;
		padding: 2rem 1rem 4rem;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
	}

	.roster-card {
		width: 100%;
		max-width: 820px;
		background: #ffffff;
		border: 1px solid #e5dccf;
		border-radius: 14px;
		padding: 2rem 2rem 2.5rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
		box-sizing: border-box;
	}

	.roster-header {
		text-align: center;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #ece4d7;
		padding-bottom: 1.2rem;
	}

	.roster-title {
		font-size: 2.2rem;
		margin: 0 0 1rem;
		color: #3b2a1a;
		letter-spacing: -0.01em;
	}

	.controls-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.8rem;
	}

	.me {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #5a4532;
	}

	.me select,
	.signup input {
		padding: 0.45rem 0.7rem;
		font-size: 0.85rem;
		border: 1px solid #dcd1c1;
		border-radius: 8px;
		background: #faf8f5;
		color: #333;
	}

	.filter-tabs {
		display: inline-flex;
		gap: 0.25rem;
		background: #efe7db;
		padding: 0.3rem;
		border-radius: 8px;
	}

	.tab-btn {
		background: transparent;
		border: none;
		padding: 0.45rem 0.9rem;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
		color: #5a4532;
		font-weight: 600;
		transition: background 150ms, color 150ms;
	}

	.tab-btn.active {
		background: #ffffff;
		color: #2b1f15;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.subscribe {
		margin-top: 1rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: #6b5b4e;
	}

	.months-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.month-section {
		display: flex;
		flex-direction: column;
	}

	.month-heading {
		font-size: 1.5rem;
		color: #4a3525;
		margin: 0.5rem 0 0.8rem;
		padding-bottom: 0.4rem;
		border-bottom: 2px solid #eae0d2;
		text-align: left;
	}

	.weekends-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.weekend-block {
		background: #faf8f5;
		border: 1px solid #ebd9c5;
		border-radius: 10px;
		padding: 0.85rem 1rem 0.95rem;
	}

	.weekend-header {
		margin-bottom: 0.6rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px dashed #e2d2be;
	}

	.weekend-label {
		font-weight: 700;
		font-size: 0.88rem;
		color: #6a4f38;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.shifts-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.shift-row {
		background: #ffffff;
		border: 1px solid #e7ded0;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		display: grid;
		grid-template-columns: 190px 1fr auto;
		align-items: center;
		gap: 1rem;
	}

	.shift-row.open {
		border-left: 5px solid #f59e0b;
		background: #fffefb;
	}

	.shift-row.filled {
		border-left: 5px solid #10b981;
	}

	.shift-row.mine {
		background: #f0faf4;
		box-shadow: inset 0 0 0 1px #a7dcc0;
	}

	.shift-when {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.shift-day {
		font-weight: 700;
		color: #2b1f15;
		font-size: 0.95rem;
	}

	.shift-date {
		font-size: 0.85rem;
		color: #6b5b4e;
	}

	.shift-time {
		font-size: 0.75rem;
		color: #928173;
		font-weight: 500;
	}

	.volunteer-pill {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border-radius: 20px;
		font-size: 0.88rem;
		font-weight: 600;
	}

	.volunteer-pill.filled {
		background: #e8f5e9;
		color: #1b5e20;
		border: 1px solid #c8e6c9;
	}

	.volunteer-pill.open {
		background: #fff3e0;
		color: #b78103;
		border: 1px solid #ffe0b2;
		font-style: italic;
	}

	.action-btn {
		background: #f4ede2;
		border: 1px solid #dcd1c2;
		color: #5c4737;
		padding: 0.35rem 0.65rem;
		font-size: 0.75rem;
		border-radius: 5px;
		cursor: pointer;
		text-decoration: none;
		font-weight: 600;
		transition: background 120ms;
	}

	.action-btn:hover {
		background: #ebe0d0;
	}

	.action-btn.primary {
		background: #7b4424;
		border-color: #7b4424;
		color: #fff;
	}

	.requested {
		font-size: 0.8rem;
		font-weight: 600;
		color: #7b4424;
	}

	.signup {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding-top: 0.6rem;
		border-top: 1px dashed #e2d2be;
	}

	.signup input {
		flex: 1 1 180px;
	}

	.signup-actions {
		display: flex;
		gap: 0.35rem;
	}

	.honeypot {
		position: absolute;
		left: -9999px;
	}

	.problem {
		width: 100%;
		margin: 0;
		font-size: 0.8rem;
		color: #b42318;
	}

	.success {
		text-align: center;
		margin: 1.5rem 0 0;
		font-size: 1.1rem;
		color: #1b5e20;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #7c6855;
		font-size: 1.2rem;
	}

	@media (max-width: 680px) {
		.roster-card {
			padding: 1.5rem 1rem;
		}

		.shift-row {
			grid-template-columns: 1fr;
			gap: 0.6rem;
		}

		.controls-bar {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
