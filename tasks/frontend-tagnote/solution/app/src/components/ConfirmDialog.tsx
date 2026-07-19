import { component$, $ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface ConfirmDialogProps {
  message: string;
  open: Signal<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = component$<ConfirmDialogProps>(
  ({ message, open, onConfirm, onCancel }) => {
    if (!open.value) return null;

    const handleConfirm = $(() => {
      onConfirm();
      open.value = false;
    });

    const handleCancel = $(() => {
      onCancel();
      open.value = false;
    });

    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="w-[320px] rounded-[7px] bg-white p-6 shadow-xl">
          <p class="mb-6 text-[17px] text-[var(--color-text-primary)]">{message}</p>
          <div class="flex justify-end gap-3">
            <button
              onClick$={handleCancel}
              class="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[#D4E0F0]"
            >
              Cancel
            </button>
            <button
              onClick$={handleConfirm}
              class="rounded-full bg-red-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
);
