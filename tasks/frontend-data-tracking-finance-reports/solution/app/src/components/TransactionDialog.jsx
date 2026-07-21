import { dialog, closeDialog, commitTransaction } from '../state.js';
import { useFocusTrap } from '../hooks.jsx';
import { TransactionForm } from './TransactionForm.jsx';
import { Icon } from './Icon.jsx';

export function TransactionDialog() {
  const d = dialog.value;
  const trapRef = useFocusTrap(d.open, {
    onEscape: closeDialog,
    initialFocus: (node) => node && node.querySelector('input, select, textarea, button'),
  });
  if (!d.open) return null;
  const isEdit = d.mode === 'edit';
  const handleSubmit = (record) => {
    commitTransaction(record, isEdit ? d.initial.id : null);
    closeDialog();
  };
  return (
    <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        class="absolute inset-0 bg-[#082727]/40 anim-fade-in"
        onClick={closeDialog}
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-txn-dialog-title"
        tabindex="-1"
        class="anim-scale-in relative my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <header class="flex items-center justify-between border-b border-[#eef4f1] bg-[#f2faf7] px-5 py-3.5">
          <h2 id="ld-txn-dialog-title" class="flex items-center gap-2 font-display text-lg font-semibold text-[#0f3d3e]">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-[#0f3d3e] text-[#8af0d3]">
              <Icon name={isEdit ? 'lucide:pencil' : 'lucide:plus'} decorative size={15} />
            </span>
            {isEdit ? 'Edit transaction' : 'New transaction'}
          </h2>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-[#4a6460] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e]"
            onClick={closeDialog}
            aria-label="Close"
          >
            <Icon name="lucide:x" decorative size={18} />
          </button>
        </header>
        <div class="px-5 py-4">
          <TransactionForm mode={d.mode} initial={d.initial} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
