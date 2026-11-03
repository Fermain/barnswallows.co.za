<script lang="ts">
	import {
		shifts,
		members,
		formatMemberName,
		formatDate,
		formatDayName,
		formatMonthYear,
		season
	} from '#lib/site';
	import { generateGoogleCalendarUrl, downloadIcsFile } from '#lib/calendar';

	type FilterType = 'all' | 'open' | 'filled';
	let filter = $state<FilterType>('all');
	let searchQuery = $state('');

	// Map member slugs/ids to member objects
	const memberMap = new Map(members.map((m) => [m.slug, m]));

	interface EnrichedShift {
		slug: string;
		date: string;
		dayName: string;
		formattedDate: string;
		monthYear: string;
		memberSlug: string | null;
		memberName: string | null;
		displayMemberName: string;
		isFilled: boolean;
		note?: string;
	}

	const enrichedShifts = $derived(
		shifts.map((s): EnrichedShift => {
			const member = s.member ? memberMap.get(s.member) : null;
			const isFilled = !!member;
			const displayMemberName = member ? formatMemberName(member.name) : 'Open';

			return {
				slug: s.slug,
				date: s.date,
				dayName: formatDayName(s.date),
				formattedDate: formatDate(s.date),
				monthYear: formatMonthYear(s.date),
				memberSlug: s.member ?? null,
				memberName: member?.name ?? null,
				displayMemberName,
				isFilled,
				note: s.note
			};
		})
	);

	const filteredShifts = $derived(
		enrichedShifts.filter((s) => {
			if (filter === 'open' && s.isFilled) return false;
			if (filter === 'filled' && !s.isFilled) return false;

			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const matchName = s.memberName?.toLowerCase().includes(query) ?? false;
				const matchDisplay = s.displayMemberName.toLowerCase().includes(query);
				const matchDate = s.formattedDate.toLowerCase().includes(query);
				const matchDay = s.dayName.toLowerCase().includes(query);
				return matchName || matchDisplay || matchDate || matchDay;
			}
			return true;
		})
	);

	// Group shifts by month
	const groupedByMonth = $derived(() => {
		const groups = new Map<string, EnrichedShift[]>();
		for (const shift of filteredShifts) {
			const existing = groups.get(shift.monthYear) ?? [];
			existing.push(shift);
			groups.set(shift.monthYear, existing);
		}
		return Array.from(groups.entries()).map(([month, items]) => ({ month, items }));
	});

	const totalCount = $derived(enrichedShifts.length);
	const filledCount = $derived(enrichedShifts.filter((s) => s.isFilled).length);
	const openCount = $derived(totalCount - filledCount);
</script>

