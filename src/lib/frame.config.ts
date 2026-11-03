import { collection, defineConfig, fields, setting } from '@fermain/frame';
import { formSetting } from '@fermain/frame/forms';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default defineConfig({
	media: { path: 'static', publicPath: '/' },

	collections: {
		members: collection({
			label: 'Members',
			icon: () => import('@lucide/svelte/icons/users'),
			path: 'src/content/members',
			title: 'name',
			sort: { field: 'name', direction: 'asc' },
			fields: {
				name: fields.text({ label: 'Full Name', description: 'e.g. John Doe' }),
				email: fields.text({ label: 'Email Address' })
			},
			components: {
				view: () => import('./components/MemberPreview.svelte')
			}
		})
	},

	settings: {
		season: setting({
			label: 'Season & Site',
			icon: () => import('@lucide/svelte/icons/sun'),
			file: 'src/content/settings/season.json',
			fields: {
				status: fields.select({
					label: 'Season Status',
					options: ['open', 'closed'],
					default: 'open'
				}),
				openMessage: fields.text({
					label: 'Welcome / Open Announcement',
					multiline: true
				}),
				closedMessage: fields.text({
					label: 'Closed / Off-Season Message',
					multiline: true
				}),
				opens: fields.date({ label: 'Season Opens', description: 'First day of site duty.' }),
				closes: fields.date({ label: 'Season Closes', description: 'Last day of site duty.' }),
				closedDates: fields.list({
					label: 'Closed Dates',
					description: 'Days within the season with no site duty, e.g. Christmas Day.',
					itemLabel: 'Date',
					item: fields.date({ label: 'Date' })
				}),
				hours: fields.list({
					label: 'Opening Hours',
					itemLabel: 'Day',
					item: fields.object({
						label: 'Hours',
						fields: {
							day: fields.select({ label: 'Day of Week', options: WEEKDAYS }),
							open: fields.text({ label: 'Open Time' }),
							close: fields.text({ label: 'Close Time' })
						}
					})
				}),
				admissions: fields.list({
					label: 'Admission Fees',
					itemLabel: 'Ticket',
					item: fields.object({
						label: 'Fee',
						fields: {
							type: fields.text({ label: 'Type' }),
							price: fields.text({ label: 'Price' })
						}
					})
				}),
				contact: fields.object({
					label: 'Contact Information',
					fields: {
						email: fields.text({ label: 'Email' }),
						phone: fields.text({ label: 'Phone' })
					}
				}),
				mapUrl: fields.text({
					label: 'Google Maps Embed URL'
				})
			},
			components: {
				view: () => import('./components/SeasonPreview.svelte')
			}
		}),

		roster: setting({
			label: 'Duty Roster',
			icon: () => import('@lucide/svelte/icons/calendar'),
			file: 'src/content/settings/roster.json',
			fields: {
				assignments: fields.list({
					label: 'Assignments',
					description:
						'Who is on duty when. Shift dates come from the season settings; add a row per person per day.',
					itemLabel: 'Assignment',
					item: fields.object({
						label: 'Assignment',
						fields: {
							date: fields.date({ label: 'Date' }),
							member: fields.relation({ label: 'Member', to: 'members' })
						}
					})
				})
			},
			components: {
				view: () => import('./components/RosterPreview.svelte')
			}
		}),

		signup: formSetting({
			label: 'Shift Sign-up Form',
			file: 'src/content/settings/signup.json'
		})
	}
});
