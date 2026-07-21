<script lang="ts">
	import { markedAction } from '../editor/marked-action.svelte';
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

<div
	class="bg-card relative h-full w-full overflow-hidden rounded"
	class:hidden={!isVisible}
	inert={!isVisible ? true : undefined}
	aria-hidden={!isVisible}
>
	{#if isEmpty && isVisible}
		<div class="text-foreground/40 absolute top-5.5 left-4 z-10 sm:left-11">
			No content to preview yet
		</div>
	{/if}
	{#if ytext}
		<div
			use:markedAction={{ ytext }}
			class="prose dark:prose-invert h-full min-w-full overflow-auto px-8 py-6 break-words"
		></div>
	{/if}
</div>
