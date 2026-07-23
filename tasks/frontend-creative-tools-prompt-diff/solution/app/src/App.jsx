import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Checkbox, ComposedModal, ModalBody, ModalFooter, ModalHeader,
  ProgressBar, Search, Select, SelectItem, Tag, TextArea, TextInput, Toggle,
} from '@carbon/react';
import {
  ArrowLeft, ArrowRight, Branch, ChartRelationship, Chat, Checkmark, ChevronDown, Code, Copy,
  Document, Download, Export as ExportIcon, Help, ImportExport, Menu, Redo, Renew,
  SettingsAdjust, Undo,
} from '@carbon/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStudioStore } from './store.js';
import { annotationCreateSchema, annotationReplySchema, formatZodError, restoreCreateSchema, versionPackageSchema } from './schemas.js';
import { artifactForTab, buildVersionPackage, getMergedText } from './artifacts.js';
import { computeDiff, counterLabel, stampLabel } from './diff.js';
import './webmcp.js';

const MODES = [
  { id: 'diff', label: 'Diff', icon: Code },
  { id: 'compare-branches', label: 'Compare branches', icon: Branch },
  { id: 'blame', label: 'Blame', icon: Document },
  { id: 'graph', label: 'Graph', icon: ChartRelationship },
];

/* ---------------- dialog behavior: focus trap, Escape, focus return -------- */

const dialogStack = [];

function topModalContainer() {
  const containers = [...document.querySelectorAll('.cds--modal-container')].filter((el) => el.closest('.is-visible') || el.classList.contains('is-visible'));
  return containers[containers.length - 1] || null;
}

function focusablesIn(root) {
  return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && !el.hasAttribute('data-focus-disabled') && el.getClientRects().length > 0);
}

