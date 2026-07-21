import { useRef } from 'preact/hooks';
import { importPanel, closeImport, importLedger, showToast } from '../state.js';
import { parseLedgerDocument } from '../ledger.js';
import { useFocusTrap } from '../hooks.jsx';
import { Icon } from './Icon.jsx';

export function ImportPanel() {
  const ip = importPanel.value;
  const fileRef = useRef(null);
  const trapRef = useFocusTrap(ip.open, {
    onEscape: closeImport,
    initialFocus: (node) => node && node.querySelector('textarea'),
  });
  if (!ip.open) return null;

  const busy = ip.status === 'busy';

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importPanel.value = { ...importPanel.value, content: String(reader.result || ''), status: 'idle', error: null, summary: null };
    };
    reader.onerror = () => {
      importPanel.value = { ...importPanel.value, status: 'error', error: 'Could not read the selected file' };
    };
    reader.readAsText(file);
  };

  const commit = () => {
    importPanel.value = { ...importPanel.value, status: 'busy', error: null, summary: null };
    // perceptible busy state for accessibility (4.5)
    setTimeout(() => {
      const parsed = parseLedgerDocument(importPanel.value.content);
      if (!parsed.ok) {
        importPanel.value = { ...importPanel.value, status: 'error', error: parsed.message };
        return;
      }
      importLedger(parsed.data);
      const summary = { transactions: parsed.data.transactions.length, thresholds: parsed.data.thresholds.length };
      importPanel.value = { ...importPanel.value, status: 'success', error: null, summary };
      showToast(`Imported ${summary.transactions} transactions and ${summary.thresholds} thresholds`, 'success');
    }, 220);
  };

  const validContent = importPanel.value.content.trim().length > 0;

  return (
    <div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button type="button" aria-label="Close import panel" class="absolute inset-0 bg-[#082727]/40 anim-fade-in" onClick={closeImport} />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-import-title"
        tabindex="-1"
        class="anim-scale-in relative my-8 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <header class="flex items-center justify-between border-b border-[#eef4f1] bg-[#f2faf7] px-5 py-3.5">
          <h2 id="ld-import-title" class="flex items-center gap-2 font-display text-lg font-semibold text-[#0f3d3e]">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-[#0f3d3e] text-[#8af0d3]">
              <Icon name="lucide:upload" decorative size={15} />
            </span>
            Import ledger JSON
          </h2>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-[#4a6460] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e]"
            onClick={closeImport}
            aria-label="Close import panel"
          >
            <Icon name="lucide:x" decorative size={18} />
          </button>
        </header>

        <div class="flex flex-col gap-3 px-5 py-4">
          <div class="flex items-center gap-2 rounded-lg bg-[#e6f7f1] px-3 py-2 text-xs font-medium text-[#0f3d3e]">
            <Icon name="lucide:replace" decorative size={15} />
            Import mode: <span class="font-semibold">Replace</span> — ledger JSON only. Replaces the current transactions and thresholds.
          </div>

          <div class="flex flex-col gap-1">
            <label for="ld-import-text" class="text-xs font-semibold uppercase tracking-wide text-[#4a6460]">
              Ledger JSON document
            </label>
            <textarea
              id="ld-import-text"
              rows={8}
              class="scroll-area w-full resize-y rounded-lg border border-[#d7eae3] bg-[#0f1f1f] px-3 py-2 font-mono text-[12px] text-[#d7eae3] focus:border-[#2c8a85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c8a85]/40"
              value={ip.content}
              onInput={(e) => {
                importPanel.value = { ...importPanel.value, content: e.target.value, status: 'idle', error: null };
              }}
            />
            <div class="flex items-center justify-between">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#175250] transition hover:bg-[#e6f7f1]"
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                <Icon name="lucide:file-json" decorative size={15} />
                Load a .json file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                class="sr-only"
                onChange={(e) => readFile(e.target.files && e.target.files[0])}
              />
              <span class="text-xs text-[#7e958f]">{ip.content.trim().length} characters</span>
            </div>
          </div>

          {ip.status === 'error' && ip.error && (
            <div role="alert" class="flex items-start gap-2 rounded-lg border border-[#f0c9b8] bg-[#fff1e9] px-3 py-2 text-sm text-[#c2410c]">
              <Icon name="lucide:circle-alert" decorative size={16} class="mt-0.5 shrink-0" />
              <span>
                <span class="font-semibold">Import rejected.</span> {ip.error}
              </span>
            </div>
          )}
          {ip.status === 'success' && ip.summary && (
            <div role="status" class="flex items-start gap-2 rounded-lg border border-[#bfe6d6] bg-[#e3f6ee] px-3 py-2 text-sm text-[#047857]">
              <Icon name="lucide:circle-check-big" decorative size={16} class="mt-0.5 shrink-0" />
              <span>
                <span class="font-semibold">Imported with Replace.</span> {ip.summary.transactions} transactions and {ip.summary.thresholds} thresholds now in the ledger.
              </span>
            </div>
          )}

          <div class="mt-1 flex items-center justify-end gap-2">
            <button type="button" class="btn btn-sm bg-white text-[#0f3d3e] ring-1 ring-[#d7eae3] hover:bg-[#e6f7f1]" onClick={closeImport}>
              Close
            </button>
            <button
              type="button"
              class="btn btn-sm bg-[#0f3d3e] text-white hover:bg-[#175250] disabled:bg-[#cfe2db] disabled:text-white/80"
              disabled={!validContent || busy}
              onClick={commit}
            >
              {busy ? (
                <>
                  <Icon name="lucide:loader-circle" decorative size={15} class="animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Icon name="lucide:upload" decorative size={15} />
                  Import with Replace
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
