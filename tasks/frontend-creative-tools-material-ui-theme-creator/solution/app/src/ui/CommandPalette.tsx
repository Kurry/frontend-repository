import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { COMPONENT_SECTIONS } from './ComponentsGallery';
import { Icon, Modal } from './primitives';

interface Cmd {
  id: string;
  label: string;
  group: string;
  run: () => void;
}

function scrollToId(id: string) {
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}

export function CommandPalette() {
  const open = useStore((s) => s.commandOpen);
  const setOpen = useStore((s) => s.setCommandOpen);
  const query = useStore((s) => s.commandQuery);
  const setQuery = useStore((s) => s.setCommandQuery);
  const setTab = useStore((s) => s.setTab);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const loadTheme = useStore((s) => s.loadTheme);
  const savedThemes = useStore((s) => s.savedThemes);
  const [cursor, setCursor] = useState(0);

  const commands: Cmd[] = useMemo(() => {
    const c: Cmd[] = [
      { id: 'tab-preview', label: 'Go to Preview', group: 'Tabs', run: () => setTab('preview') },
      { id: 'tab-components', label: 'Go to Components', group: 'Tabs', run: () => setTab('components') },
      { id: 'tab-saved', label: 'Go to Saved Themes', group: 'Tabs', run: () => setTab('saved') },
      { id: 'tool-palette', label: 'Open Palette Tool', group: 'Tools', run: () => { setTab('preview'); scrollToId('tool-palette'); } },
      { id: 'tool-fonts', label: 'Open Fonts Tool', group: 'Tools', run: () => { setTab('preview'); scrollToId('tool-fonts'); } },
      { id: 'tool-typography', label: 'Open Typography Tool', group: 'Tools', run: () => { setTab('preview'); scrollToId('tool-typography'); } },
      { id: 'tool-shape', label: 'Open Shape Tool', group: 'Tools', run: () => { setTab('preview'); scrollToId('tool-shape'); } },
      { id: 'tool-snippets', label: 'Open Snippets Tool', group: 'Tools', run: () => { setTab('preview'); scrollToId('tool-snippets'); } },
      { id: 'tool-export', label: 'Open Export (Theme Files)', group: 'Tools', run: () => setExportOpen(true) }
    ];
    for (const t of savedThemes) c.push({ id: `saved-${t.id}`, label: `Load Theme: ${t.name}`, group: 'Saved Themes', run: () => loadTheme(t.id) });
    for (const s of COMPONENT_SECTIONS) c.push({ id: `comp-${s.id}`, label: `Component: ${s.title}`, group: 'Components', run: () => { setTab('components'); scrollToId(`comp-${s.id}`); } });
    return c;
  }, [savedThemes, setTab, setExportOpen, loadTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      let qi = 0;
      const label = c.label.toLowerCase();
      for (let i = 0; i < label.length && qi < q.length; i++) if (label[i] === q[qi]) qi++;
      return qi === q.length || label.includes(q);
    });
  }, [commands, query]);

  React.useEffect(() => setCursor(0), [query, open]);

  const runAt = (i: number) => {
    const cmd = filtered[i];
    if (!cmd) return;
    cmd.run();
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="cmd-title" width={560}>
      <div
        className="p-2"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            runAt(cursor);
          }
        }}
      >
        <h2 id="cmd-title" className="sr-only">
          Command Palette
        </h2>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-shell-border">
          <Icon name="search" className="text-shell-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Command palette query"
            placeholder="Search tabs, tools, themes, and components"
            className="bg-transparent text-sm text-shell-text outline-none flex-1"
          />
          <kbd className="text-[10px] text-shell-muted border border-shell-border rounded px-1">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-auto scrollbar-thin py-1" role="listbox" aria-label="Commands">
          {filtered.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => runAt(i)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${i === cursor ? 'bg-accent text-white' : 'text-shell-text'}`}
              >
                {c.label}
                <span className={`text-[11px] ${i === cursor ? 'text-white/80' : 'text-shell-muted'}`}>{c.group}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-shell-muted">No commands match “{query}”.</li>}
        </ul>
      </div>
    </Modal>
  );
}
