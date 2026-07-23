import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Element that should regain focus when the dialog closes (defaults to the opener). */
  restoreFocus?: HTMLElement | null;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: portals to <body>, traps Tab focus while open, closes
 * on Escape / overlay click, and returns focus to the invoking control on close
 * (so the Import button regains focus, not <body>).
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  restoreFocus,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current =
      restoreFocus ?? ((document.activeElement as HTMLElement | null) || null);
    const node = dialogRef.current;
    if (!node) return;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
        return el.offsetParent !== null || el === document.activeElement;
      });

    const first = focusables()[0] ?? node;
    const focusTimer = window.setTimeout(() => {
      first.focus({ preventScroll: true });
    }, 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && (active === firstEl || active === node)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !items.includes(active))) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.clearTimeout(focusTimer);
      const restore = restoreRef.current;
      window.setTimeout(() => {
        if (restore && typeof restore.focus === "function" && document.contains(restore)) {
          restore.focus({ preventScroll: true });
        }
      }, 0);
    };
  }, [open, restoreFocus]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-[#1B2430]/40 backdrop-blur-[2px]"
        data-slot="modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="relative z-10 w-full max-w-sm rounded-[8px] bg-[#FFFFFF] p-5 text-[#1B2430] shadow-[0_20px_50px_rgba(27,36,48,0.25)] outline-none"
        data-slot="modal-dialog"
      >
        <h2 id={titleId} className="text-lg font-bold text-[#1B2430]">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-sm text-[#64748B]">
            {description}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
