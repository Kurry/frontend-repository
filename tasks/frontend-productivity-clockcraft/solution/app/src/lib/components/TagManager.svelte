<script lang="ts">
	import { focusTrap } from "../utils/focusTrap";
	import { tagsStore } from '../stores/tags';
	import { uiStore } from '../stores/ui';
	import { toastStore } from '../stores/toast';

	let tagName = $state('');
	let error = $state('');

	let tags: string[] = $state([]);
	tagsStore.subscribe((t) => { tags = t; });

	function handleAdd() {
		error = '';
		if (!tagName.trim()) {
			error = 'Tag name is required';
			return;
		}
		const ok = tagsStore.addTag(tagName);
		if (!ok) {
			error = 'Tag already exists';
			return;
		}
		toastStore.addToast(`Tag added: ${tagName.trim()}`);
		tagName = '';
	}

	function handleRemove(tag: string) {
		tagsStore.removeTag(tag);
		toastStore.addToast(`Tag removed: ${tag}`);
	}
</script>

<div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" role="presentation" onclick={() => uiStore.closeTagManager()}>
	<div
		class="bg-white radius-card p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl"
		onclick={(e) => e.stopPropagation()}
		role="dialog" use:focusTrap
		aria-label="Tag Manager"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') uiStore.closeTagManager(); }}
	>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold">Manage tags</h2>
			<button onclick={() => uiStore.closeTagManager()} class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg" aria-label="Close">✕</button>
		</div>

		<label for="new-tag-name" class="block text-sm font-medium mb-1">New tag name</label>
		<div class="flex gap-2 mb-4">
			<input
				id="new-tag-name"
				type="text"
				bind:value={tagName}
				placeholder="New tag name..."
				class="flex-1 radius-card border border-[var(--color-control-border)] px-3 py-2 text-sm bg-white
					focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]"
				onkeydown={(e) => { if (e.key === 'Enter') handleAdd(); }}
				aria-label="New tag name"
			/>
			<button
				onclick={handleAdd}
				class="radius-btn px-4 py-2 text-sm font-medium bg-[var(--color-text-primary)] text-white hover:opacity-90"
			>
				Add
			</button>
		</div>

		{#if error}
			<p class="text-sm text-[var(--color-draining)] mb-2">{error}</p>
		{/if}

		{#if tags.length === 0}
			<p class="text-sm text-[var(--color-text-muted)] py-4 text-center">No tags yet. Use New tag name to create your first tag.</p>
		{:else}
			<ul class="flex flex-col gap-2" aria-label="Custom tags">
				{#each tags as t}
					<li class="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] radius-btn">
						<span class="text-sm font-medium">{t}</span>
						<button
							onclick={() => handleRemove(t)}
							class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-draining)]"
							aria-label="Delete tag {t}"
						>✕</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
