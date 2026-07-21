import { createSignal, createMemo, For } from "solid-js";
import Modal from "./Modal";
import { state, setState, EXPORT_FORMATS, previewTextFor, copyActivePreview, downloadActivePreview, inViewCount } from "../store";
import { fmtYear } from "../format";
import { IconX, IconCopy, IconDownload } from "@tabler/icons-solidjs";

export default function ExportDrawer() {
  const [closing, setClosing] = createSignal(false);
  function close() {
    if (closing()) return;
    setClosing(true);
    setTimeout(() => {
      setState("exportOpen", false);
      setTimeout(() => setClosing(false), 260);
    }, 220);
  }
  const fmt = createMemo(() => EXPORT_FORMATS.find((f) => f.id === state.exportTab) || EXPORT_FORMATS[0]);
  const text = createMemo(() => previewTextFor(state.exportTab));

  return (
    <Modal open={state.exportOpen} closing={closing()} onClose={close} placement="right" label="Export timeline pack" contentClass="bg-paper w-full max-w-[min(94vw,560px)] shadow-2xl border-l border-[color:var(--line)] flex flex-col">
      <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[color:var(--line)]">
        <h2 class="font-display text-xl font-semibold tracking-tight">Export timeline</h2>
        <button class="chrome-btn rounded-lg p-1.5 hover:bg-[color:var(--paper-deep)]" onClick={close} aria-label="Close export drawer">
          <IconX size={20} />
        </button>
      </div>

      {/* curator export summary strip (innovation 11.1) */}
      <div class="px-5 py-2.5 bg-[color:var(--paper-deep)] border-b border-[color:var(--line)] text-xs flex flex-wrap items-center gap-x-4 gap-y-1" aria-live="polite">
        <span>
          <span class="font-semibold text-[color:var(--ink)]">{state.events.length}</span> events in collection
        </span>
        <span>
          <span class="font-semibold text-[color:var(--ink)]">{inViewCount()}</span> in view
        </span>
        <span>
          window <span class="font-display tabular-nums">{fmtYear(state.window.from)} &ndash; {fmtYear(state.window.to)}</span>
        </span>
        <span class="text-[color:var(--ink-soft)]">{state.enabledCategories.length} categories enabled</span>
      </div>

      <div class="px-5 pt-3" role="tablist" aria-label="Export format">
        <div class="flex gap-1 border-b border-[color:var(--line)]">
          <For each={EXPORT_FORMATS}>
            {(f) => {
              const active = () => state.exportTab === f.id;
              return (
                <button
                  role="tab"
                  aria-selected={active()}
                  class={`chrome-btn px-3 py-2 text-sm font-medium border-b-2 -mb-px ${active() ? "border-[#1b6b4a] text-[color:var(--ink)]" : "border-transparent text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"}`}
                  onClick={() => setState("exportTab", f.id)}
                >
                  {f.label}
                </button>
              );
            }}
          </For>
        </div>
      </div>

      <div class="flex-1 min-h-0 px-5 py-3 flex flex-col">
        <pre class="mono flex-1 min-h-[200px] overflow-auto thin-scroll rounded-lg border border-[color:var(--line)] bg-[#1d1a16] text-[#f3ead9] text-[12px] leading-5 p-3 whitespace-pre" role="tabpanel" aria-label={fmt().label + " preview"}>
          {text()}
        </pre>
        <div class="mt-3 flex gap-2">
          <button id="timeline-export-copy" class="chrome-btn inline-flex items-center gap-1.5 rounded-lg bg-[#1b6b4a] text-white px-4 py-2 text-sm font-medium hover:brightness-110" onClick={() => copyActivePreview()}>
            <IconCopy size={16} /> Copy
          </button>
          <button id="timeline-export-download" class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium" onClick={() => downloadActivePreview()}>
            <IconDownload size={16} /> Download
          </button>
          <span class="ml-auto self-center text-xs text-[color:var(--ink-soft)]">{fmt().file}</span>
        </div>
      </div>
    </Modal>
  );
}
