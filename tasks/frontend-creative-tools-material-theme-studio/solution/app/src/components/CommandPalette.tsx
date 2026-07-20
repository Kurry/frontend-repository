import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { announce, loadTheme, setSample, setSearchQuery, setTab, setTool } from '../store/themeSlice';
import Overlay from './Overlay';

type Result = {
  id: string;
  label: string;
  group: string;
  keywords: string;
  run: () => void;
};

const fuzzyMatch = (value: string, query: string) => {
  const haystack = value.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  let index = 0;
  for (const character of haystack) {
    if (character === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
};

const scrollToComponent = (id: string, attempts = 5) => {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(`comp-${id}`);
    if (target) target.scrollIntoView();
    else if (attempts > 1) scrollToComponent(id, attempts - 1);
  });
};

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useDispatch();
  const query = useSelector((state: RootState) => state.theme.searchQuery);
  const themes = useSelector((state: RootState) => state.theme.themes);
  const activeId = useSelector((state: RootState) => state.theme.activeId);
  const dirty = useSelector((state: RootState) => state.theme.dirty);
  const [highlighted, setHighlighted] = useState(0);

  const results = useMemo<Result[]>(() => {
    const closeAfter = (action: () => void) => () => {
      action();
      onClose();
    };
    const items: Result[] = [
      ...(['preview', 'components', 'saved', 'export'] as const).map(tab => ({
        id: `tab-${tab}`,
        label: tab === 'saved' ? 'Saved Themes' : tab[0].toUpperCase() + tab.slice(1),
        group: 'Main tabs',
        keywords: `${tab} navigation tab`,
        run: closeAfter(() => dispatch(setTab(tab))),
      })),
      ...(['palette', 'fonts', 'typography', 'snippets'] as const).map(tool => ({
        id: `tool-${tool}`,
        label: tool[0].toUpperCase() + tool.slice(1),
        group: 'Theme tools',
        keywords: `${tool} editor tool`,
        run: closeAfter(() => {
          dispatch(setTab('preview'));
          dispatch(setTool(tool));
        }),
      })),
      ...themes.map(theme => ({
        id: `theme-${theme.id}`,
        label: theme.name,
        group: 'Saved themes',
        keywords: `${theme.name} saved theme load`,
        run: closeAfter(() => {
          // Mirror the Saved Themes card guard: reloading the already-active
          // theme while it has unsaved edits would silently discard them.
          if (theme.id === activeId && dirty) {
            dispatch(announce(`${theme.name} is already loaded — save or undo your unsaved changes first`));
            return;
          }
          dispatch(loadTheme(theme.id));
          dispatch(setTab('preview'));
          dispatch(announce(`Theme ${theme.name} loaded`));
        }),
      })),
      ...[
        ['instructions', 'Instructions'],
        ['signup', 'Sign Up'],
        ['dashboard', 'Dashboard'],
        ['blog', 'Blog'],
        ['pricing', 'Pricing'],
        ['checkout', 'Checkout'],
      ].map(([id, label]) => ({
        id: `sample-${id}`,
        label,
        group: 'Sample templates',
        keywords: `${label} preview sample template`,
        run: closeAfter(() => {
          dispatch(setTab('preview'));
          dispatch(setSample(id));
        }),
      })),
      ...[
        ['buttons', 'Buttons'],
        ['cards', 'Cards'],
        ['inputs', 'Inputs & Controls'],
        ['data', 'Data Display'],
        ['surfaces', 'Surfaces'],
      ].map(([id, label]) => ({
        id: `component-${id}`,
        label,
        group: 'Component gallery',
        keywords: `${label} component gallery section`,
        run: closeAfter(() => {
          dispatch(setTab('components'));
          scrollToComponent(id);
        }),
      })),
    ];
    return items.filter(item => fuzzyMatch(`${item.label} ${item.keywords}`, query));
  }, [dispatch, onClose, query, themes, activeId, dirty]);

  useEffect(() => {
    if (open) {
      dispatch(setSearchQuery(''));
      setHighlighted(0);
    }
  }, [dispatch, open]);

  useEffect(() => setHighlighted(0), [query]);

  const runHighlighted = () => {
    const result = results[highlighted];
    if (result) result.run();
  };

  return (
    <Overlay open={open} onClose={onClose} labelledBy="command-palette-title" widthClass="w-full max-w-lg">
      <div className="px-5 pt-4 pb-2">
        <h2 id="command-palette-title" className="sr-only">
          Command palette
        </h2>
        <input
          data-autofocus
          type="search"
          value={query}
          onChange={event => dispatch(setSearchQuery(event.target.value))}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlighted(current => (results.length ? (current + 1) % results.length : 0));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlighted(current => (results.length ? (current - 1 + results.length) % results.length : 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              runHighlighted();
            }
          }}
          placeholder="Search tabs, tools, themes, samples, and components"
          aria-label="Search commands"
          aria-controls="command-palette-results"
          aria-activedescendant={results[highlighted]?.id}
          className="w-full rounded border border-gray-400 px-3 py-3 text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <div className="px-5 pb-5">
        <div id="command-palette-results" role="listbox" aria-label="Command results" className="max-h-[46vh] overflow-auto rounded border border-gray-300">
          {results.map((result, index) => (
            <button
              id={result.id}
              key={result.id}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              onMouseEnter={() => setHighlighted(index)}
              onClick={result.run}
              className={`flex w-full items-center justify-between px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 transition-colors duration-150 ${
                index === highlighted ? 'bg-blue-50 text-blue-900' : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{result.label}</span>
              <span className="text-xs text-gray-500">{result.group}</span>
            </button>
          ))}
          {!results.length && (
            <p className="px-3 py-6 text-center text-gray-500" role="status">
              No commands match “{query}”. Press Escape to close.
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          ↑ ↓ to highlight · Enter to run · Esc to close
        </p>
      </div>
    </Overlay>
  );
}
