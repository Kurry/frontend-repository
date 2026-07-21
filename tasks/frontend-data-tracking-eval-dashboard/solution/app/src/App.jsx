import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  IconButton,
  Modal,
  TextInput,
  MultiSelect,
  Toggle,
  Tag,
  InlineNotification,
  ToastNotification,
  Select,
  SelectItem,
  Tabs,
  TabList,
  Tab,
  TextArea,
  FileUploaderButton,
  ContentSwitcher,
  Switch,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
} from '@carbon/react';
import {
  Add,
  Play,
  Pause,
  Restart,
  Download,
  Copy,
  Upload,
  Undo,
  Redo,
  Settings,
  Moon,
  Edit,
  TrashCan,
  Menu,
  Close,
  ChevronDown,
  CaretUp,
  CaretDown,
  CheckmarkFilled,
  InProgress,
  ErrorFilled,
  Time,
  ChartBar,
  Compare,
  List,
  Export,
  Star,
  StarFilled,
} from '@carbon/icons-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatePresence, motion } from 'motion/react';
import { exportDocumentSchema, importSchema, nightWindowSchema, suiteSchema } from './schemas';
import {
  MODEL_COLORS,
  MODELS,
  PROMPTS,
  compileCsv,
  compileExportDocument,
  getLatestRun,
  pauseRunCommand,
  restartRunCommand,
  resumeRunCommand,
  retryStepCommand,
  startRunCommand,
  useEvalStore,
} from './store';
import { copyActiveArtifact, downloadArtifact } from './artifacts';

const formatDateTime = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not run yet';
const formatTime = (value) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(value));
const formatDuration = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
const pluralize = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

function scoreTone(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'warm-gray';
  return 'red';
}

function ScoreBadge({ score, label }) {
  if (score === null || score === undefined) return <Tag type="cool-gray" size="sm">Not scored</Tag>;
  return <Tag type={scoreTone(score)} size="sm" className={`score-tag score-${score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low'}`}>{label || `${score}`}</Tag>;
}

function PassBadge({ value }) {
  return <Tag type={value === 'pass' ? 'green' : 'red'} size="sm" className="pass-tag">{value === 'pass' ? 'Pass' : 'Fail'}</Tag>;
}

const STATUS_ICON = {
  pending: Time,
  running: InProgress,
  retrying: Restart,
  paused: Pause,
  complete: CheckmarkFilled,
  failed: ErrorFilled,
};

function StatusPill({ status }) {
  const Icon = STATUS_ICON[status] || Time;
  return <span className={`status-pill status-${status}`}><Icon size={14} aria-hidden="true" />{status}</span>;
}

// The control that opened a dialog; Carbon modals refocus it on close.
const dialogLauncher = { current: null };
const captureLauncher = (event) => { dialogLauncher.current = event?.currentTarget || document.activeElement; };

// Capture-phase Escape so a child widget (e.g. the MultiSelect menu) can
// never swallow the key event and keep the dialog open.
function useEscapeCapture(open, close) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, close]);
}

// Synchronous reduced-motion check so motion components never mount (and
// never log their dev warning) when the preference is active.
function usePrefersReducedMotion() {
  const [value, setValue] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setValue(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return value;
}

// Keeps an element mounted for `delayMs` after `open` flips false so CSS
// exit transitions can play.
function useMountTransition(open, delayMs) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return undefined;
    }
    if (!mounted) return undefined;
    const timer = window.setTimeout(() => setMounted(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [open, mounted, delayMs]);
  return mounted;
}

// Flips true two frames after `open`, guaranteeing the browser painted the
// closed style first so the opening transition actually runs.
function useOpenClass(open) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!open) {
      setShown(false);
      return undefined;
    }
    let second;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, [open]);
  return shown;
}

// Drawer behavior: focus on open, Tab cycle inside, capture-phase Escape,
// and focus restored to the control that opened it.
function useDrawerBehavior(open, close, panelRef) {
  useEffect(() => {
    if (!open) return undefined;
    const trigger = document.activeElement;
    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const nodes = [...panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((node) => !node.disabled && node.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey, true);
      trigger?.focus?.();
    };
  }, [open, close, panelRef]);
}

// Carbon's MultiSelect and TextArea do not wire aria-describedby to their
// validation message, so point the focusable element at the rendered error
// node directly.
function useDescribedByPatch(wrapId, targetSelector, errorId, hasError) {
  useEffect(() => {
    const root = wrapId ? document.getElementById(wrapId) : document;
    const field = root?.querySelector(targetSelector);
    if (!field) return;
    if (hasError) {
      field.setAttribute('aria-describedby', errorId);
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-describedby');
      field.removeAttribute('aria-invalid');
    }
  }, [wrapId, targetSelector, errorId, hasError]);
}

