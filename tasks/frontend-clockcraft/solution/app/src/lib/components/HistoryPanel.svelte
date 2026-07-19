<script lang="ts">
	import { historyStore, entriesStore } from '../stores';
	import { uiStore } from '../stores/ui';
	import { toastStore } from '../stores/toast';
	import { streakStore } from '../stores/streak';

	let history = $state({ snapshots: [] as {entries: import('../stores/entries').TimeEntry[]; timestamp: number; label: string}[], currentIndex: -1, branches: [] as {entries: import('../stores/entries').TimeEntry[]; timestamp: number; label: string}[] });

	historyStore.subscribe((h) => { history = JSON.parse(JSON.stringify(h)); });

	const canUndo = $derived(history.currentIndex > 0);
	const canRedo = $derived(history.currentIndex >= 0 && history.currentIndex < history.snapshots.length - 1);
	const currentLabel = $derived(history.currentIndex >= 0 && history.currentIndex < history.snapshots.length
		? history.snapshots[history.currentIndex].label
		: '');

	function handleUndo() {
		const result = historyStore.undo();
		if (result) {
			entriesStore.setEntries(JSON.parse(JSON.stringify(result)));
			streakStore.updateStreak();
			toastStore.addToast('Undo applied', 'info');
		}
	}

	function handleRedo() {
		const result = historyStore.redo();
		if (result) {
			entriesStore.setEntries(JSON.parse(JSON.stringify(result)));
			streakStore.updateStreak();
			toastStore.addToast('Redo applied', 'info');
		}
	}

	function goToSnapshot(index: number) {
		const result = historyStore.goToSnapshot(index);
		if (result) {
			entriesStore.setEntries(JSON.parse(JSON.stringify(result)));
			streakStore.updateStreak();
			toastStore.addToast(`Restored: ${history.snapshots[index].label}`, 'info');
		}
	}

	function handleApplyScenarioChange() {
		const currentEntries = history.currentIndex >= 0
			? history.snapshots[history.currentIndex].entries
			: [];
		if (currentEntries.length === 0) return;
		const scenarioNumber = history.snapshots.filter((snapshot) => snapshot.label.startsWith('Scenario change')).length + 1;
		const nextEntries = JSON.parse(JSON.stringify(currentEntries));
		nextEntries[0] = {
			...nextEntries[0],
			name: `${nextEntries[0].name.replace(/ · Scenario \d+$/, '')} · Scenario ${scenarioNumber}`
		};
		entriesStore.setEntries(nextEntries);
		historyStore.pushSnapshot(nextEntries, `Scenario change ${scenarioNumber}`);
		streakStore.updateStreak();
		toastStore.addToast('Scenario change applied', 'info');
	}

	function selectBranch(index: number) {
		const result = historyStore.selectBranch(index);
		if (!result) return;
		entriesStore.setEntries(result);
		streakStore.updateStreak();
		toastStore.addToast('Alternate branch restored', 'info');
	}

	function formatTimestamp(ts: number): string {
		const d = new Date(ts);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function formatCount(entries: import('../stores/entries').TimeEntry[]): string {
		return `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
	}
</script>

<div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" role="presentation" onclick={() => uiStore.closeHistoryPanel()}>
	<div
		class="bg-white radius-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="History Panel"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') uiStore.closeHistoryPanel(); }}
	>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold">History panel</h2>
			<button onclick={() => uiStore.closeHistoryPanel()} class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg" aria-label="Close">✕</button>
		</div>

		<!-- Undo/Redo controls -->
		<div class="flex gap-2 mb-4">
			<button
				onclick={handleUndo}
				disabled={!canUndo}
				class="radius-btn px-4 py-2 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed flex-1"
			>
				← Undo
			</button>
			<button
				onclick={handleRedo}
				disabled={!canRedo}
				class="radius-btn px-4 py-2 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)] disabled:opacity-40 disabled:cursor-not-allowed flex-1"
			>
				Redo →
			</button>
		</div>

		<!-- Apply Scenario Change -->
		<button
			onclick={handleApplyScenarioChange}
			disabled={history.currentIndex < 0}
			class="radius-btn w-full px-4 py-2 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
		>
			Apply scenario change
		</button>

		<!-- Current state indicator -->
		<div class="bg-[var(--color-bg)] radius-card p-3 mb-4">
			<p class="text-xs text-[var(--color-text-muted)] font-medium mb-1">History state</p>
			<p class="text-sm font-medium">{currentLabel || 'No history yet'}</p>
			{#if history.currentIndex >= 0}
				<p class="text-xs text-[var(--color-text-muted)] mt-1">
					Snapshot {history.currentIndex + 1} of {history.snapshots.length}
					— {formatCount(history.snapshots[history.currentIndex].entries)}
				</p>
			{/if}
		</div>

		<!-- Snapshots list -->
		{#if history.snapshots.length === 0}
			<p class="text-sm text-[var(--color-text-muted)] text-center py-6">
				No history snapshots yet. Changes will appear here.
			</p>
		{:else}
			<div class="space-y-1">
				{#each history.snapshots as snap, i}
					<button
						onclick={() => goToSnapshot(i)}
						class="w-full text-left px-3 py-2 radius-btn text-sm flex items-center justify-between
							{i === history.currentIndex
								? 'bg-[var(--color-bg)] border border-[var(--color-text-primary)] font-medium'
								: 'hover:bg-[var(--color-bg)] border border-transparent'}"
					>
						<div class="flex items-center gap-2 min-w-0">
							<i class="text-xs text-[var(--color-text-muted)] flex-shrink-0">#{i + 1}</i>
							<span class="truncate">{snap.label}</span>
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
							<span class="text-xs text-[var(--color-text-muted)] mono">{formatCount(snap.entries)}</span>
							<span class="text-xs text-[var(--color-text-muted)] mono">{formatTimestamp(snap.timestamp)}</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Branches -->
		{#if history.branches.length > 0}
			<div class="mt-4 pt-3 border-t border-[var(--color-border)]">
				<p class="text-xs text-[var(--color-text-muted)] font-medium mb-2">Alternate branches</p>
				<ul class="space-y-1" aria-label="Alternate history branches">
					{#each history.branches as branch, i}
						<li>
						<button
							onclick={() => selectBranch(i)}
							class="w-full text-left px-3 py-2 radius-btn text-sm flex items-center justify-between bg-amber-50 border border-amber-600 hover:bg-amber-100"
							aria-label="Restore alternate branch {branch.label}"
						>
							<div class="flex items-center gap-2 min-w-0">
								<i class="text-xs text-amber-600 flex-shrink-0">⤷</i>
								<span class="truncate">{branch.label}</span>
							</div>
							<span class="text-xs text-[var(--color-text-muted)] mono">{formatTimestamp(branch.timestamp)}</span>
						</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
