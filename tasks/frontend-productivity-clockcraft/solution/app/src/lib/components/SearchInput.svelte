<script lang="ts">
	import { uiStore, searchStore } from '../stores/ui';

	let search = $state('');

	searchStore.subscribe((s) => { search = s; });

	function onInput(e: Event) {
		const target = e.target as HTMLInputElement;
		uiStore.setSearch(target.value);
	}
</script>

<div>
	<label for="entry-search" class="block text-sm font-medium mb-1">Search entries</label>
	<div class="relative">
	<input
		id="entry-search"
		type="text"
		value={search}
		oninput={onInput}
		placeholder="Search activities or tags..."
		class="w-full radius-card border border-[var(--color-control-border)] px-4 py-2.5 text-sm bg-white
			focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)] focus:ring-offset-1"
		aria-label="Search entries"
	/>
	{#if search}
		<button
			onclick={() => uiStore.setSearch('')}
			class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
			aria-label="Clear search"
		>✕</button>
	{/if}
	</div>
</div>