// While open: Escape closes (topmost dialog only), Tab cycles within the
// dialog, and on close focus returns to the control that opened it.
function useDialogControls(open, onClose, { containerRef, openerRef } = {}) {
  const idRef = useRef(null);
  if (!idRef.current) idRef.current = Symbol('dialog');
  useEffect(() => {
    if (!open) return undefined;
    const id = idRef.current;
    dialogStack.push(id);
    const onKey = (event) => {
      if (dialogStack[dialogStack.length - 1] !== id) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const root = containerRef?.current || topModalContainer() || document.body;
      const items = focusablesIn(root);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (active === last || !root.contains(active))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      const index = dialogStack.indexOf(id);
      if (index >= 0) dialogStack.splice(index, 1);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose, containerRef]);
  useEffect(() => {
    if (open) return undefined;
    const target = openerRef?.current;
    if (!target) return undefined;
    // Defer so a dialog opening in the same commit (e.g. merge confirmation
    // replacing the merge flow) can claim focus before we restore it. Clear the
    // remembered opener only once focus actually returns: while a hand-off
    // dialog owns the stack, keep the opener so it can restore focus to the
    // originating control when it closes.
    const timer = window.setTimeout(() => {
      if (dialogStack.length !== 0) return;
      openerRef.current = null;
      if (target.isConnected) target.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, openerRef]);
}

const rememberOpener = (openerRef) => (event) => { openerRef.current = event.currentTarget; };

// Stable opener refs shared between the toolbar buttons and the modals they
// open, so focus returns to the exact originating control on close.
const restoreOpenerRef = { current: null };
const annotateOpenerRef = { current: null };
const shortcutsOpenerRef = { current: null };

/* ------------------------------ shared helpers ---------------------------- */

function useCurrent() {
  const state = useStudioStore();
  const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
  const base = prompt?.versions.find((version) => version.versionId === state.baseVersionId);
  const compare = prompt?.versions.find((version) => version.versionId === state.compareVersionId);
  const diff = useMemo(
    () => computeDiff(base?.text || '', compare?.text || '', { ignoreWhitespace: state.ignoreWhitespace, ignoreCase: state.ignoreCase }),
    [base?.text, compare?.text, state.ignoreWhitespace, state.ignoreCase],
  );
  return { state, prompt, base, compare, diff };
}

function pulseTarget(target) {
  target.classList.remove('counter-pulse');
  // force reflow so the pulse restarts on repeated clicks
  void target.offsetWidth;
  target.classList.add('counter-pulse');
  window.setTimeout(() => target.classList.remove('counter-pulse'), 650);
}

function scrollDiffTo(type) {
  const container = document.querySelector('.diff-scroll') || document.querySelector('.unified-diff')?.parentElement;
  const target = document.querySelector(`[data-change="${type}"]`);
  if (!container || !target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containerTop = container.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  // Start the required ~400 ms highlight on activation so it is observable
  // immediately, including while the container performs its smooth scroll.
  pulseTarget(target);
  container.scrollTo({ top: container.scrollTop + targetTop - containerTop - container.clientHeight / 2 + target.clientHeight / 2, behavior: reduce ? 'auto' : 'smooth' });
}

function stepChange(direction) {
  const container = document.querySelector('.diff-scroll');
  if (!container) return;
  const changes = [...document.querySelectorAll('[data-change]')];
  if (!changes.length) return;
  const containerTop = container.getBoundingClientRect().top;
  const mid = containerTop + container.clientHeight / 2;
  const target = direction > 0
    ? (changes.find((el) => el.getBoundingClientRect().top > mid + 4) || changes[changes.length - 1])
    : ([...changes].reverse().find((el) => el.getBoundingClientRect().top < mid - 44) || changes[0]);
  container.scrollTo({ top: container.scrollTop + target.getBoundingClientRect().top - containerTop - container.clientHeight / 2 + target.clientHeight / 2, behavior: 'smooth' });
  window.setTimeout(() => pulseTarget(target), 240);
}

function announceInvalid(errors) {
  const first = Object.values(errors || {})[0];
  const message = first?.message || 'The form has validation errors. Check the highlighted fields.';
  useStudioStore.getState().announce(`Not submitted. ${message}`);
}

/* --------------------------------- header --------------------------------- */

const versionLabel = (version, stampMode) => {
  const note = version.changeNote.length > 80 ? `${version.changeNote.slice(0, 80)}…` : version.changeNote;
  return `v${version.versionNumber} · ${stampLabel(version.timestamp, stampMode)} · ${version.author} · ${note}`;
};

function AppHeader() {
  const state = useStudioStore();
  const query = state.globalSearchQuery.trim().toLocaleLowerCase();
  const exportOpener = useRef(null);
  const results = useMemo(() => {
    if (!query) return [];
    const matches = [];
    state.prompts.forEach((item) => item.versions.forEach((version) => {
      const lower = version.text.toLocaleLowerCase();
      const index = lower.indexOf(query);
      if (index >= 0) {
        const start = Math.max(0, index - 42); const end = Math.min(version.text.length, index + query.length + 66);
        matches.push({ prompt: item, version, before: version.text.slice(start, index), match: version.text.slice(index, index + query.length), after: version.text.slice(index + query.length, end) });
      }
    }));
    return matches.slice(0, 12);
  }, [query, state.prompts]);
  const openResult = (result) => {
    state.selectPrompt(result.prompt.id);
    queueMicrotask(() => useStudioStore.getState().setBaseVersion(result.version.versionId));
    state.setGlobalSearchQuery(''); state.setActiveMode('diff');
  };
  return <header className="app-header">
    <div className="brand-block">
      <div className="brand-mark" aria-hidden="true"><Code size={19} /></div>
      <div><h1>Prompt Ledger</h1><p>Version &amp; diff studio</p></div>
    </div>
    <div className="global-search-wrap">
      <Search id="global-version-search" labelText="Search every prompt version" placeholder="Search across every version…" value={state.globalSearchQuery} onChange={(event) => state.setGlobalSearchQuery(event.target.value)} size="lg" />
      {query ? <div className="search-popover" role="listbox" aria-label="Version search results">
        {results.length ? results.map((result) => <button type="button" className="search-result" key={`${result.prompt.id}-${result.version.versionId}`} onClick={() => openResult(result)}>
          <span className="search-result-meta">{result.prompt.title} <Tag size="sm" type="cool-gray">v{result.version.versionNumber}</Tag></span>
          <span className="search-snippet">…{result.before}<mark>{result.match}</mark>{result.after}…</span>
        </button>) : <div className="search-empty" role="option" aria-selected="false"><strong>No versions match “{state.globalSearchQuery}”.</strong><span>Try a phrase from a prompt’s instructions, or clear the search to see every version again.</span></div>}
      </div> : null}
    </div>
    <div className="header-actions">
      <Button kind="ghost" size="md" hasIconOnly renderIcon={Undo} iconDescription="Undo" tooltipPosition="bottom" disabled={!state.undoStack.length} onClick={state.undo} />
      <Button kind="ghost" size="md" hasIconOnly renderIcon={Redo} iconDescription="Redo" tooltipPosition="bottom" disabled={!state.redoStack.length} onClick={state.redo} />
      <Button kind="ghost" size="md" hasIconOnly renderIcon={Help} iconDescription="Keyboard shortcuts (?)" tooltipPosition="bottom" onClick={(event) => { rememberOpener(shortcutsOpenerRef)(event); state.setShortcutsOpen(true); }} />
      <PrefsMenu />
      <Button className="export-button" kind="tertiary" size="md" renderIcon={ExportIcon} onClick={(event) => { rememberOpener(exportOpener)(event); state.setExportOpen(true); }}>Export</Button>
      <Button className="mobile-menu" kind="ghost" size="md" hasIconOnly renderIcon={Menu} iconDescription="Open prompt rail" aria-label="Open prompt rail" onClick={() => state.setSidebarOpen(true)} />
    </div>
    <ExportModal openerRef={exportOpener} />
  </header>;
}

function PrefsMenu() {
  const state = useStudioStore();
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!state.prefsOpen) return undefined;
    const onDown = (event) => { if (wrapRef.current && !wrapRef.current.contains(event.target)) state.setPrefsOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') state.setPrefsOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [state.prefsOpen, state]);
  return <div className="prefs-wrap" ref={wrapRef}>
    <Button kind="ghost" size="md" hasIconOnly renderIcon={SettingsAdjust} iconDescription="Session preferences" tooltipPosition="bottom" aria-expanded={state.prefsOpen} onClick={() => state.setPrefsOpen(!state.prefsOpen)} />
    {state.prefsOpen && <div className="prefs-popover" role="dialog" aria-label="Session preferences">
      <span className="eyebrow">Session preferences</span>
      <div className="pref-row"><span className="pref-label">Timestamps</span>
        <div className="segment" role="group" aria-label="Timestamp format">
          <button type="button" aria-pressed={state.prefs.stampMode === 'relative'} onClick={() => state.setPrefs({ stampMode: 'relative' })}>Relative</button>
          <button type="button" aria-pressed={state.prefs.stampMode === 'absolute'} onClick={() => state.setPrefs({ stampMode: 'absolute' })}>Absolute</button>
        </div>
      </div>
      <div className="pref-row"><span className="pref-label">Diff density</span>
        <div className="segment" role="group" aria-label="Diff density">
          <button type="button" aria-pressed={state.prefs.density === 'comfortable'} onClick={() => state.setPrefs({ density: 'comfortable' })}>Comfortable</button>
          <button type="button" aria-pressed={state.prefs.density === 'compact'} onClick={() => state.setPrefs({ density: 'compact' })}>Compact</button>
        </div>
      </div>
      <p className="pref-hint">Applies instantly to pickers, history, blame, and export previews for this session.</p>
    </div>}
  </div>;
}

/* ------------------------------- prompt rail ------------------------------ */

function PromptRail({ prompt }) {
  const state = useStudioStore();
  const query = state.promptQuery.toLocaleLowerCase();
  const visible = state.prompts.filter((item) => item.title.toLocaleLowerCase().includes(query) || item.description.toLocaleLowerCase().includes(query));
  const versions = [...(prompt?.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);
  const selected = state.historySelection[prompt?.id] || [];
  const railRef = useRef(null);
  useEffect(() => {
    if (!state.sidebarOpen) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') state.setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.sidebarOpen, state]);
  return <aside className={`left-rail ${state.sidebarOpen ? 'is-open' : ''}`} aria-label="Prompts and version history" ref={railRef}>
    <div className="rail-top">
      <div className="rail-heading"><div><span className="eyebrow">Library</span><h2>Prompts</h2></div><Button className="rail-close" kind="ghost" size="sm" hasIconOnly iconDescription="Close prompt rail" renderIcon={ArrowLeft} onClick={() => state.setSidebarOpen(false)} /></div>
      <Search id="prompt-picker-search" labelText="Filter prompts" placeholder="Filter prompts…" size="md" value={state.promptQuery} onChange={(event) => state.setPromptQuery(event.target.value)} />
      <div className="prompt-list" role="listbox" aria-label="Prompt picker">
        {visible.map((item) => <button type="button" role="option" aria-selected={item.id === state.selectedPromptId} key={item.id} className={`prompt-card ${item.id === state.selectedPromptId ? 'selected' : ''}`} onClick={() => { state.selectPrompt(item.id); state.setSidebarOpen(false); }}>
          <span className="prompt-card-title">{item.title}</span><span className="prompt-card-desc">{item.description}</span><span className="prompt-card-count">{item.versions.length} versions</span>
        </button>)}
        {!visible.length && <div className="rail-empty" role="status">No prompts match “{state.promptQuery}”. Clear the filter to restore the full prompt list.</div>}
      </div>
    </div>
    <div className="history-section" id="history-list">
      <div className="history-heading"><div><span className="eyebrow">Selected prompt</span><h2>Version history</h2></div>{selected.length >= 2 && <Tag type="blue" size="sm">{selected.length} selected</Tag>}</div>
      <p className="history-help">Select two or more versions to export a focused package. Change notes over 80 characters show in full here.</p>
      <div className="history-list">
        {versions.map((version, index) => <article className={`history-row kind-${version.kind} ${state.newNodeId === version.versionId ? 'is-new' : ''}`} key={version.versionId}>
          <div className="history-check"><Checkbox id={`history-${version.versionId}`} hideLabel labelText={`Include v${version.versionNumber} in export`} checked={selected.includes(version.versionId)} onChange={() => state.toggleHistorySelection(version.versionId)} /></div>
          <button type="button" className="history-main" onClick={() => state.setBaseVersion(version.versionId)}>
            <span className="history-title"><strong>v{version.versionNumber}</strong>{index === 0 && <Tag type="green" size="sm">Head</Tag>}<Tag type={version.kind === 'branch' ? 'purple' : version.kind === 'merge' ? 'teal' : version.kind === 'restore' ? 'blue' : 'cool-gray'} size="sm">{version.kind}</Tag></span>
            <span className="history-meta">{version.author} · {stampLabel(version.timestamp, state.prefs.stampMode)}</span>
            <span className="history-note">{version.changeNote}</span>
          </button>
        </article>)}
      </div>
    </div>
  </aside>;
}

/* ------------------------------- toolbar row ------------------------------ */

function WorkspaceToolbar({ prompt, base, compare, diff }) {
  const state = useStudioStore();
  const versions = [...(prompt?.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);
  const stampMode = state.prefs.stampMode;
  return <>
    <section className="picker-row" aria-label="Version selection">
      <div className="picker-block base-picker">
        <span className="picker-kicker"><span className="base-dot" />Base version</span>
        <Select id="base-version-picker" labelText="Base version" hideLabel value={base?.versionId || ''} onChange={(event) => state.setBaseVersion(event.target.value)}>
          {versions.map((version) => <SelectItem key={version.versionId} value={version.versionId} text={versionLabel(version, stampMode)} />)}
        </Select>
        {base && <span className="picker-author">{base.author} · {base.changeNote}</span>}
      </div>
      <div className="swap-glyph" aria-hidden="true"><ArrowRight size={18} /></div>
      <div className="picker-block compare-picker">
        <span className="picker-kicker"><span className="compare-dot" />Compare version</span>
        <Select id="compare-version-picker" labelText="Compare version" hideLabel value={compare?.versionId || ''} onChange={(event) => state.setCompareVersion(event.target.value)}>
          {versions.map((version) => <SelectItem key={version.versionId} value={version.versionId} text={versionLabel(version, stampMode)} />)}
        </Select>
        {compare && <span className="picker-author">{compare.author} · {compare.changeNote}</span>}
      </div>
      <div className="restore-actions">
        <Button size="sm" kind="ghost" renderIcon={Renew} disabled={!base} onClick={(event) => { rememberOpener(restoreOpenerRef)(event); state.setRestoreDialog({ side: 'base', versionId: base.versionId }); }}>Restore to base</Button>
        <Button size="sm" kind="ghost" renderIcon={Renew} disabled={!compare} onClick={(event) => { rememberOpener(restoreOpenerRef)(event); state.setRestoreDialog({ side: 'compare', versionId: compare.versionId }); }}>Restore to compare</Button>
      </div>
    </section>
    <section className="mode-options-row">
      <nav className="mode-tabs" aria-label="Studio modes">
        {MODES.map(({ id, label, icon }) => <Button key={id} size="sm" kind="ghost" renderIcon={icon} className={state.activeMode === id ? 'active' : ''} aria-current={state.activeMode === id ? 'page' : undefined} onClick={() => state.setActiveMode(id)}>{label}</Button>)}
      </nav>
      <div className="diff-options">
        <div className="view-switch" role="group" aria-label="Diff layout">
          <Button size="sm" kind={state.diffView === 'split' ? 'secondary' : 'ghost'} aria-pressed={state.diffView === 'split'} onClick={() => state.setDiffView('split')}>Split</Button>
          <Button size="sm" kind={state.diffView === 'unified' ? 'secondary' : 'ghost'} aria-pressed={state.diffView === 'unified'} onClick={() => state.setDiffView('unified')}>Unified</Button>
        </div>
        <div className="toggle-tap" title="Whitespace-only differences (leading, trailing, or repeated spaces) compare as unchanged when on.">
          <Toggle id="ignore-whitespace" size="sm" labelText="Ignore whitespace" labelA="Off" labelB="On" toggled={state.ignoreWhitespace} onToggle={state.setIgnoreWhitespace} />
        </div>
        <div className="toggle-tap" title="Letter-case-only differences compare as unchanged when on.">
          <Toggle id="ignore-case" size="sm" labelText="Ignore case" labelA="Off" labelB="On" toggled={state.ignoreCase} onToggle={state.setIgnoreCase} />
        </div>
      </div>
    </section>
    <section className="summary-strip" aria-label="Change summary">
      <button type="button" className="summary-counter added" title="Click to scroll to the first added line and pulse it" onClick={() => scrollDiffTo('added')} disabled={!diff.counters.linesAdded}><span className="counter-value">{counterLabel(diff.counters.linesAdded)}</span><span>Lines added</span></button>
      <button type="button" className="summary-counter removed" title="Click to scroll to the first removed line and pulse it" onClick={() => scrollDiffTo('removed')} disabled={!diff.counters.linesRemoved}><span className="counter-value">{counterLabel(-diff.counters.linesRemoved)}</span><span>Lines removed</span></button>
      <button type="button" className="summary-counter tokens" title="Net token delta: whitespace-delimited tokens in compare minus tokens in base. Click to jump to the dominant change type." onClick={() => scrollDiffTo(diff.counters.netTokenDelta >= 0 ? 'added' : 'removed')} disabled={diff.identical}><span className="counter-value">{counterLabel(diff.counters.netTokenDelta)}</span><span>Net tokens</span></button>
      <span className="summary-context">Derived live from v{base?.versionNumber} → v{compare?.versionNumber}</span>
    </section>
  </>;
}

/* -------------------------------- diff surface ---------------------------- */

function AnnotationMarker({ annotation }) {
  const state = useStudioStore();
  return <Button className={`thread-marker ${annotation.resolved ? 'resolved' : ''}`} kind="ghost" size="sm" hasIconOnly renderIcon={Chat} iconDescription={`Open annotation by ${annotation.author} on lines ${annotation.lineStart}–${annotation.lineEnd}`} onClick={() => state.setThreadOpen(annotation.annotationId)} />;
}

function WordLine({ line }) {
  return <span className="line-code">{line.words.map((word, index) => <span key={index} className={word.changed ? 'word-changed' : ''}>{word.text}</span>)}</span>;
}

function DiffLine({ line, side, annotations, rowIndex, linkedIndex, setLinkedIndex, marker = true }) {
  if (!line) return <div className="diff-line filler" aria-hidden="true"><span className="gutter-sign" /><span className="line-number" /><span className="line-code" /></div>;
  const anchored = annotations.filter((item) => item.lineStart === line.number);
  return <div
    className={`diff-line ${line.type} ${linkedIndex === rowIndex ? 'linked-hover' : ''}`}
    data-line-number={line.number} data-side={side}
    data-change={line.type === 'added' || line.type === 'removed' ? line.type : undefined}
    aria-label={`Line ${line.number}${line.type === 'added' ? ', added' : line.type === 'removed' ? ', removed' : ''}`}
    onMouseEnter={setLinkedIndex ? () => setLinkedIndex(rowIndex) : undefined}
    onMouseLeave={setLinkedIndex ? () => setLinkedIndex(null) : undefined}
  >
    <span className="gutter-sign" aria-hidden="true">{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ''}</span>
    <span className="line-number">{line.number}</span><WordLine line={line} />
    {marker && anchored.map((annotation) => <AnnotationMarker key={annotation.annotationId} annotation={annotation} />)}
  </div>;
}

function handleRangeSelection(setSelectedRange) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
  const elementFor = (node) => (node?.nodeType === Node.TEXT_NODE ? node.parentElement : node)?.closest?.('[data-line-number]');
  const start = elementFor(selection.anchorNode); const end = elementFor(selection.focusNode);
  if (!start || !end) return;
  const numbers = [Number(start.dataset.lineNumber), Number(end.dataset.lineNumber)];
  if (numbers.some(Number.isNaN)) return;
  setSelectedRange({ lineStart: Math.min(...numbers), lineEnd: Math.max(...numbers) });
}

function SelectionBar() {
  const state = useStudioStore();
  if (!state.selectedRange) return null;
  return <div className="selection-bar" role="status"><span>Lines {state.selectedRange.lineStart}–{state.selectedRange.lineEnd} selected</span><Button size="sm" renderIcon={Chat} onClick={(event) => { rememberOpener(annotateOpenerRef)(event); state.setAnnotationComposerOpen(true); }}>Annotate range</Button><Button kind="ghost" size="sm" onClick={() => state.setSelectedRange(null)}>Clear</Button></div>;
}

function DiffSurface({ diff, annotations, base, compare }) {
  const state = useStudioStore();
  const [linkedIndex, setLinkedIndex] = useState(null);
  if (diff.identical) return <div className="empty-state identical-state" role="status"><div className="empty-icon"><Checkmark size={26} /></div><h2>The versions are identical</h2><p>No line, word, whitespace, or case differences remain between v{base?.versionNumber} and v{compare?.versionNumber} with the current options. Turn off Ignore whitespace or Ignore case to re-check.</p></div>;
  return <div className={`diff-scroll diff-${state.diffView}`} onMouseUp={() => handleRangeSelection(state.setSelectedRange)}>
    {state.diffView === 'split' ? <>
      <div className="mobile-pane-switch" role="group" aria-label="Visible comparison pane"><Button size="sm" kind={state.mobilePane === 'base' ? 'secondary' : 'ghost'} aria-pressed={state.mobilePane === 'base'} onClick={() => state.setMobilePane('base')}>Base v{base?.versionNumber}</Button><Button size="sm" kind={state.mobilePane === 'compare' ? 'secondary' : 'ghost'} aria-pressed={state.mobilePane === 'compare'} onClick={() => state.setMobilePane('compare')}>Compare v{compare?.versionNumber}</Button></div>
      <div className={`split-diff mobile-${state.mobilePane}`}>
        <div className="pane-caption base-caption"><span>BASE · v{base?.versionNumber}</span><span>{base?.author}</span></div>
        <div className="pane-caption compare-caption"><span>COMPARE · v{compare?.versionNumber}</span><span>{compare?.author}</span></div>
        {diff.rows.map((row, rowIndex) => <React.Fragment key={row.key}><DiffLine line={row.left} side="base" annotations={annotations} rowIndex={rowIndex} linkedIndex={linkedIndex} setLinkedIndex={setLinkedIndex} /><DiffLine line={row.right} side="compare" annotations={annotations} rowIndex={rowIndex} linkedIndex={linkedIndex} setLinkedIndex={setLinkedIndex} /></React.Fragment>)}
      </div>
    </> : <div className="unified-diff">
      <div className="unified-caption">UNIFIED CHANGES · 3 lines of context</div>
      {diff.unifiedRows.map((row) => row.separator ? <div key={row.key} className="diff-separator">•••</div> : <div key={row.key} className={`unified-row ${row.line.type}`} data-line-number={row.line.number} data-change={row.line.type === 'added' || row.line.type === 'removed' ? row.line.type : undefined}>
        <span className="gutter-sign">{row.line.type === 'added' ? '+' : row.line.type === 'removed' ? '−' : ''}</span><span className="line-number old">{row.oldNumber || (row.side === 'left' ? row.line.number : '')}</span><span className="line-number new">{row.side !== 'left' ? row.line.number : ''}</span><WordLine line={row.line} />
        {/* Match the compare number (line.number) or the base number (oldNumber on
            context rows, line.number on removed rows) so a marker anchored from the
            base pane still shows after switching from split to unified — mirroring
            split, which renders the marker in both panes. */}
        {annotations.filter((item) => item.lineStart === row.line.number || item.lineStart === row.oldNumber).map((annotation) => <AnnotationMarker key={annotation.annotationId} annotation={annotation} />)}
      </div>)}
    </div>}
  </div>;
}
const MemoDiffSurface = React.memo(DiffSurface);

/* -------------------------------- markdown -------------------------------- */

function MarkdownView({ markdown }) {
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|@[A-Z][\w'’-]*(?: [A-Z][\w'’-]*)?)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index}>{part.slice(1, -1)}</code>;
      if (part.startsWith('@') && part.length > 1) return <span key={index} className="mention-chip">{part}</span>;
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  return <div className="markdown-view">{markdown.split('\n').map((line, index) => {
    if (line.startsWith('```')) return <div key={index} className="code-fence" aria-hidden="true" />;
    const before = markdown.split('\n').slice(0, index).filter((item) => item.startsWith('```')).length;
    if (before % 2 === 1) return <pre key={index}><code>{line}</code></pre>;
    const checklist = line.match(/^- \[([ xX])\] (.*)$/);
    if (checklist) return <label key={index} className="md-check"><input type="checkbox" checked={checklist[1].toLowerCase() === 'x'} readOnly />{renderInline(checklist[2])}</label>;
    if (!line) return <br key={index} />;
    return <p key={index}>{renderInline(line)}</p>;
  })}</div>;
}

/* ------------------------------- thread panel ----------------------------- */

function ThreadPanel({ annotations }) {
  const state = useStudioStore();
  const annotation = annotations.find((item) => item.annotationId === state.threadOpenId);
  if (!annotation) return null;
  const collapsed = state.threadCollapsed;
  return <aside className={`thread-panel ${annotation.resolved ? 'is-resolved' : ''}`} aria-label={`Annotation thread on lines ${annotation.lineStart}–${annotation.lineEnd}`}>
    <div className="thread-header">
      <button type="button" className="thread-collapse" aria-expanded={!collapsed} onClick={() => state.setThreadCollapsed(!collapsed)} title={collapsed ? 'Expand thread' : 'Collapse thread'}>
        <ChevronDown size={16} className={`thread-chevron ${collapsed ? '' : 'is-open'}`} />
      </button>
      <div className="thread-heading"><span className="eyebrow">Lines {annotation.lineStart}–{annotation.lineEnd}</span><h3>{annotation.resolved ? 'Resolved thread' : 'Annotation thread'}</h3></div>
      <Button kind="ghost" size="sm" onClick={() => state.setThreadOpen(null)}>Close</Button>
    </div>
    <div className={`thread-body ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="thread-body-inner">
        <div className="thread-message"><div className="thread-author"><strong>{annotation.author}</strong><span>{stampLabel(annotation.timestamp, state.prefs.stampMode)}</span></div><MarkdownView markdown={annotation.bodyMarkdown} /></div>
        {annotation.replies.map((reply, index) => <div className="thread-message reply" key={index}><div className="thread-author"><strong>{reply.author}</strong><span>Reply {index + 1}</span></div><MarkdownView markdown={reply.bodyMarkdown} /></div>)}
        {annotation.resolved ? <p className="resolved-copy"><Checkmark size={16} /> This thread is resolved. Reopen it to add replies.</p> : <ReplyForm annotationId={annotation.annotationId} />}
        <Button size="sm" kind={annotation.resolved ? 'tertiary' : 'ghost'} onClick={() => state.toggleAnnotationResolved(annotation.annotationId)}>{annotation.resolved ? 'Reopen thread' : 'Resolve thread'}</Button>
      </div>
    </div>
  </aside>;
}

function ReplyForm({ annotationId }) {
  const state = useStudioStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(annotationReplySchema), defaultValues: { bodyMarkdown: '' } });
  const submit = (data) => { const result = state.replyToAnnotation(annotationId, data.bodyMarkdown); if (result.ok) { reset(); state.pushToast('Reply posted to the thread.'); } else state.announce(`Reply not posted. ${result.error}`); };
  return <form className="reply-form" onSubmit={handleSubmit(submit, announceInvalid)}><TextArea id={`reply-${annotationId}`} labelText="Reply with markdown" rows={3} {...register('bodyMarkdown')} invalid={Boolean(errors.bodyMarkdown)} invalidText={errors.bodyMarkdown?.message} /><Button type="submit" size="sm">Post reply</Button></form>;
}

/* --------------------------- compare branches + merge ---------------------- */

function ConflictMinimap({ regions }) {
  const refs = useRef({});
  return <div className="conflict-minimap" role="group" aria-label="Conflict region minimap">
    <span className="minimap-label" title="Each segment is a conflict region; colors show its resolution. Click a segment to jump to it.">Regions</span>
    {regions.map((region, index) => <button type="button" key={region.regionId} title={`Conflict ${index + 1} · ${region.regionId} · ${region.resolution || 'unresolved'}`} className={`minimap-seg ${region.resolution ? region.resolution : 'open'}`} aria-label={`Conflict ${index + 1}: ${region.resolution || 'unresolved'}`} onClick={() => { const el = document.getElementById(`region-${region.regionId}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.querySelector('.choice-card')?.focus(); }} />)}
  </div>;
}

function BranchCompare({ prompt }) {
  const state = useStudioStore();
  const mergeOpener = useRef(null);
  const session = state.mergeSession;
  if (!prompt?.branchConfig || !session) return <div className="empty-state"><div className="empty-icon"><Branch size={26} /></div><h2>No branches for this prompt</h2><p>Choose “Context-aware reply editor” from the prompt rail to compare its two seeded branches and run the merge flow.</p></div>;
  const base = prompt.versions.find((version) => version.versionId === session.baseVersionId);
  const left = prompt.versions.find((version) => version.versionId === session.leftBranchVersionId);
  const right = prompt.versions.find((version) => version.versionId === session.rightBranchVersionId);
  const resolved = session.regions.filter((region) => region.resolution).length;
  const total = session.regions.length;
  const regionMap = new Map(session.regions.map((region, index) => [region.lineStart, index + 1]));
  const ThreePane = ({ version, label, accent }) => <div className={`branch-pane accent-${accent}`}><div className="branch-pane-head"><span>{label}</span><strong>v{version.versionNumber}</strong><small>{version.author}</small></div><div className="branch-code">{version.text.split('\n').map((line, index) => <div key={index} className={regionMap.has(index + 1) ? 'conflict-line' : ''}><span>{index + 1}</span><code>{line}</code>{regionMap.has(index + 1) && <b title="Numbered conflict region — resolve it in the merge flow">Conflict {regionMap.get(index + 1)}</b>}</div>)}</div></div>;
  return <div className="merge-workspace">
    {state.coachmarks.merge && <div className="coachmark" role="note"><div><strong>Guided merge walk-through:</strong> the three panes share one base. Purple rows are conflict regions changed differently by both branches. Open the merge flow, resolve every region (left, right, or manual edit), then Complete merge — it creates exactly one new head version and a merge node on the Graph.</div><Button kind="ghost" size="sm" onClick={() => state.setCoachmark('merge', false)}>Got it</Button></div>}
    <div className="three-pane"><ThreePane version={base} label="Common base" accent="base" /><ThreePane version={left} label="Left branch" accent="left" /><ThreePane version={right} label="Right branch" accent="right" /></div>
    <div className="merge-launch"><div><span className="eyebrow">{total} conflicting regions</span><h2>Ready for a region-level merge</h2><p>Review the base and both branches above, then resolve every conflict in a focused merge flow.</p></div><Button size="lg" renderIcon={Branch} onClick={(event) => { rememberOpener(mergeOpener)(event); state.setMergeFlowOpen(true); }}>Merge branches</Button></div>
    <MergeFlowModal prompt={prompt} session={session} resolved={resolved} total={total} left={left} right={right} openerRef={mergeOpener} />
  </div>;
}

function MergeFlowModal({ prompt, session, resolved, total, left, right, openerRef }) {
  const state = useStudioStore();
  const confirmRef = useRef(null);
  const [pending, setPending] = useState(false);
  useDialogControls(state.mergeFlowOpen && !state.mergeConfirmOpen, () => state.setMergeFlowOpen(false), { openerRef });
  useDialogControls(state.mergeConfirmOpen, () => state.setMergeConfirmOpen(false), { containerRef: confirmRef, openerRef });
  useEffect(() => {
    if (!state.mergeConfirmOpen) return;
    const first = confirmRef.current?.querySelector('button');
    if (first) window.setTimeout(() => first.focus(), 20);
  }, [state.mergeConfirmOpen]);
  const requestComplete = () => { if (resolved === total && !pending) state.setMergeConfirmOpen(true); };
  const confirmMerge = () => {
    if (pending) return;
    setPending(true);
    const result = useStudioStore.getState().completeMerge();
    setPending(false);
    if (!result.ok) { state.setMergeConfirmOpen(false); state.announce(`Merge not completed. ${result.error}`); }
  };
  return <>
    <ComposedModal className="merge-modal" open={state.mergeFlowOpen} onClose={() => state.setMergeFlowOpen(false)} size="lg" preventCloseOnClickOutside>
      <ModalHeader label={`v${left.versionNumber} + v${right.versionNumber}`} title="Merge branch regions" buttonOnClick={() => state.setMergeFlowOpen(false)} />
      <ModalBody><section className="merge-flow" aria-label="Region-by-region merge">
        <div className="merge-flow-head">
          <div><span className="eyebrow">Region-by-region merge</span><h2>Resolve branch conflicts</h2><p>Each resolution becomes a MergeRegionResolution payload. Complete merge stays disabled until all {total} regions are resolved.</p></div>
          <div className="merge-progress"><strong>{resolved} of {total} resolved</strong><ProgressBar label={`${resolved} of ${total} regions resolved`} hideLabel value={(resolved / total) * 100} size="sm" /></div>
        </div>
        <ConflictMinimap regions={session.regions} />
        <div className="bulk-actions"><span>Resolve every remaining region:</span><Button size="sm" kind="tertiary" onClick={() => state.bulkResolveMerge('left')}>Use all left</Button><Button size="sm" kind="tertiary" onClick={() => state.bulkResolveMerge('right')}>Use all right</Button></div>
        <div className="merge-regions">{session.regions.map((region, index) => <article className={`merge-region ${region.resolution ? 'is-resolved' : ''}`} key={region.regionId} id={`region-${region.regionId}`}>
          <div className="region-title"><span className="conflict-badge" title="Numbered conflict marker — this region changed differently on both branches">Conflict {index + 1}</span><div><h3>{region.label}</h3><code>{region.regionId}</code></div>{region.resolution && <Tag type="green" renderIcon={Checkmark}>{region.resolution}</Tag>}</div>
          <div className="region-choices">
            <button type="button" className={`choice-card left ${region.resolution === 'choose-left' ? 'chosen' : ''}`} aria-pressed={region.resolution === 'choose-left'} onClick={() => state.resolveMergeRegion(region.regionId, 'choose-left')}><span>Choose left · v{left.versionNumber}</span><code>{region.leftText}</code></button>
            <button type="button" className={`choice-card right ${region.resolution === 'choose-right' ? 'chosen' : ''}`} aria-pressed={region.resolution === 'choose-right'} onClick={() => state.resolveMergeRegion(region.regionId, 'choose-right')}><span>Choose right · v{right.versionNumber}</span><code>{region.rightText}</code></button>
          </div>
          <Button size="sm" kind={region.resolution === 'edit-manually' ? 'secondary' : 'ghost'} aria-pressed={region.resolution === 'edit-manually'} onClick={() => state.resolveMergeRegion(region.regionId, 'edit-manually', region.manualText ?? region.leftText)}>Edit manually</Button>
          {region.resolution === 'edit-manually' && <TextArea id={`manual-${region.regionId}`} labelText="Manual merged text" rows={3} value={region.manualText ?? ''} onChange={(event) => state.setManualMergeText(region.regionId, event.target.value)} />}
          {region.resolution && <div className="result-preview" role="status"><span>Result preview</span><code>{region.resolution === 'choose-left' ? region.leftText : region.resolution === 'choose-right' ? region.rightText : region.manualText}</code></div>}
        </article>)}</div>
        <div className="merge-complete"><p>{resolved === total ? 'All regions have valid resolutions. The confirmation step creates one immutable head version.' : `Resolve ${total - resolved} remaining ${total - resolved === 1 ? 'region' : 'regions'} to continue.`}</p></div>
      </section></ModalBody>
      <ModalFooter><Button kind="secondary" onClick={() => state.setMergeFlowOpen(false)}>Cancel</Button><Button renderIcon={Checkmark} disabled={resolved !== total || pending} title={resolved !== total ? `${total - resolved} of ${total} regions still unresolved` : 'Review and confirm the merge'} onClick={requestComplete}>Complete merge</Button></ModalFooter>
    </ComposedModal>
    {state.mergeConfirmOpen && <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm merge" ref={confirmRef}>
      <div className="confirm-card">
        <span className="eyebrow">Merge confirmation</span>
        <h2>Create merge version v{Math.max(...prompt.versions.map((version) => version.versionNumber)) + 1}?</h2>
        <p className="modal-lead">This appends exactly one head version assembled from your {total} region choices and adds a merge node to the graph. Existing versions are never rewritten or deleted.</p>
        <ul className="confirm-list">{session.regions.map((region, index) => <li key={region.regionId}><strong>Conflict {index + 1} · {region.regionId}:</strong> {region.resolution}{region.resolution === 'edit-manually' ? ` — “${(region.manualText || '').slice(0, 60)}${(region.manualText || '').length > 60 ? '…' : ''}”` : ''}</li>)}</ul>
        <div className="confirm-actions">
          <Button kind="secondary" onClick={() => state.setMergeConfirmOpen(false)} disabled={pending}>Cancel</Button>
          <Button renderIcon={Checkmark} onClick={confirmMerge} disabled={pending}>{pending ? 'Creating…' : 'Create merge version'}</Button>
        </div>
      </div>
    </div>}
  </>;
}

/* ---------------------------------- blame --------------------------------- */

function deriveBlame(prompt, selected) {
  if (!prompt || !selected) return [];
  const versions = prompt.versions.filter((item) => item.versionNumber <= selected.versionNumber).sort((a, b) => a.versionNumber - b.versionNumber);
  return selected.text.split('\n').map((text, index) => {
    let attribution = versions[0];
    for (let v = versions.length - 1; v >= 0; v -= 1) {
      if (versions[v].text.split('\n')[index] === text) {
        const before = versions[v - 1]?.text.split('\n')[index];
        if (before !== text || v === 0) { attribution = versions[v]; break; }
      }
    }
    return { text, number: index + 1, version: attribution };
  });
}

function BlameView({ prompt, compare, annotations }) {
  const state = useStudioStore();
  const lines = useMemo(() => deriveBlame(prompt, compare), [prompt, compare]);
  const maxNumber = Math.max(...(prompt?.versions.map((version) => version.versionNumber) || [1]));
  const openIntroducing = (line) => {
    const sorted = [...prompt.versions].sort((a, b) => a.versionNumber - b.versionNumber);
    const previous = [...sorted].reverse().find((version) => version.versionNumber < line.version.versionNumber);
    // A line introduced in the first version has no predecessor, so compare the
    // introducer against itself; otherwise compare predecessor to introducer.
    const baseVersion = previous || line.version;
    state.setCompareVersion(line.version.versionId);
    state.setBaseVersion(baseVersion.versionId);
    state.setActiveMode('diff');
    state.announce(`Comparing v${baseVersion.versionNumber} to v${line.version.versionNumber}, which introduced line ${line.number}.`);
  };
  return <div className="blame-wrap" onMouseUp={() => handleRangeSelection(state.setSelectedRange)}><div className="blame-head"><div><span className="eyebrow">Line provenance</span><h2>Blame · v{compare?.versionNumber}</h2></div><p>Click an attribution to load the version that introduced that line into the compare picker. Gutter heat shows how recently each line changed.</p></div><div className="blame-code">
    {lines.map((line) => {
      const heat = Math.min(4, Math.floor((line.version.versionNumber / maxNumber) * 5));
      return <div className="blame-line" key={line.number} data-line-number={line.number}>
        <button type="button" className={`blame-attribution heat-${heat}`} title={`${line.version.changeNote} — ${stampLabel(line.version.timestamp, state.prefs.stampMode)}`} onClick={() => openIntroducing(line)}>
          <strong>v{line.version.versionNumber}</strong><span>{line.version.author}</span>
          <span className="blame-tooltip" role="tooltip"><strong>{line.version.changeNote}</strong><small>{stampLabel(line.version.timestamp, state.prefs.stampMode)}</small></span>
        </button>
        <span className="line-number">{line.number}</span><code>{line.text}</code>
        {annotations.filter((item) => item.lineStart === line.number).map((annotation) => <AnnotationMarker key={annotation.annotationId} annotation={annotation} />)}
      </div>;
    })}
  </div></div>;
}
const MemoBlameView = React.memo(BlameView);

/* ---------------------------------- graph --------------------------------- */

function VersionGraph({ prompt }) {
  const state = useStudioStore();
  const versions = [...(prompt?.versions || [])].sort((a, b) => a.versionNumber - b.versionNumber);
  const width = 340; const rowHeight = 88; const height = Math.max(200, versions.length * rowHeight + 44);
  const positions = Object.fromEntries(versions.map((version, index) => {
    let x = 170;
    if (version.kind === 'branch') x = version.versionId === prompt?.branchConfig?.leftBranchVersionId ? 82 : 258;
    return [version.versionId, { x, y: 42 + index * rowHeight }];
  }));
  return <div className="graph-layout"><div className="graph-intro"><span className="eyebrow">Prompt topology</span><h2>{prompt?.title}</h2><p>Edges preserve every parent link. Branch and merge nodes are offset by kind; newly created nodes and their edges animate into place.</p><div className="graph-legend"><span><i className="main" />Main</span><span><i className="branch" />Branch</span><span><i className="merge" />Merge</span><span><i className="restore" />Restore</span></div></div><div className="graph-scroll"><div className="version-graph" style={{ width, height }}>
    <svg width={width} height={height} aria-hidden="true">{versions.flatMap((version) => version.parentIds.map((parentId) => { const from = positions[parentId]; const to = positions[version.versionId]; if (!from || !to) return null; const isNew = state.newNodeId === version.versionId; return <path key={`${parentId}-${version.versionId}`} className={isNew ? 'edge-draw' : ''} d={`M ${from.x} ${from.y + 26} C ${from.x} ${from.y + 58}, ${to.x} ${to.y - 30}, ${to.x} ${to.y - 26}`} />; }))}</svg>
    {versions.map((version) => {
      const position = positions[version.versionId];
      const initials = version.author.split(' ').map((part) => part[0]).join('').slice(0, 2);
      const isBase = state.baseVersionId === version.versionId; const isCompare = state.compareVersionId === version.versionId;
      return <button type="button" key={version.versionId} style={{ left: position.x - 58, top: position.y - 26 }} title={`v${version.versionNumber} · ${version.author} · ${stampLabel(version.timestamp, state.prefs.stampMode)}`} className={`graph-node ${version.kind} ${isBase ? 'is-base' : ''} ${isCompare ? 'is-compare' : ''} ${state.newNodeId === version.versionId ? 'is-new' : ''}`} onClick={() => { state.setBaseVersion(version.versionId); state.announce(`v${version.versionNumber} set as base version.`); }}><span className="graph-version">v{version.versionNumber}</span><span className="graph-initials">{initials}</span><small>{version.kind}</small>{isBase && <b>B</b>}{isCompare && <b>C</b>}</button>;
    })}
  </div></div></div>;
}
const MemoVersionGraph = React.memo(VersionGraph);

/* ------------------------------ restore modal ----------------------------- */

function RestoreModal({ prompt }) {
  const state = useStudioStore();
  const isOpen = Boolean(state.restoreDialog);
  useDialogControls(isOpen, () => state.setRestoreDialog(null), { openerRef: restoreOpenerRef });
  const source = prompt?.versions.find((version) => version.versionId === state.restoreDialog?.versionId);
  const { register, handleSubmit, watch, reset, setError, formState: { errors } } = useForm({ resolver: zodResolver(restoreCreateSchema), defaultValues: { sourceVersionId: source?.versionId || '', changeNote: '' } });
  useEffect(() => reset({ sourceVersionId: source?.versionId || '', changeNote: '' }), [source?.versionId, reset, isOpen]);
  const note = watch('changeNote') || '';
  const namesSource = source ? note.toLocaleLowerCase().includes(`v${source.versionNumber}`.toLocaleLowerCase()) : false;
  const valid = Boolean(source && note.trim().length >= 1 && note.length <= 200 && namesSource);
  const noteError = errors.changeNote?.message || (!note.trim() ? 'changeNote is required and must name the restore source version.' : note.length > 200 ? 'changeNote must be 200 characters or fewer.' : source && !namesSource ? `changeNote must name restore source v${source.versionNumber}.` : '');
  const submit = (payload) => {
    const result = useStudioStore.getState().restoreVersion(payload.sourceVersionId, payload.changeNote);
    if (!result.ok) { setError('changeNote', { message: result.error }); state.announce(`Restore not submitted. ${result.error}`); }
  };
  return <ComposedModal open={isOpen} onClose={() => state.setRestoreDialog(null)} size="sm" selectorPrimaryFocus="#restore-change-note" preventCloseOnClickOutside>
    <ModalHeader label="Immutable history" title={`Restore source v${source?.versionNumber || ''}`} buttonOnClick={() => state.setRestoreDialog(null)} />
    <ModalBody><p className="modal-lead">This creates one new head version whose text exactly matches <strong>v{source?.versionNumber}</strong>. Every existing version stays in the history list and graph.</p>
      <form id="restore-form" onSubmit={handleSubmit(submit, announceInvalid)}><input type="hidden" {...register('sourceVersionId')} />
        <TextArea id="restore-change-note" labelText="Change note" helperText={`Required · 1–200 characters · must include v${source?.versionNumber || ''}`} rows={4} {...register('changeNote')} invalid={Boolean(noteError)} invalidText={noteError} />
      </form>
    </ModalBody>
    <ModalFooter><Button kind="secondary" onClick={() => state.setRestoreDialog(null)}>Cancel</Button><Button type="submit" form="restore-form" disabled={!valid}>Restore version</Button></ModalFooter>
  </ComposedModal>;
}

/* ---------------------------- annotation composer -------------------------- */

function AnnotationModal() {
  const state = useStudioStore();
  const isOpen = state.annotationComposerOpen;
  useDialogControls(isOpen, () => state.setAnnotationComposerOpen(false), { openerRef: annotateOpenerRef });
  const range = state.selectedRange || { lineStart: 1, lineEnd: 1 };
  const existingThread = (state.annotations[state.selectedPromptId] || []).find((item) => item.lineStart === range.lineStart && item.lineEnd === range.lineEnd);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(annotationCreateSchema), defaultValues: { bodyMarkdown: '', author: 'Mara Sol', lineStart: range.lineStart, lineEnd: range.lineEnd } });
  useEffect(() => {
    if (!isOpen) return;
    const draft = useStudioStore.getState().annotationDraft;
    const matchesRange = draft?.promptId === state.selectedPromptId && draft.lineStart === range.lineStart && draft.lineEnd === range.lineEnd;
    reset(matchesRange ? { bodyMarkdown: draft.bodyMarkdown, author: draft.author, lineStart: draft.lineStart, lineEnd: draft.lineEnd } : { bodyMarkdown: '', author: 'Mara Sol', lineStart: range.lineStart, lineEnd: range.lineEnd });
  }, [range.lineStart, range.lineEnd, reset, isOpen, state.selectedPromptId]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const subscription = watch((values) => useStudioStore.getState().setAnnotationDraft({
      promptId: state.selectedPromptId,
      bodyMarkdown: values.bodyMarkdown || '',
      author: values.author || '',
      lineStart: Number(values.lineStart),
      lineEnd: Number(values.lineEnd),
    }));
    return () => subscription.unsubscribe();
  }, [isOpen, state.selectedPromptId, watch]);
  const markdown = watch('bodyMarkdown') || '';
  const submit = (data) => {
    const result = useStudioStore.getState().postAnnotation({ ...data, lineStart: Number(data.lineStart), lineEnd: Number(data.lineEnd) });
    if (!result.ok) state.announce(`Annotation not posted. ${result.error}`);
  };
  return <ComposedModal open={isOpen} onClose={() => state.setAnnotationComposerOpen(false)} size="md" selectorPrimaryFocus="#annotation-body" preventCloseOnClickOutside>
    <ModalHeader label={`Lines ${range.lineStart}–${range.lineEnd}`} title="Add annotation" buttonOnClick={() => state.setAnnotationComposerOpen(false)} />
    <ModalBody>
      {existingThread && <p className="inline-note" role="status">This range already carries a thread by {existingThread.author}. Posting adds your note to that existing thread instead of stacking a second marker.</p>}
      <form id="annotation-form" className="annotation-form" onSubmit={handleSubmit(submit, announceInvalid)}>
        <div className="annotation-fields">
          <TextInput id="annotation-author" labelText="Author" {...register('author')} invalid={Boolean(errors.author)} invalidText={errors.author?.message} />
          <div className="range-inputs">
            <TextInput id="line-start" type="number" labelText="Line start" {...register('lineStart')} invalid={Boolean(errors.lineStart)} invalidText={errors.lineStart?.message} />
            <TextInput id="line-end" type="number" labelText="Line end" {...register('lineEnd')} invalid={Boolean(errors.lineEnd)} invalidText={errors.lineEnd?.message} />
          </div>
          <TextArea id="annotation-body" labelText="bodyMarkdown" helperText="Markdown, fenced code, @mentions, and checklists supported · 1–4000 characters" rows={8} {...register('bodyMarkdown')} invalid={Boolean(errors.bodyMarkdown)} invalidText={errors.bodyMarkdown?.message} />
        </div>
        <div className="annotation-preview"><span className="eyebrow">Live preview</span>{markdown.trim() ? <MarkdownView markdown={markdown} /> : <p className="preview-empty">Formatted annotation text will appear here.</p>}</div>
      </form>
    </ModalBody>
    <ModalFooter><Button kind="secondary" onClick={() => state.setAnnotationComposerOpen(false)}>Cancel</Button><Button type="submit" form="annotation-form">Post annotation</Button></ModalFooter>
  </ComposedModal>;
}

