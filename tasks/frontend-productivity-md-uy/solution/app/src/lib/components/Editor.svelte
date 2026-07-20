<script lang="ts">
	import { codemirror } from '../editor/codemirror-action.svelte';
	import * as Y from 'yjs';

	let { ytext, isVisible } = $props<{ ytext: Y.Text | null; isVisible: boolean }>();

	let isEmpty = $state(true);

	$effect(() => {
		if (!ytext) {
			isEmpty = true;
			return;
		}
		isEmpty = ytext.length === 0;
		const observer = () => {
			isEmpty = ytext.length === 0;
		};
		ytext.observe(observer);
		return () => {
			if (ytext) ytext.unobserve(observer);
		}
	});
</script>

<div class="relative h-full w-full overflow-hidden" class:hidden={!isVisible}>
	{#if isEmpty && isVisible}
		<span class="text-foreground/40 absolute top-6.5 left-4 z-10 font-mono text-sm sm:left-11">
			Start typing to add content...
		</span>
	{/if}
	{#if ytext}
		<div use:codemirror={{ ytext, isVisible }} class="h-full focus:outline-none"></div>
	{/if}
</div>
