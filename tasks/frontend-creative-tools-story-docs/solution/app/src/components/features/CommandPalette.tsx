import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { viewModeStore, undo, redo } from '@/store';
import {
  isCommandPaletteOpenStore,
  isExportDrawerOpenStore,
  isImportModalOpenStore,
  openAddScene,
} from '@/store/ui';
import { useDialogFocus } from '../common/useDialogFocus';
import { Ri, type RiIconName } from '../common/Ri';
import { clsx } from 'clsx';

interface Command {
  id: string;
  label: string;
  icon: RiIconName;
  hint?: string;
  run: () => void;
}

const COMMANDS: Command[] = [
  { id: 'add-scene', label: 'Add Scene', icon: 'add-line', run: () => openAddScene() },
  { id: 'export', label: 'Export Storyboard', icon: 'download-2-line', run: () => isExportDrawerOpenStore.set(true) },
  { id: 'import', label: 'Import Storyboard', icon: 'upload-2-line', run: () => isImportModalOpenStore.set(true) },
  { id: 'mode-tile', label: 'Switch to Tile', icon: 'apps-line', run: () => viewModeStore.set('tile') },
  { id: 'mode-list', label: 'Switch to List', icon: 'list-unordered', run: () => viewModeStore.set('list') },
  { id: 'mode-slide', label: 'Switch to Slide', icon: 'slideshow-line', run: () => viewModeStore.set('slide') },
  { id: 'mode-canvas', label: 'Switch to Canvas', icon: 'drag-move-2-line', run: () => viewModeStore.set('canvas') },
  { id: 'undo', label: 'Undo', icon: 'arrow-go-back-line', run: () => undo() },
  { id: 'redo', label: 'Redo', icon: 'arrow-go-forward-line', run: () => redo() },
];

export function CommandPalette() {
  const isOpen = useStore(isCommandPaletteOpenStore);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => isCommandPaletteOpenStore.set(false);
  useDialogFocus(isOpen, close, panelRef, { initialFocus: inputRef });

  const filtered = useMemo(
    () => COMMANDS.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const activate = (cmd: Command) => {
    close();
    cmd.run();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="presentation">
      <div className="flex min-h-full items-start justify-center p-4 pt-[12vh]">
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity" aria-hidden="true" onClick={close} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          tabIndex={-1}
          className="form-enter relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          <div className="relative border-b border-gray-100">
            <Ri name="search-line" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <label htmlFor="command-search" className="sr-only">
              Search commands
            </label>
            <input
              id="command-search"
              ref={inputRef}
              type="text"
              autoComplete="off"
              placeholder="Search commands…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelected((s) => (filtered.length ? (s + 1) % filtered.length : 0));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelected((s) => (filtered.length ? (s - 1 + filtered.length) % filtered.length : 0));
                } else if (e.key === 'Enter' && filtered[selected]) {
                  e.preventDefault();
                  activate(filtered[selected]);
                }
              }}
              className="h-14 w-full bg-transparent pl-11 pr-14 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
              ESC
            </kbd>
          </div>

          {filtered.length > 0 ? (
            <ul role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-2">
              {filtered.map((cmd, i) => (
                <li key={cmd.id} role="option" aria-selected={i === selected} id={`cmd-${cmd.id}`}>
                  <button
                    type="button"
                    onClick={() => activate(cmd)}
                    onMouseEnter={() => setSelected(i)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus:outline-none',
                      i === selected ? 'bg-yellow-50 text-gray-900 ring-1 ring-inset ring-yellow-200/70' : 'text-gray-600'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                        i === selected ? 'bg-yellow-400 text-yellow-950' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      <Ri name={cmd.icon} size={16} />
                    </span>
                    {cmd.label}
                    {i === selected && <Ri name="keyboard-line" size={14} className="ml-auto text-gray-300" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              No commands match “{query}”. Try “scene”, “export”, or “switch”.
            </p>
          )}

          <div className="flex items-center gap-3 border-t border-gray-100 bg-[#fafaf8] px-4 py-2.5 text-[11px] font-medium text-gray-400">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-bold">↑↓</kbd> navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-bold">↵</kbd> run
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-bold">esc</kbd> close
            </span>
            <span className="ml-auto hidden items-center gap-1 sm:inline-flex">
              opened with <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-bold">⌘K</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