/* ------------------------------ export + import ---------------------------- */

function ImportForm() {
  const state = useStudioStore();
  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm({ defaultValues: { packageJson: state.importDraft } });
  const draft = watch('packageJson');
  useEffect(() => state.setImportDraft(draft || ''), [draft]);
  const reconcile = useMemo(() => {
    if (!draft?.trim()) return null;
    let parsed;
    try { parsed = JSON.parse(draft); } catch { return null; }
    const result = versionPackageSchema.safeParse(parsed);
    if (!result.success) return null;
    const current = state.prompts.find((item) => item.id === state.selectedPromptId);
    const currentIds = new Set((current?.versions || []).map((version) => version.versionId));
    const incoming = result.data.versions.map((version) => ({ versionNumber: version.versionNumber, kind: version.kind, kept: currentIds.has(version.versionId) }));
    return { valid: true, data: result.data, currentCount: current?.versions.length || 0, incoming, newCount: incoming.filter((version) => !version.kept).length };
  }, [draft, state.prompts, state.selectedPromptId]);
  const validateAndImport = ({ packageJson }) => {
    state.setImportBusy(true);
    window.setTimeout(() => {
      const actions = useStudioStore.getState();
      let parsed;
      try { parsed = JSON.parse(packageJson); } catch (error) {
        const message = `Import parse error: ${error.message}. Paste valid JSON to continue.`;
        setError('packageJson', { message }); actions.setImportError(message); actions.setImportBusy(false); actions.announce(`Import rejected. ${message}`);
        return;
      }
      const result = versionPackageSchema.safeParse(parsed);
      if (!result.success) {
        const message = formatZodError(result.error);
        setError('packageJson', { message }); actions.setImportError(message); actions.setImportBusy(false); actions.announce(`Import rejected. ${message}`);
        return;
      }
      actions.importPackage(result.data);
    }, 320);
  };
  const loadFile = async (event) => { const file = event.target.files?.[0]; if (file) setValue('packageJson', await file.text(), { shouldValidate: true }); };
  return <form className="import-form" onSubmit={handleSubmit(validateAndImport, announceInvalid)}>
    <div className="import-heading"><div><span className="eyebrow">VersionPackage</span><h3>Import JSON package</h3></div><label className="file-button"><ImportExport size={16} /> Load JSON file<input type="file" accept="application/json,.json" onChange={loadFile} /></label></div>
    <TextArea id="import-json" labelText="Package JSON" rows={10} {...register('packageJson', { required: 'Import package JSON is required.' })} invalid={Boolean(errors.packageJson || state.importError)} invalidText={errors.packageJson?.message || state.importError} />
    {state.importBusy && <div className="busy-bar" role="status" aria-live="polite"><span className="busy-dot" />Validating package against the VersionPackage field contract…</div>}
    {reconcile && !state.importBusy && <div className="reconcile-preview" role="status">
      <strong>Reconcile preview — side-by-side with the current chain</strong>
      <span>Package “{reconcile.data.promptTitle}” carries {reconcile.incoming.length} versions ({reconcile.newCount} new vs. the current {reconcile.currentCount}); base v{reconcile.data.versions.find((version) => version.versionId === reconcile.data.baseVersionId)?.versionNumber} · compare v{reconcile.data.versions.find((version) => version.versionId === reconcile.data.compareVersionId)?.versionNumber}; {reconcile.data.annotations.length} annotations{reconcile.data.merge ? '; merge summary included' : ''}.</span>
      <span className="reconcile-chips">{reconcile.incoming.map((version, index) => <Tag key={index} size="sm" type={version.kept ? 'cool-gray' : 'green'}>v{version.versionNumber} · {version.kind}{version.kept ? '' : ' · new'}</Tag>)}</span>
    </div>}
    <div className="import-actions"><Button type="button" kind="ghost" onClick={() => state.setImportOpen(false)}>Back to preview</Button><Button type="submit" renderIcon={ImportExport} disabled={state.importBusy}>{state.importBusy ? 'Validating…' : 'Import package'}</Button></div>
  </form>;
}

