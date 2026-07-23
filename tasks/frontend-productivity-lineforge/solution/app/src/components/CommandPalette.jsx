import { h } from 'preact';
import { useRef, useEffect, useMemo } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import {
  paletteOpen, paletteQuery,
  savedLines, currentOpening, loadOpening, setBoardTheme, loadSavedLine,
  showExportCenter, startPractice, exitPractice, practiceActive, showSavedPanel,
  showToast
} from '../store';
import { OPENINGS } from '../openings';
import { Icon } from '../icons';
import { TrapScope, useRestoreFocus } from '../focusTrap';

const THEME_ROWS = [
  { id: 'classic', label: 'Classic' },
  { id: 'forest', label: 'Forest' },
  { id: 'slate', label: 'Slate' }
];

function fuzzy(needle, hay) {
  if (!needle) return true;
  const n = needle.toLowerCase();
  const h = hay.toLowerCase();
  if (h.includes(n)) return true;
  let i = 0;
  for (const ch of h) { if (ch === n[i]) i++; if (i === n.length) return true; }
  return false;
}

export function CommandPalette() {
  const open = paletteOpen.value;
  const query = paletteQuery.value;
  const dialogRef = useRef(null);
  const index = useSignal(0);
  useRestoreFocus(open);

  const rows = useMemo(() => {
    const q = query.trim();
    const out = [];
    for (const o of OPENINGS) {
      if (fuzzy(q, `${o.name} ${o.code} ${o.family}`)) {
        out.push({ kind: 'Opening', label: `${o.name} ${o.code}`, run: () => loadOpening(o.id) });
      }
    }
    for (const line of savedLines.value) {
      if (fuzzy(q, line.name)) {
        out.push({ kind: 'Saved line', label: line.name, run: () => loadSavedLine(line) });
      }
    }
    for (const t of THEME_ROWS) {
      if (fuzzy(q, `${t.label} theme board`)) {
        out.push({ kind: 'Theme', label: `${t.label} board theme`, run: () => { setBoardTheme(t.id); showToast(`Board theme set to ${t.label}`); } });
      }
    }
    if (fuzzy(q, 'export center study pack pgn')) {
      out.push({ kind: 'Action', label: 'Open Export center', run: () => { showExportCenter.value = true; } });
    }
    if (currentOpening.value) {
      if (fuzzy(q, 'practice this line')) {
        out.push({ kind: 'Action', label: practiceActive.value ? 'Exit practice' : 'Practice this line', run: () => { practiceActive.value ? exitPractice() : startPractice(); } });
      }
    }
    if (fuzzy(q, 'view saved lines my saved lines')) {
      out.push({ kind: 'Action', label: 'View saved lines', run: () => { showSavedPanel.value = true; } });
    }
    return out;
  }, [query, savedLines.value, currentOpening.value, practiceActive.value]);

  useEffect(() => { index.value = 0; }, [query]);
  useEffect(() => { if (!open) paletteQuery.value = ''; }, [open]);

  const close = () => { paletteOpen.value = false; };

  const activate = (row) => {
    if (!row) return;
    close();
    row.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); index.value = Math.min(index.value + 1, rows.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); index.value = Math.max(index.value - 1, 0); }
    else if (e.key === 'Enter') { e.preventDefault(); activate(rows[index.value]); }
  };

  if (!open) return null;

  return (
    <div class="palette-backdrop" onClick={close}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        class="palette palette-enter"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <TrapScope active containerRef={dialogRef} onEscape={close} />
        <div class="palette-search">
          <Icon name="search" size={18} />
          <input
            type="text"
            aria-label="Search commands, openings and saved lines"
            placeholder="Search openings, saved lines, themes, actions…"
            value={paletteQuery.value}
            onInput={e => { paletteQuery.value = e.target.value; }}
            class="palette-input"
            autoFocus
            ref={el => { if (el) setTimeout(() => el.focus(), 0); }}
          />
          <button type="button" class="palette-close" onClick={close} aria-label="Close command palette">
            <Icon name="close" size={18} />
          </button>
        </div>
        <ul class="palette-list" role="listbox" aria-label="Command results">
          {rows.length === 0 && (
            <li class="palette-empty">No matching commands. Try a different name, code or action.</li>
          )}
          {rows.map((row, i) => (
            <li
              key={`${row.kind}-${row.label}`}
              role="option"
              aria-selected={i === index.value}
              class={`palette-row ${i === index.value ? 'palette-row-active' : ''}`}
              onMouseEnter={() => { index.value = i; }}
              onClick={() => activate(row)}
            >
              <span class="palette-kind">{row.kind}</span>
              <span class="palette-label">{row.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