function Header() {
  const state = useEvalStore();
  const selected = state.suites.find((suite) => suite.id === state.selectedSuiteId);
  const activeForSelected = state.activeRun?.suiteId === selected?.id ? state.activeRun : null;
  const runBusy = state.activeRun && ['running', 'retrying'].includes(state.activeRun.status);
  const paused = activeForSelected?.paused;
  const handleRun = () => startRunCommand(selected?.id);
  return (
    <header className="app-header">
      <div className="brand-row">
        <IconButton className="mobile-menu" label="Open suite navigation" kind="ghost" onClick={() => state.setSidebarOpen(true)}><Menu /></IconButton>
        <div className="brand-mark"><ChartBar size={20} /></div>
        <div>
          <h1>Eval Studio</h1>
          <p>Prompt quality operations</p>
        </div>
        <div className="header-context" aria-live="polite">
          {selected ? <><span>{selected.name}</span><i /> <span>{pluralize(selected.promptIds.length, 'prompt')}</span></> : <span>No suite selected</span>}
        </div>
      </div>
      <div className="toolbar" role="toolbar" aria-label="Evaluation actions">
        <Button size="sm" kind="ghost" renderIcon={Undo} onClick={state.undo} disabled={!state.history.length} title="Undo the last suite change (Ctrl+Z)">Undo</Button>
        <Button size="sm" kind="ghost" renderIcon={Redo} onClick={state.redo} disabled={!state.future.length} title="Redo the last undone suite change (Ctrl+Shift+Z)">Redo</Button>
        <Button size="sm" kind="ghost" renderIcon={Settings} onClick={(event) => { captureLauncher(event); state.openNightModal(); }} className="night-window-button">
          {state.nightWindow ? `${state.nightWindow.startTime}–${state.nightWindow.endTime}` : 'Night Window'}
        </Button>
        <Button size="sm" kind="ghost" renderIcon={Upload} onClick={(event) => { captureLauncher(event); state.openImport(); }} disabled={!selected}>Import results</Button>
        <Button size="sm" kind="ghost" renderIcon={Export} onClick={(event) => { captureLauncher(event); state.openExport('json'); }} disabled={!selected} title="Export results (Ctrl+E)">Export results</Button>
        <Button size="sm" kind="secondary" renderIcon={Compare} onClick={() => state.setMainView(state.mainView === 'results' ? 'comparison' : 'results')} disabled={!selected}>
          {state.mainView === 'results' ? 'Compare models' : 'Results view'}
        </Button>
        {activeForSelected && !['complete', 'failed'].includes(activeForSelected.status) ? (
          <Button size="sm" kind="tertiary" renderIcon={paused ? Play : Pause} onClick={paused ? resumeRunCommand : pauseRunCommand}>{paused ? 'Resume' : 'Pause'}</Button>
        ) : null}
        <Button size="sm" kind="primary" renderIcon={Play} onClick={handleRun} disabled={!selected || Boolean(runBusy)}>{runBusy ? 'Running…' : 'Run Suite'}</Button>
      </div>
    </header>
  );
}

function PassRateSparkline({ runs }) {
  const points = runs.slice(-7).map((run) => {
    const total = (run.passCount || 0) + (run.failCount || 0);
    return total ? (run.passCount / total) * 100 : 0;
  });
  if (points.length < 2) return null;
  const w = 92;
  const h = 24;
  const step = w / (points.length - 1);
  const coords = points.map((value, index) => `${(index * step).toFixed(1)},${(h - 2 - (value / 100) * (h - 4)).toFixed(1)}`);
  const latest = Math.round(points.at(-1));
  return (
    <span className="suite-sparkline" title={`Pass-rate trend across the last ${points.length} runs, currently ${latest}%`} aria-label={`Pass-rate sparkline, currently ${latest} percent`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        <polyline points={coords.join(' ')} fill="none" stroke="#5b5bd6" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={w.toFixed(1)} cy={(h - 2 - (points.at(-1) / 100) * (h - 4)).toFixed(1)} r="2.4" fill="#5b5bd6" />
      </svg>
      <em>{latest}% pass</em>
    </span>
  );
}

function SuiteCard({ suite }) {
  const state = useEvalStore();
  const selected = suite.id === state.selectedSuiteId;
  const pinned = state.pinnedSuiteIds.includes(suite.id);
  return (
    <article className={`suite-card ${selected ? 'selected' : ''} ${pinned ? 'pinned' : ''}`}>
      <button className="suite-select" onClick={() => state.selectSuite(suite.id)} aria-pressed={selected}>
        <span className="suite-title-row">
          <strong title={suite.name}>{suite.name}</strong>
          <span className="suite-badges">
            {pinned && <StarFilled size={12} className="pin-star" aria-label="Pinned suite" />}
            {suite.nightMode && <span className="moon-badge" title="Scheduled for night mode"><Moon size={14} /></span>}
          </span>
        </span>
        <span className="suite-meta"><span>{pluralize(suite.promptIds.length, 'prompt')}</span><span>Last run {formatDateTime(suite.lastRunAt)}</span></span>
        <span className="suite-score-row"><span>Average score</span><ScoreBadge score={suite.averageScore} /></span>
        {suite.runs.length > 1 && <span className="suite-spark-row"><PassRateSparkline runs={suite.runs} /></span>}
      </button>
      <div className="suite-actions">
        <div className="night-toggle-wrap" title={state.nightWindow ? `Run during ${state.nightWindow.startTime}–${state.nightWindow.endTime}` : 'Configure Night Window in the toolbar'}>
          <Toggle id={`night-${suite.id}`} size="sm" labelText="Night Mode" hideLabel toggled={suite.nightMode} onToggle={() => state.toggleNightMode(suite.id)} />
        </div>
        <IconButton label={pinned ? `Unpin ${suite.name}` : `Pin ${suite.name} to top`} size="sm" kind="ghost" className={`pin-button ${pinned ? 'is-pinned' : ''}`} onClick={() => state.togglePin(suite.id)}>{pinned ? <StarFilled /> : <Star />}</IconButton>
        <IconButton label={`Edit ${suite.name}`} size="sm" kind="ghost" onClick={(event) => { captureLauncher(event); state.openSuiteModal('edit', suite.id); }}><Edit /></IconButton>
        <IconButton label={`Delete ${suite.name}`} size="sm" kind="ghost" onClick={(event) => { captureLauncher(event); state.requestDelete(suite.id); }}><TrashCan /></IconButton>
      </div>
    </article>
  );
}

function Sidebar() {
  const state = useEvalStore();
  const reduceMotion = usePrefersReducedMotion();
  const ordered = useMemo(() => {
    const pinned = new Set(state.pinnedSuiteIds);
    return [...state.suites].sort((a, b) => (pinned.has(b.id) ? 1 : 0) - (pinned.has(a.id) ? 1 : 0));
  }, [state.suites, state.pinnedSuiteIds]);
  const content = (
    <>
      <div className="sidebar-heading">
        <div><span className="eyebrow">Workspace</span><h2>Evaluation suites</h2><p>{pluralize(state.suites.length, 'suite')}</p></div>
        <IconButton className="mobile-close" label="Close suite navigation" kind="ghost" onClick={() => state.setSidebarOpen(false)}><Close /></IconButton>
      </div>
      <Button className="new-suite-button" kind="primary" renderIcon={Add} onClick={(event) => { captureLauncher(event); state.openSuiteModal('create'); }}>New Suite</Button>
      <div className="suite-list" aria-label="Evaluation suites">
        {ordered.map((suite) => <SuiteCard key={suite.id} suite={suite} />)}
      </div>
      <div className="sidebar-footer"><span className="health-dot" />All evaluation services available</div>
      <div className="shortcut-hints" aria-label="Keyboard shortcuts">
        <span><kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo</span>
        <span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> Redo</span>
        <span><kbd>Ctrl</kbd>+<kbd>E</kbd> Export</span>
      </div>
    </>
  );
  return (
    <>
      <aside className="sidebar desktop-sidebar">{content}</aside>
      {reduceMotion ? (
        state.sidebarOpen && <div className="sidebar-scrim open" onClick={() => state.setSidebarOpen(false)}>
          <aside className="sidebar mobile-sidebar" onClick={(event) => event.stopPropagation()}>{content}</aside>
        </div>
      ) : (
        <AnimatePresence>
          {state.sidebarOpen && <motion.div className="sidebar-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={() => state.setSidebarOpen(false)}>
            <motion.aside className="sidebar mobile-sidebar" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.22 }} onClick={(event) => event.stopPropagation()}>{content}</motion.aside>
          </motion.div>}
        </AnimatePresence>
      )}
    </>
  );
}