function ExportModal({ openerRef }) {
  const state = useStudioStore();
  const isOpen = state.exportOpen;
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => { setClosing(false); state.setExportOpen(false); }, 170);
  };
  // Keep the focus trap active through the exit animation. Restoring while
  // the modal is still mounted lets Carbon pull focus back to a hidden footer
  // button; restoration should happen only after exportOpen becomes false.
  useDialogControls(isOpen, close, { openerRef });
  useEffect(() => {
    if (!isOpen) return undefined;
    state.setExportBusy(true);
    const timer = window.setTimeout(() => state.setExportBusy(false), 380);
    return () => window.clearTimeout(timer);
  }, [isOpen, state.exportTab]);
  const content = artifactForTab(state, state.exportTab);
  const hasMerged = Boolean(getMergedText(state));
  const copy = async () => {
    try { await navigator.clipboard.writeText(content); } catch {
      const helper = document.createElement('textarea'); helper.value = content; helper.style.position = 'fixed'; helper.style.opacity = '0'; document.body.appendChild(helper); helper.select(); document.execCommand('copy'); helper.remove();
    }
    setCopied(true); window.setTimeout(() => setCopied(false), 1400);
    state.pushToast(`${state.exportTab === 'package' ? 'Version package' : state.exportTab === 'merged' ? 'Merged prompt text' : 'History report'} copied to the clipboard.`);
  };
  const download = () => {
    const extensions = { history: 'md', package: 'json', merged: 'txt' };
    const types = { history: 'text/markdown', package: 'application/json', merged: 'text/plain' };
    const blob = new Blob([content], { type: types[state.exportTab] }); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = `prompt-ledger-${state.exportTab}.${extensions[state.exportTab]}`; anchor.click(); URL.revokeObjectURL(href);
    state.pushToast('Artifact download started.');
  };
  return <ComposedModal className={`export-modal ${closing ? 'is-closing' : ''}`} open={isOpen} onClose={close} size="lg" selectorPrimaryFocus=".export-tab" preventCloseOnClickOutside>
    <ModalHeader label="Live artifacts" title="Export prompt history" buttonOnClick={close} />
    <ModalBody>{state.importOpen ? <ImportForm /> : <>
      <div className="export-tab-row" role="tablist" aria-label="Export formats">
        <button type="button" role="tab" aria-selected={state.exportTab === 'history'} className={`export-tab ${state.exportTab === 'history' ? 'active' : ''}`} onClick={() => state.setExportTab('history')}>History report</button>
        <button type="button" role="tab" aria-selected={state.exportTab === 'package'} className={`export-tab ${state.exportTab === 'package' ? 'active' : ''}`} onClick={() => state.setExportTab('package')}>Version package</button>
        <button type="button" role="tab" aria-selected={state.exportTab === 'merged'} className={`export-tab ${state.exportTab === 'merged' ? 'active' : ''}`} disabled={!hasMerged} title={hasMerged ? 'Plain text merged output' : 'Available after a merge completes'} onClick={() => state.setExportTab('merged')}>Merged prompt text</button>
      </div>
      <div className="export-meta"><span>{state.exportTab === 'history' ? 'Markdown' : state.exportTab === 'package' ? 'JSON · prompt-diff-package-v1' : 'Plain text · byte-identical merge output'}</span><span>{new Blob([content]).size.toLocaleString()} bytes</span></div>
      {state.exportBusy ? <div className="busy-bar preview-busy" role="status" aria-live="polite"><span className="busy-dot" />Regenerating preview from the live store…</div> : <pre className="artifact-preview" tabIndex="0" aria-label={`${state.exportTab} preview`}>{content || 'Complete a merge to produce merged prompt text.'}</pre>}
      {state.exportTab === 'package' && <div className="schema-chips"><Tag type="blue">schemaVersion</Tag><Tag type="cool-gray">versions[]</Tag><Tag type="cool-gray">counters</Tag><Tag type="cool-gray">annotations[]</Tag><Tag type="purple">merge</Tag></div>}
    </>}</ModalBody>
    {!state.importOpen && <ModalFooter><Button kind="ghost" renderIcon={ImportExport} onClick={() => state.setImportOpen(true)}>Import</Button><Button kind="secondary" renderIcon={Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button><Button renderIcon={Download} onClick={download}>Download</Button></ModalFooter>}
  </ComposedModal>;
}

