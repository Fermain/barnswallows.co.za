<script lang="ts">
	import { season as defaultSeason, type SeasonSettings } from '#lib/site';

	let { entry = defaultSeason }: { entry?: SeasonSettings } = $props();
</script>

<div class="clipboard">
	<img class="no-int" src="/clipboard.png" alt="Clipboard" />
	<div class="clipboard-content">
		{#if entry.status === 'open'}
			<h2>Opening Hours</h2>
			<table class="opening-hours">
				<thead>
					<tr>
						<th>Day</th>
						<th>Open</th>
						<th>Closed</th>
					</tr>
				</thead>
				<tbody>
					{#each entry.hours as hour}
						<tr>
							<td>{hour.day}</td>
							<td>{hour.open}</td>
							<td>{hour.close}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<br />

			<h2>Entry Fee</h2>
			<table class="entry-fee">
				<thead>
					<tr>
						<th>Type</th>
						<th>Price</th>
					</tr>
				</thead>
				<tbody>
					{#each entry.admissions as admission}
						<tr>
							<td>{admission.type}</td>
							<td>{admission.price}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="contact">
				<a href="mailto:{entry.contact.email}">{entry.contact.email}</a>
				<a href="tel:{entry.contact.phone}">{entry.contact.phone}</a>
			</div>
		{:else}
			<h2>Closed!</h2>
			<p class="handlee-regular">
				{entry.closedMessage}
			</p>
			<div class="contact">
				<a href="mailto:{entry.contact.email}">{entry.contact.email}</a>
				<a href="tel:{entry.contact.phone}">{entry.contact.phone}</a>
			</div>
		{/if}
	</div>
</div>
