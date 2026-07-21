import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { activeToastStore, type ToastState } from '@/store/ui';
import { Ri } from './Ri';
import { clsx } from 'clsx';

/** Toasts slide in, stay readable, and auto-dismiss with a fade. */
export function Toast() {
  const activeToast = useStore(activeToastStore);
  const [shown, setShown] = useState<ToastState | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (activeToast) {
      setShown(activeToast);
      setLeaving(false);
    } else if (shown) {
      setLeaving(true);
      const t = setTimeout(() => {
        setShown(null);
        setLeaving(false);
      }, 320);
      return () => clearTimeout(t);
    }
  }, [activeToast]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;

  return (
    <div
      id="capture-toast"
      role="status"
      aria-live="polite"
      className={clsx(
        'toast-chip fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-full',
        'bg-gray-900 py-2.5 pl-3.5 pr-5 text-sm font-medium text-white shadow-2xl shadow-gray-900/20',
        leaving ? 'toast-leave' : 'toast-enter'
      )}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-yellow-400 text-gray-900">
        <Ri name="information-line" size={13} />
      </span>
      <span>{shown.message}</span>
    </div>
  );
}
