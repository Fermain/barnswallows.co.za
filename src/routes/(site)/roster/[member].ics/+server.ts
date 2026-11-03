import { error } from '@sveltejs/kit';
import { members, shifts } from '#lib/site';
import { calendar, icsResponse } from '#lib/ics';

export const prerender = true;
export const trailingSlash = 'never';

export function entries() {
	return members.map((m) => ({ member: m.slug }));
}

/** One member's own shifts, with a reminder two hours before each. */
export function GET({ params }) {
	const member = members.find((m) => m.slug === params.member);
	if (!member) error(404);

	return icsResponse(
		calendar({
			name: `Barn Swallows: ${member.name}`,
			shifts: shifts.filter((s) => s.members.some((m) => m.slug === member.slug)),
			summary: () => 'Barn Swallows site duty',
			reminder: 120
		})
	);
}
