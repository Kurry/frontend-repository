import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => {
      restoreRef.current?.focus?.();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(33, 29, 58, 0.4)' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="bg-white p-6 max-w-sm w-full shadow-2xl"
        style={{ borderRadius: '12px', borderTop: '6px solid var(--color-warning)' }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start gap-3">
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <path d="M12 3 L22 20 H2 Z" fill="var(--color-warning)" />
            <rect x="11" y="9" width="2" height="6" rx="1" fill="#211D3A" />
            <rect x="11" y="16.5" width="2" height="2" rx="1" fill="#211D3A" />
          </svg>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-semibold"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-body"
              className="mt-2"
              style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}
            >
              {body}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-warning" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
