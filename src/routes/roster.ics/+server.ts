import { shifts } from '#lib/site';
import { calendar, icsResponse, onDuty } from '#lib/ics';

export const prerender = true;
export const trailingSlash = 'never';

/** The whole season, with who is on duty each day. */
export function GET() {
	return icsResponse(
		calendar({
			name: 'Barn Swallows Duty Roster',
			shifts,
			summary: (shift) => `Barn Swallows duty: ${onDuty(shift)}`
		})
	);
}
