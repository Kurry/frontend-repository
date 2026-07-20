import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../store';

export function Icon({ name, className = '', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={style} aria-hidden="true">
      {name}
    </span>
  );
}

// Accessible modal: role dialog, aria-modal, focus trap, Escape to close,
// returns focus to the control that opened it. Animated enter/exit.
export function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  width = 560,
  variant = 'center'
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: React.ReactNode;
  width?: number;
  variant?: 'center' | 'drawer';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      const t = setTimeout(() => {
        const first = ref.current?.querySelector<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        (first ?? ref.current)?.focus();
      }, 40);
      return () => clearTimeout(t);
    } else if (opener.current instanceof HTMLElement) {
      opener.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!nodes || nodes.length === 0) return;
        const list = Array.from(nodes);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const panelInit = variant === 'drawer' ? { opacity: 0, x: 64 } : { opacity: 0, scale: 0.94, y: 14 };
  const panelAnim = variant === 'drawer' ? { opacity: 1, x: 0 } : { opacity: 1, scale: 1, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex bg-black/60"
          style={{ alignItems: variant === 'drawer' ? 'stretch' : 'center', justifyContent: variant === 'drawer' ? 'flex-end' : 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            className="bg-shell-1 border border-shell-border shadow-2xl overflow-auto scrollbar-thin"
            style={{
              width: variant === 'drawer' ? Math.max(width, 360) : width,
              maxWidth: '96vw',
              maxHeight: variant === 'drawer' ? '100vh' : '92vh',
              borderRadius: variant === 'drawer' ? 0 : 14,
              margin: variant === 'center' ? 'auto' : 0
            }}
            initial={panelInit}
            animate={panelAnim}
            exit={panelInit}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-hidden="false">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            role="status"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22 }}
            className="bg-shell-3 text-shell-text text-sm px-4 py-2.5 rounded-lg border border-shell-border shadow-lg"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Two polite live regions: one for confirmations, one assertive for validation.
export function LiveRegions() {
  const liveMessage = useStore((s) => s.liveMessage);
  const copyMessage = useStore((s) => s.copyMessage);
  return (
    <>
      <div className="sr-only" aria-live="assertive" role="status" data-testid="aria-live-assertive">
        {liveMessage}
      </div>
      <div className="sr-only" aria-live="polite" role="status" data-testid="aria-live-polite">
        {copyMessage}
      </div>
    </>
  );
}

// SVG colour-blindness filter matrices, referenced by the preview stage.
export function ColorBlindFilters() {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="cb-protanopia">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0" />
        </filter>
        <filter id="cb-deuteranopia">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0" />
        </filter>
        <filter id="cb-tritanopia">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0" />
        </filter>
      </defs>
    </svg>
  );
}
