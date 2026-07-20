<script lang="ts">
	import { entriesStore, type Category, type TimeEntry } from '../stores/entries';
	import { filterStore, searchStore, uiStore } from '../stores/ui';
	import CategoryChip from './CategoryChip.svelte';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	let entries: TimeEntry[] = $state([]);
	let filter = $state<'all' | Category>('all');
	let search = $state('');

	entriesStore.subscribe((e) => { entries = e; });
	filterStore.subscribe((f) => { filter = f; });
	searchStore.subscribe((s) => { search = s; });

	const todayEntries = $derived(() => {
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		const endOfDay = startOfDay + 86400000;

		const today = entries.filter((e) => e.startTime >= startOfDay && e.startTime < endOfDay);

		// Filter by category
		const filtered = filter === 'all' ? today : today.filter((e) => e.category === filter);

		// Filter by search
		const searchLower = search.toLowerCase();
		const searched = search ? filtered.filter((e) =>
			e.name.toLowerCase().includes(searchLower) || (e.tag && e.tag.toLowerCase().includes(searchLower))
		) : filtered;

		// Sort a copy so Svelte's reactive store value is never mutated in-place.
		return [...searched].sort((a, b) => b.startTime - a.startTime);
	});

	function formatTime(ms: number): string {
		const d = new Date(ms);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	const hasAnyToday = $derived(() => {
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		const endOfDay = startOfDay + 86400000;
		return entries.some((e) => e.startTime >= startOfDay && e.startTime < endOfDay);
	});

	const searchOrFilterActive = $derived(() => {
		return search || filter !== 'all';
	});
</script>

<div class="bg-white radius-card border border-[var(--color-border)] p-5">
	<h2 class="text-base font-semibold mb-4">Today's timeline</h2>

	{#if todayEntries().length === 0 && !hasAnyToday()}
		<div class="text-center py-10" in:slide={{ duration: 250 }}>
			<div class="text-3xl mb-2">⏱️</div>
			<p class="text-sm text-[var(--color-text-muted)]">
				No activities logged yet today.
			</p>
			<p class="text-xs text-[var(--color-text-muted)] mt-1">
				Start a timer or add a manual entry to begin tracking your day!
			</p>
		</div>
	{:else if todayEntries().length === 0 && hasAnyToday()}
		<div class="text-center py-8" in:slide={{ duration: 250 }}>
			<p class="text-sm text-[var(--color-text-muted)]">No results match your search or filter.</p>
		</div>
	{:else}
		<ul class="relative pl-4 border-l-2 border-[var(--color-border)]" aria-label="Today's entries">
			{#each todayEntries() as entry (entry.id)}
				{@const blockHeight = Math.min(360, Math.max(56, entry.duration * 2))}
				<li
					class="entry-block relative mb-3 ml-4 flex items-stretch gap-3 group cursor-pointer"
					style="height: {blockHeight}px"
					animate:flip={{ duration: 250 }}
					in:slide={{ duration: 250 }}
					out:slide={{ duration: 250 }}
				>
					<div class="absolute -left-[23px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125
						{entry.category === 'meaningful' ? 'bg-[var(--color-meaningful)]' : entry.category === 'draining' ? 'bg-[var(--color-draining)]' : 'bg-[var(--color-neutral)]'}"
					></div>
					<button
						type="button"
						onclick={() => uiStore.openEditDialog(entry.id)}
						class="flex-1 text-left radius-card p-3 border border-[var(--color-border)] group-hover:shadow-md transition-shadow relative overflow-hidden
							{entry.category === 'meaningful' ? 'bg-green-50 border-green-200' : entry.category === 'draining' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}"
						aria-label="Edit entry: {entry.name}, {entry.duration} minutes"
					>
						<!-- Color accent bar -->
						<div class="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5
							{entry.category === 'meaningful' ? 'bg-[var(--color-meaningful)]' : entry.category === 'draining' ? 'bg-[var(--color-draining)]' : 'bg-[var(--color-neutral)]'}"
						></div>
						<div class="pl-3">
							<div class="flex items-center justify-between gap-2">
								<span class="text-sm font-medium truncate flex-1 group-hover:text-[var(--color-text-primary)] transition-colors">{entry.name}</span>
								<CategoryChip category={entry.category} />
							</div>
							<div class="flex items-center gap-2 mt-1 flex-wrap">
								<span class="text-xs text-[var(--color-text-muted)] mono">{formatTime(entry.startTime)}</span>
								<span class="text-xs text-[var(--color-text-muted)]">•</span>
								<span class="text-xs text-[var(--color-text-muted)] mono">{entry.duration} min</span>
								{#if entry.tag}
									<span class="text-xs text-[var(--color-text-muted)]">•</span>
									<span class="text-xs text-[var(--color-text-primary)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-sm">{entry.tag}</span>
								{/if}
								{#if entry.interruptionReason}
									<span class="text-xs text-[var(--color-text-muted)]">•</span>
									<span class="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
										<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
										{entry.interruptionReason}
									</span>
								{/if}
							</div>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
