import { watch, nextTick, onBeforeUnmount } from 'vue';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog behavior for overlay surfaces: focus moves in on open, Tab stays
 * trapped while open, Escape closes, focus returns to the invoking control,
 * and page scroll is locked for the whole time the dialog is open.
 */
export function useDialog(open, rootRef, { onClose } = {}) {
  let lastFocused = null;
  let keydownActive = false;

  const resolveRoot = () => {
    const value = rootRef?.value;
    return value?.$el ?? value ?? null;
  };

  function onKeydown(event) {
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

  watch(
    open,
    async (isOpen) => {
      if (isOpen) {
        lastFocused = document.activeElement;
        await nextTick();
        if (!keydownActive) {
          document.addEventListener('keydown', onKeydown, true);
          keydownActive = true;
        }
        document.body.style.overflow = 'hidden';
        const root = resolveRoot();
        const target =
          root?.querySelector('[data-autofocus]') || root?.querySelector(FOCUSABLE);
        target?.focus();
      } else {
        if (keydownActive) {
          document.removeEventListener('keydown', onKeydown, true);
          keydownActive = false;
        }
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function' && document.contains(lastFocused)) {
          lastFocused.focus();
        }
        lastFocused = null;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (keydownActive) document.removeEventListener('keydown', onKeydown, true);
    document.body.style.overflow = '';
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
