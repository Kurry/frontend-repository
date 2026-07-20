import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@carbon/react';
import {
  Undo, Redo, Search, Menu, Close, Tag, Review, ChartRelationship,
  DocumentExport, Edit, Time,
} from '@carbon/icons-react';
import Sidebar from './components/Sidebar';
import AnnotationCard from './components/AnnotationCard';
import TaxonomyView from './components/TaxonomyView';
import ReviewView from './components/ReviewView';
import AgreementView from './components/AgreementView';
import HistoryView from './components/HistoryView';
import ExportView from './components/ExportView';
import { ClassIcon } from './icons';
import { useStudioStore } from './store';
import { registerWebMCP } from './webmcp';

const views = [
  { id: 'annotate', label: 'Annotate', icon: Edit },
  { id: 'taxonomy', label: 'Taxonomy', icon: Tag },
  { id: 'review-queue', label: 'Review queue', icon: Review },
  { id: 'agreement', label: 'Agreement', icon: ChartRelationship },
  { id: 'export', label: 'Export', icon: DocumentExport },
];

function fuzzy(text, query) {
  const source = text.toLowerCase(); const target = query.toLowerCase().trim();
  if (!target) return true; if (source.includes(target)) return true;
  let at = 0; for (const char of source) if (char === target[at]) at += 1;
  return at === target.length;
}

function CommandPalette() {
  const state = useStudioStore();
  const inputRef = useRef(null);
  const returnFocus = useRef(null);
  const results = useMemo(() => {
    const all = [
      ...Object.values(state.items).map((item) => ({ kind: 'Item', label: item.title, detail: state.suites.find((s) => s.id === item.suiteId)?.name, activate: () => state.selectItem(item.id) })),
      ...state.suites.map((suite) => ({ kind: 'Suite', label: suite.name, detail: `${suite.itemIds.filter((id) => state.items[id]?.review_state === 'unlabeled').length} remaining`, activate: () => state.selectSuite(suite.id) })),
      ...state.taxonomy.map((cls) => ({ kind: 'Class', label: cls.name, detail: `Shortcut ${cls.shortcut}`, icon: cls.icon, activate: () => { state.setView('taxonomy'); window.setTimeout(() => document.getElementById(`taxonomy-${cls.id}`)?.focus(), 30); } })),
      ...views.map((view) => ({ kind: 'View', label: view.label, detail: 'Studio view', activate: () => state.setView(view.id) })),
      { kind: 'View', label: 'History', detail: 'Saved annotations', activate: () => state.setView('history') },
    ];
    return all.filter((result) => fuzzy(`${result.label} ${result.detail}`, state.paletteQuery)).slice(0, 16);
  }, [state.items, state.suites, state.taxonomy, state.paletteQuery]);
  useEffect(() => {
    if (state.paletteOpen) { returnFocus.current = document.activeElement; window.setTimeout(() => inputRef.current?.focus(), 20); }
  }, [state.paletteOpen]);
  const close = () => { state.closePalette(); window.setTimeout(() => returnFocus.current?.focus(), 20); };
  const activate = (result) => { result.activate(); close(); };
  const keyDown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); state.setPaletteIndex(Math.min(results.length - 1, state.paletteIndex + 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); state.setPaletteIndex(Math.max(0, state.paletteIndex - 1)); }
    if (event.key === 'Enter' && results[state.paletteIndex]) { event.preventDefault(); activate(results[state.paletteIndex]); }
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') { event.preventDefault(); inputRef.current?.focus(); }
  };
  if (!state.paletteOpen) return null;
  return <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={keyDown}>
    <div className="palette-search"><Search size={20} /><input ref={inputRef} aria-label="Search commands" value={state.paletteQuery} onChange={(e) => state.setPaletteQuery(e.target.value)} /><kbd>Esc</kbd></div>
    <div className="palette-results" role="listbox">{results.map((result, index) => <button key={`${result.kind}-${result.label}`} role="option" aria-selected={index === state.paletteIndex} className={index === state.paletteIndex ? 'highlighted' : ''} onMouseEnter={() => state.setPaletteIndex(index)} onClick={() => activate(result)}>{result.icon ? <ClassIcon name={result.icon} /> : <Search size={16} />}<span><strong>{result.label}</strong><small>{result.detail}</small></span><em>{result.kind}</em></button>)}{!results.length && <p className="palette-empty">No items, suites, classes, or views match your search.</p>}</div>
    <footer><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span></footer>
  </div></div>;
}

