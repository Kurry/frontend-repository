import { h } from 'preact';
import { useSignal } from '@preact/signals';
import { useRef, useEffect } from 'preact/hooks';
import {
  showExportCenter, importError,
  buildStudyPackText, buildCurrentPGN, importStudyPackText,
  favorites, savedLines, boardTheme, currentOpening, selectedNodeId
} from '../store';

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

export function ExportCenter() {
  const copied = useSignal('');
  const copyFailed = useSignal('');
  const importText = useSignal('');
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  // Recompute previews from live store state on every render (signals read below).
  // Reading the signals here subscribes this component to their changes.
  const _f = favorites.value; const _s = savedLines.value; const _t = boardTheme.value;
  const _o = currentOpening.value; const _n = selectedNodeId.value;
  const studyPackText = buildStudyPackText();
  const pgnText = buildCurrentPGN();

  useEffect(() => {
    openerRef.current = document.activeElement;
    const el = dialogRef.current;
    if (el) {
      const first = el.querySelector('button, [href], input, textarea, select');
      if (first) first.focus();
    }
    return () => {
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
      }
    };
  }, []);

  const close = () => { showExportCenter.value = false; importError.value = ''; };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const list = Array.from(focusable).filter(n => !n.disabled);
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  // Falls back to a hidden-textarea execCommand copy when the async Clipboard
  // API is unavailable (insecure context, permission denied, older browser).
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

  const doImport = () => {
    importStudyPackText(importText.value);
  };

  return (
    <div
      class="fixed inset-0 bg-black/40 z-40 flex justify-end export-overlay"
      onClick={close}
    >
      <div
        ref={dialogRef}
        class="w-full max-w-lg bg-[var(--color-surface)] h-full overflow-y-auto shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Export center"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div class="p-4 border-b border-neutral-400 flex items-center justify-between gap-2">
          <h2>Export center</h2>
          <button type="button" class="btn-secondary btn-compact" onClick={close}>Close</button>
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

          {/* Study pack JSON */}
          <section>
            <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <h3>Study pack JSON</h3>
              <div class="flex gap-2">
                <button type="button" class="btn-secondary btn-compact"
                  onClick={() => copy('Study pack JSON', studyPackText)}>
                  {copied.value === 'Study pack JSON' ? 'Copied!' : copyFailed.value === 'Study pack JSON' ? 'Copy failed' : 'Copy'}
                </button>
                <button type="button" class="btn-primary btn-compact"
                  onClick={() => download('lineforge-study-pack.json', studyPackText, 'application/json')}>
                  Download study pack
                </button>
              </div>
            </div>
            <pre class="export-preview" aria-label="Study pack JSON preview">{studyPackText}</pre>
          </section>

          {/* Current line PGN */}
          <section>
            <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <h3>Current line PGN</h3>
              <div class="flex gap-2">
                <button type="button" class="btn-secondary btn-compact"
                  onClick={() => copy('Current line PGN', pgnText)}>
                  {copied.value === 'Current line PGN' ? 'Copied!' : copyFailed.value === 'Current line PGN' ? 'Copy failed' : 'Copy'}
                </button>
                <button type="button" class="btn-primary btn-compact"
                  onClick={() => download('lineforge-current-line.pgn', pgnText, 'application/x-chess-pgn')}>
                  Download PGN
                </button>
              </div>
            </div>
            <pre class="export-preview" aria-label="Current line PGN preview">{pgnText}</pre>
          </section>

          {/* Import */}
          <section>
            <h3 class="mb-1">Import study pack</h3>
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
                onClick={doImport}>
                Import study pack
              </button>
            </div>
            <p id="import-error" aria-live="polite" class="mt-1 text-sm font-medium" style="color: var(--color-danger); min-height: 1.25rem;">
              {importError.value}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
