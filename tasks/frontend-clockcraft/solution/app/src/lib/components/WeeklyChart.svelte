<script lang="ts">
	import { entriesStore, type Category } from '../stores/entries';

	let entries: import('../stores/entries').TimeEntry[] = $state([]);
	entriesStore.subscribe((e) => { entries = e; });

	interface DayData {
		date: Date;
		label: string;
		meaningful: number;
		neutral: number;
		draining: number;
		total: number;
	}

	const weekData = $derived(() => {
		const now = new Date();
		const days: DayData[] = [];

		for (let i = 6; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
			const endDay = startDay + 86400000;

			let meaningful = 0, neutral = 0, draining = 0;

			for (const e of entries) {
				if (e.startTime >= startDay && e.startTime < endDay) {
					if (e.category === 'meaningful') meaningful += e.duration;
					else if (e.category === 'neutral') neutral += e.duration;
					else draining += e.duration;
				}
			}

			const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			const isToday = i === 0;

			days.push({
				date: d,
				label: isToday ? 'Today' : dayNames[d.getDay()],
				meaningful,
				neutral,
				draining,
				total: meaningful + neutral + draining
			});
		}

		return days;
	});

	const maxDayTotal = $derived(() => {
		const data = weekData();
		const max = Math.max(...data.map((d) => d.total), 1);
		return Math.max(max, 1);
	});

	const barHeight = 160; // px for max

	function segmentHeight(minutes: number): number {
		const maximum = maxDayTotal();
		if (maximum === 0) return 0;
		return (minutes / maximum) * barHeight;
	}
</script>

<div class="bg-white radius-card border border-[var(--color-border)] p-5">
	<h2 class="text-base font-semibold mb-4">Weekly overview</h2>

	<div class="flex items-end justify-between gap-1 sm:gap-2 px-2" style="height: {barHeight + 24}px">
		{#each weekData() as day}
			<div class="flex-1 flex flex-col items-center h-full justify-end" aria-label="{day.label}: {day.total} minutes">
				<!-- Stacked segments (bottom-up) -->
				<div class="w-full flex flex-col items-center justify-end flex-1 min-h-0">
					{#if day.total > 0}
						<!-- Top: draining -->
						{#if day.draining > 0}
							<div
								class="w-full bg-[var(--color-draining)] transition-all duration-300"
								style="height: {segmentHeight(day.draining)}px; border-radius: 4px 4px 0 0; min-height: 2px;"
								title="Draining: {day.draining}m"
							></div>
						{/if}
						<!-- Middle: neutral -->
						{#if day.neutral > 0}
							<div
								class="w-full bg-[var(--color-neutral)] transition-all duration-300"
								style="height: {segmentHeight(day.neutral)}px; min-height: 2px;"
								title="Neutral: {day.neutral}m"
							></div>
						{/if}
						<!-- Bottom: meaningful -->
						{#if day.meaningful > 0}
							<div
								class="w-full bg-[var(--color-meaningful)] transition-all duration-300"
								style="height: {segmentHeight(day.meaningful)}px; border-radius: 0 0 4px 4px; min-height: 2px;"
								title="Meaningful: {day.meaningful}m"
							></div>
						{/if}
					{:else}
						<div class="w-full h-px bg-[var(--color-border)]"></div>
					{/if}
				</div>
				<span class="text-xs text-[var(--color-text-muted)] mt-1.5 text-center w-full font-medium">{day.label}</span>
			</div>
		{/each}
	</div>

	<!-- Legend -->
	<div class="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[var(--color-border)]">
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded-sm bg-[var(--color-meaningful)]"></span>
			<span class="text-xs text-[var(--color-text-muted)]">Meaningful</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded-sm bg-[var(--color-neutral)]"></span>
			<span class="text-xs text-[var(--color-text-muted)]">Neutral</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded-sm bg-[var(--color-draining)]"></span>
			<span class="text-xs text-[var(--color-text-muted)]">Draining</span>
		</div>
	</div>
</div>
