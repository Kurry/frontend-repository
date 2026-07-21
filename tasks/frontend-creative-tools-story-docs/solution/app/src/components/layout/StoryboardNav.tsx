import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  viewModeStore,
  statusFilterStore,
  searchFilterStore,
  historyStore,
  tutorialProgressStore,
  injectTemplate,
  undo,
  redo,
  resetCanvasPositions,
  SCENE_TEMPLATES,
  type ViewMode,
} from '@/store';
import {
  isExportDrawerOpenStore,
  isImportModalOpenStore,
  showToast,
} from '@/store/ui';
import { Ri, type RiIconName } from '../common/Ri';
import { clsx } from 'clsx';

const MODES: { mode: ViewMode; label: string; icon: RiIconName }[] = [
  { mode: 'tile', label: 'Tile', icon: 'apps-line' },
  { mode: 'list', label: 'List', icon: 'list-unordered' },
  { mode: 'slide', label: 'Slide', icon: 'slideshow-line' },
  { mode: 'canvas', label: 'Canvas', icon: 'drag-move-2-line' },
];

function TemplatesMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const inject = (id: string) => {
    const result = injectTemplate(id);
    setOpen(false);
    triggerRef.current?.focus();
    if (result) showToast(`${result.name} Added ${result.added} Scenes`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors',
          'hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
          open && 'border-yellow-400 bg-yellow-50 text-yellow-800'
        )}
      >
        <Ri name="sparkling-2-fill" size={16} className="text-yellow-500" />
        Templates
      </button>
      {open && (
        <ul
          role="menu"
          aria-label="Scene templates"
          onKeyDown={(e) => {
            const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
            const cur = items.findIndex((el) => el === document.activeElement);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              items[(cur + 1) % items.length]?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              items[(cur - 1 + items.length) % items.length]?.focus();
            }
          }}
          className="menu-pop absolute left-0 z-40 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
        >
          {SCENE_TEMPLATES.map((t, i) => (
            <li key={t.id} role="none">
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                type="button"
                onClick={() => inject(t.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-yellow-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                <span>{t.name}</span>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                  {t.scenes.length} scenes
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StoryboardNav() {
  const viewMode = useStore(viewModeStore);
  const statusFilter = useStore(statusFilterStore);
  const searchFilter = useStore(searchFilterStore);
  const history = useStore(historyStore);
  const progress = useStore(tutorialProgressStore);

  const switchMode = (mode: ViewMode) => {
    if (viewModeStore.get() === mode) return;
    viewModeStore.set(mode);
    const label = MODES.find((m) => m.mode === mode)?.label ?? mode;
    showToast(`${label} Mode`);
  };

  return (
    <nav
      aria-label="Storyboard controls"
      className="storyboard-nav sticky top-16 z-20 -mx-4 mb-6 border-b border-gray-200/70 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="status-filter" className="sr-only">
          Filter scenes by status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => statusFilterStore.set(e.target.value as 'all' | 'draft' | 'review' | 'ready')}
          className="h-11 w-32 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="ready">Ready</option>
        </select>

        <div className="relative min-w-0 flex-1 sm:max-w-60">
          <Ri
            name="search-line"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <label htmlFor="search-scenes" className="sr-only">
            Search scenes by title or description
          </label>
          <input
            id="search-scenes"
            type="search"
            placeholder="Search scenes"
            value={searchFilter}
            onChange={(e) => searchFilterStore.set(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          />
        </div>

        <TemplatesMenu />

        {viewMode === 'canvas' && (
          <button
            type="button"
            onClick={() => {
              resetCanvasPositions();
              showToast('Canvas Layout Reset');
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="refresh-line" size={16} />
            Reset Layout
          </button>
        )}

        {/* Tutorial progress — live tutorial-wide checklist readout */}
        <div
          className="hidden items-center gap-2 rounded-xl bg-yellow-50 px-3 py-2 ring-1 ring-inset ring-yellow-200/70 md:flex"
          title="Tutorial checklist progress across all scenes"
        >
          <Ri name="checkbox-circle-line" size={16} className="text-yellow-600" />
          <div className="flex items-center gap-2" aria-label={`Tutorial progress: ${progress.checked} of ${progress.total} checklist items complete`}>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-yellow-200/70">
              <div
                className="h-full rounded-full bg-yellow-500 transition-[width] duration-500 ease-out"
                style={{ width: progress.total ? `${(progress.checked / progress.total) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums text-yellow-800">
              {progress.checked}/{progress.total}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => undo()}
            disabled={history.past.length === 0}
            aria-label="Undo"
            title="Undo"
            className="grid h-11 w-11 place-items-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:pointer-events-none disabled:opacity-30"
          >
            <Ri name="arrow-go-back-line" size={19} />
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={history.future.length === 0}
            aria-label="Redo"
            title="Redo"
            className="grid h-11 w-11 place-items-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:pointer-events-none disabled:opacity-30"
          >
            <Ri name="arrow-go-forward-line" size={19} />
          </button>

          <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={() => isImportModalOpenStore.set(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:px-3.5"
          >
            <Ri name="upload-2-line" size={16} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            type="button"
            onClick={() => isExportDrawerOpenStore.set(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:px-3.5"
          >
            <Ri name="download-2-line" size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-1 rounded-xl bg-gray-100 p-1"
          role="group"
          aria-label="View mode"
        >
          {MODES.map(({ mode, label, icon }) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => switchMode(mode)}
                aria-pressed={active}
                aria-label={`${label} view`}
                title={`${label} view`}
                className={clsx(
                  'grid h-11 w-12 place-items-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:w-16',
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-200/60 hover:text-gray-800 active:scale-95'
                )}
              >
                <span className="flex flex-col items-center gap-0.5">
                  <Ri name={icon} size={18} />
                  <span className="text-[10px] font-bold leading-none tracking-wide">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="hidden text-xs font-medium text-gray-400 sm:block">
          Press <kbd className="rounded-md border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-gray-500">⌘K</kbd> for
          commands
        </p>
      </div>
    </nav>
  );
}