<svelte:head>
	<title>Duty Roster · Mount Moreland Barn Swallows</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="roster-page">
	<div class="roster-container">
		<header class="roster-header">
			<a href="/" class="back-link">← Return to website</a>
			<h1 class="fondamento-regular">Site Duty Roster</h1>
			<p class="roster-lead handlee-regular">
				Manning the Lake Victoria Viewing Site on Fridays, Saturdays and Sundays (17:00 – 19:00)
			</p>
			<p class="roster-season">Season: 6 November 2026 – 25 April 2027</p>

			<div class="stats-row">
				<div class="stat-badge total">
					<span class="stat-number">{totalCount}</span>
					<span class="stat-label">Total Shifts</span>
				</div>
				<div class="stat-badge filled">
					<span class="stat-number">{filledCount}</span>
					<span class="stat-label">Manned</span>
				</div>
				<div class="stat-badge open">
					<span class="stat-number">{openCount}</span>
					<span class="stat-label">Need Volunteers</span>
				</div>
			</div>

			<div class="controls-row">
				<div class="filter-tabs">
					<button
						class="tab-btn {filter === 'all' ? 'active' : ''}"
						onclick={() => (filter = 'all')}
					>
						All ({totalCount})
					</button>
					<button
						class="tab-btn {filter === 'open' ? 'active' : ''}"
						onclick={() => (filter = 'open')}
					>
						Open ({openCount})
					</button>
					<button
						class="tab-btn {filter === 'filled' ? 'active' : ''}"
						onclick={() => (filter = 'filled')}
					>
						Manned ({filledCount})
					</button>
				</div>

				<div class="search-box">
					<input
						type="text"
						placeholder="Filter by name or date..."
						bind:value={searchQuery}
						class="search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')}>✕</button>
					{/if}
				</div>
			</div>
		</header>

		{#if groupedByMonth().length === 0}
			<div class="empty-state handlee-regular">
				<p>No shifts matching your filter.</p>
				<button class="reset-btn" onclick={() => { filter = 'all'; searchQuery = ''; }}>
					Show all shifts
				</button>
			</div>
		{:else}
			{#each groupedByMonth() as group}
				<section class="month-section">
					<h2 class="month-title fondamento-regular">{group.month}</h2>
					<div class="shifts-grid">
						{#each group.items as shift}
							<div class="shift-card {shift.isFilled ? 'filled' : 'open'}">
								<div class="shift-date-col">
									<span class="shift-day">{shift.dayName}</span>
									<span class="shift-date">{shift.formattedDate}</span>
									<span class="shift-time">17:00 – 19:00</span>
								</div>

								<div class="shift-member-col">
									{#if shift.isFilled}
										<div class="member-info">
											<span class="member-tag filled">
												✓ {shift.displayMemberName}
											</span>
											{#if shift.note}
												<span class="shift-note">{shift.note}</span>
											{/if}
										</div>
									{:else}
										<span class="member-tag open">Needs Volunteer</span>
									{/if}
								</div>

								<div class="shift-action-col">
									{#if shift.isFilled}
										<div class="calendar-actions">
											<a
												href={generateGoogleCalendarUrl(shift.date)}
												target="_blank"
												rel="noopener noreferrer"
												class="calendar-btn"
												title="Add to Google Calendar"
											>
												Google Cal
											</a>
											<button
												class="calendar-btn"
												onclick={() => downloadIcsFile(shift.date, shift.displayMemberName)}
												title="Download .ics file for Apple/Outlook Calendar"
											>
												.ICS
											</button>
										</div>
									{:else}
										<a
											href="mailto:{season.contact.email}?subject=Volunteer%20for%20Shift%20{shift.date}"
											class="claim-link"
										>
											Volunteer
										</a>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		{/if}

		<footer class="roster-info-card">
			<h3 class="handlee-regular">Site Duty Information</h3>
			<ul>
				<li><strong>Hours:</strong> 17:00 to 19:00 (volunteers arrive by 16:45).</li>
				<li><strong>Admission collection:</strong> Adult R50, Child & Resident R20 (Zapper and Card machine provided).</li>
				<li><strong>Swallow briefing:</strong> Welcome visitors and assist with parking along the fence line.</li>
				<li>To claim a shift, update your availability, or swap, please edit via <a href="/admin">Frame Admin</a> or message the coordinator.</li>
			</ul>
		</footer>
	</div>
</div>

<style>
	.roster-page {
		min-height: calc(100vh - 120px);
		padding: 2rem 1rem 4rem;
	}

	.roster-container {
		max-width: 840px;
		margin: 0 auto;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(139, 94, 60, 0.2);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 1rem;
		font-size: 0.95rem;
		color: #7b4424;
		text-decoration: none;
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.roster-header {
		text-align: center;
		margin-bottom: 2.5rem;
		border-bottom: 1px dashed rgba(139, 94, 60, 0.3);
		padding-bottom: 1.5rem;
	}

	.roster-header h1 {
		font-size: 2.4rem;
		margin: 0 0 0.5rem;
		color: #3b2a1a;
	}

	.roster-lead {
		font-size: 1.25rem;
		margin: 0 0 0.25rem;
		color: #5a4532;
	}

	.roster-season {
		font-size: 0.9rem;
		color: #7c6855;
		margin: 0 0 1.5rem;
		font-style: italic;
	}

	.stats-row {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.stat-badge {
		background: #fff;
		border: 1px solid #e2d7c7;
		padding: 0.6rem 1.2rem;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 100px;
	}

	.stat-number {
		font-size: 1.4rem;
		font-weight: bold;
	}

	.stat-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #7c6855;
	}

	.stat-badge.filled .stat-number {
		color: #2e7d32;
	}

	.stat-badge.open .stat-number {
		color: #d32f2f;
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1rem;
	}

	.filter-tabs {
		display: flex;
		gap: 0.4rem;
		background: #eee6d8;
		padding: 0.25rem;
		border-radius: 6px;
	}

	.tab-btn {
		background: transparent;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		font-size: 0.85rem;
		cursor: pointer;
		color: #5a4532;
		font-weight: 500;
		transition: background 150ms;
	}

	.tab-btn.active {
		background: #fff;
		color: #3b2a1a;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.search-box {
		position: relative;
		flex: 1;
		max-width: 260px;
	}

	.search-input {
		width: 100%;
		padding: 0.45rem 1.8rem 0.45rem 0.8rem;
		font-size: 0.85rem;
		border: 1px solid #d4c7b5;
		border-radius: 6px;
		background: #fff;
		box-sizing: border-box;
	}

	.clear-btn {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: #999;
	}

	.month-section {
		margin-bottom: 2rem;
	}

	.month-title {
		font-size: 1.5rem;
		color: #4a3525;
		margin: 1.5rem 0 0.8rem;
		padding-bottom: 0.3rem;
		border-bottom: 2px solid #e0d4c2;
		text-align: left;
	}

	.shifts-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.shift-card {
		background: #ffffff;
		border: 1px solid #e7ddce;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		display: grid;
		grid-template-columns: 200px 1fr auto;
		align-items: center;
		gap: 1rem;
		transition: transform 120ms ease, box-shadow 120ms ease;
	}

	.shift-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.shift-card.open {
		border-left: 4px solid #f59e0b;
		background: #fffdf8;
	}

	.shift-card.filled {
		border-left: 4px solid #10b981;
	}

	.shift-date-col {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.shift-day {
		font-weight: 600;
		color: #2b1f15;
		font-size: 0.95rem;
	}

	.shift-date {
		font-size: 0.85rem;
		color: #6b5b4e;
	}

	.shift-time {
		font-size: 0.75rem;
		color: #8c7b6d;
	}

	.shift-member-col {
		display: flex;
		align-items: center;
	}

	.member-tag {
		display: inline-block;
		padding: 0.35rem 0.75rem;
		border-radius: 20px;
		font-size: 0.88rem;
		font-weight: 500;
	}

	.member-tag.filled {
		background: #e8f5e9;
		color: #1b5e20;
		border: 1px solid #c8e6c9;
	}

	.member-tag.open {
		background: #fff3e0;
		color: #b78103;
		border: 1px solid #ffe0b2;
		font-style: italic;
	}

	.shift-note {
		display: block;
		font-size: 0.75rem;
		color: #888;
		margin-top: 0.2rem;
	}

	.shift-action-col {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.calendar-actions {
		display: flex;
		gap: 0.3rem;
	}

	.calendar-btn {
		background: #f4ede2;
		border: 1px solid #dcd1c2;
		color: #5c4737;
		padding: 0.3rem 0.6rem;
		font-size: 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		text-decoration: none;
		font-weight: 500;
		transition: background 120ms;
	}

	.calendar-btn:hover {
		background: #ebe0d0;
	}

	.claim-link {
		background: #7b4424;
		color: #fff;
		border: none;
		padding: 0.35rem 0.8rem;
		font-size: 0.8rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
		transition: background 150ms;
	}

	.claim-link:hover {
		background: #5d3117;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #7c6855;
		font-size: 1.2rem;
	}

	.reset-btn {
		background: #7b4424;
		color: #fff;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		border-radius: 6px;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.roster-info-card {
		margin-top: 3rem;
		padding: 1.5rem;
		background: #fcf8ee;
		border: 1px solid #e8decb;
		border-radius: 8px;
		color: #4b3828;
	}

	.roster-info-card h3 {
		margin: 0 0 0.8rem;
		font-size: 1.3rem;
		color: #3b2a1a;
		text-align: left;
	}

	.roster-info-card ul {
		margin: 0;
		padding-left: 1.2rem;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.roster-info-card a {
		color: #7b4424;
		font-weight: 600;
	}

	@media (max-width: 650px) {
		.shift-card {
			grid-template-columns: 1fr;
			gap: 0.6rem;
			text-align: left;
		}

		.shift-action-col {
			justify-content: flex-start;
		}

		.controls-row {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			max-width: none;
		}
	}
</style>
