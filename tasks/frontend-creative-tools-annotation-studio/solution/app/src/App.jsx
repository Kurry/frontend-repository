import Onboarding from './components/Onboarding';
import { useScrollPinDuringPointer } from './components/scrollpin';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@carbon/react';
import {
  Undo, Redo, Search, Menu, Close, Tag, Review, ChartRelationship,
  DocumentExport, Edit, Time, SettingsAdjust, CheckmarkFilled, InformationFilled, ErrorFilled, TaskComplete,
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

// Ranked fuzzy match: every query term must land as a substring, a word
// prefix, or a near-contiguous run inside a single word — loose whole-string
// subsequences are rejected so "Visual" only surfaces visual-grounding results.
function fuzzyScore(text, query) {
  const source = text.toLowerCase();
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  let score = 0;
  for (const term of terms) {
    const index = source.indexOf(term);
    if (index >= 0) {
      score += index === 0 || /[^a-z0-9]/.test(source[index - 1] || ' ') ? 3 : 2;
      continue;
    }
    const words = source.split(/[^a-z0-9]+/).filter(Boolean);
    if (words.some((word) => word.startsWith(term))) { score += 1.5; continue; }
    let matched = false;
    for (const word of words) {
      if (term.length > word.length) continue;
      let at = 0; let gaps = 0; let prev = -2;
      for (let i = 0; i < word.length && at < term.length; i += 1) {
        if (word[i] === term[at]) {
          if (prev >= 0) gaps += i - prev - 1;
          prev = i;
          at += 1;
        }
      }
      if (at === term.length && gaps <= 1) { matched = true; score += 0.5; break; }
    }
    if (!matched) return 0;
  }
  return score;
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
    return all
      .map((result) => ({ result, score: fuzzyScore(`${result.label} ${result.detail}`, state.paletteQuery) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 16)
      .map((entry) => entry.result);
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
    <div className="palette-results" role="listbox">{results.map((result, index) => <button key={`${result.kind}-${result.label}`} role="option" aria-selected={index === state.paletteIndex} className={index === state.paletteIndex ? 'highlighted' : ''} style={{ animationDelay: `${Math.min(index, 8) * 18}ms` }} onMouseEnter={() => state.setPaletteIndex(index)} onClick={() => activate(result)}>{result.icon ? <ClassIcon name={result.icon} /> : <Search size={16} />}<span><strong>{result.label}</strong><small>{result.detail}</small></span><em>{result.kind}</em></button>)}{!results.length && <p className="palette-empty">No items, suites, classes, or views match “{state.paletteQuery}”. Try part of a title, suite, or view name.</p>}</div>
    <footer><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span></footer>
  </div></div>;
}

const toastIcons = { success: CheckmarkFilled, info: InformationFilled, error: ErrorFilled };

function Toast() {
  const toast = useStudioStore((s) => s.toast);
  if (!toast) return null;
  const Icon = toastIcons[toast.kind] || CheckmarkFilled;
  return <div key={toast.id} className={`toast toast-${toast.kind}`} role="status"><Icon size={18} /><span>{toast.message}</span></div>;
}

function Celebration() {
  const celebration = useStudioStore((s) => s.celebration);
  if (!celebration) return null;
  return <div key={celebration.id} className="celebration" role="status" aria-live="polite">
    <div className="confetti" aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} />)}</div>
    <div className="celebration-card"><TaskComplete size={30} /><div><h2>{celebration.suiteName} is fully reviewed</h2><p>Every item in this suite carries a reviewed annotation.</p></div></div>
  </div>;
}

