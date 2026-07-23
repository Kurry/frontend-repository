export function focusTrap(node: HTMLElement) {
  let previousFocus: HTMLElement | null = null;
  if (typeof document !== 'undefined') {
    previousFocus = document.activeElement as HTMLElement | null;
  }
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
      if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') return false;
      if (element.tabIndex < 0) return false;
      const style = window.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      return element.getClientRects().length > 0;
    });
  }

  function focusFirst() {
    const focusables = getFocusable();
    (focusables[0] ?? node).focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const focusables = getFocusable();
    if (focusables.length === 0) {
      event.preventDefault();
      node.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || !node.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (active === last || !node.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleFocusIn(event: FocusEvent) {
    const target = event.target as Node | null;
    if (target && node.contains(target)) return;
    event.stopPropagation();
    event.preventDefault();
    focusFirst();
  }

  if (!node.hasAttribute('tabindex')) node.tabIndex = -1;
  node.addEventListener('keydown', handleKeydown);
  document.addEventListener('focusin', handleFocusIn, true);

  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('focusin', handleFocusIn, true);
      if (previousFocus) {
        previousFocus.focus();
      }
    }
  };
}
