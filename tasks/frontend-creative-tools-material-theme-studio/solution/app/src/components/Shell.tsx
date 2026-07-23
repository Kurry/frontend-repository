import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@mui/material';
import { RootState } from '../store/store';
import { setTab } from '../store/themeSlice';
import CommandPalette from './CommandPalette';
import ThemeFormPanel from './ThemeFormPanel';
import Overlay from './Overlay';

const TABS = [
  { id: 'preview', label: 'Preview' },
  { id: 'components', label: 'Components' },
  { id: 'saved', label: 'Saved Themes' },
  { id: 'export', label: 'Export' },
] as const;

const TOUR_STEPS = [
  {
    title: 'Preview tools',
    body: 'Reframe the device-framed sample site with Phone / Tablet / Desktop, cycle through six sample templates, apply color-blindness vision filters, and compare Before / After against the last saved snapshot.',
  },
  {
    title: 'Palette and theme tools',
    body: 'Edit intent colors with live WCAG contrast readouts and Harmonics suggestions, add fonts, tune Typography and shape, or apply Snippets presets — every edit rewrites the ThemeOptions source and the preview together.',
  },
  {
    title: 'Saved Themes',
    body: 'Create, rename, load, and delete themes from dense swatch cards; save named version snapshots and restore them at any time.',
  },
  {
    title: 'Export',
    body: 'Copy or download the live-compiled ThemeOptions as JSON or CSS variables, and import a declared-theme package back into the studio.',
  },
];

function TutorialDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const last = step === TOUR_STEPS.length - 1;
  const current = TOUR_STEPS[step];

  return (
    <Overlay open={open} onClose={onClose} labelledBy="tutorial-title" widthClass="w-full max-w-lg">
      <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
        <h2 id="tutorial-title" className="text-lg font-semibold text-gray-900">
          Studio tour
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tutorial"
          className="-mr-1 flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
          Step {step + 1} of {TOUR_STEPS.length} — guided tour
        </p>
        <h3 className="mt-1 text-xl font-semibold text-gray-900">{current.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{current.body}</p>

        <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
          {TOUR_STEPS.map((tourStep, index) => (
            <span
              key={tourStep.title}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
        <Button onClick={onClose} sx={{ minHeight: 44 }}>
          Skip tour
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} sx={{ minHeight: 44 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => (last ? onClose() : setStep(s => s + 1))}
            sx={{ minHeight: 44 }}
            data-autofocus
          >
            {last ? 'Start theming' : 'Next'}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const tab = useSelector((state: RootState) => state.theme.tab);
  const announcement = useSelector((state: RootState) => state.theme.announcement);
  const announceSeq = useSelector((state: RootState) => state.theme.announceSeq);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const tabRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  // Recreated when `tab` changes so the resize listener always measures the
  // currently selected tab instead of a stale closure from mount.
  const measure = useCallback(() => {
    const element = tabRefs.current[tab];
    if (element) setIndicator({ left: element.offsetLeft, width: element.offsetWidth, ready: true });
  }, [tab]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="studio-header flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-gray-700">
        <div className="flex min-w-0 basis-full items-center gap-2 sm:basis-auto sm:gap-4">
          <h1 className="min-w-0 text-lg font-bold sm:text-xl">Material-UI Theme Creator</h1>
          <div className="flex min-w-0 items-center text-sm text-gray-400">
            <span className="mr-2" aria-hidden="true">└─</span>
            <span
              className="min-w-0 break-all px-2 py-1 bg-gray-800 rounded border border-gray-700 cursor-not-allowed select-none"
              title="Inert version chip"
            >
              @material-ui/core@^4.11.0
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm text-gray-300 border border-gray-700 rounded hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-11"
            onClick={() => setPaletteOpen(true)}
            aria-haspopup="dialog"
          >
            Commands <span className="text-gray-500">Ctrl/⌘ K</span>
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-400/10 hover:underline rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-11"
            id="btn-tutorial"
            onClick={() => setTutorialOpen(true)}
          >
            Tutorial
          </button>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors cursor-not-allowed min-w-11 min-h-11 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="GitHub (inert)"
            title="GitHub (inert)"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
              />
            </svg>
          </button>
        </div>
      </header>

      <nav className="studio-nav relative flex px-4 border-b border-gray-700 bg-gray-900" role="tablist" aria-label="Main">
        <div className="flex items-center mr-6">
          <svg viewBox="0 0 24 24" width="28" height="28" role="img" aria-label="Material logo mark">
            <path
              fill="#00b0ff"
              d="M19.37 2.04l-9 2.25a1 1 0 0 0-.74.97v10.9a2.5 2.5 0 1 0 1.5 2.3V9.54l7.5-1.87v7.24a2.5 2.5 0 1 0 1.5 2.3V3a1 1 0 0 0-1.26-.96z"
            />
          </svg>
        </div>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            ref={el => {
              tabRefs.current[t.id] = el;
            }}
            onClick={() => dispatch(setTab(t.id))}
            className={`px-4 py-3 text-sm font-medium transition-[color,background-color,opacity] duration-200 relative outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:z-10 min-w-11 min-h-11 ${
              tab === t.id ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span
          aria-hidden="true"
          className="absolute bottom-0 h-0.5 bg-blue-400 transition-all duration-300 ease-in-out"
          style={{ left: indicator.left, width: indicator.width, opacity: indicator.ready ? 1 : 0 }}
        />
      </nav>

      {/* Below lg the main region itself scrolls (Saved Themes / Export content
          taller than the viewport stays reachable at 768px); at lg+ each tab
          manages its own internal scrolling. */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden relative">{children}</main>

      {/* Polite live region for validation + status announcements. The span is
          re-keyed on every announce dispatch so identical consecutive messages
          still mutate the DOM and re-fire for assistive tech. */}
      <div className="sr-only" role="status" aria-live="polite" data-announcer>
        <span className="block h-px w-px overflow-hidden" key={announceSeq}>{announcement}</span>
      </div>

      <TutorialDialog open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ThemeFormPanel />
    </div>
  );
}
