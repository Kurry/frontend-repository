<script lang="ts">
	import { entriesStore, streakStore, type Category } from '../stores';
	import { uiStore } from '../stores/ui';

	let streak = $state({ count: 0, lastDate: '' });
	streakStore.subscribe((s) => { streak = s; });

	let entries: import('../stores/entries').TimeEntry[] = $state([]);
	entriesStore.subscribe((e) => { entries = e; });

	const todayMinutes = $derived(() => {
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		const endOfDay = startOfDay + 86400000;

		let meaningful = 0;
		let neutral = 0;
		let draining = 0;

		for (const e of entries) {
			if (e.startTime >= startOfDay && e.startTime < endOfDay) {
				if (e.category === 'meaningful') meaningful += e.duration;
				else if (e.category === 'neutral') neutral += e.duration;
				else draining += e.duration;
			}
		}
		return { meaningful, neutral, draining, total: meaningful + neutral + draining };
	});

	const meaningfulRatio = $derived(() => {
		const { meaningful, draining, total } = todayMinutes();
		if (total === 0) return { pct: 50, label: '—', winning: 'none' as const };
		const mvsD = meaningful + draining;
		if (mvsD === 0) return { pct: 50, label: '—', winning: 'none' as const };
		const pct = Math.round((meaningful / mvsD) * 100);
		const winning = meaningful > draining ? 'meaningful' : draining > meaningful ? 'draining' : 'tied';
		return { pct, label: `${meaningful}m vs ${draining}m`, winning };
	});

	const ratioColor = $derived(() => {
		const r = meaningfulRatio();
		if (r.winning === 'meaningful') return 'text-[var(--color-meaningful)]';
		if (r.winning === 'draining') return 'text-[var(--color-draining)]';
		return 'text-[var(--color-text-muted)]';
	});

	const ratioBarColor = $derived(() => {
		const r = meaningfulRatio();
		if (r.winning === 'meaningful') return 'var(--color-meaningful)';
		if (r.winning === 'draining') return 'var(--color-draining)';
		return 'var(--color-neutral)';
	});
</script>

<header class="bg-white border-b border-[var(--color-border)] px-4 py-4 sm:px-6">
	<div class="max-w-5xl mx-auto">
		<div class="flex items-center justify-between mb-3">
			<h1 class="text-xl font-bold tracking-tight">
				<span class="text-[var(--color-text-primary)]">Clock</span><span class="text-[var(--color-meaningful)]">Craft</span>
			</h1>
			<div class="flex items-center gap-2">
				<button
					onclick={() => uiStore.toggleTagManager()}
					class="radius-btn px-3 py-1.5 text-xs font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]"
				>
					Manage tags
				</button>
				<button
					onclick={() => uiStore.toggleHistoryPanel()}
					class="radius-btn px-3 py-1.5 text-xs font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]"
				>
					View history
				</button>
			</div>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
			<!-- Meaningful Ratio -->
			<div class="bg-[var(--color-bg)] radius-card p-3">
				<p class="text-xs text-[var(--color-text-muted)] mb-1">Meaningful ratio</p>
				<div class="flex items-end gap-2">
					<span class="text-2xl font-bold mono {ratioColor()}">{meaningfulRatio().pct}%</span>
				</div>
				<p class="text-xs text-[var(--color-text-muted)] mt-1">{meaningfulRatio().label}</p>
				<div class="w-full h-1.5 bg-[var(--color-border)] rounded-full mt-2 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-500"
						style="width: {meaningfulRatio().pct}%; background-color: {ratioBarColor()}"
					></div>
				</div>
			</div>

			<!-- Today's Minutes -->
			<div class="bg-[var(--color-bg)] radius-card p-3">
				<p class="text-xs text-[var(--color-text-muted)] mb-1">Today's minutes</p>
				<span class="text-2xl font-bold mono">{todayMinutes().total}</span>
				<div class="flex gap-1.5 mt-2">
					{#if todayMinutes().meaningful > 0}
						<span class="text-xs px-1.5 py-0.5 bg-[var(--color-meaningful)] text-[var(--color-text-primary)] rounded-sm">{todayMinutes().meaningful}m</span>
					{/if}
					{#if todayMinutes().neutral > 0}
						<span class="text-xs px-1.5 py-0.5 bg-[var(--color-neutral)] text-white rounded-sm">{todayMinutes().neutral}m</span>
					{/if}
					{#if todayMinutes().draining > 0}
						<span class="text-xs px-1.5 py-0.5 bg-[var(--color-draining)] text-white rounded-sm">{todayMinutes().draining}m</span>
					{/if}
				</div>
			</div>

			<!-- Streak -->
			<div class="bg-[var(--color-bg)] radius-card p-3 col-span-2 sm:col-span-1">
				<p class="text-xs text-[var(--color-text-muted)] mb-1">Meaningful streak</p>
				<span class="text-2xl font-bold mono {streak.count > 0 ? 'text-[var(--color-meaningful)]' : 'text-[var(--color-text-muted)]'}">
					{streak.count}
				</span>
				<span class="text-xs text-[var(--color-text-muted)] ml-1">
					{streak.count === 1 ? 'day' : 'days'}
				</span>
				<p class="text-xs text-[var(--color-text-muted)] mt-1">
					{streak.count === 0 ? 'Start your streak today!' : streak.count >= 7 ? 'Keep it up!' : 'Meaningful > Draining'}
				</p>
			</div>
		</div>
	</div>
</header>
