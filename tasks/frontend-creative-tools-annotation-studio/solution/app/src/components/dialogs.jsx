import { useEffect } from 'react';

// Shared dialog behavior layered on every ComposedModal: while the dialog is
// open, Escape anywhere on the page closes it, and on close focus returns to
// the control that opened the dialog (recorded via rememberOpener).
export function useDialogDismiss(open, onClose, openerRef) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open && openerRef?.current) {
      const opener = openerRef.current;
      window.setTimeout(() => {
        if (document.contains(opener)) opener.focus();
      }, 30);
    }
  }, [open, openerRef]);
}

export const rememberOpener = (openerRef) => (event) => {
  openerRef.current = event.currentTarget;
};
