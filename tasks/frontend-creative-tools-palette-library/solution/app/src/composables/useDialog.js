import { watch, nextTick, onBeforeUnmount } from 'vue';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stacking state shared by every dialog instance: scroll lock stays applied
// while ANY dialog is open, and Escape/Tab handling belongs to the topmost
// dialog only — otherwise closing one of two stacked overlays (e.g. the cart
// drawer opened from Detail's "Add to Cart") would release the page scroll
// while the other overlay is still open, and a single Escape would dismiss
// every overlay at once.
let openCount = 0;
const topmostStack = [];

/**
 * Dialog behavior for overlay surfaces: focus moves in on open, Tab stays
 * trapped while open, Escape closes, focus returns to the invoking control,
 * and page scroll is locked for the whole time the dialog is open.
 */
export function useDialog(open, rootRef, { onClose } = {}) {
  let lastFocused = null;
  let keydownActive = false;
  let holdingSlot = false;
  const stackToken = {};

  const resolveRoot = () => {
    const value = rootRef?.value;
    return value?.$el ?? value ?? null;
  };

  function onKeydown(event) {
    // Only the topmost dialog reacts; lower stacked dialogs stay inert.
    if (topmostStack[topmostStack.length - 1] !== stackToken) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose?.();
      return;
    }
    if (event.key !== 'Tab') return;
    const root = resolveRoot();
    if (!root) return;
    const items = [...root.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.getClientRects().length > 0,
    );
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !root.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  function acquireSlot() {
    if (holdingSlot) return;
    holdingSlot = true;
    openCount += 1;
    topmostStack.push(stackToken);
    document.body.style.overflow = 'hidden';
  }

  function releaseSlot() {
    if (!holdingSlot) return;
    holdingSlot = false;
    const at = topmostStack.indexOf(stackToken);
    if (at !== -1) topmostStack.splice(at, 1);
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.style.overflow = '';
  }

  watch(
    open,
    async (isOpen) => {
      if (isOpen) {
        lastFocused = document.activeElement;
        acquireSlot();
        if (!keydownActive) {
          document.addEventListener('keydown', onKeydown, true);
          keydownActive = true;
        }
        await nextTick();
        const root = resolveRoot();
        const target =
          root?.querySelector('[data-autofocus]') || root?.querySelector(FOCUSABLE);
        target?.focus();
      } else {
        releaseSlot();
        if (keydownActive) {
          document.removeEventListener('keydown', onKeydown, true);
          keydownActive = false;
        }
        if (lastFocused && typeof lastFocused.focus === 'function' && document.contains(lastFocused)) {
          lastFocused.focus();
        }
        lastFocused = null;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    releaseSlot();
    if (keydownActive) document.removeEventListener('keydown', onKeydown, true);
  });
}

/** Clipboard write with a hidden-textarea fallback; never throws. */
export async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the fallback
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Download a text artifact in the browser. */
export function downloadText(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Reduced-motion-aware smooth scroll for in-page destinations. */
export function scrollToId(id) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    el.scrollIntoView({ behavior, block: 'start' });
  });
}
