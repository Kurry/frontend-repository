export function focusTrap(node: HTMLElement, { returnFocus }: { returnFocus?: HTMLElement | null } = {}) {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let focusTarget = returnFocus;

  function keydownHandler(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    const focusable = Array.from(node.querySelectorAll<HTMLElement>(focusableElements)).filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null
    );

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  node.addEventListener('keydown', keydownHandler);
  
  // Set initial focus
  const focusable = Array.from(node.querySelectorAll<HTMLElement>(focusableElements)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null
  );
  const initialFocus = node.querySelector<HTMLElement>('[data-autofocus]');
  if (initialFocus && !initialFocus.hasAttribute('disabled')) {
    initialFocus.focus();
  } else if (focusable.length > 0) {
    focusable[0].focus();
  } else {
    node.focus();
  }

  return {
    update({ returnFocus: nextReturnFocus }: { returnFocus?: HTMLElement | null } = {}) {
      focusTarget = nextReturnFocus;
    },
    destroy() {
      node.removeEventListener('keydown', keydownHandler);
      const target = focusTarget;
      setTimeout(() => {
        if (target?.isConnected && !target.hidden && !target.hasAttribute('disabled')) {
          target.focus();
          return;
        }
        const fallback = target?.closest<HTMLElement>('section');
        if (fallback?.isConnected) fallback.focus();
      }, 0);
    }
  };
}