export default function App() {
  const activeView = useStudioStore((s) => s.activeView);
  const undoStack = useStudioStore((s) => s.undoStack);
  const redoStack = useStudioStore((s) => s.redoStack);
  const mobileOpen = useStudioStore((s) => s.mobileSidebarOpen);
  const liveMessage = useStudioStore((s) => s.liveMessage);
  const actionPanelOpen = useStudioStore((s) => s.actionPanelOpen);
  const actionHistory = useStudioStore((s) => s.actionHistory);
  const density = useStudioStore((s) => s.density);
  const items = useStudioStore((s) => s.items);
  const suites = useStudioStore((s) => s.suites);
  const setView = useStudioStore((s) => s.setView);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const openPalette = useStudioStore((s) => s.openPalette);
  const setMobile = useStudioStore((s) => s.setMobileSidebarOpen);
  const setActionPanelOpen = useStudioStore((s) => s.setActionPanelOpen);
  const toggleDensity = useStudioStore((s) => s.toggleDensity);
  const tickAssist = useStudioStore((s) => s.tickAssist);
  const celebratedRef = useRef(new Set());

  useEffect(() => { registerWebMCP(); const interval = window.setInterval(tickAssist, 400); return () => window.clearInterval(interval); }, [tickAssist]);
  useScrollPinDuringPointer();

  useEffect(() => { document.documentElement.dataset.density = density; }, [density]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => { document.documentElement.dataset.reducedMotion = media.matches ? 'true' : 'false'; };
    apply();
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    for (const suite of suites) {
      const suiteItems = suite.itemIds.map((id) => items[id]).filter(Boolean);
      if (suiteItems.length && suiteItems.every((item) => item.review_state === 'reviewed') && !celebratedRef.current.has(suite.id)) {
        celebratedRef.current.add(suite.id);
        useStudioStore.getState().celebrate(suite.name);
      }
    }
  }, [items, suites]);

  useEffect(() => {
    const key = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); openPalette(); return; }
      const target = event.target;
      const tag = target?.tagName;
      const textEditable = tag === 'TEXTAREA'
        || target?.isContentEditable
        || (tag === 'INPUT' && !['range', 'checkbox', 'radio', 'button', 'submit'].includes((target.type || 'text').toLowerCase()));
      if (mod && event.key.toLowerCase() === 'z' && !textEditable) { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [openPalette, undo, redo]);

  const content = activeView === 'annotate' ? <AnnotationCard /> : activeView === 'taxonomy' ? <TaxonomyView /> : activeView === 'review-queue' ? <ReviewView /> : activeView === 'agreement' ? <AgreementView /> : activeView === 'history' ? <HistoryView /> : <ExportView />;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><Button className="mobile-menu" aria-label={mobileOpen ? 'Close queue sidebar' : 'Open queue sidebar'} aria-expanded={mobileOpen} hasIconOnly kind="ghost" size="sm" renderIcon={mobileOpen ? Close : Menu} iconDescription="Toggle queue" onClick={() => setMobile(!mobileOpen)} /><div className="brand-mark">C</div><span><strong>Corvid</strong><small>Annotation studio</small></span></div>
      <nav className="view-switcher" aria-label="Studio views">{views.map((view) => <button key={view.id} aria-current={activeView === view.id ? 'page' : undefined} onClick={() => setView(view.id)}><view.icon size={16} /><span>{view.label}</span></button>)}</nav>
      <div className="toolbar-actions"><Button hasIconOnly kind="ghost" size="sm" renderIcon={Undo} iconDescription="Undo" disabled={!undoStack.length} onClick={undo} /><Button hasIconOnly kind="ghost" size="sm" renderIcon={Redo} iconDescription="Redo" disabled={!redoStack.length} onClick={redo} /><Button className="tablet-optional" hasIconOnly kind="ghost" size="sm" renderIcon={Time} iconDescription="Action history" aria-expanded={actionPanelOpen} onClick={() => setActionPanelOpen(!actionPanelOpen)} /><Button className="tablet-optional" hasIconOnly kind="ghost" size="sm" renderIcon={SettingsAdjust} iconDescription={`Density: ${density} — activate to switch`} aria-pressed={density === 'compact'} onClick={toggleDensity} /><Button className="palette-trigger" kind="ghost" size="sm" renderIcon={Search} onClick={openPalette}>Search <kbd>⌘K</kbd></Button><span className="session-status"><i /> Session only</span></div>
    </header>
    <div className="workspace"><Sidebar />{mobileOpen && <button className="sidebar-scrim" aria-label="Close queue" onClick={() => setMobile(false)} />}<main>{content}</main></div>
    {actionPanelOpen && <aside className="action-panel" aria-label="Recent action history"><header><div><p className="eyebrow">Undo stack</p><h2>Recent actions</h2></div><Button hasIconOnly kind="ghost" size="sm" renderIcon={Close} iconDescription="Close action history" onClick={() => setActionPanelOpen(false)} /></header><div>{actionHistory.length ? actionHistory.map((entry) => <article key={entry.id} className={entry.reverted ? 'reverted' : ''}><Time size={15} /><span><strong>{entry.label}</strong><small>{new Date(entry.at).toLocaleTimeString()} {entry.reverted && '· Undone'}</small></span></article>) : <p className="empty-mini">No annotation actions yet. Submits, skips, regions, taxonomy edits, and review changes appear here.</p>}</div></aside>}
    <CommandPalette /><Toast /><Celebration /><Onboarding /><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>
  </div>;
}
