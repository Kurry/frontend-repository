<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open,
    heading,
    onClose,
    soft = false,
    widthClass = 'max-w-lg',
    labelledBy = 'modal-heading',
    children,
  }: {
    open: boolean;
    heading: string;
    onClose: () => void;
    soft?: boolean;
    widthClass?: string;
    labelledBy?: string;
    children: Snippet;
  } = $props();

  // Only the most recently opened modal owns the focus trap / Escape; two
  // open overlays must never fight over focus.
  const MODAL_STACK: symbol[] = (globalThis as Record<string, unknown>).__panecraftModalStack ??= [];
  const myId = Symbol('modal');

  let visible = $state(false);
  let isOpen = $state(false);
  let panelEl = $state<HTMLDivElement | undefined>();
  let backdropEl = $state<HTMLDivElement | undefined>();
  let opener: HTMLElement | null = null;
  let closingTimer: ReturnType<typeof setTimeout> | null = null;

  function isTopmost(): boolean {
    return MODAL_STACK[MODAL_STACK.length - 1] === myId;
  }

  const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function prefersReducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  function focusables(): HTMLElement[] {
    if (!panelEl) return [];
    return Array.from(panelEl.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }

  // Escape is handled at document level (capture) so the topmost modal closes
  // no matter which element currently holds focus.
  function handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    if (!isOpen || !isTopmost()) return;
    event.stopPropagation();
    onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) {
      event.preventDefault();
      panelEl?.focus();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || !panelEl?.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !panelEl?.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  // Keep focus inside the dialog even when a click lands outside it (the soft
  // wizard backdrop is pointer-transparent so the page tabs stay clickable —
  // the click still lands, only focus returns to the wizard).
  function handleFocusIn(event: FocusEvent) {
    if (!isOpen || !panelEl || !isTopmost()) return;
    const target = event.target as Node | null;
    if (target && !panelEl.contains(target)) {
      const items = focusables();
      (items[0] ?? panelEl)?.focus();
    }
  }

  $effect(() => {
    if (open) {
      if (closingTimer) {
        clearTimeout(closingTimer);
        closingTimer = null;
      }
      opener = (document.activeElement as HTMLElement) ?? null;
      visible = true;
      if (!MODAL_STACK.includes(myId)) MODAL_STACK.push(myId);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          isOpen = true;
          if (isTopmost()) {
            const items = focusables();
            (items[0] ?? panelEl)?.focus();
          }
        }),
      );
      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('keydown', handleDocumentKeydown, true);
    } else if (visible) {
      isOpen = false;
      const stackIndex = MODAL_STACK.indexOf(myId);
      if (stackIndex >= 0) MODAL_STACK.splice(stackIndex, 1);
      const wait = prefersReducedMotion() ? 0 : 260;
      closingTimer = setTimeout(() => {
        visible = false;
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('keydown', handleDocumentKeydown, true);
        if (opener && document.contains(opener)) {
          opener.focus();
        } else {
          (document.querySelector<HTMLElement>('[data-default-focus]') ?? document.body).focus?.();
        }
        opener = null;
      }, wait);
    }
  });
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={backdropEl}
    class="overlay-backdrop {isOpen ? 'is-open' : ''} {soft ? 'overlay-backdrop--soft' : ''}"
    onkeydown={handleKeydown}
    onclick={soft ? undefined : onClose}
    role="presentation"
  >
    <div
      bind:this={panelEl}
      class="overlay-panel w-full {widthClass} max-h-[88vh] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabindex="-1"
      onclick={(event) => event.stopPropagation()}
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <h2 id={labelledBy} class="text-lg font-semibold text-[var(--color-text-primary)]">{heading}</h2>
        <button
          type="button"
          aria-label="Close {heading}"
          class="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-xl leading-none min-w-9 min-h-9 rounded-[var(--radius-base)] tap-target-x transition-colors"
          onclick={onClose}
        >×</button>
      </div>
      <div class="overflow-y-auto flex-1">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