function SuiteModal() {
  const state = useEvalStore();
  const modal = state.suiteModal;
  const suite = state.suites.find((item) => item.id === modal.suiteId);
  const defaultsRef = useRef({ name: '', promptIds: [] });
  const [stamp, setStamp] = useState(0);
  const submittingRef = useRef(false);
  const form = useForm({
    resolver: zodResolver(suiteSchema),
    mode: 'onChange',
    defaultValues: { name: '', promptIds: [] },
  });
  useEffect(() => {
    if (!modal.open) return;
    defaultsRef.current = modal.mode === 'edit' && suite
      ? { name: suite.name, promptIds: [...suite.promptIds] }
      : { name: '', promptIds: [] };
    form.reset(defaultsRef.current);
    setStamp((value) => value + 1);
    form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal.open]);
  useEscapeCapture(modal.open, state.closeSuiteModal);
  const submit = form.handleSubmit((value) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      if (modal.mode === 'edit') state.updateSuite(modal.suiteId, value);
      else state.createSuite(value);
    } finally {
      window.setTimeout(() => { submittingRef.current = false; }, 400);
    }
  });
  const nameError = form.formState.errors.name;
  const promptsError = form.formState.errors.promptIds;
  useDescribedByPatch('suite-prompts-wrap', '.cds--list-box__field', 'suite-prompts-error-msg', Boolean(promptsError));
  return (
    <Modal
      open={modal.open}
      modalHeading={modal.mode === 'edit' ? 'Edit evaluation suite' : 'Create evaluation suite'}
      modalLabel="Suite request"
      primaryButtonText={modal.mode === 'edit' ? 'Save Suite' : 'Submit'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!form.formState.isValid || form.formState.isSubmitting}
      onRequestClose={state.closeSuiteModal}
      onSecondarySubmit={state.closeSuiteModal}
      onRequestSubmit={submit}
      launcherButtonRef={dialogLauncher}
      selectorPrimaryFocus="#suite-name"
      size="sm"
    >
      <p className="modal-intro">Group prompts that should run and score together. The payload mirrors the suite API: name (1–80 characters) and promptIds (at least one).</p>
      <form key={stamp} onSubmit={submit} className="modal-form" noValidate>
        <TextInput
          id="suite-name"
          labelText="Suite name"
          placeholder="e.g. Release candidate guardrail"
          maxLength={81}
          {...form.register('name')}
          invalid={Boolean(nameError)}
          invalidText={nameError?.message}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'suite-name-error-msg' : undefined}
        />
        <div id="suite-prompts-wrap" className="prompts-field-wrap">
          <Controller
            name="promptIds"
            control={form.control}
            render={({ field }) => (
              <MultiSelect
                key={stamp}
                id="suite-prompts"
                titleText="Prompt selection"
                label="Choose one or more prompts"
                items={PROMPTS}
                itemToString={(item) => item?.title || ''}
                initialSelectedItems={PROMPTS.filter((prompt) => defaultsRef.current.promptIds.includes(prompt.id))}
                onChange={({ selectedItems }) => field.onChange(selectedItems.map((item) => item.id))}
                invalid={Boolean(promptsError)}
              />
            )}
          />
          {promptsError && <div id="suite-prompts-error-msg" className="cds--form-requirement field-error" role="alert">{promptsError.message}</div>}
        </div>
      </form>
    </Modal>
  );
}

function DeleteModal() {
  const state = useEvalStore();
  const suite = state.suites.find((item) => item.id === state.deleteModal.suiteId);
  useEscapeCapture(state.deleteModal.open, state.closeDelete);
  return (
    <Modal
      open={state.deleteModal.open}
      danger
      modalHeading="Delete evaluation suite?"
      primaryButtonText="Delete Suite"
      secondaryButtonText="Cancel"
      onRequestClose={state.closeDelete}
      onSecondarySubmit={state.closeDelete}
      onRequestSubmit={() => state.deleteSuite(state.deleteModal.suiteId)}
      launcherButtonRef={dialogLauncher}
      size="xs"
    >
      <p>This removes <strong>{suite?.name || 'this suite'}</strong> and its run history from this session. You can restore it with Undo.</p>
    </Modal>
  );
}

