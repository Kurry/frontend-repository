<script lang="ts">
	import { marked } from 'marked';
	import * as Y from 'yjs';
	import { fade } from 'svelte/transition';

	let { ytext, isVisible } = $props<{ ytext: Y.Text | null; isVisible: boolean }>();

	let currentSlide = $state(0);
	let slides = $state<string[]>([]);
	let slideKey = $state(0);
	let touchStartX = 0;

	const parseSlides = () => {
		if (!ytext) {
			slides = [];
			return;
		}
		const content = ytext.toString() as string;
		const rawSlides = content.split(/^\s*---\s*$/m);
		const nextSlides = rawSlides.map(
			(s) => marked.parse(s.trim(), { gfm: true, breaks: true }) as string
		);
		if (nextSlides.length === 0) nextSlides.push('');
		const nextIndex = currentSlide >= nextSlides.length ? Math.max(0, nextSlides.length - 1) : currentSlide;
		slides = nextSlides;
		if (nextIndex !== currentSlide) currentSlide = nextIndex;
	};

	const prevSlide = () => {
		if (currentSlide > 0) {
			currentSlide--;
			slideKey++;
		}
	};
	const nextSlide = () => {
		if (currentSlide < slides.length - 1) {
			currentSlide++;
			slideKey++;
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (!isVisible) return;
		if (event.key === 'ArrowRight' || event.key === 'PageDown') {
			event.preventDefault();
			event.stopPropagation();
			nextSlide();
		} else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
			event.preventDefault();
			event.stopPropagation();
			prevSlide();
		}
	};

	$effect(() => {
		if (!ytext) return;
		parseSlides();
		const observer = () => parseSlides();
		ytext.observe(observer);
		return () => {
			ytext?.unobserve(observer);
		};
	});

	$effect(() => {
		if (!isVisible) return;
		// Capture-phase so arrows never leak to mode chrome / CodeMirror.
		window.addEventListener('keydown', handleKeydown, true);
		const active = document.activeElement;
		if (active instanceof HTMLElement && active.closest?.('.cm-editor')) {
			active.blur();
		}
		return () => {
			window.removeEventListener('keydown', handleKeydown, true);
		};
	});

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0]?.clientX ?? 0;
	}
	function onTouchEnd(e: TouchEvent) {
		if (!isVisible) return;
		const x = e.changedTouches[0]?.clientX ?? 0;
		const dx = x - touchStartX;
		if (Math.abs(dx) < 48) return;
		if (dx < 0) nextSlide();
		else prevSlide();
	}
</script>

<div
	class="bg-card relative flex h-full w-full flex-col overflow-hidden rounded"
	class:hidden={!isVisible}
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="region"
	aria-label="Presentation slides"
>
	{#if !isVisible}
		<!-- keep mounted but inert -->
	{:else if slides.length === 0}
		<div class="text-foreground/40 absolute top-5.5 left-4 z-10 sm:left-11">
			No content to present yet. Add content with --- separators to create slides.
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center overflow-hidden">
			{#key slideKey}
				<div
					class="prose dark:prose-invert slide-pane mx-auto flex h-full w-full max-w-4xl items-center justify-center overflow-auto p-8"
					in:fade={{ duration: 180 }}
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
			{/key}
		</div>
		<div class="bg-card flex items-center justify-between border-t p-3 sm:p-4">
			<div class="text-foreground/70 text-sm sm:text-base">
				Slide {currentSlide + 1} of {slides.length}
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					class="chrome-btn border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-11 min-w-11 rounded border px-3 text-sm font-medium disabled:opacity-50"
					onclick={prevSlide}
					disabled={currentSlide === 0}>Previous</button
				>
				<button
					type="button"
					class="chrome-btn border-input bg-background hover:bg-accent hover:text-accent-foreground min-h-11 min-w-11 rounded border px-3 text-sm font-medium disabled:opacity-50"
					onclick={nextSlide}
					disabled={currentSlide >= Math.max(0, slides.length - 1)}>Next</button
				>
			</div>
		</div>
	{/if}
</div>
