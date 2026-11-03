import { entries } from '@fermain/frame';
import seasonData from '../content/settings/season.json';

export interface SeasonSettings {
	status: 'open' | 'closed';
	openMessage: string;
	closedMessage: string;
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
	name: string;
	email: string;
	phone?: string;
}

export interface Shift {
	slug: string;
	date: string;
	member?: string | null;
	note?: string;
}

export const season: SeasonSettings = seasonData as SeasonSettings;

export const members = entries(
	import.meta.glob('../content/members/*.json', { eager: true, import: 'default' }),
	{ sort: { field: 'name' } }
) as unknown as Member[];

export const shifts = entries(
	import.meta.glob('../content/shifts/*.json', { eager: true, import: 'default' }),
	{ sort: { field: 'date', direction: 'asc' } }
) as unknown as Shift[];

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