function NightWindowModal() {
  const state = useEvalStore();
  const form = useForm({
    resolver: zodResolver(nightWindowSchema),
    mode: 'onChange',
    defaultValues: { startTime: '22:00', endTime: '23:30' },
  });
  useEffect(() => {
    if (!state.nightModalOpen) return;
    form.reset(useEvalStore.getState().nightWindow || { startTime: '22:00', endTime: '23:30' });
    form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nightModalOpen]);
  useEscapeCapture(state.nightModalOpen, state.closeNightModal);
  const submit = form.handleSubmit(state.saveNightWindow);
  const startError = form.formState.errors.startTime;
  const endError = form.formState.errors.endTime;
  return (
    <Modal
      open={state.nightModalOpen}
      modalHeading="Configure Night Window"
      modalLabel="Automation schedule"
      primaryButtonText="Save Window"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!form.formState.isValid}
      onRequestClose={state.closeNightModal}
      onSecondarySubmit={state.closeNightModal}
      onRequestSubmit={submit}
      launcherButtonRef={dialogLauncher}
      selectorPrimaryFocus="#night-start"
      size="xs"
    >
      <p className="modal-intro">Scheduled suites run within a same-day UTC window.</p>
      <form onSubmit={submit} className="time-form" noValidate>
        <TextInput
          id="night-start"
          labelText="Night start time"
          type="time"
          {...form.register('startTime')}
          invalid={Boolean(startError)}
          invalidText={startError?.message}
          aria-invalid={startError ? true : undefined}
          aria-describedby={startError ? 'night-start-error-msg' : undefined}
        />
        <TextInput
          id="night-end"
          labelText="Night end time"
          type="time"
          {...form.register('endTime')}
          invalid={Boolean(endError)}
          invalidText={endError?.message}
          aria-invalid={endError ? true : undefined}
          aria-describedby={endError ? 'night-end-error-msg' : undefined}
        />
      </form>
    </Modal>
  );
}

function EmptyWorkspace() {
  const state = useEvalStore();
  return (
    <section className="workspace-empty">
      <div className="empty-icon"><List size={28} /></div>
      <h2>Select an evaluation suite</h2>
      <p>Choose a suite to inspect its latest results, or create a new suite and run it to populate results.</p>
      <div>
        <Button kind="primary" renderIcon={Add} onClick={(event) => { captureLauncher(event); state.openSuiteModal('create'); }}>New Suite</Button>
        {state.suites.length > 0 && <Button kind="tertiary" onClick={() => state.selectSuite(state.suites[0].id)}>Select first suite</Button>}
      </div>
    </section>
  );
}

function Metric({ label, value, accent, tone }) {
  return <div className="metric"><span>{label}</span><strong className={`${accent ? 'accent' : ''} ${tone ? `delta-${tone}` : ''}`}>{value}</strong></div>;
}

function chartAverages(results) {
  return MODELS.map((model) => {
    const rows = results.filter((row) => row.model === model);
    return { model, score: rows.length ? Math.round((rows.reduce((sum, row) => sum + row.score, 0) / rows.length) * 10) / 10 : 0, fill: MODEL_COLORS[model] };
  }).filter((row) => results.some((result) => result.model === row.model));
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="chart-tooltip"><strong>{row.model || row.date}</strong><span>Average score · {payload[0].value}</span></div>;
}

