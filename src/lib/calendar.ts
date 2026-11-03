export function generateGoogleCalendarUrl(dateStr: string): string {
	// Date is in South Africa Standard Time (UTC+2)
	const cleanDate = dateStr.replace(/-/g, '');
	const startIso = `${cleanDate}T150000Z`; // 17:00 SAST is 15:00 UTC
	const endIso = `${cleanDate}T170000Z`; // 19:00 SAST is 17:00 UTC

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: 'Barn Swallows Site Duty - Mount Moreland',
		dates: `${startIso}/${endIso}`,
		details:
			'Manning the Mount Moreland Barn Swallows viewing site for evening roost. Entry R50 adult, R20 child/resident.',
		location: 'Lake Victoria Barn Swallows Viewing Site, Mount Moreland'
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile(dateStr: string, memberName: string): void {
	const cleanDate = dateStr.replace(/-/g, '');
	const startIso = `${cleanDate}T150000Z`;
	const endIso = `${cleanDate}T170000Z`;

	const icsData = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Mount Moreland Monitors//Barn Swallows Shift//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:barn-swallows-${dateStr}@barnswallows.co.za`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
		`DTSTART:${startIso}`,
		`DTEND:${endIso}`,
		'SUMMARY:Barn Swallows Site Duty - Mount Moreland',
		`DESCRIPTION:Site duty for ${memberName}. Lake Victoria Barn Swallows Viewing Site.`,
		'LOCATION:Lake Victoria Barn Swallows Viewing Site, Mount Moreland',
		'STATUS:CONFIRMED',
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');

	const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `barn-swallows-shift-${dateStr}.ics`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