/* ---------------------------------- toasts -------------------------------- */

function ToastStack() {
  const toasts = useStudioStore((slice) => slice.toasts);
  const dismiss = useStudioStore((slice) => slice.dismissToast);
  const markLeaving = useStudioStore((slice) => slice.markToastLeaving);
  // Track timers per toast id so a newly arriving toast never resets the
  // auto-dismiss countdown of ones already on screen.
  const timers = useRef({});
  useEffect(() => {
    toasts.forEach((item) => {
      if (item.leaving || timers.current[item.id]) return;
      timers.current[item.id] = [
        window.setTimeout(() => markLeaving(item.id), 2600),
        window.setTimeout(() => dismiss(item.id), 3000),
      ];
    });
    Object.keys(timers.current).forEach((id) => {
      if (!toasts.some((item) => item.id === id)) {
        timers.current[id].forEach(window.clearTimeout);
        delete timers.current[id];
      }
    });
  }, [toasts, dismiss, markLeaving]);
  useEffect(() => () => {
    Object.values(timers.current).forEach((pair) => pair.forEach(window.clearTimeout));
    timers.current = {};
  }, []);
  return <div className="toast-stack">{toasts.slice(-3).map((item) => <div key={item.id} className={`toast kind-${item.kind} ${item.leaving ? 'leaving' : ''}`} role="status">
    <span className="toast-icon" aria-hidden="true">{item.kind === 'info' ? <Renew size={16} /> : <Checkmark size={16} />}</span>
    <span className="toast-message">{item.message}</span>
    <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>×</button>
  </div>)}</div>;
}

