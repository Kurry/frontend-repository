import { h } from 'preact';
import { useSignal } from '@preact/signals';
import { useRef, useEffect, useMemo } from 'preact/hooks';
import {
  showExportCenter, importError, importConfirmOpen, importPendingText,
  buildStudyPackText, buildCurrentPGN, importStudyPackText, parseStudyPackText,
  favorites, savedLines, boardTheme, currentOpening, selectedNodeId, getNodeMoves
} from '../store';
import { Icon } from '../icons';
import { TrapScope, useRestoreFocus } from '../focusTrap';
import { OPENINGS } from '../openings';

function download(filename, text, mime) {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { /* download unavailable */ }
}

function ImportConfirm() {
  const open = importConfirmOpen.value;
  const ref = useRef(null);
  useRestoreFocus(open);
  if (!open) return null;
  const preview = parseStudyPackText(importPendingText.value);
  const cancel = () => { importConfirmOpen.value = false; importPendingText.value = ''; };
  const confirm = () => {
    const text = importPendingText.value;
    importConfirmOpen.value = false;
    importPendingText.value = '';
    importStudyPackText(text);
  };
  return (
    <div class="modal-backdrop" onClick={cancel}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm study pack import"
        class="modal modal-enter"
        onClick={e => e.stopPropagation()}
      >
        <TrapScope active containerRef={ref} onEscape={cancel} />
        <h2>Import study pack?</h2>
        {preview.ok ? (
          <p class="text-base mt-2">
            This replaces the current session with {preview.favorites} favorite{preview.favorites === 1 ? '' : 's'}, {preview.savedLines} saved line{preview.savedLines === 1 ? '' : 's'}, and the {preview.boardTheme} board theme.
          </p>
        ) : (
          <p class="text-base mt-2" style="color: var(--color-danger);">{preview.error}</p>
        )}
        <div class="modal-foot">
          <button type="button" class="btn-secondary" onClick={cancel}>Cancel</button>
          <button type="button" class="btn-primary" disabled={!preview.ok} onClick={confirm}>
            Import study pack
          </button>
        </div>
      </div>
    </div>
  );
}

function StudySheetPreview({ studyPackText, pgnText }) {
  const open = currentOpening.value;
  const moves = getNodeMoves();
  let body = '';
  moves.forEach((san, i) => {
    if (i % 2 === 0) body += `${Math.floor(i / 2) + 1}. `;
    body += san + ' ';
  });
  const favNames = favorites.value
    .map(id => OPENINGS.find(o => o.id === id)?.name)
    .filter(Boolean);

  return (
    <section class="study-sheet" aria-label="Printable study sheet preview">
      <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h3>Printable study sheet</h3>
        <button
          type="button"
          class="btn-secondary btn-compact"
          onClick={() => window.print()}
        >
          <Icon name="print" size={16} /> Print preview
        </button>
      </div>
      <div class="study-sheet-page">
        <header class="study-sheet-head">
          <div class="study-sheet-brand">LineForge study sheet</div>
          <div class="text-sm text-neutral-600">{new Date().toLocaleDateString('en-US')}</div>
        </header>
        <h4 class="study-sheet-title">{open ? open.name : 'No opening loaded'}</h4>
        {open && <div class="text-sm text-neutral-600 mb-2">{open.code} · {open.family}</div>}
        <div class="study-sheet-moves stat-figures">{body.trim() || '—'}</div>
        <div class="study-sheet-meta">
          <div><strong>Board theme:</strong> {boardTheme.value}</div>
          <div><strong>Favorites:</strong> {favNames.length ? favNames.join(', ') : 'None'}</div>
          <div><strong>Saved lines:</strong> {savedLines.value.length}</div>
        </div>
        {savedLines.value.length > 0 && (
          <ul class="study-sheet-lines">
            {savedLines.value.map(l => (
              <li key={l.id}>
                <strong>{l.name}</strong>
                {l.tags?.length ? ` · ${l.tags.join(', ')}` : ''}
                {l.notes ? ` — ${l.notes}` : ''}
              </li>
            ))}
          </ul>
        )}
        <details class="mt-3">
          <summary class="text-sm font-medium cursor-pointer">Study pack JSON (for print)</summary>
          <pre class="export-preview mt-1">{studyPackText}</pre>
        </details>
        <details class="mt-2">
          <summary class="text-sm font-medium cursor-pointer">Current line PGN (for print)</summary>
          <pre class="export-preview mt-1">{pgnText}</pre>
        </details>
      </div>
    </section>
  );
}

