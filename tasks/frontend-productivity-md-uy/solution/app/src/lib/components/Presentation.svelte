<script lang="ts">
	import { marked } from 'marked';
	import * as Y from 'yjs';
	import { onMount, onDestroy } from 'svelte';

	let { ytext, isVisible } = $props<{ ytext: Y.Text | null; isVisible: boolean }>();

	let currentSlide = $state(0);
	let slides = $state<string[]>([]);

	const parseSlides = () => {
		if (!ytext) {
			slides = [];
			return;
		}
		const content = ytext.toString() as string;
		const rawSlides = content.split(/^\s*---\s*$/m);
		slides = rawSlides.map(
			(s) => marked.parse(s.trim(), { gfm: true, breaks: true }) as string
		);
		if (currentSlide >= slides.length) currentSlide = Math.max(0, slides.length - 1);
	};

	const prevSlide = () => {
		if (currentSlide > 0) currentSlide--;
	};
	const nextSlide = () => {
		if (currentSlide < slides.length - 1) currentSlide++;
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (!isVisible) return;
		if (event.key === 'ArrowRight' || event.key === 'PageDown') {
			nextSlide();
			event.preventDefault();
		} else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
			prevSlide();
			event.preventDefault();
		}
	};

	$effect(() => {
		if (!ytext) return;
		parseSlides();
		window.addEventListener('keydown', handleKeydown);
		const observer = () => parseSlides();
		ytext.observe(observer);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			if (ytext) ytext.unobserve(observer);
		};
	});

</script>

<div
	class="bg-card relative flex h-full w-full flex-col overflow-hidden rounded"
	class:hidden={!isVisible}
>
	{#if slides.length === 0 && isVisible}
		<div class="text-foreground/40 absolute top-5.5 left-4 z-10 sm:left-11">
			No content to present yet. Add content with --- separators to create slides.
		</div>
	{:else if isVisible}
		<div class="flex flex-1 items-center justify-center overflow-hidden">
			<div
				class="prose dark:prose-invert mx-auto flex h-full w-full max-w-4xl items-center justify-center overflow-auto p-8"
			>
				{#if slides[currentSlide]}
					<div class="flex h-full w-full flex-col items-center justify-center">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html slides[currentSlide]}
					</div>
				{:else}
					<div class="text-foreground/40">Empty slide</div>
				{/if}
			</div>
		</div>
		<div class="bg-card flex items-center justify-between border-t p-4">
			<div class="text-foreground/70 text-sm">Slide {currentSlide + 1} of {slides.length}</div>
			<div class="flex gap-2">
				<button
					class="border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 rounded border px-2 text-xs font-medium transition-colors disabled:opacity-50"
					onclick={prevSlide}
					disabled={currentSlide === 0}>Previous</button
				>
				<button
					class="border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 rounded border px-2 text-xs font-medium transition-colors disabled:opacity-50"
					onclick={nextSlide}
					disabled={currentSlide >= Math.max(0, slides.length - 1)}>Next</button
				>
			</div>
		</div>
	{/if}
</div>
