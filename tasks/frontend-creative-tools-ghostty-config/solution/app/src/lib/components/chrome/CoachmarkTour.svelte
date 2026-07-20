<script lang="ts">
    // First-run coachmark tour: three steps spotlighting the generated-config panel, the
    // live dock preview, and the command palette. Purely advisory — it never blocks the
    // editor (no backdrop) and a single Skip dismisses it for good.
    import {fly, fade} from "svelte/transition";
    import {toAppWindow} from "$lib/attachments/portal";
    import Kbd from "./Kbd.svelte";
    import {endTour, nextTourStep, tour} from "$lib/stores/editor.svelte";

    const steps = [
        {
            title: "Generated config",
            body: "Every override compiles here live as key = value lines. Copy or download it straight into your Ghostty config.",
            selector: ".config-aside"
        },
        {
            title: "Live dock preview",
            body: "The dock hosts a live interactive terminal that re-themes the instant you edit colors, fonts, or the cursor.",
            selector: "#dock-live-terminal"
        },
        {
            title: "Command palette",
            body: "Press ⌘K to fuzzy-search any setting or action and jump straight to it — no scrolling required.",
            selector: ".sidebar-search"
        }
    ];

    const active = $derived(tour.active);
    const step = $derived(steps[Math.min(tour.step, steps.length - 1)]);

    // Spotlight the current step's target with a pulsing outline; the tour card itself never
    // intercepts clicks anywhere else in the app.
    $effect(() => {
        if (!active) return;
        const target = step?.selector ? document.querySelector(step.selector) : null;
        const highlighted: Element[] = [];
        if (target) {
            target.classList.add("tour-glow");
            highlighted.push(target);
        }
        return () => {
            for (const el of highlighted) el.classList.remove("tour-glow");
        };
    });
</script>

{#if active && step}
<div class="tour-card" role="complementary" aria-label="Feature tour" transition:fly={{y: 24, duration: 260}} {@attach toAppWindow}>
    <p class="tour-step-label">Step {tour.step + 1} of {steps.length}</p>
    <h3 class="tour-title">{step.title}</h3>
    <p class="tour-body">
        {step.body}
        {#if tour.step === 2}<br /><span class="tour-kbd-row"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>{/if}
    </p>
    <div class="tour-actions">
        <button type="button" class="tour-skip" onclick={endTour}>Skip tour</button>
        <span class="tour-dots" aria-hidden="true">
            {#each steps as s, i (s.title)}
                <span class="tour-dot" class:current={i === tour.step}></span>
            {/each}
        </span>
        <button type="button" class="tour-next" onclick={() => nextTourStep(steps.length)}>
            {tour.step === steps.length - 1 ? "Done" : "Next"}
        </button>
    </div>
</div>
{/if}

<style>
.tour-card {
    position: absolute;
    right: 20px;
    bottom: 110px;
    width: 290px;
    z-index: 800;
    background: rgba(from var(--bg-level-1) r g b / 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-level-1);
    border-radius: var(--radius-level-2);
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.7), 0 0 1px white inset;
    padding: 14px 16px;
}

.tour-step-label {
    margin: 0 0 4px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--font-color-muted);
}

.tour-title {
    margin: 0 0 6px;
    font-size: 1rem;
    font-weight: 700;
}

.tour-body {
    margin: 0 0 12px;
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--font-color-muted);
}

.tour-kbd-row {
    display: inline-flex;
    gap: 3px;
    vertical-align: middle;
}

.tour-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.tour-skip {
    border: none;
    background: transparent;
    color: var(--font-color-muted);
    font-size: 0.78rem;
    cursor: pointer;
    padding: 4px 2px;
    border-radius: 4px;
}

.tour-skip:hover {
    color: var(--font-color);
}

.tour-skip:focus-visible,
.tour-next:focus-visible {
    outline: var(--border-input-focus);
}

.tour-dots {
    display: inline-flex;
    gap: 5px;
    flex: 1;
    justify-content: center;
}

.tour-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    transition: background 200ms ease, transform 200ms ease;
}

.tour-dot.current {
    background: white;
    transform: scale(1.25);
}

.tour-next {
    border: none;
    background: linear-gradient(0deg, #3C6EC9, #437AE2);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: var(--radius-level-4);
    cursor: pointer;
    transition: filter 150ms ease;
}

.tour-next:hover {
    filter: brightness(1.15);
}

:global(.tour-glow) {
    outline: 2px solid rgba(122, 162, 255, 0.9)!important;
    outline-offset: 3px;
    animation: tour-pulse 1.6s ease-in-out infinite;
}

@keyframes tour-pulse {
    0%, 100% { outline-color: rgba(122, 162, 255, 0.95); }
    50% { outline-color: rgba(122, 162, 255, 0.35); }
}

@media (prefers-reduced-motion: reduce) {
    :global(.tour-glow) {
        animation: none;
    }
}
</style>
