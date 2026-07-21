import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Stack of mounted overlays so Escape / focus-trap only apply to the topmost one.
const overlayStack: string[] = [];

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the dialog (aria-label fallback when no labelledBy). */
  label?: string;
  labelledBy?: string;
  /** Modal backdrop blocks outside interaction; pass false for a docked, click-through panel. */
  backdrop?: boolean;
  widthClass?: string;
  /** Paper background color (defaults to white MUI-style paper). */
  paperClass?: string;
  zClass?: string;
}

export default function Overlay({
  open,
  onClose,
  children,
  label,
  labelledBy,
  backdrop = true,
  widthClass = 'w-full max-w-md',
  paperClass = 'bg-white text-gray-900',
  zClass = 'z-[1300]',
}: OverlayProps) {
  const id = useId();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Keep the most recent focus target outside a dialog. React may mount the
  // portal before the opening effect runs, so reading activeElement only at
  // that point can accidentally remember an element inside the new overlay.
  useEffect(() => {
    if (open) return;
    const remember = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('[role="dialog"]')) restoreRef.current = target;
    };
    document.addEventListener('focusin', remember);
    return () => document.removeEventListener('focusin', remember);
  }, [open]);

  useEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      if (active && !active.closest('[role="dialog"]')) restoreRef.current = active;
      // Reopening before the close animation's unmount timer fires cancels the
      // timer that would have removed the earlier entry — drop any stale entry
      // first so the stack holds exactly one id per mounted overlay (and the
      // reopened overlay reclaims the topmost slot).
      const stale = overlayStack.indexOf(id);
      if (stale >= 0) overlayStack.splice(stale, 1);
      overlayStack.push(id);
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = setTimeout(() => {
      setMounted(false);
      const index = overlayStack.indexOf(id);
      if (index >= 0) overlayStack.splice(index, 1);
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    }, 270);
    return () => clearTimeout(timer);
  }, [open, id]);

  useEffect(() => () => {
    const index = overlayStack.indexOf(id);
    if (index >= 0) overlayStack.splice(index, 1);
  }, [id]);

  // Escape to close + Tab focus trap, only for the topmost overlay.
  useEffect(() => {
    if (!mounted) return;
    const handler = (event: KeyboardEvent) => {
      if (overlayStack[overlayStack.length - 1] !== id) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        element => element.offsetParent !== null || element === document.activeElement
      );
      if (!focusables.length) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active ? panel.contains(active) : false;
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [mounted, id]);

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const preferred =
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>('input, select, textarea, button');
      preferred?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zClass} ${backdrop ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {backdrop && (
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-[250ms] ease-out ${
            shown ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto px-4 pt-[10vh] pb-8 pointer-events-none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={labelledBy ? undefined : label}
          aria-labelledby={labelledBy}
          className={`pointer-events-auto rounded-lg shadow-2xl transition-[opacity,transform] duration-[250ms] ease-out will-change-transform ${
            shown ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
          } ${widthClass} ${paperClass}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