/* --------------------------- shortcuts + coachmark ------------------------- */

function ShortcutsModal() {
  const state = useStudioStore();
  const isOpen = state.shortcutsOpen;
  useDialogControls(isOpen, () => state.setShortcutsOpen(false), { openerRef: shortcutsOpenerRef });
  const rows = [
    ['N or J', 'Jump to the next change in the diff'],
    ['P or K', 'Jump to the previous change in the diff'],
    ['W', 'Toggle Ignore whitespace'],
    ['C', 'Toggle Ignore case'],
    ['?', 'Open or close this shortcut list'],
    ['Esc', 'Close dialogs, popovers, and the prompt rail'],
  ];
  return <ComposedModal open={isOpen} onClose={() => state.setShortcutsOpen(false)} size="sm" preventCloseOnClickOutside>
    <ModalHeader label="Power user" title="Keyboard shortcuts" buttonOnClick={() => state.setShortcutsOpen(false)} />
    <ModalBody><table className="shortcuts-table"><tbody>{rows.map(([keys, what]) => <tr key={keys}><th scope="row"><kbd>{keys}</kbd></th><td>{what}</td></tr>)}</tbody></table></ModalBody>
    <ModalFooter><Button kind="secondary" onClick={() => state.setShortcutsOpen(false)}>Close</Button></ModalFooter>
  </ComposedModal>;
}

