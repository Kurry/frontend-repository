import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { loadTheme, setSample, setSearchQuery, setTab, setTool } from '../store/themeSlice';

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
          dispatch(loadTheme(theme.id));
          dispatch(setTab('preview'));
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
  }, [dispatch, onClose, query, themes]);

  useEffect(() => {
    if (open) {
      dispatch(setSearchQuery(''));
      setHighlighted(0);
    }
  }, [dispatch, open]);

  useEffect(() => setHighlighted(0), [query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="command-palette-title">
      <DialogTitle id="command-palette-title" className="!pb-2">Command palette</DialogTitle>
      <DialogContent className="!pt-2">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={event => dispatch(setSearchQuery(event.target.value))}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlighted(current => results.length ? (current + 1) % results.length : 0);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlighted(current => results.length ? (current - 1 + results.length) % results.length : 0);
            } else if (event.key === 'Enter' && results[highlighted]) {
              event.preventDefault();
              results[highlighted].run();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="Search tabs, tools, themes, samples, and components"
          aria-label="Search commands"
          aria-controls="command-palette-results"
          aria-activedescendant={results[highlighted]?.id}
          className="w-full rounded border border-gray-500 px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <div id="command-palette-results" role="listbox" className="mt-3 max-h-[50vh] overflow-auto rounded border border-gray-300">
          {results.map((result, index) => (
            <button
              id={result.id}
              key={result.id}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              onMouseEnter={() => setHighlighted(index)}
              onClick={result.run}
              className={`flex w-full items-center justify-between px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${index === highlighted ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'}`}
            >
              <span>{result.label}</span>
              <span className="text-xs text-gray-500">{result.group}</span>
            </button>
          ))}
          {!results.length && <p className="px-3 py-6 text-center text-gray-500" role="status">No commands match “{query}”.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
