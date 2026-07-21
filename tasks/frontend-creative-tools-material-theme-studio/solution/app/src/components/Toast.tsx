import { useEffect, useRef, useState } from 'react';

export interface ToastState {
  msg: string;
  leaving: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timers = useRef<{ hide?: ReturnType<typeof setTimeout>; remove?: ReturnType<typeof setTimeout> }>({});

  const show = (msg: string) => {
    clearTimeout(timers.current.hide);
    clearTimeout(timers.current.remove);
    setToast({ msg, leaving: false });
    timers.current.hide = setTimeout(() => setToast(current => (current ? { ...current, leaving: true } : null)), 2250);
    timers.current.remove = setTimeout(() => setToast(null), 2600);
  };

  useEffect(
    () => () => {
      clearTimeout(timers.current.hide);
      clearTimeout(timers.current.remove);
    },
    []
  );

  return { toast, show };
}

export function ToastView({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-[1400] rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-xl transition-opacity duration-300 ${
        toast.leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ animation: 'toast-in 0.25s ease both' }}
    >
      {toast.msg}
    </div>
  );
}
