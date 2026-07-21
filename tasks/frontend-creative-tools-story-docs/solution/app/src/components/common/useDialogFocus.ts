import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog behavior shared by every overlay (drawers, palette, modals, version
 * panel): on open, focus moves in; Tab is trapped while open; Escape dismisses;
 * on close, focus returns to the invoking control.
 */
export function useDialogFocus(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement>,
  options?: { initialFocus?: RefObject<HTMLElement>; escape?: boolean }
) {
  const invokerRef = useRef<HTMLElement | null>(null);
  const escape = options?.escape ?? true;

  useEffect(() => {
    if (!open) return;
    invokerRef.current = (document.activeElement as HTMLElement) ?? null;

    const raf = requestAnimationFrame(() => {
      const initial = options?.initialFocus?.current;
      const container = containerRef.current;
      if (initial) {
        initial.focus();
        return;
      }
      const first = container?.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
      else container?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escape) {
        e.stopPropagation();
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (nodes.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus to the control that opened this dialog.
      const invoker = invokerRef.current;
      if (invoker && typeof invoker.focus === 'function' && document.contains(invoker)) {
        invoker.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
