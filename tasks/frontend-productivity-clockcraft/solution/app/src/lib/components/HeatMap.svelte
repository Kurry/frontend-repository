<script lang="ts">
	import { entriesStore, type TimeEntry } from '../stores/entries';

	let entries = $state<TimeEntry[]>([]);
	entriesStore.subscribe((nextEntries) => { entries = nextEntries; });

	type DayCell = {
		key: string;
		label: string;
		minutes: number;
	};

	const cells = $derived(() => {
		const totals = new Map<string, number>();
		for (const entry of entries) {
			const date = new Date(entry.startTime);
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
			totals.set(key, (totals.get(key) ?? 0) + entry.duration);
		}

		const today = new Date();
		const result: DayCell[] = [];
		for (let offset = 83; offset >= 0; offset -= 1) {
			const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
			result.push({
				key,
				label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
				minutes: totals.get(key) ?? 0
			});
		}
		return result;
	});

	const maxMinutes = $derived(() => Math.max(1, ...cells().map((cell) => cell.minutes)));

	function cellColor(minutes: number): string {
		if (minutes === 0) return 'var(--color-bg)';
		const alpha = 0.2 + (minutes / maxMinutes()) * 0.8;
		return `rgba(22, 163, 74, ${alpha.toFixed(2)})`;
	}
</script>

<section id="heat-map" class="bg-white radius-card border border-[var(--color-border)] p-5 mb-6" aria-labelledby="heat-map-heading">
	<h2 id="heat-map-heading" class="text-base font-semibold mb-1">Streak heat-map</h2>
	<p class="text-xs text-[var(--color-text-muted)] mb-4">Tracked minutes over the last 12 weeks</p>
	<div
		class="grid grid-rows-7 grid-flow-col auto-cols-fr gap-1 overflow-x-auto pb-1"
		aria-label="Last 12 weeks of tracked minutes"
	>
		{#each cells() as cell (cell.key)}
			<div
				class="min-w-3 aspect-square rounded-sm border border-[var(--color-border)] transition-all duration-300 hover:ring-2 hover:ring-[var(--color-text-primary)] hover:ring-offset-1"
				style="background-color: {cellColor(cell.minutes)}"
				title="{cell.label}: {cell.minutes} minutes"
				aria-label="{cell.label}: {cell.minutes} minutes"
			></div>
		{/each}
	</div>
	<div class="flex justify-end items-center gap-1.5 mt-3 text-xs text-[var(--color-text-muted)]" aria-hidden="true">
		<span>Less</span>
		{#each [0, 15, 45, 90] as minutes}
			<span class="w-3 h-3 rounded-sm border border-[var(--color-border)]" style="background-color: {cellColor(minutes)}"></span>
		{/each}
		<span>More</span>
	</div>
</section>
