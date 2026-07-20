<script lang="ts">
	import { timerStore } from '../stores/timer';
	import { entriesStore } from '../stores/entries';
	import { toastStore } from '../stores/toast';
	import { streakStore } from '../stores/streak';
	import { historyStore } from '../stores/history';
	import { tagsStore, type Category } from '../stores';
	import { uiStore } from '../stores/ui';
	import { get } from 'svelte/store';

	let timer = $state({ running: false, name: '', category: 'neutral' as Category, tag: '', startTime: null as number | null, elapsed: 0 });

	timerStore.subscribe((t) => { timer = t; });

	let activityName = $state('');
	let category = $state<Category | ''>('');
	let tag = $state('');
	let error = $state('');

	let tags: string[] = $state([]);
	tagsStore.subscribe((t) => { tags = t; });

	const elapsedFormatted = $derived(() => {
		const s = timer.elapsed;
		const hrs = Math.floor(s / 3600);
		const mins = Math.floor((s % 3600) / 60);
		const secs = s % 60;
		if (hrs > 0) return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	});

	function doStopAndSave(): import('../stores/entries').TimeEntry | null {
		const stopped = timerStore.stopTimer();
		if (stopped) {
			const entry = entriesStore.addEntry(stopped);
			const currentEntries = get(entriesStore.entries);
			historyStore.pushSnapshot(currentEntries, `Timer: ${stopped.name}`);
			streakStore.updateStreak();
			return entry;
		}
		return null;
	}

	function handleStart() {
		error = '';
		if (!activityName.trim()) {
			error = 'Enter an activity name to start the timer';
			return;
		}
		if (!category) {
			error = 'Select a category to start the timer';
			return;
		}

		// If timer already running, stop and save current first
		if (timer.running) {
			if (timer.elapsed < 25 * 60) {
				timerStore.pauseTimer();
				uiStore.openInterruptionDialog({ name: activityName.trim(), category, tag });
				return;
			}
			const saved = doStopAndSave();
			if (!saved) {
				error = 'Running timer could not be saved';
				return;
			}
			toastStore.addToast(`Saved "${saved.name}" — switched to new timer`);
		}

		timerStore.startTimer(activityName.trim(), category, tag);
		toastStore.addToast(`Timer started: ${activityName.trim()}`);
		activityName = '';
		category = '';
		tag = '';
	}

	function handleStop() {
		if (timer.elapsed < 25 * 60) {
			timerStore.pauseTimer();
			uiStore.openInterruptionDialog();
			return;
		}
		const saved = doStopAndSave();
		if (saved) {
			toastStore.addToast(`Saved: ${saved.name} (${saved.duration} min)`);
			activityName = '';
			tag = '';
			category = '';
		}
	}
</script>

<div class="bg-white radius-card border border-[var(--color-border)] p-5">
	<h2 class="text-base font-semibold mb-4">Live timer</h2>

	<form class="flex flex-col gap-3" onsubmit={(event) => { event.preventDefault(); handleStart(); }}>
		<div>
			<label for="timer-name" class="block text-sm font-medium mb-1">Activity name</label>
			<input
				id="timer-name"
				type="text"
				bind:value={activityName}
				placeholder="What are you doing?"
				class="w-full radius-card border border-[var(--color-control-border)] px-3 py-2.5 text-sm bg-white
					focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
			/>
		</div>
		<div class="flex flex-wrap gap-2 items-end">
			<div class="flex flex-col gap-1 flex-1 min-w-[120px]">
				<label for="timer-category" class="text-sm font-medium">Category</label>
				<select
					id="timer-category"
					bind:value={category}
					class="radius-btn border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white
						focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
				>
					<option value="">Select a category</option>
					<option value="meaningful">Meaningful</option>
					<option value="neutral">Neutral</option>
					<option value="draining">Draining</option>
				</select>
			</div>
				{#if tags.length > 0}
				<div class="flex flex-col gap-1 flex-1 min-w-[120px]">
					<label for="timer-tag" class="text-sm font-medium">Tag (optional)</label>
					<select
						id="timer-tag"
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
		{#if error}
			<p class="text-sm text-[var(--color-draining)]" role="alert">{error}</p>
		{/if}
		<button
			type="submit"
			class="radius-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90"
			aria-label={timer.running ? 'Start new timer' : 'Start timer'}
		>
			{timer.running ? 'Start new timer' : 'Start timer'}
		</button>
		{#if timer.running}
			<div class="border-t border-[var(--color-border)] pt-3">
		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<div>
					<span class="text-sm text-[var(--color-text-muted)]">{timer.name}</span>
					<div class="flex items-center gap-2 mt-1">
						<span class="mono text-3xl font-bold text-[var(--color-text-primary)]" aria-live="polite" aria-label="Timer elapsed">
							{elapsedFormatted()}
						</span>
					</div>
				</div>
				<div class="text-[var(--color-draining)] text-xs font-medium animate-pulse" aria-label="Recording">● Recording</div>
			</div>
			<button
				type="button"
				onclick={handleStop}
				class="radius-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-draining)] text-white hover:opacity-90"
				aria-label="Stop timer"
			>
				Stop timer
			</button>
		</div>
			</div>
		{/if}
	</form>
</div>