function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (event) => {
      const state = useStudioStore.getState();
      const active = document.activeElement;
      const typing = active && (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable);
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '?') { event.preventDefault(); state.setShortcutsOpen(!state.shortcutsOpen); return; }
      if (typing || state.shortcutsOpen || state.exportOpen || state.restoreDialog || state.annotationComposerOpen || state.mergeConfirmOpen || state.mergeFlowOpen) return;
      const key = event.key.toLowerCase();
      if (key === 'n' || key === 'j') { event.preventDefault(); if (state.activeMode === 'diff') stepChange(1); }
      else if (key === 'p' || key === 'k') { event.preventDefault(); if (state.activeMode === 'diff') stepChange(-1); }
      else if (key === 'w') { event.preventDefault(); state.setIgnoreWhitespace(!state.ignoreWhitespace); state.announce(`Ignore whitespace ${!state.ignoreWhitespace ? 'on' : 'off'}.`); }
      else if (key === 'c') { event.preventDefault(); state.setIgnoreCase(!state.ignoreCase); state.announce(`Ignore case ${!state.ignoreCase ? 'on' : 'off'}.`); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/* ----------------------------------- app ---------------------------------- */

function Coachmark() {
  const state = useStudioStore();
  if (!state.coachmarks.studio) return null;
  return <div className="coachmark studio-coachmark" role="note">
    <div><strong>First run?</strong> This studio seeds a branched prompt — open <button type="button" className="coach-link" onClick={() => { state.setActiveMode('compare-branches'); state.setCoachmark('studio', false); }}>Compare branches</button> to walk a three-way merge, or press <kbd>?</kbd> for keyboard shortcuts.</div>
    <Button kind="ghost" size="sm" onClick={() => state.setCoachmark('studio', false)}>Got it</Button>
  </div>;
}

export default function App() {
  const { state, prompt, base, compare, diff } = useCurrent();
  const annotations = state.annotations[state.selectedPromptId] || [];
  useGlobalShortcuts();
  return <div className={`app-shell density-${state.prefs.density}`}>
    <AppHeader />
    <PromptRail prompt={prompt} />
    {state.sidebarOpen && <button className="rail-scrim" aria-label="Close prompt rail" onClick={() => state.setSidebarOpen(false)} />}
    <main className="workspace">
      <Coachmark />
      <WorkspaceToolbar prompt={prompt} base={base} compare={compare} diff={diff} />
      <SelectionBar />
      <div className="surface-wrap" key={`${state.baseVersionId}-${state.compareVersionId}-${state.ignoreWhitespace}-${state.ignoreCase}-${state.activeMode}-${state.diffView}`}>
        {state.activeMode === 'diff' && <MemoDiffSurface diff={diff} annotations={annotations} base={base} compare={compare} />}
        {state.activeMode === 'compare-branches' && <BranchCompare prompt={prompt} />}
        {state.activeMode === 'blame' && <MemoBlameView prompt={prompt} compare={compare} annotations={annotations} />}
        {state.activeMode === 'graph' && <MemoVersionGraph prompt={prompt} />}
      </div>
      <ThreadPanel annotations={annotations} />
    </main>
    <RestoreModal prompt={prompt} />
    <AnnotationModal />
    <ShortcutsModal />
    <ToastStack />
    <div className="sr-live" aria-live="polite" role="status"><span key={state.liveNonce}>{state.liveMessage}</span></div>
  </div>;
}
