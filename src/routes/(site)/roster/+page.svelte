<script lang="ts">
	import {
		shifts,
		members,
		formatMemberName,
		formatDate,
		formatDayName,
		formatMonthYear,
		type Member
	} from '#lib/site';
	import { generateGoogleCalendarUrl, downloadIcsFile } from '#lib/calendar';

	type FilterType = 'all' | 'open' | 'filled';
	let filter = $state<FilterType>('all');
	let searchQuery = $state('');

	// Client-side date comparison to hide past shifts
	const todayStr = new Date().toLocaleDateString('en-CA');

	// Map members by both slug and id to handle ID-only Frame content edits
	const memberLookup = $derived.by(() => {
		const map = new Map<string, Member>();
		for (const m of members) {
			if (m.slug) map.set(m.slug, m);
			if (m.id) map.set(m.id, m);
		}
		return map;
	});

	interface EnrichedShift {
		slug: string;
		date: string;
		dayName: string;
		formattedDate: string;
		monthYear: string;
		weekendKey: string;
		weekendLabel: string;
		memberSlug: string | null;
		memberName: string | null;
		displayMemberName: string;
		isFilled: boolean;
	}

	function getWeekendInfo(dateStr: string): { key: string; label: string } {
		const d = new Date(`${dateStr}T12:00:00Z`);
		const day = d.getUTCDay(); // 5 = Fri, 6 = Sat, 0 = Sun
		const diffToFri = day === 0 ? 2 : day - 5;
		const fri = new Date(d);
		fri.setUTCDate(d.getUTCDate() - diffToFri);
		const sun = new Date(fri);
		sun.setUTCDate(fri.getUTCDate() + 2);

		const friDay = fri.toLocaleDateString('en-ZA', { day: '2-digit', timeZone: 'UTC' });
		const sunDay = sun.toLocaleDateString('en-ZA', { day: '2-digit', timeZone: 'UTC' });
		const friMonth = fri.toLocaleDateString('en-ZA', { month: 'short', timeZone: 'UTC' });
		const sunMonth = sun.toLocaleDateString('en-ZA', { month: 'short', timeZone: 'UTC' });

		const label =
			friMonth === sunMonth
				? `${friDay} – ${sunDay} ${friMonth}`
				: `${friDay} ${friMonth} – ${sunDay} ${sunMonth}`;

		return {
			key: fri.toISOString().slice(0, 10),
			label
		};
	}

	// Filter out past shifts and enrich
	const activeShifts = $derived(
		shifts
			.filter((s) => s.date >= todayStr)
			.map((s): EnrichedShift => {
				const member = s.member ? memberLookup.get(s.member) : null;
				const isFilled = !!member;
				const displayMemberName = member ? formatMemberName(member.name) : 'Open';
				const weekend = getWeekendInfo(s.date);

				return {
					slug: s.slug,
					date: s.date,
					dayName: formatDayName(s.date),
					formattedDate: formatDate(s.date),
					monthYear: formatMonthYear(s.date),
					weekendKey: weekend.key,
					weekendLabel: weekend.label,
					memberSlug: s.member ?? null,
					memberName: member?.name ?? null,
					displayMemberName,
					isFilled
				};
			})
	);

	const filteredShifts = $derived(
		activeShifts.filter((s) => {
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

	interface WeekendGroup {
		key: string;
		label: string;
		shifts: EnrichedShift[];
	}

	interface MonthGroup {
		month: string;
		weekends: WeekendGroup[];
	}

	// Group shifts by Month, and then within each Month by Weekend
	const groupedByMonthAndWeek = $derived((): MonthGroup[] => {
		const monthMap = new Map<string, Map<string, { label: string; shifts: EnrichedShift[] }>>();

		for (const shift of filteredShifts) {
			let weekendMap = monthMap.get(shift.monthYear);
			if (!weekendMap) {
				weekendMap = new Map();
				monthMap.set(shift.monthYear, weekendMap);
			}

			let weekend = weekendMap.get(shift.weekendKey);
			if (!weekend) {
				weekend = { label: shift.weekendLabel, shifts: [] };
				weekendMap.set(shift.weekendKey, weekend);
			}
			weekend.shifts.push(shift);
		}

		return Array.from(monthMap.entries()).map(([month, weekendMap]) => ({
			month,
			weekends: Array.from(weekendMap.entries()).map(([key, data]) => ({
				key,
				label: data.label,
				shifts: data.shifts
			}))
		}));
	});

	const totalCount = $derived(activeShifts.length);
	const filledCount = $derived(activeShifts.filter((s) => s.isFilled).length);
	const openCount = $derived(totalCount - filledCount);
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
						placeholder="Search name, day or date..."
						bind:value={searchQuery}
						class="search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">✕</button>
					{/if}
				</div>
			</div>
		</header>

		{#if groupedByMonthAndWeek().length === 0}
			<div class="empty-state handlee-regular">
				<p>No upcoming shifts matching your filter.</p>
				<button class="reset-btn" onclick={() => { filter = 'all'; searchQuery = ''; }}>
					Show all upcoming shifts
				</button>
			</div>
		{:else}
			<div class="months-container">
				{#each groupedByMonthAndWeek() as monthGroup}
					<section class="month-section">
						<h2 class="month-heading fondamento-regular">{monthGroup.month}</h2>

						<div class="weekends-list">
							{#each monthGroup.weekends as weekend}
								<div class="weekend-block">
									<div class="weekend-header">
										<span class="weekend-label">Weekend: {weekend.label}</span>
									</div>

									<div class="shifts-list">
										{#each weekend.shifts as shift}
											<div class="shift-row {shift.isFilled ? 'filled' : 'open'}">
												<div class="shift-when">
													<span class="shift-day">{shift.dayName}</span>
													<span class="shift-date">{shift.formattedDate}</span>
													<span class="shift-time">17:00 – 19:00</span>
												</div>

												<div class="shift-who">
													{#if shift.isFilled}
														<span class="volunteer-pill filled">
															✓ {shift.displayMemberName}
														</span>
													{:else}
														<span class="volunteer-pill open">Needs Volunteer</span>
													{/if}
												</div>

												<div class="shift-actions">
													{#if shift.isFilled}
														<div class="calendar-group">
															<a
																href={generateGoogleCalendarUrl(shift.date)}
																target="_blank"
																rel="noopener noreferrer"
																class="action-btn"
																title="Add to Google Calendar"
															>
																Google Cal
															</a>
															<button
																class="action-btn"
																onclick={() => downloadIcsFile(shift.date, shift.displayMemberName)}
																title="Download .ics file for Calendar"
															>
																.ICS
															</button>
														</div>
													{/if}
												</div>
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

	.search-box {
		position: relative;
		flex: 1;
		max-width: 280px;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 2rem 0.5rem 0.85rem;
		font-size: 0.85rem;
		border: 1px solid #dcd1c1;
		border-radius: 8px;
		background: #faf8f5;
		color: #333;
		box-sizing: border-box;
		outline: none;
	}

	.search-input:focus {
		border-color: #8b5e3c;
		background: #ffffff;
	}

	.clear-btn {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: #888;
		font-size: 0.8rem;
		padding: 2px 4px;
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
		transition: transform 120ms ease, box-shadow 120ms ease;
	}

	.shift-row:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.shift-row.open {
		border-left: 5px solid #f59e0b;
		background: #fffefb;
	}

	.shift-row.filled {
		border-left: 5px solid #10b981;
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

	.shift-who {
		display: flex;
		align-items: center;
	}

	.volunteer-pill {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border-radius: 20px;
		font-size: 0.88rem;
		font-weight: 600;
		width: fit-content;
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

	.shift-actions {
		display: flex;
		align-items: center;
	}

	.calendar-group {
		display: flex;
		gap: 0.35rem;
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

		.search-box {
			max-width: none;
		}
	}
</style>
