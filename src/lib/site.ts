import { entries, related } from '@fermain/frame';
import seasonData from '../content/settings/season.json';
import rosterData from '../content/settings/roster.json';

export interface SeasonSettings {
	status: 'open' | 'closed';
	openMessage: string;
	closedMessage: string;
	opens: string;
	closes: string;
	closedDates: string[];
	hours: Array<{
		day: string;
		open: string;
		close: string;
	}>;
	admissions: Array<{
		type: string;
		price: string;
	}>;
	contact: {
		email: string;
		phone: string;
	};
	mapUrl: string;
}

export interface Member {
	slug: string;
	id?: string;
	name: string;
	email: string;
}

export interface Shift {
	/** `2026-11-06` */
	date: string;
	/** `17:00`, South African time */
	start: string;
	end: string;
	members: Member[];
}

export const season: SeasonSettings = seasonData as SeasonSettings;

export const members = entries(
	import.meta.glob('../content/members/*.json', { eager: true, import: 'default' }),
	{ sort: { field: 'name' } }
) as unknown as Member[];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface Assignment {
	date: string;
	member: string | null;
}

const assignments = (rosterData.assignments ?? []) as Assignment[];

/**
 * Every duty shift in the season: one per day from `opens` to `closes` that has opening
 * hours and isn't a closed date, with whoever the roster assigns to it. The editor's
 * preview passes its unsaved assignments; the site uses the saved ones.
 */
export function seasonShifts(roster: Assignment[] = assignments): Shift[] {
	if (!season.opens || !season.closes) return [];
	const closed = new Set(season.closedDates ?? []);
	const result: Shift[] = [];
	const day = new Date(`${season.opens}T12:00:00Z`);
	const last = new Date(`${season.closes}T12:00:00Z`);

	for (; day <= last; day.setUTCDate(day.getUTCDate() + 1)) {
		const date = day.toISOString().slice(0, 10);
		const hours = season.hours.find((h) => h.day === WEEKDAYS[day.getUTCDay()]);
		if (!hours || closed.has(date)) continue;

		const assigned = roster
			.filter((a) => a.date === date)
			.map((a) => related(a.member, members))
			.filter((m): m is Member => !!m);

		result.push({ date, start: hours.open, end: hours.close, members: assigned });
	}
	return result;
}

export const shifts = seasonShifts();

/**
 * Returns member display name as First Name and Initial of Last Name,
 * e.g. "Trevor Doe" -> "Trevor D."
 */
export function formatMemberName(name?: string | null): string {
	if (!name) return '';
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0];
	const first = parts[0];
	const lastInitial = parts[parts.length - 1][0].toUpperCase();
	return `${first} ${lastInitial}.`;
}

export function formatDate(iso: string): string {
	const d = new Date(`${iso}T12:00:00Z`);
	return d.toLocaleDateString('en-ZA', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

export function formatDayName(iso: string): string {
	const d = new Date(`${iso}T12:00:00Z`);
	return d.toLocaleDateString('en-ZA', {
		weekday: 'long',
		timeZone: 'UTC'
	});
}

export function formatMonthYear(iso: string): string {
	const d = new Date(`${iso}T12:00:00Z`);
	return d.toLocaleDateString('en-ZA', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}
