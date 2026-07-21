import { createSignal, Show } from "solid-js";
import Modal from "./Modal";
import { state, importTimeline, closeImport } from "../store";
import { IconX, IconUpload } from "@tabler/icons-solidjs";

export default function ImportDialog() {
  const [text, setText] = createSignal("");
  const [closing, setClosing] = createSignal(false);
  let fileRef;

  function close() {
    if (closing()) return;
    setClosing(true);
    setTimeout(() => {
      closeImport();
      setText("");
      setTimeout(() => setClosing(false), 200);
    }, 180);
  }
  function doImport() {
    const res = importTimeline(text());
    if (res.ok) close();
    // on failure importTimeline already sets the inline error + announces via live region
  }
  function onFile(e) {
    const f = e.currentTarget.files && e.currentTarget.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(f);
  }

  return (
    <Modal open={state.importOpen} closing={closing()} onClose={close} label="Import Timeline JSON" initialFocus={() => fileRef} contentClass="bg-paper rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-auto thin-scroll border border-[color:var(--line)]">
      <div class="flex items-center justify-between px-5 pt-5">
        <h2 class="font-display text-2xl font-semibold tracking-tight">Import timeline</h2>
        <button class="chrome-btn rounded-lg p-1.5 hover:bg-[color:var(--paper-deep)]" onClick={close} aria-label="Close import dialog">
          <IconX size={20} />
        </button>
      </div>
      <div class="px-5 pb-5 pt-3 space-y-3">
        <p class="text-sm text-[color:var(--ink-soft)]">
          Paste a previously exported Timeline JSON document, or choose a <span class="mono">.json</span> file. A valid document replaces the collection and restores the year window and enabled categories; a malformed document changes nothing and names the offending field.
        </p>
        <div class="flex items-center gap-2">
          <label class="chrome-btn inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-medium cursor-pointer">
            <IconUpload size={16} /> Choose file
            <input ref={fileRef} type="file" accept="application/json,.json" class="sr-only" onChange={onFile} />
          </label>
          <span class="text-xs text-[color:var(--ink-soft)]">{text() ? `${text().length} characters pasted` : "No file chosen"}</span>
        </div>
        <label for="import-text" class="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
          Timeline JSON
        </label>
        <textarea id="import-text" rows="9" class="mono w-full rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-[12px] leading-5 outline-none focus:border-[color:var(--focus)]" value={text()} onInput={(e) => setText(e.currentTarget.value)} placeholder='{"version":1,"document":"media-timeline", ...}' />
        <Show when={state.importError}>
          <p class="text-sm text-[#a33b4a] anim-fade rounded-lg bg-[#a33b4a14] border border-[#a33b4a55] px-3 py-2" role="alert">
            Import error: {state.importError}
          </p>
        </Show>
        <div class="flex justify-end gap-2">
          <button class="chrome-btn rounded-lg border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium" onClick={close}>
            Cancel
          </button>
          <button class="chrome-btn rounded-lg bg-[#1b6b4a] text-white px-4 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-40" disabled={!text().trim()} onClick={doImport}>
            Import timeline
          </button>
        </div>
      </div>
    </Modal>
  );
}
