import { Show, For, createSignal } from "solid-js";
import { state, CATEGORIES, batchCategorize, clearSelection, openBatchConfirm } from "../store";
import { IconTags, IconTrash, IconX } from "@tabler/icons-solidjs";

export default function SelectionTray() {
  const [pickCat, setPickCat] = createSignal(false);
  const count = () => state.selection.length;

  function doCategorize(cat) {
    batchCategorize(cat);
    setPickCat(false);
    clearSelection();
  }

  return (
    <Show when={count() > 0}>
      <div class="anim-fade shrink-0 border-t border-[color:var(--line)] bg-[color:var(--paper-deep)] px-3 py-2.5 flex flex-wrap items-center gap-2" role="region" aria-label="Selection tray">
        <span class="text-sm font-medium">
          <span class="font-display tabular-nums text-[color:var(--ink)]">{count()}</span> selected
        </span>
        <div class="flex items-center gap-2 ml-auto flex-wrap">
          <div class="relative">
            <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-1.5 text-sm font-medium" onClick={() => setPickCat((v) => !v)} aria-expanded={pickCat()} aria-haspopup="true">
              <IconTags size={16} /> Batch categorize
            </button>
            <Show when={pickCat()}>
              <div class="anim-fade absolute right-0 bottom-full mb-2 z-30 w-52 rounded-xl border border-[color:var(--line)] bg-white p-2 shadow-xl grid grid-cols-1 gap-1">
                <span class="px-1 pb-1 text-[11px] uppercase tracking-wide text-[color:var(--ink-soft)]">Set category to</span>
                <For each={CATEGORIES}>
                  {(c) => (
                    <button class="chrome-btn flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-[color:var(--paper-deep)]" onClick={() => doCategorize(c.id)}>
                      <span class="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      {c.id}
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
          <button class="chrome-btn inline-flex items-center gap-1.5 rounded-lg bg-[#7a1f1f] text-white px-3 py-1.5 text-sm font-medium hover:brightness-110" onClick={() => openBatchConfirm()}>
            <IconTrash size={16} /> Batch delete
          </button>
          <button class="chrome-btn inline-flex items-center gap-1 rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-sm" onClick={() => clearSelection()} aria-label="Clear selection">
            <IconX size={16} />
          </button>
        </div>
      </div>
    </Show>
  );
}
