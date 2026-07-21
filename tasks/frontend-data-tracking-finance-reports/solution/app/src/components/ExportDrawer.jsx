import { useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import { exportDrawer, closeExport, setExportTab, displayCurrency, totals, summaryStats } from '../state.js';
import { buildJsonText, buildCsvText } from '../ledger.js';
import { formatMoney } from '../format.js';
import { useFocusTrap, copyText, downloadBlob } from '../hooks.jsx';
import { Icon } from './Icon.jsx';

export const copiedFlag = signal(false);
let copiedTimer = null;

export function markCopied() {
  copiedFlag.value = true;
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copiedFlag.value = false;
  }, 2800);
}

function highlightJson(text) {
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|\b(true|false)\b|\bnull\b/g;
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      if (m[2]) out.push(<span class="text-[#175250]">{m[1]}</span>, <span class="text-[#7e958f]">{m[2]}</span>);
      else out.push(<span class="text-[#047857]">{m[1]}</span>);
    } else if (m[3]) out.push(<span class="text-[#b45309]">{m[3]}</span>);
    else if (m[4]) out.push(<span class="text-[#7c3aed]">{m[4]}</span>);
    else out.push(<span class="text-[#c2410c]">null</span>);
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function ExportDrawer() {
  const ed = exportDrawer.value;
  const [copiedLocal, setCopiedLocal] = useState(false);
  const trapRef = useFocusTrap(ed.open, {
    onEscape: closeExport,
    initialFocus: (node) => node && node.querySelector('[data-initial-focus]'),
  });

  const cur = displayCurrency.value;
  const jsonText = buildJsonText(cur);
  const csvText = buildCsvText();
  const activeText = ed.tab === 'csv' ? csvText : jsonText;
  const t = totals.value;
  const stats = summaryStats.value;

  if (!ed.open) return null;

  const doCopy = async () => {
    const ok = await copyText(activeText);
    if (ok) {
      markCopied();
      setCopiedLocal(true);
      setTimeout(() => setCopiedLocal(false), 2800);
    }
  };
  const doDownload = () => {
    if (ed.tab === 'csv') downloadBlob('finance-reports-ledger.csv', csvText, 'text/csv;charset=utf-8');
    else downloadBlob('finance-reports-ledger.json', jsonText, 'application/json;charset=utf-8');
  };

  return (
    <div class="fixed inset-0 z-[100] flex justify-end">
      <button type="button" aria-label="Close export drawer" class="absolute inset-0 bg-[#082727]/40 anim-fade-in" onClick={closeExport} />
      <aside
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Export ledger"
        tabindex="-1"
        class="anim-drawer-in relative flex h-full w-full max-w-[30rem] flex-col bg-white shadow-2xl ring-1 ring-black/5"
      >
        <header class="flex items-center justify-between gap-3 border-b border-[#eef4f1] px-4 py-3">
          <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-[#0f3d3e]">
            <Icon name="lucide:file-down" decorative size={18} />
            Export report
          </h2>
          <button
            data-initial-focus
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-[#4a6460] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e]"
            onClick={closeExport}
            aria-label="Close export drawer"
          >
            <Icon name="lucide:x" decorative size={18} />
          </button>
        </header>

        <div class="flex items-center gap-1 border-b border-[#eef4f1] px-4 pt-2">
          {['json', 'csv'].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={ed.tab === tab}
              class={`rounded-t-lg px-3 py-2 text-sm font-semibold transition ${
                ed.tab === tab ? 'bg-[#e6f7f1] text-[#0f3d3e] ring-1 ring-[#c5f5e7]' : 'text-[#4a6460] hover:bg-[#f2faf7]'
              }`}
              onClick={() => setExportTab(tab)}
            >
              {tab === 'json' ? 'JSON' : 'CSV'}
            </button>
          ))}
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#eef4f1] bg-[#f2faf7] px-4 py-2.5 text-xs">
          <span class="font-semibold uppercase tracking-wide text-[#7e958f]">{cur} totals</span>
          <span class="tnum text-[#047857]">Income {formatMoney(t.income, cur)}</span>
          <span class="tnum text-[#c2410c]">Expenses {formatMoney(t.expenses, cur)}</span>
          <span class="tnum font-semibold text-[#0f3d3e]">Net {formatMoney(t.net, cur, { showSign: true })}</span>
          <span class="tnum text-[#4a6460]">{stats.count} rows</span>
        </div>

        <div class="scroll-area min-h-0 flex-1 overflow-auto bg-[#0f1f1f] p-3">
          <pre class="font-mono text-[12px] leading-relaxed text-[#d7eae3] whitespace-pre">
            {ed.tab === 'csv' ? csvText : highlightJson(jsonText)}
          </pre>
        </div>

        <footer class="flex items-center justify-between gap-2 border-t border-[#eef4f1] px-4 py-3">
          <span class="text-xs text-[#7e958f]">Compiled live from the ledger · {ed.tab.toUpperCase()}</span>
          <div class="flex items-center gap-2">
            <button
              id="ld-export-copy"
              type="button"
              class="btn btn-sm bg-white text-[#0f3d3e] ring-1 ring-[#d7eae3] hover:bg-[#e6f7f1]"
              onClick={doCopy}
              aria-live="polite"
            >
              <Icon name={copiedFlag.value || copiedLocal ? 'lucide:check' : 'lucide:copy'} decorative size={15} />
              {copiedFlag.value || copiedLocal ? 'Copied' : 'Copy'}
            </button>
            <button id="ld-export-download" type="button" class="btn btn-sm bg-[#0f3d3e] text-white hover:bg-[#175250]" onClick={doDownload}>
              <Icon name="lucide:download" decorative size={15} />
              Download {ed.tab === 'csv' ? 'CSV' : 'JSON'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