function Charts({ suite, results }) {
  const state = useEvalStore();
  const latest = getLatestRun(suite);
  const averages = useMemo(() => chartAverages(results), [results]);
  const trend = suite.runs.slice(-7).map((run) => ({ date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(run.finishedAt)), score: run.averageScore }));
  if (!latest && !results.length) {
    return <section className="chart-empty"><div><ChartBar size={24} /></div><p>Charts will appear after this suite’s first run.</p></section>;
  }
  return (
    <section className="chart-strip" aria-label="Score charts">
      <article className="panel chart-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Latest run{state.modelFilter ? ` · filtered to ${state.modelFilter}` : ''}</span><h2>Average score by model</h2></div>
          <ScoreBadge score={latest?.averageScore} label={`${latest?.averageScore} avg`} />
        </div>
        <div className="chart-box">
          <span className="axis-label">Average score</span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart key={`${latest?.id || 'bar'}-${state.density}`} data={averages} margin={{ top: 10, right: 10, left: 0, bottom: 2 }} className="grow-bars">
              <CartesianGrid stroke="#e7e5df" vertical={false} />
              <XAxis dataKey="model" tick={{ fontSize: 11, fill: '#625f59' }} axisLine={false} tickLine={false} />
              <YAxis width={42} domain={[0, 100]} tick={{ fontSize: 11, fill: '#77736c' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(91,91,214,.07)' }} />
              <Bar
                dataKey="score"
                radius={[5, 5, 0, 0]}
                isAnimationActive={false}
                cursor="pointer"
                onClick={(data) => {
                  const model = data?.payload?.model || data?.model;
                  if (model) state.toggleModelFilter(model);
                }}
              >
                {averages.map((entry) => (
                  <Cell key={entry.model} fill={entry.fill} fillOpacity={!state.modelFilter || state.modelFilter === entry.model ? 1 : 0.28} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-hint">Click a bar to filter the results table to that model</p>
        </div>
      </article>
      <article className="panel chart-panel trend-panel">
        <div className="panel-heading"><div><span className="eyebrow">Run history</span><h2>7-run score trend</h2></div><span className="trend-caption">Last {trend.length} runs</span></div>
        <div className="chart-box">
          <span className="axis-label">Average score</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={latest?.id || 'line'} data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 2 }}>
              <CartesianGrid stroke="#e7e5df" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#625f59' }} axisLine={false} tickLine={false} />
              <YAxis width={42} domain={[0, 100]} tick={{ fontSize: 11, fill: '#77736c' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#8f8fe8', strokeWidth: 1.5, strokeDasharray: '4 3' }} />
              <Line type="monotone" dataKey="score" stroke="#5b5bd6" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive animationDuration={420} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

const COLUMNS = [
  { key: 'promptTitle', label: 'Prompt title' },
  { key: 'model', label: 'Model' },
  { key: 'score', label: 'Score' },
  { key: 'latencyMs', label: 'Latency (ms)' },
  { key: 'tokens', label: 'Tokens used' },
  { key: 'passFail', label: 'Pass / Fail' },
];

function sortRows(results, sort) {
  return results.map((row, index) => ({ row, index })).sort((a, b) => {
    const left = a.row[sort.key];
    const right = b.row[sort.key];
    const compared = (typeof left === 'number' ? left - right : String(left).localeCompare(String(right))) || (a.index - b.index);
    return sort.direction === 'asc' ? compared : -compared;
  }).map(({ row }) => row);
}

async function copyResultRow(row) {
  const { rowId, ...record } = row;
  try {
    await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    useEvalStore.getState().pushToast('Result copied', `${row.promptTitle} · ${row.model} is on the clipboard as JSON.`);
  } catch {
    useEvalStore.getState().pushToast('Copy unavailable', 'Clipboard permission was not granted.');
  }
}

function ResultsTable({ suite, results, live }) {
  const state = useEvalStore();
  const filtered = state.modelFilter ? results.filter((row) => row.model === state.modelFilter) : results;
  const rows = useMemo(() => sortRows(filtered, state.sort), [filtered, state.sort]);
  if (!results.length && live) {
    return (
      <section className="results-empty live-empty">
        <div className="empty-icon"><InProgress size={24} /></div>
        <h2>First prompt in progress</h2>
        <p>Scored rows will appear here one by one as model responses complete.</p>
      </section>
    );
  }
  if (!results.length) {
    return (
      <section className="results-empty">
        <div className="empty-icon"><Play size={24} /></div>
        <h2>No results yet</h2>
        <p>Run this suite to populate scored results. Export results is still available with a version 1 JSON artifact and a header-only CSV.</p>
        <Button renderIcon={Play} onClick={() => startRunCommand(suite.id)}>Run Suite</Button>
      </section>
    );
  }
  const importDiff = state.importDiff?.suiteId === suite.id ? state.importDiff : null;
  const importDelta = importDiff && importDiff.previousAverage !== null ? Math.round((importDiff.nextAverage - importDiff.previousAverage) * 10) / 10 : null;
  return (
    <section className={`panel results-panel density-${state.density}`}>
      <div className="panel-heading results-heading">
        <div><span className="eyebrow">{live ? 'Live output' : 'Latest output'}</span><h2>Evaluation results</h2></div>
        <div className="results-tools">
          {state.modelFilter && (
            <button className="filter-chip" onClick={() => state.setModelFilter(null)} aria-label={`Clear model filter, currently ${state.modelFilter}`}>
              <span className="model-dot" style={{ background: MODEL_COLORS[state.modelFilter] }} />{state.modelFilter}<Close size={12} />
            </button>
          )}
          {importDiff && (
            <span className="import-chip" role="status">
              <Upload size={12} />Imported run · avg {importDiff.nextAverage}{importDelta !== null ? ` (${importDelta > 0 ? '+' : ''}${importDelta} vs previous)` : ''}
            </span>
          )}
          <span className="results-summary"><span>{pluralize(filtered.length, 'response')}</span><span>{filtered.filter((row) => row.passFail === 'pass').length} passing</span></span>
          <ContentSwitcher size="sm" className="density-switch" selectedIndex={state.density === 'compact' ? 1 : 0} onChange={(choice) => state.setDensity(choice.name)} aria-label="Table density preference (persists for this session)">
            <Switch name="comfortable" text="Comfortable" />
            <Switch name="compact" text="Compact" />
          </ContentSwitcher>
        </div>
      </div>
      <TableContainer className="results-table-wrap">
        <Table size={state.density === 'compact' ? 'sm' : 'lg'} useZebraStyles={false} aria-label="Evaluation results">
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHeader key={column.key}>
                  <button className="sort-button" onClick={() => state.setSort(column.key)} aria-label={`Sort by ${column.label} ${state.sort.key === column.key ? (state.sort.direction === 'asc' ? 'ascending' : 'descending') : 'ascending'}`}>
                    {column.label}{state.sort.key === column.key ? (state.sort.direction === 'desc' ? <CaretDown className="sort-active" /> : <CaretUp className="sort-active" />) : <CaretUp className="sort-idle" />}
                  </button>
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.rowId}
                className={`result-row ${state.freshImportRowIds.includes(row.rowId) ? 'row-flash' : ''}`}
                style={{ '--row-delay': live ? `${(index % MODELS.length) * 80}ms` : `${Math.min(index, 14) * 80}ms` }}
                onClick={() => state.selectResult(row.rowId)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.selectResult(row.rowId); }
                }}
                aria-label={`Open details for ${row.promptTitle}, ${row.model}, score ${row.score}`}
              >
                <TableCell><span className="prompt-cell" title={row.promptTitle}>{row.promptTitle}</span></TableCell>
                <TableCell><span className="model-dot" style={{ background: MODEL_COLORS[row.model] }} />{row.model}</TableCell>
                <TableCell><strong className="table-score">{row.score}</strong></TableCell>
                <TableCell>{row.latencyMs.toLocaleString()}</TableCell>
                <TableCell>{row.tokens.toLocaleString()}</TableCell>
                <TableCell>
                  <span className="pass-cell">
                    <PassBadge value={row.passFail} />
                    <IconButton size="sm" kind="ghost" className="row-copy" label={`Copy ${row.promptTitle} result for ${row.model} as JSON`} onClick={(event) => { event.stopPropagation(); copyResultRow(row); }}><Copy size={14} /></IconButton>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}

function ComparisonTable({ results }) {
  const state = useEvalStore();
  const visibleModels = state.modelFilter ? MODELS.filter((model) => model === state.modelFilter) : MODELS;
  const filtered = state.modelFilter ? results.filter((row) => row.model === state.modelFilter) : results;
  const prompts = [...new Set(filtered.map((row) => row.promptTitle))];
  return (
    <section className="panel comparison-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Side-by-side</span><h2>Model comparison</h2></div>
        <div className="results-tools">
          {state.modelFilter && (
            <button className="filter-chip" onClick={() => state.setModelFilter(null)} aria-label={`Clear model filter, currently ${state.modelFilter}`}>
              <span className="model-dot" style={{ background: MODEL_COLORS[state.modelFilter] }} />{state.modelFilter}<Close size={12} />
            </button>
          )}
          <span className="trend-caption">Score · latency</span>
        </div>
      </div>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead><tr><th>Prompt</th>{visibleModels.map((model) => <th key={model}><span className="model-line" style={{ background: MODEL_COLORS[model] }} />{model}</th>)}</tr></thead>
          <tbody>{prompts.map((prompt) => <tr key={prompt}><th title={prompt}>{prompt}</th>{visibleModels.map((model) => {
            const row = filtered.find((result) => result.promptTitle === prompt && result.model === model);
            return <td key={model}>{row ? <><strong>{row.score}</strong><span>{row.latencyMs.toLocaleString()} ms</span></> : <span>—</span>}</td>;
          })}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function RunInspector({ run }) {
  const state = useEvalStore();
  const completed = run.steps.filter((step) => step.status === 'complete').length;
  const failed = run.steps.filter((step) => step.status === 'failed').length;
  const filteredEvents = run.events.filter((event) => state.timelineFilter === 'all' || event.status === state.timelineFilter);
  return (
    <aside className="run-inspector" aria-label="Run execution">
      <section className="panel run-rollup">
        <div className="panel-heading compact"><div><span className="eyebrow">Run execution</span><h2>{run.status === 'complete' ? 'Run complete' : run.status === 'failed' ? 'Action required' : run.paused ? 'Run paused' : 'Evaluating prompts'}</h2></div><StatusPill key={`${run.status === 'failed' ? 'failed' : run.paused ? 'paused' : run.status}-${failed}`} status={run.status === 'failed' ? 'failed' : run.paused ? 'paused' : run.status} /></div>
        <div className="rollup-grid"><Metric label="Complete" value={`${completed} of ${run.steps.length}`} accent /><Metric label="Elapsed" value={formatDuration(run.elapsedMs)} /><Metric label="Failures" value={failed} tone={failed ? 'down' : undefined} /></div>
        <div className="run-progress"><span style={{ width: `${(completed / run.steps.length) * 100}%` }} /></div>
        <div className="run-actions">
          {!['complete', 'failed'].includes(run.status) && <Button size="sm" kind="tertiary" renderIcon={run.paused ? Play : Pause} onClick={run.paused ? resumeRunCommand : pauseRunCommand}>{run.paused ? 'Resume' : 'Pause'}</Button>}
          {run.status === 'complete' && <Button size="sm" kind="ghost" renderIcon={Restart} onClick={restartRunCommand}>Run again</Button>}
        </div>
      </section>
      <section className="panel step-panel">
        <div className="section-title"><h3>Prompt steps</h3><span>{completed}/{run.steps.length}</span></div>
        <ol className="step-list">
          {run.steps.map((step, index) => (
            <li key={step.id} className={`step-item step-${step.status} ${run.highlightedStep === index ? 'highlighted' : ''}`}>
              <div className="step-index">{index + 1}</div>
              <div className="step-content">
                <strong title={step.title}>{step.title}</strong>
                <div className="step-state"><StatusPill key={step.status} status={step.status} />{step.attempts > 0 && <span>Attempt {step.attempts} of 3</span>}</div>
                {step.status === 'retrying' && <p className="retry-copy" aria-live="polite">Waiting {step.retryIn}s before retry {step.attempts + 1} of 3</p>}
                {step.error && <div className="step-error"><p>{step.error}</p><Button size="sm" kind="danger--tertiary" renderIcon={Restart} onClick={() => retryStepCommand(index)}>Retry</Button></div>}
                {step.status === 'running' && <div className="inline-loader"><span /><span /><span /></div>}
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="panel log-panel">
        <div className="section-title"><h3>Streaming run log</h3><span className="live-indicator"><i />Live</span></div>
        <div className="log-stream" aria-live="polite">
          {run.logs.length ? run.logs.slice(-12).map((log) => <div key={log.id} className="log-line"><StatusPill status={log.status} /><span>{log.message}</span><time>{formatTime(log.at)}</time></div>) : <p className="muted-empty">Waiting for the first evaluator event…</p>}
        </div>
      </section>
      <section className="panel timeline-panel">
        <div className="timeline-heading"><div><span className="eyebrow">Ordered activity</span><h3>Event timeline</h3></div><Select id="timeline-filter" labelText="Filter status" hideLabel value={state.timelineFilter} onChange={(event) => state.setTimelineFilter(event.target.value)} size="sm"><SelectItem value="all" text="All statuses" />{['pending', 'running', 'retrying', 'paused', 'complete', 'failed'].map((value) => <SelectItem key={value} value={value} text={value[0].toUpperCase() + value.slice(1)} />)}</Select></div>
        <div className="timeline-list">
          {filteredEvents.length ? [...filteredEvents].reverse().map((event) => <button key={event.id} className="timeline-event" onClick={() => event.stepIndex !== null && state.patchRun({ highlightedStep: event.stepIndex })}><span className={`timeline-dot status-${event.status}`} /><span><strong>{event.label}</strong><time>{formatTime(event.at)}</time></span></button>) : <p className="muted-empty">No timeline entries match this status.</p>}
        </div>
      </section>
    </aside>
  );
}

function DetailPanel({ row, open }) {
  const state = useEvalStore();
  const openDisclosure = Boolean(state.disclosureOpen[row.rowId]);
  return (
    <aside className={`detail-panel ${open ? 'open' : ''}`} aria-label="Result detail">
      <div className="detail-top"><div><span className="eyebrow">Result detail</span><h2>{row.promptTitle}</h2></div><IconButton label="Close result detail" kind="ghost" onClick={state.closeDetail}><Close /></IconButton></div>
      <div className="detail-metrics"><div><span>Model</span><strong><i className="model-dot" style={{ background: MODEL_COLORS[row.model] }} />{row.model}</strong></div><div><span>Score</span><strong>{row.score}/100</strong></div><div><span>Outcome</span><PassBadge value={row.passFail} /></div></div>
      <div className="detail-actions">
        <Button size="sm" kind="ghost" renderIcon={Copy} onClick={() => copyResultRow(row)}>Copy result JSON</Button>
      </div>
      <div className="detail-section"><h3>Full prompt</h3><p>{row.promptText}</p></div>
      <div className="detail-section response"><h3>Model response</h3><p>{row.response}</p></div>
      <div className={`disclosure ${openDisclosure ? 'open' : ''}`}>
        <button onClick={() => state.toggleDisclosure(row.rowId)} aria-expanded={openDisclosure}><span><span className="eyebrow">Rubric</span><strong>Scoring breakdown</strong></span><ChevronDown className="disclosure-chevron" /></button>
        <div className="disclosure-content" aria-hidden={!openDisclosure}>
          <div>{row.scoringBreakdown.map((item) => <div className="rubric-row" key={item.dimension}><span>{item.dimension}</span><div><i style={{ width: `${item.score}%` }} /></div><strong>{item.score}</strong></div>)}</div>
        </div>
      </div>
    </aside>
  );
}

function ExportDrawer() {
  const state = useEvalStore();
  const ref = useRef(null);
  const mounted = useMountTransition(state.exportOpen, 320);
  const shown = useOpenClass(state.exportOpen);
  useDrawerBehavior(state.exportOpen, state.closeExport, ref);
  const document = compileExportDocument(state);
  const json = JSON.stringify(document, null, 2);
  const csv = compileCsv(state);
  if (!mounted) return null;
  return (
    <div className={`drawer-scrim ${shown ? 'open' : ''}`} onMouseDown={state.closeExport}>
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="export-title" className="drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-header"><div><span className="eyebrow">Live session artifact</span><h2 id="export-title">Export results</h2><p>{document?.suite.name} · {pluralize(document?.results.length || 0, 'result record')}</p></div><IconButton label="Close export results" kind="ghost" onClick={state.closeExport}><Close /></IconButton></div>
        <div className="drawer-body">
          <Tabs selectedIndex={state.exportTab === 'json' ? 0 : 1} onChange={({ selectedIndex }) => state.setExportTab(selectedIndex === 0 ? 'json' : 'csv')}>
            <TabList aria-label="Export formats" contained><Tab>JSON</Tab><Tab>CSV</Tab></TabList>
          </Tabs>
          {!document?.results.length && <InlineNotification lowContrast hideCloseButton kind="info" title="No run results yet" subtitle="The JSON artifact keeps version 1 suite and run metadata with an empty results array; the CSV artifact keeps its header line. Both update live as soon as a run completes." />}
          <p className="shape-hint">Normative shape — top level: <code>version: 1</code>, <code>suite</code>, <code>run</code>, <code>results</code>. Compiled live from the session store.</p>
          <div className="artifact-preview"><div className="preview-bar"><span>{state.exportTab === 'json' ? 'eval-run-results.json' : 'eval-run-results.csv'}</span><span>{state.exportTab === 'json' ? json.split('\n').length : csv.split('\n').length} lines</span></div><pre>{state.exportTab === 'json' ? json : csv}</pre></div>
        </div>
        <div className="drawer-footer">
          <div className="copy-wrap"><Button kind="ghost" renderIcon={Copy} onClick={() => copyActiveArtifact().catch(() => state.pushToast('Copy unavailable', 'Clipboard permission was not granted.'))}>Copy</Button>{state.copied && <span className="copied-confirm" role="status"><CheckmarkFilled />Copied</span>}</div>
          <Button kind="tertiary" renderIcon={Download} onClick={() => downloadArtifact('csv')}>Download CSV</Button>
          <Button kind="primary" renderIcon={Download} onClick={() => downloadArtifact('json')}>Download JSON</Button>
        </div>
      </aside>
    </div>
  );
}

function ImportDrawer() {
  const state = useEvalStore();
  const ref = useRef(null);
  const mounted = useMountTransition(state.importOpen, 320);
  const shown = useOpenClass(state.importOpen);
  useDrawerBehavior(state.importOpen, state.closeImport, ref);
  const form = useForm({ resolver: zodResolver(importSchema), mode: 'onChange', defaultValues: { document: '' } });
  const submit = form.handleSubmit((value) => {
    try {
      const json = JSON.parse(value.document);
      const parsed = exportDocumentSchema.parse(json);
      state.importResults(parsed);
    } catch (error) {
      const issue = error?.issues?.[0];
      const path = issue?.path?.length ? ` at ${issue.path.join('.')}` : '';
      form.setError('document', { message: `Import${path}: ${issue?.message || 'JSON is malformed'}` });
    }
  });
  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (file) form.setValue('document', await file.text(), { shouldValidate: true, shouldDirty: true });
  };
  const docError = form.formState.errors.document;
  useDescribedByPatch(null, '#import-document', 'import-document-error-msg', Boolean(docError));
  if (!mounted) return null;
  return (
    <div className={`drawer-scrim ${shown ? 'open' : ''}`} onMouseDown={state.closeImport}>
      <aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="import-title" className="drawer import-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-header"><div><span className="eyebrow">Round-trip results</span><h2 id="import-title">Import results</h2><p>Replace the selected suite’s latest run with a previously exported document.</p></div><IconButton label="Close import results" kind="ghost" onClick={state.closeImport}><Close /></IconButton></div>
        <form className="drawer-body import-form" onSubmit={submit} noValidate>
          <InlineNotification lowContrast hideCloseButton kind="info" title="Validated before replacement" subtitle="The current results remain unchanged if any required result field is invalid." />
          <FileUploaderButton labelText="Choose exported JSON" buttonKind="tertiary" accept={['.json', 'application/json']} onChange={onFile} />
          <span className="or-divider">or paste the exported document</span>
          <TextArea
            id="import-document"
            labelText="Import JSON"
            placeholder={'{\n  "version": 1,\n  ...\n}'}
            rows={18}
            {...form.register('document')}
            invalid={Boolean(docError)}
            invalidText={docError?.message}
            aria-invalid={docError ? true : undefined}
            aria-describedby={docError ? 'import-document-error-msg' : undefined}
          />
        </form>
        <div className="drawer-footer"><Button kind="ghost" onClick={state.closeImport}>Cancel</Button><Button kind="primary" renderIcon={Upload} onClick={submit} disabled={!form.formState.isValid}>Import results</Button></div>
      </aside>
    </div>
  );
}

function Toasts() {
  const state = useEvalStore();
  const reduceMotion = usePrefersReducedMotion();
  if (reduceMotion) {
    return (
      <div className="toast-stack" aria-label="Notifications">
        {state.toasts.map((toast) => (
          <div key={toast.id}>
            <ToastNotification lowContrast kind="success" title={toast.title} subtitle={toast.subtitle} timeout={0} onClose={() => state.dismissToast(toast.id)} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="toast-stack" aria-label="Notifications">
      <AnimatePresence>
        {state.toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <ToastNotification lowContrast kind="success" title={toast.title} subtitle={toast.subtitle} timeout={0} onClose={() => state.dismissToast(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Workspace() {
  const state = useEvalStore();
  const suite = state.suites.find((item) => item.id === state.selectedSuiteId);
  const lastRowRef = useRef(null);
  const selectedRow = (() => {
    if (!suite) return null;
    const latest = getLatestRun(suite);
    const run = state.activeRun?.suiteId === suite.id ? state.activeRun : null;
    const live = run && !['complete', 'stopped'].includes(run.status);
    const results = live ? run.producedResults : (latest?.results || []);
    return results.find((row) => row.rowId === state.selectedResultId) || latest?.results.find((row) => row.rowId === state.selectedResultId) || null;
  })();
  if (selectedRow) lastRowRef.current = selectedRow;
  const detailMounted = useMountTransition(Boolean(selectedRow), 320);
  const detailShown = useOpenClass(Boolean(selectedRow));
  if (!suite) return <main className="main-content"><EmptyWorkspace /></main>;
  const latest = getLatestRun(suite);
  const previous = suite.runs.at(-2);
  const delta = latest && previous ? Math.round((latest.averageScore - previous.averageScore) * 10) / 10 : null;
  const run = state.activeRun?.suiteId === suite.id ? state.activeRun : null;
  const live = run && !['complete', 'stopped'].includes(run.status);
  const results = live ? run.producedResults : (latest?.results || []);
  return (
    <main className="main-content">
      <div className="workspace-title">
        <div><span className="eyebrow">Evaluation overview</span><h2>{suite.name}</h2><p>{pluralize(suite.promptIds.length, 'prompt')} · Latest run {formatDateTime(suite.lastRunAt)}</p></div>
        <div className="overview-metrics">
          <Metric label="Average" value={suite.averageScore ?? '—'} accent />
          <Metric label="Pass rate" value={latest?.results.length ? `${Math.round((latest.passCount / latest.results.length) * 100)}%` : '—'} />
          <Metric label="Total tokens" value={latest?.totalTokens?.toLocaleString() || '—'} />
          <Metric label="vs previous run" value={delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}`} tone={delta === null ? undefined : delta >= 0 ? 'up' : 'down'} />
        </div>
      </div>
      <Charts suite={suite} results={latest?.results || []} />
      <div className={`content-grid ${run ? 'with-run' : ''}`}>
        <div className="result-region">{state.mainView === 'comparison' ? (results.length ? <ComparisonTable results={results} /> : <ResultsTable suite={suite} results={results} live={live} />) : <ResultsTable suite={suite} results={results} live={live} />}</div>
        {run && <RunInspector run={run} />}
      </div>
      {detailMounted && lastRowRef.current && <DetailPanel row={lastRowRef.current} open={detailShown} />}
    </main>
  );
}

export default function App() {
  const state = useEvalStore();
  useEffect(() => {
    const handleShortcut = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) useEvalStore.getState().redo();
        else useEvalStore.getState().undo();
      } else if (key === 'e') {
        const snapshot = useEvalStore.getState();
        if (snapshot.selectedSuiteId) {
          event.preventDefault();
          if (!snapshot.exportOpen) snapshot.openExport('json');
        }
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
  return (
    <div className="app-shell">
      <Header />
      <Sidebar />
      <Workspace />
      <SuiteModal />
      <DeleteModal />
      <NightWindowModal />
      <ExportDrawer />
      <ImportDrawer />
      <Toasts />
      <div className="sr-only" aria-live="assertive">{state.ariaMessage}</div>
    </div>
  );
}
