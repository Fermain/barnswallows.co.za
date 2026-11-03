import { formatMemberName, type Shift } from './site';

const DOMAIN = 'barnswallows.co.za';
const LOCATION = 'Lake Victoria Barn Swallows Viewing Site, Mount Moreland';

/** `2026-11-06` + `17:00` in South African time (UTC+2, no daylight saving) → `20261106T150000Z` */
function utc(date: string, time: string): string {
	return new Date(`${date}T${time}:00+02:00`).toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function escape(text: string): string {
	return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

/** Lines longer than 75 octets continue on the next line, indented by a space (RFC 5545 §3.1). */
function fold(line: string): string {
	const bytes = new TextEncoder().encode(line);
	if (bytes.length <= 75) return line;
	const parts: string[] = [];
	let current = '';
	for (const char of line) {
		const limit = parts.length === 0 ? 75 : 74;
		if (new TextEncoder().encode(current + char).length > limit) {
			parts.push(current);
			current = char;
		} else {
			current += char;
		}
	}
	parts.push(current);
	return parts.join('\r\n ');
}

interface CalendarOptions {
	name: string;
	shifts: Shift[];
	/** The event title for a shift. */
	summary: (shift: Shift) => string;
	/** Remind this many minutes before each shift. */
	reminder?: number;
}

export function calendar({ name, shifts, summary, reminder }: CalendarOptions): string {
	const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Mount Moreland Monitors//Barn Swallows Roster//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escape(name)}`,
		'X-WR-TIMEZONE:Africa/Johannesburg',
		'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
		'X-PUBLISHED-TTL:PT6H'
	];

	for (const shift of shifts) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:shift-${shift.date}@${DOMAIN}`,
			`DTSTAMP:${stamp}`,
			`DTSTART:${utc(shift.date, shift.start)}`,
			`DTEND:${utc(shift.date, shift.end)}`,
			`SUMMARY:${escape(summary(shift))}`,
			`LOCATION:${escape(LOCATION)}`,
			`URL:https://${DOMAIN}/roster/`
		);
		if (reminder) {
			lines.push(
				'BEGIN:VALARM',
				'ACTION:DISPLAY',
				'DESCRIPTION:Barn Swallows site duty',
				`TRIGGER:-PT${reminder}M`,
				'END:VALARM'
			);
		}
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}

/** Who is on a shift, as shown publicly. */
export function onDuty(shift: Shift): string {
	return shift.members.length
		? shift.members.map((m) => formatMemberName(m.name)).join(' & ')
		: 'Needs volunteer';
}

export function icsResponse(body: string): Response {
	return new Response(body, {
		headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
	});
}