function Toast() {
  const toast = useStudioStore((s) => s.toast);
  if (!toast) return null;
  return <div className={`toast toast-${toast.kind}`} role="status">{toast.message}</div>;
}

export default function App() {
  const activeView = useStudioStore((s) => s.activeView);
  const undoStack = useStudioStore((s) => s.undoStack);
  const redoStack = useStudioStore((s) => s.redoStack);
  const mobileOpen = useStudioStore((s) => s.mobileSidebarOpen);
  const liveMessage = useStudioStore((s) => s.liveMessage);
  const actionPanelOpen = useStudioStore((s) => s.actionPanelOpen);
  const actionHistory = useStudioStore((s) => s.actionHistory);
  const setView = useStudioStore((s) => s.setView);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const openPalette = useStudioStore((s) => s.openPalette);
  const setMobile = useStudioStore((s) => s.setMobileSidebarOpen);
  const setActionPanelOpen = useStudioStore((s) => s.setActionPanelOpen);
  const tickAssist = useStudioStore((s) => s.tickAssist);
  useEffect(() => { registerWebMCP(); const interval = window.setInterval(tickAssist, 400); return () => window.clearInterval(interval); }, [tickAssist]);
  useEffect(() => {
    const key = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); }
      if (mod && event.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [openPalette, undo, redo]);
  const content = activeView === 'annotate' ? <AnnotationCard /> : activeView === 'taxonomy' ? <TaxonomyView /> : activeView === 'review-queue' ? <ReviewView /> : activeView === 'agreement' ? <AgreementView /> : activeView === 'history' ? <HistoryView /> : <ExportView />;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><Button className="mobile-menu" aria-label="Toggle queue" hasIconOnly kind="ghost" size="sm" renderIcon={mobileOpen ? Close : Menu} iconDescription="Toggle queue" onClick={() => setMobile(!mobileOpen)} /><div className="brand-mark">C</div><span><strong>Corvid</strong><small>Annotation studio</small></span></div>
      <nav className="view-switcher" aria-label="Studio views">{views.map((view) => <button key={view.id} aria-current={activeView === view.id ? 'page' : undefined} onClick={() => setView(view.id)}><view.icon size={16} /><span>{view.label}</span></button>)}</nav>
      <div className="toolbar-actions"><Button hasIconOnly kind="ghost" size="sm" renderIcon={Undo} iconDescription="Undo" disabled={!undoStack.length} onClick={undo} /><Button hasIconOnly kind="ghost" size="sm" renderIcon={Redo} iconDescription="Redo" disabled={!redoStack.length} onClick={redo} /><Button hasIconOnly kind="ghost" size="sm" renderIcon={Time} iconDescription="Action history" aria-expanded={actionPanelOpen} onClick={() => setActionPanelOpen(!actionPanelOpen)} /><Button className="palette-trigger" kind="ghost" size="sm" renderIcon={Search} onClick={openPalette}>Search <kbd>⌘K</kbd></Button><span className="session-status"><i /> Session only</span></div>
    </header>
    <div className="workspace"><Sidebar />{mobileOpen && <button className="sidebar-scrim" aria-label="Close queue" onClick={() => setMobile(false)} />}<main>{content}</main></div>
    {actionPanelOpen && <aside className="action-panel" aria-label="Recent action history"><header><div><p className="eyebrow">Undo stack</p><h2>Recent actions</h2></div><Button hasIconOnly kind="ghost" size="sm" renderIcon={Close} iconDescription="Close action history" onClick={() => setActionPanelOpen(false)} /></header><div>{actionHistory.length ? actionHistory.map((entry) => <article key={entry.id} className={entry.reverted ? 'reverted' : ''}><Time size={15} /><span><strong>{entry.label}</strong><small>{new Date(entry.at).toLocaleTimeString()} {entry.reverted && '· Undone'}</small></span></article>) : <p className="empty-mini">No annotation actions yet. Submits, skips, regions, taxonomy edits, and review changes appear here.</p>}</div></aside>}
    <CommandPalette /><Toast /><div className="sr-only" aria-live="polite">{liveMessage}</div>
  </div>;
}
