import { createSignal } from "solid-js";
import Modal from "./Modal";
import { state, batchDelete, closeBatchConfirm, clearSelection } from "../store";
import { IconAlertTriangle } from "@tabler/icons-solidjs";

export default function BatchConfirm() {
  const [closing, setClosing] = createSignal(false);
  const count = () => state.selection.length;

  function close() {
    if (closing()) return;
    setClosing(true);
    setTimeout(() => {
      closeBatchConfirm();
      setTimeout(() => setClosing(false), 200);
    }, 180);
  }
  function confirm() {
    const n = batchDelete();
    clearSelection();
    if (closing()) return;
    setClosing(true);
    setTimeout(() => {
      closeBatchConfirm();
      setTimeout(() => setClosing(false), 200);
    }, 180);
    void n;
  }

  return (
    <Modal open={state.batchConfirmOpen} closing={closing()} onClose={close} label="Confirm batch delete" contentClass="bg-paper rounded-2xl shadow-2xl w-full max-w-md p-5 border border-[color:var(--line)]">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 text-[#a33b4a]">
          <IconAlertTriangle size={22} />
        </span>
        <div class="flex-1">
          <h2 class="font-display text-xl font-semibold tracking-tight">Batch delete</h2>
          <p class="mt-1 text-sm text-[color:var(--ink-soft)]">
            Delete the <span class="font-semibold text-[color:var(--ink)]">{count()}</span> selected user-managed event{count() === 1 ? "" : "s"}? Seeded read-only events are never removed. This can be undone.
          </p>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button class="chrome-btn rounded-lg border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium" onClick={close}>
          Cancel
        </button>
        <button class="chrome-btn rounded-lg bg-[#7a1f1f] text-white px-4 py-2 text-sm font-medium hover:brightness-110" onClick={confirm}>
          Batch delete {count()}
        </button>
      </div>
    </Modal>
  );
}