export function ExportCenter() {
  const copied = useSignal('');
  const copyFailed = useSignal('');
  const importText = useSignal('');
  const tab = useSignal('pack');
  const dialogRef = useRef(null);
  const open = showExportCenter.value;
  useRestoreFocus(open);

  const _f = favorites.value; const _s = savedLines.value; const _t = boardTheme.value;
  const _o = currentOpening.value; const _n = selectedNodeId.value;
  // Copy confirmation re-renders this component. Keep the generated timestamp
  // stable until actual session data changes so the clipboard bytes remain
  // identical to the post-action visible preview.
  const studyPackText = useMemo(() => buildStudyPackText(), [_f, _s, _t, _o, _n, open]);
  const pgnText = useMemo(() => buildCurrentPGN(), [_o, _n, open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (el) {
      const first = el.querySelector('button, [href], input, textarea, select');
      if (first) setTimeout(() => first.focus(), 0);
    }
  }, []);

  const close = () => {
    showExportCenter.value = false;
    importError.value = '';
    importConfirmOpen.value = false;
  };

  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = !!(document.execCommand && document.execCommand('copy'));
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const copy = (label, text) => {
    const finish = (ok) => {
      if (ok) {
        copyFailed.value = '';
        copied.value = label;
        setTimeout(() => { if (copied.value === label) copied.value = ''; }, 1600);
      } else {
        copied.value = '';
        copyFailed.value = label;
        setTimeout(() => { if (copyFailed.value === label) copyFailed.value = ''; }, 1600);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => finish(true),
        () => finish(fallbackCopy(text))
      );
    } else {
      finish(fallbackCopy(text));
    }
  };

  const requestImport = () => {
    const text = importText.value;
    if (!text.trim()) return;
    const preview = parseStudyPackText(text);
    if (!preview.ok) {
      importError.value = preview.error;
      return;
    }
    importError.value = '';
    importPendingText.value = text;
    importConfirmOpen.value = true;
  };

  return (
    <div
      class="fixed inset-0 bg-black/40 z-40 flex justify-end export-overlay"
      onClick={close}
    >
      <div
        ref={dialogRef}
        class="w-full max-w-lg bg-[var(--color-surface)] h-full overflow-y-auto shadow-xl export-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Export Center"
        onClick={e => e.stopPropagation()}
      >
        <TrapScope active containerRef={dialogRef} onEscape={close} />
        <div class="p-4 border-b border-neutral-400 flex items-center justify-between gap-2">
          <h2>Export Center</h2>
          <button type="button" class="btn-secondary btn-compact" onClick={close} aria-label="Close Export Center">
            <Icon name="close" size={16} /> Close
          </button>
        </div>

        <div class="px-4 pt-3 flex flex-wrap gap-2 border-b border-neutral-300">
          <button type="button" class={`btn-secondary btn-compact ${tab.value === 'pack' ? 'filter-on' : ''}`} onClick={() => { tab.value = 'pack'; }} aria-pressed={tab.value === 'pack'}>
            Study pack &amp; PGN
          </button>
          <button type="button" class={`btn-secondary btn-compact ${tab.value === 'sheet' ? 'filter-on' : ''}`} onClick={() => { tab.value = 'sheet'; }} aria-pressed={tab.value === 'sheet'}>
            <Icon name="sheet" size={16} /> Study sheet
          </button>
        </div>

        <div class="p-4 space-y-5">
          <p aria-live="polite" class="sr-only-live text-sm"
            style={`color: var(${copyFailed.value ? '--color-danger' : '--color-success'});`}>
            {copied.value
              ? `${copied.value} copied to clipboard`
              : copyFailed.value
                ? `Could not copy ${copyFailed.value} to clipboard`
                : ''}
          </p>

          {tab.value === 'sheet' ? (
            <StudySheetPreview studyPackText={studyPackText} pgnText={pgnText} />
          ) : (
            <>
              <section>
                <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <h3>Study pack JSON</h3>
                  <div class="flex gap-2">
                    <button type="button" class="btn-secondary btn-compact" data-export-copy="study-pack"
                      onClick={() => copy('Study pack JSON', studyPackText)}>
                      <Icon name="copy" size={14} />
                      {copied.value === 'Study pack JSON' ? 'Copied to clipboard!' : copyFailed.value === 'Study pack JSON' ? 'Copy failed' : 'Copy JSON'}
                    </button>
                    <button type="button" class="btn-primary btn-compact"
                      onClick={() => download('lineforge-study-pack.json', studyPackText, 'application/json')}>
                      <Icon name="download" size={14} /> Download study pack
                    </button>
                  </div>
                </div>
                <pre class="export-preview" aria-label="Study pack JSON preview">{studyPackText}</pre>
              </section>

              <section>
                <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <h3>Current line PGN</h3>
                  <div class="flex gap-2">
                    <button type="button" class="btn-secondary btn-compact"
                      onClick={() => copy('Current line PGN', pgnText)}>
                      <Icon name="copy" size={14} />
                      {copied.value === 'Current line PGN' ? 'Copied to clipboard!' : copyFailed.value === 'Current line PGN' ? 'Copy failed' : 'Copy PGN'}
                    </button>
                    <button type="button" class="btn-primary btn-compact"
                      onClick={() => download('lineforge-current-line.pgn', pgnText, 'application/x-chess-pgn')}>
                      <Icon name="download" size={14} /> Download PGN
                    </button>
                  </div>
                </div>
                <pre class="export-preview" aria-label="Current line PGN preview">{pgnText}</pre>
              </section>

              <section>
                <h3 class="mb-1">Import study pack</h3>
                <p class="text-sm text-neutral-600 mb-2">
                  Paste a previously exported Study pack JSON to restore favorites, board theme, and My Saved Lines. Star openings from the Opening Library before exporting if you want them included.
                </p>
                <label class="block text-sm font-medium mb-1" for="import-json">Paste study pack JSON</label>
                <textarea
                  id="import-json"
                  class="text-input w-full font-mono text-sm"
                  rows={5}
                  placeholder='{"formatVersion":"1", ...}'
                  value={importText.value}
                  onInput={e => { importText.value = e.target.value; if (importError.value) importError.value = ''; }}
                  aria-describedby={importError.value ? 'import-error' : undefined}
                  aria-invalid={importError.value ? 'true' : undefined}
                />
                <div class="flex items-center gap-2 mt-2">
                  <button type="button" class="btn-primary btn-compact"
                    disabled={!importText.value.trim()}
                    onClick={requestImport}>
                    Import study pack
                  </button>
                </div>
                <p id="import-error" aria-live="polite" class="mt-1 text-sm font-medium" style="color: var(--color-danger); min-height: 1.25rem;">
                  {importError.value}
                </p>
              </section>
            </>
          )}
        </div>
      </div>
      <ImportConfirm />
    </div>
  );
}
