<script lang="ts">
    // Shared dialog shell for the editor's overlay panels (Import, Profiles, Compare themes).
    // macOS-style translucent chrome, focus moves in on open, Tab stays trapped, Escape and
    // backdrop clicks dismiss, and focus returns to the opener on close — with enter/exit
    // transitions on both the backdrop and the card.
    import {toAppWindow} from "$lib/attachments/portal";
    import {sequoiaEase} from "$lib/utils/animations";
    import {fade, fly} from "svelte/transition";
    import type {Snippet} from "svelte";

    interface Props {
        title: string;
        onclose: () => void;
        width?: string;
        children: Snippet;
        footer?: Snippet;
    }

    const {title, onclose, width = "520px", children, footer}: Props = $props();

    let card: HTMLDivElement | undefined = $state();
    let previouslyFocused: HTMLElement | null = null;

    function handleBackdropClick(event: MouseEvent) {
        if (event.target !== event.currentTarget) return;
        onclose();
    }

    // Escape dismisses no matter where focus is (focus may sit on a confirm modal that was
    // opened from this panel, or on the body after a deleted row's button disappears).
    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key !== "Escape") return;
        // Let a higher confirm/alert modal consume Escape first.
        const topModal = document.querySelector(".alert-backdrop");
        if (topModal) return;
        event.stopPropagation();
        onclose();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.stopPropagation();
            onclose();
            return;
        }
        if (event.key !== "Tab" || !card) return;

        const focusables = Array.from(
            card.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")
        ).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || active === card)) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    $effect(() => {
        previouslyFocused = document.activeElement as HTMLElement | null;
        const target = card?.querySelector<HTMLElement>("[data-autofocus]")
            ?? card?.querySelector<HTMLElement>("input, textarea, select, button");
        target?.focus();

        return () => {
            previouslyFocused?.focus?.();
        };
    });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div
    class="panel-backdrop"
    role="presentation"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    transition:fade={{duration: 200}}
    {@attach toAppWindow}
>
    <div
        class="panel-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabindex="-1"
        bind:this={card}
        style:width={`min(${width}, calc(100vw - 48px))`}
        transition:fly={{y: -24, duration: 250, easing: sequoiaEase}}
    >
        <header class="panel-header">
            <h3>{title}</h3>
            <button type="button" class="panel-close" aria-label="Close" onclick={onclose}>&times;</button>
        </header>
        <div class="panel-body">{@render children()}</div>
        {#if footer}
            <footer class="panel-footer">{@render footer()}</footer>
        {/if}
    </div>
</div>

<style>
.panel-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(18, 18, 18, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 600;
    padding: 24px;
}

.panel-card {
    display: flex;
    flex-direction: column;
    max-height: min(80%, 640px);
    background: rgba(from var(--bg-level-1) r g b / 0.82);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: var(--radius-level-2);
    border: 1px solid var(--border-level-1);
    box-shadow:
        0 24px 60px -12px rgba(0, 0, 0, 0.75),
        0 0 1px white inset;
    overflow: hidden;
    outline: none;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px 10px;
    border-bottom: 1px solid var(--border-level-1);
}

.panel-header h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
}

.panel-close {
    border: none;
    background: rgba(255, 255, 255, 0.08);
    color: var(--font-color-muted);
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    transition: background 150ms ease, color 150ms ease;
}

.panel-close:hover {
    background: rgba(255, 255, 255, 0.16);
    color: var(--font-color);
}

.panel-close:focus-visible {
    outline: var(--border-input-focus);
}

.panel-body {
    padding: 14px 18px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 0.9rem;
}

.panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px 14px;
    border-top: 1px solid var(--border-level-1);
}

@media (max-width: 600px) {
    .panel-backdrop {
        padding: 12px;
    }
}
</style>
