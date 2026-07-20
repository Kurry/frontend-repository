<script lang="ts">
	import { focusTrap } from "../utils/focusTrap";
	import { entriesStore } from '../stores/entries';
	import { toastStore } from '../stores/toast';
	import { streakStore } from '../stores/streak';
	import { historyStore } from '../stores/history';
	import { uiStore } from '../stores/ui';
	import { get } from 'svelte/store';
	import { onDestroy } from 'svelte';

	let entryName = $state('');
	let deleteId: string | null = $state(null);

	const unsubscribe = uiStore.ui.subscribe((u) => {
		deleteId = u.deleteEntryId;
		const entry = deleteId ? get(entriesStore.entries).find((candidate) => candidate.id === deleteId) : null;
		entryName = entry?.name ?? '';
	});
	onDestroy(unsubscribe);

	function confirmDelete() {
		if (!deleteId) return;
		entriesStore.deleteEntry(deleteId);

		let allEntries: import('../stores/entries').TimeEntry[] = [];
		entriesStore.entries.subscribe((e) => { allEntries = e; })();
		historyStore.pushSnapshot(allEntries, `Deleted: ${entryName}`);
		streakStore.updateStreak();
		uiStore.closeDeleteConfirm();
		toastStore.addToast(`Deleted: ${entryName}`);
	}
</script>

{#if deleteId}
<div class="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" role="presentation" onclick={() => uiStore.closeDeleteConfirm()}>
	<div
		class="bg-white radius-card p-6 w-full max-w-sm shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="alertdialog"
		use:focusTrap
		aria-label="Confirm delete"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') uiStore.closeDeleteConfirm(); }}
	>
		<h2 class="text-lg font-semibold mb-2">Delete entry?</h2>
		<p class="text-sm text-[var(--color-text-muted)] mb-6">
			Are you sure you want to delete "{entryName}"? This cannot be undone.
		</p>
		<div class="flex gap-2">
			<button
				onclick={confirmDelete}
				class="radius-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-draining)] text-white hover:opacity-90 flex-1"
			>
				Delete
			</button>
			<button
				onclick={() => uiStore.closeDeleteConfirm()}
				class="radius-btn px-4 py-2.5 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)] flex-1"
			>
				Cancel
			</button>
		</div>
	</div>
</div>
{/if}
