export function focusTrap(node: HTMLElement, { returnFocus }: { returnFocus?: HTMLElement | null } = {}) {
  const focusableSelector =
    'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';
  let focusTarget = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);

  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => {
      if (el.closest('[inert]')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }

  function focusInitial(): void {
    const autofocus = node.querySelector<HTMLElement>('[data-autofocus]');
    if (autofocus && !autofocus.hasAttribute('disabled')) {
      autofocus.focus();
      return;
    }
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
      return;
    }
    if (!node.hasAttribute('tabindex')) node.tabIndex = -1;
    node.focus();
  }

  function redirectFocus(preferLast = false): void {
    const focusable = getFocusable();
    if (focusable.length > 0) {
      (preferLast ? focusable[focusable.length - 1] : focusable[0]).focus();
      return;
    }
    node.focus();
  }

  function keydownHandler(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      event.stopPropagation();
      node.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!node.contains(active)) {
      event.preventDefault();
      event.stopPropagation();
      redirectFocus(event.shiftKey);
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      event.stopPropagation();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      event.stopPropagation();
      first.focus();
    }
  }

  function focusInHandler(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof Node) || node.contains(target)) return;
    if (target instanceof Element) {
      const foreignTrap = target.closest('[data-focus-trap-root]');
      if (foreignTrap && foreignTrap !== node) return;
    }
    if (document.documentElement.hasAttribute('data-export-open') || document.documentElement.hasAttribute('data-import-open')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    redirectFocus();
  }

  document.addEventListener('keydown', keydownHandler, true);
  document.addEventListener('focusin', focusInHandler, true);
  requestAnimationFrame(focusInitial);

  return {
    update({ returnFocus: nextReturnFocus }: { returnFocus?: HTMLElement | null } = {}) {
      if (nextReturnFocus) focusTarget = nextReturnFocus;
    },
    destroy() {
      document.removeEventListener('keydown', keydownHandler, true);
      document.removeEventListener('focusin', focusInHandler, true);
      const target = focusTarget;
      requestAnimationFrame(() => {
        if (target?.isConnected && !target.hasAttribute('disabled') && target.getAttribute('aria-hidden') !== 'true') {
          const style = window.getComputedStyle(target);
          if (style.display !== 'none' && style.visibility !== 'hidden' && !target.hidden) {
            target.focus();
            return;
          }
        }
        const fallback = document.querySelector<HTMLElement>('[data-rerun-opener="true"], #test-detail, #triage-queue');
        fallback?.focus?.();
      });
    },
  };
}
