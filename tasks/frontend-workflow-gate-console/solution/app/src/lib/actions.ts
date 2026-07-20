export function focusTrap(node: HTMLElement) {
  const focusableElements = 'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])';
  let firstFocusableElement: HTMLElement;
  let lastFocusableElement: HTMLElement;

  function updateElements() {
    const focusableContent = node.querySelectorAll<HTMLElement>(focusableElements);
    if (focusableContent.length === 0) return;
    const activeFocusables = Array.from(focusableContent).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
    if (activeFocusables.length === 0) return;
    firstFocusableElement = activeFocusables[0];
    lastFocusableElement = activeFocusables[activeFocusables.length - 1];
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    updateElements();
    if (!firstFocusableElement || !lastFocusableElement) return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  }

  node.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      node.removeEventListener('keydown', handleKeydown);
    }
  };
}
