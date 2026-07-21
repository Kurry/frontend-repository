<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    title: string;
    emoji?: string;
    accent?: string;
    maxWidth?: string;
    subtitle?: string;
    onClose: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    title,
    emoji = '',
    accent = 'var(--color-fury-orange)',
    maxWidth = 'max-w-lg',
    subtitle = '',
    onClose,
    children,
  }: Props = $props();

  let panel: HTMLDivElement;
  let triggerSel: string | null = null;

  const FOCUSABLE =
    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function selectorFor(el: HTMLElement): string | null {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const aria = el.getAttribute('aria-label');
    if (aria) return `${el.tagName.toLowerCase()}[aria-label="${aria.replace(/"/g, '\\"')}"]`;
    return null;
  }

  function focusables(): HTMLElement[] {
    if (!panel) return [];
    return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (n) => n.offsetParent !== null || n === document.activeElement,
    );
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        panel?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  onMount(() => {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    triggerSel = active ? selectorFor(active) : null;
    // Move focus into the dialog so the trap + Escape handler are live and the
    // dialog is announced. Prefer the first control, else the panel itself.
    requestAnimationFrame(() => {
      const items = focusables();
      (items[0] ?? panel)?.focus();
    });
  });

  onDestroy(() => {
    // Restore focus to the control that opened the overlay. Done synchronously
    // while the trigger still exists in the DOM (Svelte removes the overlay's
    // own nodes only after this hook), re-queried by a stable selector so a
    // DOM patch can't leave us holding a detached node.
    const sel = triggerSel;
    try {
      const el = sel ? document.querySelector(sel) : null;
      if (el instanceof HTMLElement) el.focus();
    } catch {
      /* ignore — trigger gone after a committed reset */
    }
  });
</script>

<div
  class="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
  style="background: rgba(8,8,16,0.74); backdrop-filter: blur(3px);"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
  role="presentation"
>
  <div
    bind:this={panel}
    class="overlay-panel {maxWidth} w-full max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
    style="background: var(--color-fury-dark); border: 1px solid color-mix(in srgb, {accent} 38%, transparent); box-shadow: 0 24px 60px rgba(0,0,0,0.55);"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    onkeydown={onKey}
  >
    <header
      class="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0"
      style="border-bottom: 1px solid color-mix(in srgb, {accent} 22%, transparent); background: color-mix(in srgb, {accent} 7%, var(--color-fury-dark));"
    >
      <div class="min-w-0">
        <h2 class="text-lg sm:text-xl font-black truncate" style="color: {accent};">
          {#if emoji}<span aria-hidden="true">{emoji} </span>{/if}{title}
        </h2>
        {#if subtitle}<p class="text-slate-300 text-xs mt-0.5 truncate">{subtitle}</p>{/if}
      </div>
      <button
        class="btn-interactive min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-100 flex-shrink-0"
        style="background: rgba(120,120,140,0.18);"
        onclick={onClose}
        aria-label="Close {title}"
      >
        ✕
      </button>
    </header>
    <div class="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  .overlay-backdrop {
    animation: overlay-fade 0.18s ease-out;
  }
  .overlay-panel {
    animation: overlay-enter 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes overlay-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes overlay-enter {
    from { opacity: 0; transform: translateY(14px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .overlay-backdrop,
    .overlay-panel {
      animation: none;
    }
  }
</style>
