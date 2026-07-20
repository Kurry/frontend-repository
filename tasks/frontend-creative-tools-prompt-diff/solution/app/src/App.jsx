import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Checkbox, ComposedModal, InlineNotification, ModalBody, ModalFooter, ModalHeader,
  ProgressBar, Search, Select, SelectItem, Tag, TextArea, TextInput, Toggle,
} from '@carbon/react';
import {
  ArrowLeft, ArrowRight, Branch, ChartRelationship, Chat, Checkmark, Code, Copy, Document,
  Download, Export as ExportIcon, ImportExport, Menu, Redo, Renew, Undo,
} from '@carbon/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStudioStore } from './store.js';
import { annotationCreateSchema, annotationReplySchema, formatZodError, restoreCreateSchema, versionPackageSchema } from './schemas.js';
import { artifactForTab, buildVersionPackage, getMergedText } from './artifacts.js';
import { computeDiff, relativeTime } from './diff.js';
import { registerWebMCP } from './webmcp.js';

const MODES = [
  { id: 'diff', label: 'Diff', icon: Code },
  { id: 'compare-branches', label: 'Compare branches', icon: Branch },
  { id: 'blame', label: 'Blame', icon: Document },
  { id: 'graph', label: 'Graph', icon: ChartRelationship },
];

const versionLabel = (version) => {
  const note = version.changeNote.length > 80 ? `${version.changeNote.slice(0, 80)}…` : version.changeNote;
  return `v${version.versionNumber} · ${relativeTime(version.timestamp)} · ${version.author} · ${note}`;
};

const dateLabel = (timestamp) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));

function useCurrent() {
  const state = useStudioStore();
  const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
  const base = prompt?.versions.find((version) => version.versionId === state.baseVersionId);
  const compare = prompt?.versions.find((version) => version.versionId === state.compareVersionId);
  const diff = useMemo(() => computeDiff(base?.text || '', compare?.text || '', { ignoreWhitespace: state.ignoreWhitespace, ignoreCase: state.ignoreCase }), [base?.text, compare?.text, state.ignoreWhitespace, state.ignoreCase]);
  return { state, prompt, base, compare, diff };
}

function AppHeader({ prompt }) {
  const state = useStudioStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const query = state.globalSearchQuery.trim().toLocaleLowerCase();
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
    state.setGlobalSearchQuery(''); state.setActiveMode('diff'); setSearchFocused(false);
  };
  return <header className="app-header">
    <div className="brand-block">
      <div className="brand-mark" aria-hidden="true"><Code size={19} /></div>
      <div><h1>Prompt Ledger</h1><p>Version & diff studio</p></div>
    </div>
    <div className="global-search-wrap">
      <Search id="global-version-search" labelText="Search every prompt version" placeholder="Search across every version…" value={state.globalSearchQuery} onChange={(event) => state.setGlobalSearchQuery(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 160)} size="lg" />
      {searchFocused && query && <div className="search-popover" role="listbox" aria-label="Version search results">
        {results.length ? results.map((result) => <button type="button" className="search-result" key={`${result.prompt.id}-${result.version.versionId}`} onMouseDown={(event) => event.preventDefault()} onClick={() => openResult(result)}>
          <span className="search-result-meta">{result.prompt.title} <Tag size="sm" type="cool-gray">v{result.version.versionNumber}</Tag></span>
          <span className="search-snippet">…{result.before}<mark>{result.match}</mark>{result.after}…</span>
        </button>) : <div className="search-empty"><strong>No versions match “{state.globalSearchQuery}”.</strong><span>Try a phrase from a prompt’s instructions.</span></div>}
      </div>}
    </div>
    <div className="header-actions">
      <Button kind="ghost" size="md" hasIconOnly renderIcon={Undo} iconDescription="Undo" disabled={!state.undoStack.length} onClick={state.undo} />
      <Button kind="ghost" size="md" hasIconOnly renderIcon={Redo} iconDescription="Redo" disabled={!state.redoStack.length} onClick={state.redo} />
      <Button kind="tertiary" size="md" renderIcon={ExportIcon} onClick={() => state.setExportOpen(true)}>Export</Button>
      <Button className="mobile-menu" kind="ghost" size="md" hasIconOnly renderIcon={Menu} iconDescription="Open prompt rail" onClick={() => state.setSidebarOpen(true)} />
    </div>
  </header>;
}

