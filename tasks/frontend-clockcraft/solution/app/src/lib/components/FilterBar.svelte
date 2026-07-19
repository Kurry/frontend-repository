<script lang="ts">
	import { uiStore, filterStore } from '../stores/ui';
	import type { Category } from '../stores/entries';

	let filter = $state<'all' | Category>('all');

	filterStore.subscribe((f) => { filter = f; });

	const filters: { key: 'all' | Category; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'meaningful', label: 'Meaningful' },
		{ key: 'neutral', label: 'Neutral' },
		{ key: 'draining', label: 'Draining' }
	];

	function setFilter(key: 'all' | Category) {
		uiStore.setFilter(filter === key && key !== 'all' ? 'all' : key);
	}

	function chipStyle(key: string) {
		if (filter !== key) return 'bg-white border border-[var(--color-control-border)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]';
		if (key === 'meaningful') return 'bg-[var(--color-meaningful)] text-[var(--color-text-primary)] border border-[var(--color-meaningful)]';
		if (key === 'draining') return 'bg-[var(--color-draining)] text-white border border-[var(--color-draining)]';
		if (key === 'neutral') return 'bg-[var(--color-neutral)] text-white border border-[var(--color-neutral)]';
		return 'bg-[var(--color-text-primary)] text-white border border-[var(--color-text-primary)]';
	}
</script>

<div class="flex flex-wrap gap-2" role="group" aria-label="Category filter">
	{#each filters as f}
		<button
			onclick={() => setFilter(f.key)}
			class="radius-btn px-3 py-1.5 text-sm font-medium transition-colors {chipStyle(f.key)}"
			aria-pressed={filter === f.key}
		>
			{f.label}
		</button>
	{/each}
</div>
