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

	const filteredEntries = $derived(() => {
		// Filter by category
		const filtered = filter === 'all' ? entries : entries.filter((e) => e.category === filter);

		// Filter by search
		const searchLower = search.toLowerCase().trim();
		const searched = searchLower ? filtered.filter((e) =>
			e.name.toLowerCase().includes(searchLower) || (e.tag && e.tag.toLowerCase().includes(searchLower))
		) : filtered;

		// Sort a copy so derived rendering cannot mutate the store's reactive array.
		return [...searched].sort((a, b) => b.startTime - a.startTime);
	});

	function formatDate(ms: number): string {
		const d = new Date(ms);
		return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTime(ms: number): string {
		const d = new Date(ms);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	const hasAnyEntries = $derived(entries.length > 0);
	const searchOrFilterActive = $derived(() => search || filter !== 'all');
</script>

<div class="bg-white radius-card border border-[var(--color-border)] p-5">
	<h2 class="text-base font-semibold mb-4">All entries</h2>

	{#if !hasAnyEntries}
		<div class="text-center py-10" in:slide={{ duration: 250 }}>
			<p class="text-sm text-[var(--color-text-muted)]">No entries yet. Start tracking your time!</p>
		</div>
	{:else if filteredEntries().length === 0}
		<div class="text-center py-8" in:slide={{ duration: 250 }}>
			<p class="text-sm text-[var(--color-text-muted)]">No results match your search or filter.</p>
		</div>
	{:else}
		<ul class="space-y-2 max-h-[400px] overflow-y-auto" aria-label="All time entries">
			{#each filteredEntries() as entry (entry.id)}
				<li class="flex items-center gap-3 p-3 radius-card border border-[var(--color-border)] hover:bg-slate-50 hover:shadow-md group transition-all"
					animate:flip={{ duration: 250 }}
					in:slide={{ duration: 250 }}
					out:slide={{ duration: 250 }}>
					<!-- Color indicator -->
					<div class="w-1.5 h-10 rounded-full flex-shrink-0
						{entry.category === 'meaningful' ? 'bg-[var(--color-meaningful)]' : entry.category === 'draining' ? 'bg-[var(--color-draining)]' : 'bg-[var(--color-neutral)]'}"
					></div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="text-sm font-medium truncate">{entry.name}</span>
							<CategoryChip category={entry.category} />
							{#if entry.tag}
								<span class="text-xs text-[var(--color-text-primary)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-sm">{entry.tag}</span>
							{/if}
							{#if entry.interruptionReason}
								<span class="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
									<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
									{entry.interruptionReason}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-1.5 mt-0.5">
							<span class="text-xs text-[var(--color-text-muted)]">{formatDate(entry.startTime)} {formatTime(entry.startTime)}</span>
							<span class="text-xs text-[var(--color-text-muted)]">•</span>
							<span class="text-xs text-[var(--color-text-primary)] mono font-medium">{entry.duration} min</span>
						</div>
					</div>

					<div class="flex items-center gap-1.5 flex-shrink-0">
						<button
							type="button"
							onclick={() => uiStore.openEditDialog(entry.id)}
							class="radius-btn px-2 py-1 text-xs font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
							aria-label="Edit {entry.name}"
						>
							Edit
						</button>
						<button
							type="button"
							onclick={() => uiStore.openDeleteConfirm(entry.id)}
							class="radius-btn px-2 py-1 text-xs font-medium border border-[var(--color-draining)] text-[var(--color-draining)] hover:bg-rose-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
							aria-label="Delete {entry.name}"
						>
							Delete
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
