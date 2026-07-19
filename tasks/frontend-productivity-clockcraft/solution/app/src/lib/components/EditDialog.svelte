<script lang="ts">
	import { entriesStore, type Category } from '../stores/entries';
	import { tagsStore } from '../stores/tags';
	import { toastStore } from '../stores/toast';
	import { streakStore } from '../stores/streak';
	import { historyStore } from '../stores/history';
	import { uiStore } from '../stores/ui';
	import { get } from 'svelte/store';
	import { onDestroy } from 'svelte';

	let editName = $state('');
	let editCategory = $state<Category>('neutral');
	let editTag = $state('');
	let editDuration = $state('');
	let error = $state('');

	let entry: import('../stores/entries').TimeEntry | null = $state(null);
	let tags: string[] = $state([]);
	let editId: string | null = $state(null);
	let loadedId: string | null = null;

	const unsubscribeUi = uiStore.ui.subscribe((u) => {
		editId = u.editEntryId;
		if (editId && editId !== loadedId) {
			const found = get(entriesStore.entries).find((candidate) => candidate.id === editId);
			entry = found ? { ...found } : null;
			if (found) {
				editName = found.name;
				editCategory = found.category;
				editTag = found.tag;
				editDuration = String(found.duration);
				loadedId = editId;
			}
		} else if (!editId) {
			loadedId = null;
			entry = null;
		}
	});
	const unsubscribeTags = tagsStore.subscribe((t) => { tags = t; });
	onDestroy(() => {
		unsubscribeUi();
		unsubscribeTags();
	});

	function handleSubmit() {
		error = '';
		if (!editId || !entry) return;

		if (!editName.trim()) {
			error = 'Activity name is required';
			return;
		}
		const dur = parseInt(editDuration, 10);
		if (isNaN(dur) || dur < 1 || dur > 1440) {
			error = 'Duration must be between 1 and 1440 minutes';
			return;
		}

		entriesStore.updateEntry(editId, {
			name: editName.trim(),
			category: editCategory,
			tag: editTag,
			duration: dur
		});

		let allEntries: import('../stores/entries').TimeEntry[] = [];
		entriesStore.entries.subscribe((e) => { allEntries = e; })();
		historyStore.pushSnapshot(allEntries, `Edited: ${editName.trim()}`);
		streakStore.updateStreak();
		toastStore.addToast(`Updated: ${editName.trim()}`);
		uiStore.closeEditDialog();
	}
</script>

{#if entry}
<div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" role="presentation" onclick={() => uiStore.closeEditDialog()}>
	<div
		class="bg-white radius-card p-6 w-full max-w-md shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="Edit entry"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') uiStore.closeEditDialog(); }}
	>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold">Edit entry</h2>
			<button onclick={() => uiStore.closeEditDialog()} class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg" aria-label="Close">✕</button>
		</div>

		<form class="flex flex-col gap-3" onsubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
			<label for="edit-name" class="text-sm font-medium">Activity name</label>
			<input
				id="edit-name"
				type="text"
				bind:value={editName}
				placeholder="Activity name"
				class="radius-card border border-[var(--color-control-border)] px-3 py-2.5 text-sm bg-white
					focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
				aria-label="Activity name"
			/>

			<div class="flex flex-wrap gap-2">
				<div class="flex flex-col gap-1 flex-1 min-w-[120px]">
					<label for="edit-category" class="text-sm font-medium">Category</label>
					<select
						id="edit-category"
						bind:value={editCategory}
						class="radius-btn border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white"
					>
						<option value="meaningful">Meaningful</option>
						<option value="neutral">Neutral</option>
						<option value="draining">Draining</option>
					</select>
				</div>

				{#if tags.length > 0}
					<div class="flex flex-col gap-1 flex-1 min-w-[120px]">
						<label for="edit-tag" class="text-sm font-medium">Tag</label>
						<select id="edit-tag" bind:value={editTag} class="radius-btn border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white">
							<option value="">No tag</option>
							{#each tags as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<label for="edit-duration" class="text-sm font-medium">Duration in minutes</label>
			<input
				id="edit-duration"
				type="number"
				bind:value={editDuration}
				min="1"
				max="1440"
				class="radius-card border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white mono
					focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
				aria-label="Duration (minutes)"
			/>

			{#if error}
				<p class="text-sm text-[var(--color-draining)]" role="alert">{error}</p>
			{/if}

			<div class="flex gap-2">
				<button
					type="submit"
					class="radius-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90 flex-1"
				>
					Save changes
				</button>
				<button
					type="button"
					onclick={() => uiStore.closeEditDialog()}
					class="radius-btn px-4 py-2.5 text-sm font-medium border border-[var(--color-control-border)] hover:bg-[var(--color-bg)]"
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
