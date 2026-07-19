<script lang="ts">
	import type { Category } from '../stores/entries';

	let { category, size = 'sm' }: { category: Category; size?: 'sm' | 'md' } = $props();

	const labels: Record<Category, string> = {
		meaningful: 'Meaningful',
		neutral: 'Neutral',
		draining: 'Draining'
	};

	const colorClass = $derived(category === 'meaningful'
		? 'bg-[var(--color-meaningful)] text-[var(--color-text-primary)]'
		: category === 'draining'
			? 'bg-[var(--color-draining)] text-white'
			: 'bg-[var(--color-neutral)] text-white');

	const sizeClass = $derived(size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs');
</script>

<span class="chip inline-block font-medium rounded-md {colorClass} {sizeClass}" data-category={category}>
	{labels[category]}
</span>
