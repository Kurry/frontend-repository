<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { onMount } from 'svelte';

  interface Props {
    labelId: string;
    onClose: () => void;
    children?: any;
  }
  let { labelId, onClose, children }: Props = $props();

  let panel: HTMLDivElement | undefined = $state();

  function focusables(): HTMLElement[] {
    if (!panel) return [];
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  onMount(() => {
    const lastFocused = document.activeElement as HTMLElement | null;
    // move focus into the dialog
    const first = focusables()[0] ?? panel;
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) { e.preventDefault(); panel?.focus(); return; }
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && active === lastEl) { e.preventDefault(); firstEl.focus(); }
        else if (!panel?.contains(active)) { e.preventDefault(); firstEl.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      try { lastFocused?.focus?.(); } catch { /* ignore */ }
    };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center p-5 dialog-backdrop"
  style="background-color: rgba(1, 1, 1, 0.55);"
  onmousedown={(e) => { if (e.target === e.currentTarget) onClose(); }}
>
  <div
    class="dialog-panel bg-white w-full max-w-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto" transition:scale={{ start: 0.95, duration: 180 }}
    style="border-radius: 10px;"
    role="dialog"
    aria-modal="true"
    aria-labelledby={labelId}
    tabindex="-1"
    bind:this={panel}
  >
    {@render children?.()}
  </div>
</div>
