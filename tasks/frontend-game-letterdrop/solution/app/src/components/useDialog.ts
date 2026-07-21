import { useEffect, useRef } from 'react';

// Manages a native modal <dialog>: opens with showModal when `open` turns true,
// closes when it turns false, traps focus while open (native behaviour), closes
// on Escape (the dialog's own cancel/close events), and returns focus to the
// element that opened it (the browser restores it on close). Backdrop clicks
// also close it. This is the single focus-management path both the Settings
// and Export dialogs use, matching the accessibility contract (take focus on
// open, trap while open, Escape closes, return focus to the opener).
export function useDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        /* already open or detached — ignore */
      }
    } else if (!open && dialog.open) {
      try {
        dialog.close();
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onCloseRef.current();
    const handleCancel = (e: Event) => {
      // Let the native Escape close proceed; sync the store on the close event.
      e.preventDefault();
      onCloseRef.current();
    };
    const handleBackdrop = (e: MouseEvent) => {
      // A click that lands on the dialog element itself (not a child) is the
      // dimmed backdrop region — close on it.
      if (e.target === dialog) onCloseRef.current();
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleBackdrop);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleBackdrop);
    };
  }, []);

  return dialogRef;
}
