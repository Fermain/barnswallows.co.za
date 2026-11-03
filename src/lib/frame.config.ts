import { collection, defineConfig, fields, setting } from '@fermain/frame';

export default defineConfig({
	media: { path: 'static', publicPath: '/' },

	collections: {
		shifts: collection({
			label: 'Shifts',
			icon: () => import('@lucide/svelte/icons/calendar'),
			path: 'src/content/shifts',
			title: 'date',
			sort: { field: 'date', direction: 'asc' },
			fields: {
				date: fields.date({ label: 'Shift Date' }),
				member: fields.relation({
					label: 'Assigned Member',
					to: 'members',
					required: false
				}),
				note: fields.text({ label: 'Notes / Details', required: false })
			},
			components: {
				view: () => import('./components/ShiftPreview.svelte')
			}
		}),

		members: collection({
			label: 'Members',
			icon: () => import('@lucide/svelte/icons/users'),
			path: 'src/content/members',
			title: 'name',
			sort: { field: 'name', direction: 'asc' },
			fields: {
				name: fields.text({ label: 'Full Name', description: 'e.g. John Doe' }),
				email: fields.text({ label: 'Email Address' }),
				phone: fields.text({ label: 'Cell / WhatsApp Number', required: false })
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
				hours: fields.list({
					label: 'Opening Hours',
					itemLabel: 'Day',
					item: fields.object({
						label: 'Hours',
						fields: {
							day: fields.text({ label: 'Day of Week' }),
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
		})
	}
});
