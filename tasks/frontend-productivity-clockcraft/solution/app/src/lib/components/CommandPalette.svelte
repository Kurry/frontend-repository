<script lang="ts">
	import { focusTrap } from "../utils/focusTrap";
	import { onMount, onDestroy } from 'svelte';
	import { uiStore, tagsStore } from '../stores';
	import { get } from 'svelte/store';

	let isOpen = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);

	type Command = {
		id: string;
		title: string;
		action: () => void;
	};

	const baseCommands: Command[] = [
		{ id: 'focus-timer', title: 'Start timer focus', action: () => {
			isOpen = false;
			const timerInput = document.getElementById('timer-name');
			if (timerInput) timerInput.focus();
		}},
		{ id: 'add-manual', title: 'Add entry manually', action: () => { isOpen = false; uiStore.ui.update(s => ({...s, showManualForm: true})); setTimeout(() => { const el = document.getElementById('manual-name'); if (el) el.focus(); }, 50); } },
		{ id: 'view-history', title: 'View history', action: () => { isOpen = false; uiStore.toggleHistoryPanel(); } },
		{ id: 'export', title: 'Export session', action: () => { isOpen = false; uiStore.toggleExportDrawer(); } },
		{ id: 'import', title: 'Import session', action: () => { isOpen = false; uiStore.toggleExportDrawer(); } },
		{ id: 'filter-all', title: 'Filter: All', action: () => { isOpen = false; uiStore.setFilter('all'); } },
		{ id: 'filter-meaningful', title: 'Filter: Meaningful', action: () => { isOpen = false; uiStore.setFilter('meaningful'); } },
		{ id: 'filter-neutral', title: 'Filter: Neutral', action: () => { isOpen = false; uiStore.setFilter('neutral'); } },
		{ id: 'filter-draining', title: 'Filter: Draining', action: () => { isOpen = false; uiStore.setFilter('draining'); } },
	];

	let filteredCommands = $derived(() => {
		const tags = get(tagsStore.tags);
		const tagCommands = tags.map(t => ({
			id: `tag-${t}`,
			title: `Tag: ${t}`,
			action: () => {
				isOpen = false;
				uiStore.setSearch(t);
			}
		}));
		const allCommands = [...baseCommands, ...tagCommands];
		const q = query.toLowerCase();
		if (!q) return allCommands;
		return allCommands.filter(c => c.title.toLowerCase().includes(q));
	});

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			isOpen = !isOpen;
			if (isOpen) {
				query = '';
				selectedIndex = 0;
				setTimeout(() => {
					const el = document.getElementById('palette-input');
					if (el) el.focus();
				}, 50);
			}
			return;
		}

		if (!isOpen) return;

		const commands = filteredCommands();
		if (e.key === 'Escape') {
			e.preventDefault();
			isOpen = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % commands.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + commands.length) % commands.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (commands[selectedIndex]) {
				commands[selectedIndex].action();
			}
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});
	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});

	// Reset index when query changes
	$effect(() => {
		const _ = query;
		selectedIndex = 0;
	});
</script>

{#if isOpen}
<div class="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-[10vh] p-4" role="presentation" onclick={() => isOpen = false}>
	<div
		class="bg-white radius-card w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
		onclick={(e) => e.stopPropagation()}
		role="dialog" use:focusTrap
		aria-label="Command palette"
		tabindex="-1"
		onkeydown={(e) => { if (e.key === 'Escape') isOpen = false; }}
	>
		<div class="border-b border-[var(--color-border)] flex items-center px-4 py-3">
			<span class="text-[var(--color-text-muted)] mr-3">🔍</span>
			<input
				id="palette-input"
				bind:value={query}
				type="text"
				placeholder="Type a command or search..."
				class="w-full bg-transparent focus:outline-none text-sm"
				aria-label="Command palette search"
				aria-autocomplete="list"
			/>
		</div>

		<div class="max-h-[60vh] overflow-y-auto p-2" role="listbox">
			{#if filteredCommands().length === 0}
				<p class="text-sm text-[var(--color-text-muted)] p-3 text-center">No matching commands.</p>
			{:else}
				{#each filteredCommands() as cmd, i}
					<button
						type="button"
						class="w-full text-left px-3 py-2 text-sm rounded flex items-center {i === selectedIndex ? 'bg-[var(--color-bg)] font-medium text-[var(--color-text-primary)]' : 'hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]'}"
						role="option"
						aria-selected={i === selectedIndex}
						onclick={() => { cmd.action(); }}
						onmousemove={() => { selectedIndex = i; }}
					>
						{cmd.title}
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
{/if}
