<script lang="ts">
	import { entriesStore, type Category } from '../stores/entries';
	import { tagsStore } from '../stores/tags';
	import { toastStore } from '../stores/toast';
	import { streakStore } from '../stores/streak';
	import { historyStore } from '../stores/history';
	import { uiStore } from '../stores/ui';

	let name = $state('');
	let category = $state<Category | ''>('');
	let tag = $state('');
	let startTime = $state('');
	let durationMinutes = $state('');
	let error = $state('');
	let errorField = $state('');

	let tags: string[] = $state([]);
	tagsStore.subscribe((t) => { tags = t; });

	function handleSubmit() {
		error = '';
		errorField = '';

		if (!name.trim()) {
			error = 'Enter an activity name';
			errorField = 'name';
			return;
		}
		if (!category) {
			error = 'Select a category';
			errorField = 'category';
			return;
		}
		if (!startTime) {
			error = 'Choose a start time';
			errorField = 'start';
			return;
		}
		const dur = parseInt(durationMinutes, 10);
		if (isNaN(dur) || dur < 1) {
			error = 'Duration must be at least 1 minute';
			errorField = 'duration';
			return;
		}
		if (dur > 1440) {
			error = 'Enter a duration of 1 to 1,440 minutes';
			errorField = 'duration';
			return;
		}

		const startMs = new Date(startTime).getTime();
		if (isNaN(startMs)) {
			error = 'Invalid start time';
			errorField = 'start';
			return;
		}

		entriesStore.addEntry({
			name: name.trim(),
			category,
			tag,
			startTime: startMs,
			duration: dur
		});

		historyStore.pushSnapshot(getEntries(), `Manual: ${name.trim()}`);
		streakStore.updateStreak();
		toastStore.addToast(`Added: ${name.trim()} (${dur} min)`);

		// Reset form
		name = '';
		tag = '';
		startTime = '';
		durationMinutes = '';
		uiStore.closeManualForm();
	}

	function getEntries() {
		let entries: import('../stores/entries').TimeEntry[] = [];
		entriesStore.entries.subscribe((e) => { entries = e; })();
		return entries;
	}
</script>

<div class="bg-white radius-card border border-[var(--color-border)] p-5">
	<h2 class="text-base font-semibold mb-4">Add entry manually</h2>

	<form class="flex flex-col gap-3" onsubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
		<div>
		<label for="manual-name" class="block text-sm font-medium mb-1">Activity name</label>
		<input
			id="manual-name"
			type="text"
			bind:value={name}
			placeholder="Activity name"
			class="w-full radius-card border border-[var(--color-control-border)] px-3 py-2.5 text-sm bg-white
				focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
		/>
		{#if errorField === 'name'}<p class="text-sm text-[var(--color-draining)] mt-1" role="alert">{error}</p>{/if}
		</div>

		<div class="flex flex-wrap gap-2">
			<div class="flex flex-col gap-1 flex-1 min-w-[120px]">
			<label for="manual-category" class="text-sm font-medium">Category</label>
			<select
				id="manual-category"
				bind:value={category}
				class="radius-btn border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white
					focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
			>
				<option value="">Select a category</option>
				<option value="meaningful">Meaningful</option>
				<option value="neutral">Neutral</option>
				<option value="draining">Draining</option>
			</select>
			{#if errorField === 'category'}<p class="text-sm text-[var(--color-draining)]" role="alert">{error}</p>{/if}
			</div>

			{#if tags.length > 0}
				<div class="flex flex-col gap-1 flex-1 min-w-[120px]">
				<label for="manual-tag" class="text-sm font-medium">Tag (optional)</label>
				<select
					id="manual-tag"
					bind:value={tag}
					class="radius-btn border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white
						focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
				>
					<option value="">No tag</option>
					{#each tags as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
				</div>
			{/if}
		</div>

		<div>
		<label for="manual-start" class="block text-sm font-medium mb-1">Start time</label>
		<input
			id="manual-start"
			type="datetime-local"
			bind:value={startTime}
			class="w-full radius-card border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white
				focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
		/>
		{#if errorField === 'start'}<p class="text-sm text-[var(--color-draining)] mt-1" role="alert">{error}</p>{/if}
		</div>

		<div>
		<label for="manual-duration" class="block text-sm font-medium mb-1">Duration in minutes</label>
		<input
			id="manual-duration"
			type="number"
			bind:value={durationMinutes}
			placeholder="Duration (minutes)"
			min="1"
			max="1440"
			class="w-full radius-card border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white mono
				focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
		/>
		{#if errorField === 'duration'}<p class="text-sm text-[var(--color-draining)] mt-1" role="alert">{error}</p>{/if}
		</div>

		{#if error && !errorField}
			<p class="text-sm text-[var(--color-draining)]" role="alert">{error}</p>
		{/if}

		<div class="flex gap-2">
			<button
				type="submit"
				class="radius-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90 flex-1"
			>
				Save entry
			</button>
			<button
				type="button"
				onclick={() => uiStore.closeManualForm()}
				class="radius-btn px-4 py-2.5 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]"
			>
				Cancel
			</button>
		</div>
	</form>
</div>