function PromptRail({ prompt }) {
  const state = useStudioStore();
  const query = state.promptQuery.toLocaleLowerCase();
  const visible = state.prompts.filter((item) => item.title.toLocaleLowerCase().includes(query) || item.description.toLocaleLowerCase().includes(query));
  const versions = [...(prompt?.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);
  const selected = state.historySelection[prompt?.id] || [];
  return <aside className={`left-rail ${state.sidebarOpen ? 'is-open' : ''}`} aria-label="Prompts and version history">
    <div className="rail-top">
      <div className="rail-heading"><div><span className="eyebrow">Library</span><h2>Prompts</h2></div><Button className="rail-close" kind="ghost" size="sm" hasIconOnly iconDescription="Close prompt rail" renderIcon={ArrowLeft} onClick={() => state.setSidebarOpen(false)} /></div>
      <Search id="prompt-picker-search" labelText="Filter prompts" placeholder="Filter prompts…" size="md" value={state.promptQuery} onChange={(event) => state.setPromptQuery(event.target.value)} />
      <div className="prompt-list" role="listbox" aria-label="Prompt picker">
        {visible.map((item) => <button type="button" role="option" aria-selected={item.id === state.selectedPromptId} key={item.id} className={`prompt-card ${item.id === state.selectedPromptId ? 'selected' : ''}`} onClick={() => state.selectPrompt(item.id)}>
          <span className="prompt-card-title">{item.title}</span><span className="prompt-card-desc">{item.description}</span><span className="prompt-card-count">{item.versions.length} versions</span>
        </button>)}
        {!visible.length && <div className="rail-empty">No prompts match “{state.promptQuery}”. Clear the filter to restore the prompt list.</div>}
      </div>
    </div>
    <div className="history-section">
      <div className="history-heading"><div><span className="eyebrow">Selected prompt</span><h2>Version history</h2></div>{selected.length >= 2 && <Tag type="blue" size="sm">{selected.length} selected</Tag>}</div>
      <p className="history-help">Select two or more versions to export a focused package.</p>
      <div className="history-list">
        {versions.map((version, index) => <article className={`history-row kind-${version.kind}`} key={version.versionId}>
          <div className="history-check"><Checkbox id={`history-${version.versionId}`} hideLabel labelText={`Include v${version.versionNumber} in export`} checked={selected.includes(version.versionId)} onChange={() => state.toggleHistorySelection(version.versionId)} /></div>
          <button type="button" className="history-main" onClick={() => state.setBaseVersion(version.versionId)}>
            <span className="history-title"><strong>v{version.versionNumber}</strong>{index === 0 && <Tag type="green" size="sm">Head</Tag>}<Tag type={version.kind === 'branch' ? 'purple' : version.kind === 'merge' ? 'teal' : version.kind === 'restore' ? 'blue' : 'cool-gray'} size="sm">{version.kind}</Tag></span>
            <span className="history-meta">{version.author} · {dateLabel(version.timestamp)}</span>
            <span className="history-note">{version.changeNote}</span>
          </button>
        </article>)}
      </div>
    </div>
  </aside>;
}

function WorkspaceToolbar({ prompt, base, compare, diff }) {
  const state = useStudioStore();
  const versions = [...(prompt?.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);
  const scrollTo = (type) => {
    const target = document.querySelector(`[data-change="${type}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    target.classList.remove('counter-pulse'); requestAnimationFrame(() => target.classList.add('counter-pulse'));
    setTimeout(() => target.classList.remove('counter-pulse'), 450);
  };
  return <>
    <section className="picker-row" aria-label="Version selection">
      <div className="picker-block base-picker">
        <span className="picker-kicker"><span className="base-dot" />Base version</span>
        <Select id="base-version-picker" labelText="Base version" hideLabel value={base?.versionId || ''} onChange={(event) => state.setBaseVersion(event.target.value)}>
          {versions.map((version) => <SelectItem key={version.versionId} value={version.versionId} text={versionLabel(version)} />)}
        </Select>
        {base && <span className="picker-author">{base.author} · {base.changeNote}</span>}
      </div>
      <div className="swap-glyph" aria-hidden="true"><ArrowRight size={18} /></div>
      <div className="picker-block compare-picker">
        <span className="picker-kicker"><span className="compare-dot" />Compare version</span>
        <Select id="compare-version-picker" labelText="Compare version" hideLabel value={compare?.versionId || ''} onChange={(event) => state.setCompareVersion(event.target.value)}>
          {versions.map((version) => <SelectItem key={version.versionId} value={version.versionId} text={versionLabel(version)} />)}
        </Select>
        {compare && <span className="picker-author">{compare.author} · {compare.changeNote}</span>}
      </div>
      <div className="restore-actions">
        <Button size="sm" kind="ghost" renderIcon={Renew} disabled={!base} onClick={() => state.setRestoreDialog({ side: 'base', versionId: base.versionId })}>Restore to base</Button>
        <Button size="sm" kind="ghost" renderIcon={Renew} disabled={!compare} onClick={() => state.setRestoreDialog({ side: 'compare', versionId: compare.versionId })}>Restore to compare</Button>
      </div>
    </section>
    <section className="mode-options-row">
      <nav className="mode-tabs" aria-label="Studio modes">
        {MODES.map(({ id, label, icon }) => <Button key={id} size="sm" kind="ghost" renderIcon={icon} className={state.activeMode === id ? 'active' : ''} aria-current={state.activeMode === id ? 'page' : undefined} onClick={() => state.setActiveMode(id)}>{label}</Button>)}
      </nav>
      <div className="diff-options">
        <div className="view-switch" role="group" aria-label="Diff layout">
          <Button size="sm" kind={state.diffView === 'split' ? 'secondary' : 'ghost'} onClick={() => state.setDiffView('split')}>Split</Button>
          <Button size="sm" kind={state.diffView === 'unified' ? 'secondary' : 'ghost'} onClick={() => state.setDiffView('unified')}>Unified</Button>
        </div>
        <Toggle id="ignore-whitespace" size="sm" labelText="Ignore whitespace" labelA="Off" labelB="On" toggled={state.ignoreWhitespace} onToggle={state.setIgnoreWhitespace} />
        <Toggle id="ignore-case" size="sm" labelText="Ignore case" labelA="Off" labelB="On" toggled={state.ignoreCase} onToggle={state.setIgnoreCase} />
      </div>
    </section>
    <section className="summary-strip" aria-label="Change summary">
      <button type="button" className="summary-counter added" onClick={() => scrollTo('added')} disabled={!diff.counters.linesAdded}><span className="counter-value">+{diff.counters.linesAdded}</span><span>Lines added</span></button>
      <button type="button" className="summary-counter removed" onClick={() => scrollTo('removed')} disabled={!diff.counters.linesRemoved}><span className="counter-value">−{diff.counters.linesRemoved}</span><span>Lines removed</span></button>
      <button type="button" className="summary-counter tokens" onClick={() => scrollTo(diff.counters.netTokenDelta >= 0 ? 'added' : 'removed')} disabled={diff.identical}><span className="counter-value">{diff.counters.netTokenDelta >= 0 ? '+' : ''}{diff.counters.netTokenDelta}</span><span>Net tokens</span></button>
      <span className="summary-context">Derived live from v{base?.versionNumber} → v{compare?.versionNumber}</span>
    </section>
  </>;
}

function AnnotationMarker({ annotation }) {
  const state = useStudioStore();
  return <Button className={`thread-marker ${annotation.resolved ? 'resolved' : ''}`} kind="ghost" size="sm" hasIconOnly renderIcon={Chat} iconDescription={`Open annotation by ${annotation.author}`} onClick={() => state.setThreadOpen(annotation.annotationId)} />;
}

function WordLine({ line }) {
  return <span className="line-code">{line.words.map((word, index) => <span key={index} className={word.changed ? 'word-changed' : ''}>{word.text}</span>)}</span>;
}

function DiffLine({ line, side, annotations, marker = true }) {
  if (!line) return <div className="diff-line filler" aria-hidden="true"><span className="gutter-sign" /><span className="line-number" /><span className="line-code" /></div>;
  const anchored = annotations.filter((item) => item.lineStart === line.number);
  return <div className={`diff-line ${line.type}`} data-line-number={line.number} data-side={side} data-change={line.type === 'added' || line.type === 'removed' ? line.type : undefined} aria-label={`Line ${line.number}${line.type === 'added' ? ', added' : line.type === 'removed' ? ', removed' : ''}`}>
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
  return <div className="selection-bar" role="status"><span>Lines {state.selectedRange.lineStart}–{state.selectedRange.lineEnd} selected</span><Button size="sm" renderIcon={Chat} onClick={() => state.setAnnotationComposerOpen(true)}>Annotate range</Button><Button kind="ghost" size="sm" onClick={() => state.setSelectedRange(null)}>Clear</Button></div>;
}

function DiffSurface({ diff, annotations, base, compare }) {
  const state = useStudioStore();
  if (diff.identical) return <div className="empty-state identical-state"><div className="empty-icon"><Checkmark size={26} /></div><h2>The versions are identical</h2><p>No line, word, whitespace, or case differences remain with the current options.</p></div>;
  return <div className={`diff-scroll diff-${state.diffView}`} onMouseUp={() => handleRangeSelection(state.setSelectedRange)}>
    {state.diffView === 'split' ? <>
      <div className="mobile-pane-switch" role="group" aria-label="Visible comparison pane"><Button size="sm" kind={state.mobilePane === 'base' ? 'secondary' : 'ghost'} onClick={() => state.setMobilePane('base')}>Base v{base?.versionNumber}</Button><Button size="sm" kind={state.mobilePane === 'compare' ? 'secondary' : 'ghost'} onClick={() => state.setMobilePane('compare')}>Compare v{compare?.versionNumber}</Button></div>
      <div className={`split-diff mobile-${state.mobilePane}`}>
        <div className="pane-caption base-caption"><span>BASE · v{base?.versionNumber}</span><span>{base?.author}</span></div>
        <div className="pane-caption compare-caption"><span>COMPARE · v{compare?.versionNumber}</span><span>{compare?.author}</span></div>
        {diff.rows.map((row) => <React.Fragment key={row.key}><DiffLine line={row.left} side="base" annotations={annotations} /><DiffLine line={row.right} side="compare" annotations={annotations} /></React.Fragment>)}
      </div>
    </> : <div className="unified-diff">
      <div className="unified-caption">UNIFIED CHANGES · 3 lines of context</div>
      {diff.unifiedRows.map((row) => row.separator ? <div key={row.key} className="diff-separator">•••</div> : <div key={row.key} className={`unified-row ${row.line.type}`} data-line-number={row.line.number} data-change={row.line.type === 'added' || row.line.type === 'removed' ? row.line.type : undefined}>
        <span className="gutter-sign">{row.line.type === 'added' ? '+' : row.line.type === 'removed' ? '−' : ''}</span><span className="line-number old">{row.oldNumber || (row.side === 'left' ? row.line.number : '')}</span><span className="line-number new">{row.side !== 'left' ? row.line.number : ''}</span><WordLine line={row.line} />
        {annotations.filter((item) => item.lineStart === row.line.number).map((annotation) => <AnnotationMarker key={annotation.annotationId} annotation={annotation} />)}
      </div>)}
    </div>}
  </div>;
}

function MarkdownView({ markdown }) {
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : <React.Fragment key={index}>{part}</React.Fragment>);
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

function ThreadPanel({ annotations }) {
  const state = useStudioStore();
  const annotation = annotations.find((item) => item.annotationId === state.threadOpenId);
  if (!annotation) return null;
  return <aside className={`thread-panel ${annotation.resolved ? 'is-resolved' : ''}`}>
    <div className="thread-header"><div><span className="eyebrow">Lines {annotation.lineStart}–{annotation.lineEnd}</span><h3>{annotation.resolved ? 'Resolved thread' : 'Annotation thread'}</h3></div><Button kind="ghost" size="sm" onClick={() => state.setThreadOpen(null)}>Close</Button></div>
    <div className="thread-message"><div className="thread-author"><strong>{annotation.author}</strong><span>{dateLabel(annotation.timestamp)}</span></div><MarkdownView markdown={annotation.bodyMarkdown} /></div>
    {!annotation.resolved && annotation.replies.map((reply, index) => <div className="thread-message reply" key={index}><div className="thread-author"><strong>{reply.author}</strong><span>Reply {index + 1}</span></div><MarkdownView markdown={reply.bodyMarkdown} /></div>)}
    {annotation.resolved ? <p className="resolved-copy"><Checkmark size={16} /> This thread is resolved and collapsed.</p> : <ReplyForm annotationId={annotation.annotationId} />}
    <Button size="sm" kind={annotation.resolved ? 'tertiary' : 'ghost'} onClick={() => state.toggleAnnotationResolved(annotation.annotationId)}>{annotation.resolved ? 'Reopen thread' : 'Resolve thread'}</Button>
  </aside>;
}

function ReplyForm({ annotationId }) {
  const state = useStudioStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(annotationReplySchema), defaultValues: { bodyMarkdown: '' } });
  const submit = (data) => { state.replyToAnnotation(annotationId, data.bodyMarkdown); reset(); };
  return <form className="reply-form" onSubmit={handleSubmit(submit)}><TextArea id={`reply-${annotationId}`} labelText="Reply with markdown" rows={3} {...register('bodyMarkdown')} invalid={Boolean(errors.bodyMarkdown)} invalidText={errors.bodyMarkdown?.message} /><Button type="submit" size="sm">Post reply</Button></form>;
}

function BranchCompare({ prompt }) {
  const state = useStudioStore();
  const session = state.mergeSession;
  if (!prompt?.branchConfig || !session) return <div className="empty-state"><div className="empty-icon"><Branch size={26} /></div><h2>No branches for this prompt</h2><p>Choose “Context-aware reply editor” to compare its two seeded branches.</p></div>;
  const base = prompt.versions.find((version) => version.versionId === session.baseVersionId);
  const left = prompt.versions.find((version) => version.versionId === session.leftBranchVersionId);
  const right = prompt.versions.find((version) => version.versionId === session.rightBranchVersionId);
  const resolved = session.regions.filter((region) => region.resolution).length;
  const total = session.regions.length;
  const regionMap = new Map(session.regions.map((region, index) => [region.lineStart, index + 1]));
  const ThreePane = ({ version, label, accent }) => <div className={`branch-pane accent-${accent}`}><div className="branch-pane-head"><span>{label}</span><strong>v{version.versionNumber}</strong><small>{version.author}</small></div><div className="branch-code">{version.text.split('\n').map((line, index) => <div key={index} className={regionMap.has(index + 1) ? 'conflict-line' : ''}><span>{index + 1}</span><code>{line}</code>{regionMap.has(index + 1) && <b>Conflict {regionMap.get(index + 1)}</b>}</div>)}</div></div>;
  return <div className="merge-workspace">
    <div className="three-pane"><ThreePane version={base} label="Common base" accent="base" /><ThreePane version={left} label="Left branch" accent="left" /><ThreePane version={right} label="Right branch" accent="right" /></div>
    <div className="merge-launch"><div><span className="eyebrow">Three conflicting regions</span><h2>Ready for a region-level merge</h2><p>Review the base and both branches above, then resolve every conflict in a focused merge flow.</p></div><Button size="lg" renderIcon={Branch} onClick={() => state.setMergeFlowOpen(true)}>Merge branches</Button></div>
    <div onKeyDown={(e) => { if (e.key === 'Escape') state.setMergeFlowOpen(false); }}><ComposedModal className="merge-modal" open={state.mergeFlowOpen} onClose={() => state.setMergeFlowOpen(false)} size="lg"><ModalHeader label={`v${left.versionNumber} + v${right.versionNumber}`} title="Merge branch regions" buttonOnClick={() => state.setMergeFlowOpen(false)} /><ModalBody><section className="merge-flow">
      <div className="merge-flow-head"><div><span className="eyebrow">Region-by-region merge</span><h2>Resolve branch conflicts</h2><p>Each resolution becomes a MergeRegionResolution payload.</p></div><div className="merge-progress"><strong>{resolved} of {total} resolved</strong><ProgressBar label={`${resolved} of ${total} regions resolved`} hideLabel value={(resolved / total) * 100} /></div></div>
      <div className="bulk-actions"><span>Resolve every remaining region:</span><Button size="sm" kind="tertiary" onClick={() => state.bulkResolveMerge('left')}>Use all left</Button><Button size="sm" kind="tertiary" onClick={() => state.bulkResolveMerge('right')}>Use all right</Button></div>
      <div className="merge-regions">{session.regions.map((region, index) => <article className={`merge-region ${region.resolution ? 'is-resolved' : ''}`} key={region.regionId}>
        <div className="region-title"><span className="conflict-badge">Conflict {index + 1}</span><div><h3>{region.label}</h3><code>{region.regionId}</code></div>{region.resolution && <Tag type="green" renderIcon={Checkmark}>{region.resolution}</Tag>}</div>
        <div className="region-choices"><button type="button" className={`choice-card left ${region.resolution === 'choose-left' ? 'chosen' : ''}`} onMouseDown={() => state.resolveMergeRegion(region.regionId, 'choose-left')} onClick={() => state.resolveMergeRegion(region.regionId, 'choose-left')}><span>Choose left · v{left.versionNumber}</span><code>{region.leftText}</code></button><button type="button" className={`choice-card right ${region.resolution === 'choose-right' ? 'chosen' : ''}`} onMouseDown={() => state.resolveMergeRegion(region.regionId, 'choose-right')} onClick={() => state.resolveMergeRegion(region.regionId, 'choose-right')}><span>Choose right · v{right.versionNumber}</span><code>{region.rightText}</code></button></div>
        <Button size="sm" kind={region.resolution === 'edit-manually' ? 'secondary' : 'ghost'} onMouseDown={() => state.resolveMergeRegion(region.regionId, 'edit-manually', region.manualText ?? region.leftText)} onClick={() => state.resolveMergeRegion(region.regionId, 'edit-manually', region.manualText ?? region.leftText)}>Edit manually</Button>
        {region.resolution === 'edit-manually' && <TextArea id={`manual-${region.regionId}`} labelText="Manual merged text" rows={3} value={region.manualText ?? ''} onChange={(event) => state.setManualMergeText(region.regionId, event.target.value)} />}
        {region.resolution && <div className="result-preview"><span>Result preview</span><code>{region.resolution === 'choose-left' ? region.leftText : region.resolution === 'choose-right' ? region.rightText : region.manualText}</code></div>}
      </article>)}</div>
      <div className="merge-complete"><p>{resolved === total ? 'All regions have valid resolutions. The merge will create one immutable head version.' : `Resolve ${total - resolved} remaining ${total - resolved === 1 ? 'region' : 'regions'} to continue.`}</p></div>
    </section></ModalBody><ModalFooter><Button kind="secondary" onClick={() => state.setMergeFlowOpen(false)}>Cancel</Button><Button renderIcon={Checkmark} disabled={resolved !== total} onClick={state.completeMerge}>Complete merge</Button></ModalFooter></ComposedModal></div>
  </div>;
}

function deriveBlame(prompt, selected) {
  if (!prompt || !selected) return [];
  const versions = prompt.versions.filter((item) => item.versionNumber <= selected.versionNumber).sort((a, b) => a.versionNumber - b.versionNumber);
  return selected.text.split('\n').map((text, index) => {
    let attribution = versions[0]; let prior;
    versions.forEach((version) => { const line = version.text.split('\n')[index]; if (line === text && line !== prior) attribution = version; if (line != null) prior = line; });
    for (let v = versions.length - 1; v >= 0; v -= 1) { if (versions[v].text.split('\n')[index] === text) { const before = versions[v - 1]?.text.split('\n')[index]; if (before !== text || v === 0) { attribution = versions[v]; break; } } }
    return { text, number: index + 1, version: attribution };
  });
}

function BlameView({ prompt, compare, annotations }) {
  const state = useStudioStore();
  const lines = useMemo(() => deriveBlame(prompt, compare), [prompt, compare]);
  return <div className="blame-wrap" onMouseUp={() => handleRangeSelection(state.setSelectedRange)}><div className="blame-head"><div><span className="eyebrow">Line provenance</span><h2>Blame · v{compare?.versionNumber}</h2></div><p>Click an attribution to compare the version that introduced that line.</p></div><div className="blame-code">
    {lines.map((line) => <div className="blame-line" key={line.number} data-line-number={line.number}><button type="button" className="blame-attribution" onClick={() => { state.setBaseVersion(line.version.versionId); state.setActiveMode('diff'); }}><strong>v{line.version.versionNumber}</strong><span>{line.version.author}</span><span className="blame-tooltip" role="tooltip"><strong>{line.version.changeNote}</strong><small>{dateLabel(line.version.timestamp)}</small></span></button><span className="line-number">{line.number}</span><code>{line.text}</code>{annotations.filter((item) => item.lineStart === line.number).map((annotation) => <AnnotationMarker key={annotation.annotationId} annotation={annotation} />)}</div>)}
  </div></div>;
}

function VersionGraph({ prompt }) {
  const state = useStudioStore();
  const versions = [...(prompt?.versions || [])].sort((a, b) => a.versionNumber - b.versionNumber);
  const width = 340; const rowHeight = 88; const height = Math.max(200, versions.length * rowHeight + 44);
  const positions = Object.fromEntries(versions.map((version, index) => {
    let x = 170;
    if (version.kind === 'branch') x = version.versionId === prompt?.branchConfig?.leftBranchVersionId ? 82 : 258;
    return [version.versionId, { x, y: 42 + index * rowHeight }];
  }));
  return <div className="graph-layout"><div className="graph-intro"><span className="eyebrow">Prompt topology</span><h2>{prompt?.title}</h2><p>Edges preserve every parent link. Branch and merge nodes are offset by kind.</p><div className="graph-legend"><span><i className="main" />Main</span><span><i className="branch" />Branch</span><span><i className="merge" />Merge</span><span><i className="restore" />Restore</span></div></div><div className="graph-scroll"><div className="version-graph" style={{ width, height }}>
    <svg width={width} height={height} aria-hidden="true">{versions.flatMap((version) => version.parentIds.map((parentId) => { const from = positions[parentId]; const to = positions[version.versionId]; if (!from || !to) return null; return <path key={`${parentId}-${version.versionId}`} d={`M ${from.x} ${from.y + 26} C ${from.x} ${from.y + 58}, ${to.x} ${to.y - 30}, ${to.x} ${to.y - 26}`} />; }))}</svg>
    {versions.map((version) => { const position = positions[version.versionId]; const initials = version.author.split(' ').map((part) => part[0]).join('').slice(0, 2); const base = state.baseVersionId === version.versionId; const compare = state.compareVersionId === version.versionId; return <button type="button" key={version.versionId} style={{ left: position.x - 58, top: position.y - 26 }} className={`graph-node ${version.kind} ${base ? 'is-base' : ''} ${compare ? 'is-compare' : ''} ${state.newNodeId === version.versionId ? 'is-new' : ''}`} onClick={() => state.setBaseVersion(version.versionId)}><span className="graph-version">v{version.versionNumber}</span><span className="graph-initials">{initials}</span><small>{version.kind}</small>{base && <b>B</b>}{compare && <b>C</b>}</button>; })}
  </div></div></div>;
}

function RestoreModal({ prompt }) {
  const state = useStudioStore();
  const isOpen = Boolean(state.restoreDialog);
  useEffect(() => {
    if (isOpen) {
      const active = document.activeElement;
      return () => { if (active) active.focus(); };
    }
  }, [isOpen]);
  const source = prompt?.versions.find((version) => version.versionId === state.restoreDialog?.versionId);
  const { register, handleSubmit, watch, reset, setError, formState: { errors } } = useForm({ resolver: zodResolver(restoreCreateSchema), defaultValues: { sourceVersionId: source?.versionId || '', changeNote: '' } });
  useEffect(() => reset({ sourceVersionId: source?.versionId || '', changeNote: '' }), [source?.versionId, reset]);
  const note = watch('changeNote') || '';
  const valid = Boolean(source && note.trim().length >= 1 && note.length <= 200 && note.toLocaleLowerCase().includes(`v${source.versionNumber}`.toLocaleLowerCase()));
  const noteError = errors.changeNote?.message || (!note.trim() ? 'changeNote is required and must name the restore source version.' : note.length > 200 ? 'changeNote must be 200 characters or fewer.' : source && !note.toLocaleLowerCase().includes(`v${source.versionNumber}`.toLocaleLowerCase()) ? `changeNote must name restore source v${source.versionNumber}.` : '');
  const submit = (payload) => {
    if (!payload.changeNote.toLocaleLowerCase().includes(`v${source.versionNumber}`.toLocaleLowerCase())) { setError('changeNote', { message: `changeNote must name restore source v${source.versionNumber}.` }); return; }
    state.restoreVersion(payload.sourceVersionId, payload.changeNote);
  };
  return <div onKeyDown={(e) => { if (e.key === 'Escape') state.setRestoreDialog(null); }}><ComposedModal open={isOpen} onClose={() => state.setRestoreDialog(null)} size="sm" selectorPrimaryFocus="#restore-change-note"><ModalHeader label="Immutable history" title={`Restore source v${source?.versionNumber || ''}`} buttonOnClick={() => state.setRestoreDialog(null)} /><ModalBody><p className="modal-lead">This creates one new head version whose text exactly matches <strong>v{source?.versionNumber}</strong>. Existing versions remain untouched.</p><form id="restore-form" onSubmit={handleSubmit(submit)}><input type="hidden" {...register('sourceVersionId')} /><TextArea id="restore-change-note" labelText="Change note" helperText={`Required · 1–200 characters · must include v${source?.versionNumber || ''}`} rows={4} {...register('changeNote')} invalid={Boolean(noteError)} invalidText={noteError} /></form></ModalBody><ModalFooter><Button kind="secondary" onClick={() => state.setRestoreDialog(null)}>Cancel</Button><Button type="submit" form="restore-form" disabled={!valid}>Restore version</Button></ModalFooter></ComposedModal></div>;
}

function AnnotationModal() {
  const state = useStudioStore();
  const isOpen = state.annotationComposerOpen;
  useEffect(() => {
    if (isOpen) {
      const active = document.activeElement;
      return () => { if (active) active.focus(); };
    }
  }, [isOpen]);
  const range = state.selectedRange || { lineStart: 1, lineEnd: 1 };
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(annotationCreateSchema), defaultValues: { bodyMarkdown: '', author: 'Mara Sol', lineStart: range.lineStart, lineEnd: range.lineEnd } });
  useEffect(() => reset({ bodyMarkdown: '', author: 'Mara Sol', lineStart: range.lineStart, lineEnd: range.lineEnd }), [range.lineStart, range.lineEnd, reset, state.annotationComposerOpen]);
  const markdown = watch('bodyMarkdown') || '';
  return <div onKeyDown={(e) => { if (e.key === 'Escape') state.setAnnotationComposerOpen(false); }}><ComposedModal open={isOpen} onClose={() => state.setAnnotationComposerOpen(false)} size="md" selectorPrimaryFocus="#annotation-body"><ModalHeader label={`Lines ${range.lineStart}–${range.lineEnd}`} title="Add annotation" buttonOnClick={() => state.setAnnotationComposerOpen(false)} /><ModalBody><form id="annotation-form" className="annotation-form" onSubmit={handleSubmit(state.postAnnotation)}><div className="annotation-fields"><TextInput id="annotation-author" labelText="Author" {...register('author')} invalid={Boolean(errors.author)} invalidText={errors.author?.message} /><div className="range-inputs"><TextInput id="line-start" type="number" labelText="Line start" {...register('lineStart')} invalid={Boolean(errors.lineStart)} invalidText={errors.lineStart?.message} /><TextInput id="line-end" type="number" labelText="Line end" {...register('lineEnd')} invalid={Boolean(errors.lineEnd)} invalidText={errors.lineEnd?.message} /></div><TextArea id="annotation-body" labelText="bodyMarkdown" helperText="Markdown, fenced code, and checklists supported · 1–4000 characters" rows={8} {...register('bodyMarkdown')} invalid={Boolean(errors.bodyMarkdown)} invalidText={errors.bodyMarkdown?.message} /></div><div className="annotation-preview"><span className="eyebrow">Live preview</span>{markdown.trim() ? <MarkdownView markdown={markdown} /> : <p className="preview-empty">Formatted annotation text will appear here.</p>}</div></form></ModalBody><ModalFooter><Button kind="secondary" onClick={() => state.setAnnotationComposerOpen(false)}>Cancel</Button><Button type="submit" form="annotation-form">Post annotation</Button></ModalFooter></ComposedModal></div>;
}

function ImportForm() {
  const state = useStudioStore();
  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm({ defaultValues: { packageJson: state.importDraft } });
  const draft = watch('packageJson');
  useEffect(() => state.setImportDraft(draft || ''), [draft]);
  const validateAndImport = ({ packageJson }) => {
    let parsed;
    try { parsed = JSON.parse(packageJson); } catch (error) { setError('packageJson', { message: `Import parse error: ${error.message}` }); state.setImportError(`Import parse error: ${error.message}`); return; }
    const result = versionPackageSchema.safeParse(parsed);
    if (!result.success) { const message = formatZodError(result.error); setError('packageJson', { message }); state.setImportError(message); return; }
    state.importPackage(result.data);
  };
  const loadFile = async (event) => { const file = event.target.files?.[0]; if (file) setValue('packageJson', await file.text(), { shouldValidate: true }); };
  return <form className="import-form" onSubmit={handleSubmit(validateAndImport)}><div className="import-heading"><div><span className="eyebrow">VersionPackage</span><h3>Import JSON package</h3></div><label className="file-button"><ImportExport size={16} /> Load JSON file<input type="file" accept="application/json,.json" onChange={loadFile} /></label></div><TextArea id="import-json" labelText="Package JSON" rows={13} {...register('packageJson', { required: 'Import package JSON is required.' })} invalid={Boolean(errors.packageJson || state.importError)} invalidText={errors.packageJson?.message || state.importError} /><div className="import-actions"><Button type="button" kind="ghost" onClick={() => state.setImportOpen(false)}>Back to preview</Button><Button type="submit" renderIcon={ImportExport}>Import package</Button></div></form>;
}

function ExportModal() {
  const state = useStudioStore();
  const isOpen = state.exportOpen;
  useEffect(() => {
    if (isOpen) {
      const active = document.activeElement;
      return () => { if (active) active.focus(); };
    }
  }, [isOpen]);
  const content = artifactForTab(state, state.exportTab);
  const [copied, setCopied] = useState(false);
  const hasMerged = Boolean(getMergedText(state));
  const copy = async () => {
    try { await navigator.clipboard.writeText(content); }
    catch {
      const helper = document.createElement('textarea'); helper.value = content; helper.style.position = 'fixed'; helper.style.opacity = '0'; document.body.appendChild(helper); helper.select(); document.execCommand('copy'); helper.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1400);
    useStudioStore.setState((current) => ({ toasts: [...current.toasts, { id: `${Date.now()}`, kind: 'success', message: 'Artifact copied to the clipboard.' }] }));
  };
  const download = () => {
    const extensions = { history: 'md', package: 'json', merged: 'txt' };
    const types = { history: 'text/markdown', package: 'application/json', merged: 'text/plain' };
    const blob = new Blob([content], { type: types[state.exportTab] }); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = `prompt-ledger-${state.exportTab}.${extensions[state.exportTab]}`; anchor.click(); URL.revokeObjectURL(href);
    useStudioStore.setState((current) => ({ toasts: [...current.toasts, { id: `${Date.now()}`, kind: 'success', message: 'Artifact download started.' }] }));
  };
  return <div onKeyDown={(e) => { if (e.key === 'Escape') state.setExportOpen(false); }}><ComposedModal className="export-modal" open={isOpen} onClose={() => state.setExportOpen(false)} size="lg"><ModalHeader label="Live artifacts" title="Export prompt history" buttonOnClick={() => state.setExportOpen(false)} /><ModalBody>{state.importOpen ? <ImportForm /> : <>
    <div className="export-tab-row" role="tablist" aria-label="Export formats"><Button role="tab" aria-selected={state.exportTab === 'history'} size="sm" kind={state.exportTab === 'history' ? 'secondary' : 'ghost'} onClick={() => state.setExportTab('history')}>History report</Button><Button role="tab" aria-selected={state.exportTab === 'package'} size="sm" kind={state.exportTab === 'package' ? 'secondary' : 'ghost'} onClick={() => state.setExportTab('package')}>Version package</Button><Button role="tab" aria-selected={state.exportTab === 'merged'} size="sm" kind={state.exportTab === 'merged' ? 'secondary' : 'ghost'} disabled={!hasMerged} onClick={() => state.setExportTab('merged')}>Merged prompt text</Button></div>
    <div className="export-meta"><span>{state.exportTab === 'history' ? 'Markdown' : state.exportTab === 'package' ? 'JSON · prompt-diff-package-v1' : 'Plain text · byte-identical merge output'}</span><span>{new Blob([content]).size.toLocaleString()} bytes</span></div>
    <pre className="artifact-preview" tabIndex="0">{content || 'Complete a merge to produce merged prompt text.'}</pre>
    {state.exportTab === 'package' && <div className="schema-chips"><Tag type="blue">schemaVersion</Tag><Tag type="cool-gray">versions[]</Tag><Tag type="cool-gray">counters</Tag><Tag type="cool-gray">annotations[]</Tag><Tag type="purple">merge</Tag></div>}
  </>}</ModalBody>{!state.importOpen && <ModalFooter><Button kind="ghost" renderIcon={ImportExport} onClick={() => state.setImportOpen(true)}>Import</Button><Button kind="secondary" renderIcon={Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button><Button renderIcon={Download} onClick={download}>Download</Button></ModalFooter>}</ComposedModal></div>;
}

function ToastStack() {
  const state = useStudioStore();
  useEffect(() => { const ids = state.toasts.map((item) => setTimeout(() => state.dismissToast(item.id), 4200)); return () => ids.forEach(clearTimeout); }, [state.toasts.length]);
  return <div className="toast-stack" aria-live="polite">{state.toasts.slice(-3).map((item) => <InlineNotification key={item.id} kind={item.kind === 'info' ? 'info' : 'success'} title={item.message} lowContrast hideCloseButton={false} onCloseButtonClick={() => state.dismissToast(item.id)} />)}</div>;
}

export default function App() {
  const { state, prompt, base, compare, diff } = useCurrent();
  const annotations = state.annotations[state.selectedPromptId] || [];
  useEffect(() => registerWebMCP(), []);
  return <div className="app-shell">
    <AppHeader prompt={prompt} />
    <PromptRail prompt={prompt} />
    {state.sidebarOpen && <button className="rail-scrim" aria-label="Close prompt rail" onClick={() => state.setSidebarOpen(false)} />}
    <main className="workspace">
      <WorkspaceToolbar prompt={prompt} base={base} compare={compare} diff={diff} />
      <SelectionBar />
      <div className="surface-wrap" key={`${state.baseVersionId}-${state.compareVersionId}-${state.ignoreWhitespace}-${state.ignoreCase}-${state.activeMode}`}>
        {state.activeMode === 'diff' && <DiffSurface diff={diff} annotations={annotations} base={base} compare={compare} />}
        {state.activeMode === 'compare-branches' && <BranchCompare prompt={prompt} />}
        {state.activeMode === 'blame' && <BlameView prompt={prompt} compare={compare} annotations={annotations} />}
        {state.activeMode === 'graph' && <VersionGraph prompt={prompt} />}
      </div>
      <ThreadPanel annotations={annotations} />
    </main>
    <RestoreModal prompt={prompt} />
    <AnnotationModal />
    <ExportModal />
    <ToastStack />
    <div className="sr-live" aria-live="polite">{state.liveMessage}</div>
  </div>;
}
