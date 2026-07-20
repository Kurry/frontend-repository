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
  CheckmarkFilled,
  InProgress,
  ErrorFilled,
  Time,
  ChartBar,
  Compare,
  List,
  Export,
} from '@carbon/icons-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

function useDialogFocus(open, close, ref) {
  const triggerRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    triggerRef.current = document.activeElement;
    const frame = requestAnimationFrame(() => ref.current?.focus());
    const handleKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab' && ref.current) {
        const nodes = [...ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((node) => !node.disabled);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKey);
      triggerRef.current?.focus?.();
    };
  }, [open, close, ref]);
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
          {selected ? <><span>{selected.name}</span><i /> <span>{selected.promptIds.length} prompts</span></> : <span>No suite selected</span>}
        </div>
      </div>
      <div className="toolbar" role="toolbar" aria-label="Evaluation actions">
        <Button size="sm" kind="ghost" renderIcon={Undo} onClick={state.undo} disabled={!state.history.length} title="Undo (Ctrl+Z)">Undo</Button>
        <Button size="sm" kind="ghost" renderIcon={Redo} onClick={state.redo} disabled={!state.future.length} title="Redo (Ctrl+Shift+Z)">Redo</Button>
        <Button size="sm" kind="ghost" renderIcon={Settings} onClick={state.openNightModal} className="night-window-button">
          {state.nightWindow ? `${state.nightWindow.startTime}–${state.nightWindow.endTime}` : 'Night Window'}
        </Button>
        <Button size="sm" kind="ghost" renderIcon={Upload} onClick={state.openImport} disabled={!selected}>Import results</Button>
        <Button size="sm" kind="ghost" renderIcon={Export} onClick={() => state.openExport('json')} disabled={!selected}>Export results</Button>
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

function SuiteCard({ suite }) {
  const state = useEvalStore();
  const selected = suite.id === state.selectedSuiteId;
  return (
    <article className={`suite-card ${selected ? 'selected' : ''}`}>
      <button className="suite-select" onClick={() => state.selectSuite(suite.id)} aria-pressed={selected}>
        <span className="suite-title-row">
          <strong>{suite.name}</strong>
          {suite.nightMode && <motion.span initial={{ opacity: 0, scale: 0.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} className="moon-badge" title="Scheduled for night mode"><Moon size={14} /></motion.span>}
        </span>
        <span className="suite-meta"><span>{suite.promptIds.length} prompts</span><span>Last run {formatDateTime(suite.lastRunAt)}</span></span>
        <span className="suite-score-row"><span>Average score</span><ScoreBadge score={suite.averageScore} /></span>
      </button>
      <div className="suite-actions">
        <div className="night-toggle-wrap" title={state.nightWindow ? `Run during ${state.nightWindow.startTime}–${state.nightWindow.endTime}` : 'Configure Night Window in the toolbar'}>
          <Toggle id={`night-${suite.id}`} size="sm" labelText="Night Mode" hideLabel toggled={suite.nightMode} onToggle={() => state.toggleNightMode(suite.id)} />
        </div>
        <IconButton label={`Edit ${suite.name}`} size="sm" kind="ghost" onClick={() => state.openSuiteModal('edit', suite.id)}><Edit /></IconButton>
        <IconButton label={`Delete ${suite.name}`} size="sm" kind="ghost" onClick={() => state.requestDelete(suite.id)}><TrashCan /></IconButton>
      </div>
    </article>
  );
}

function Sidebar() {
  const state = useEvalStore();
  const content = (
    <>
      <div className="sidebar-heading">
        <div><span className="eyebrow">Workspace</span><h2>Evaluation suites</h2><p>{state.suites.length} suites</p></div>
        <IconButton className="mobile-close" label="Close suite navigation" kind="ghost" onClick={() => state.setSidebarOpen(false)}><Close /></IconButton>
      </div>
      <Button className="new-suite-button" kind="primary" renderIcon={Add} onClick={() => state.openSuiteModal('create')}>New Suite</Button>
      <div className="suite-list" aria-label="Evaluation suites">
        {state.suites.map((suite) => <SuiteCard key={suite.id} suite={suite} />)}
      </div>
      <div className="sidebar-footer"><span className="health-dot" />All evaluation services available</div>
    </>
  );
  return (
    <>
      <aside className="sidebar desktop-sidebar">{content}</aside>
      <AnimatePresence>
        {state.sidebarOpen && <motion.div className="sidebar-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => state.setSidebarOpen(false)}>
          <motion.aside className="sidebar mobile-sidebar" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.22 }} onClick={(event) => event.stopPropagation()}>{content}</motion.aside>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}

function SuiteModal() {
  const state = useEvalStore();
  const modal = state.suiteModal;
  const suite = state.suites.find((item) => item.id === modal.suiteId);
  const form = useForm({
    resolver: zodResolver(suiteSchema),
    mode: 'onChange',
    defaultValues: { name: suite?.name || '', promptIds: suite?.promptIds || [] },
  });
  useEffect(() => { form.trigger(); }, []);
  const submit = form.handleSubmit((value) => modal.mode === 'edit' ? state.updateSuite(modal.suiteId, value) : state.createSuite(value));
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
      selectorPrimaryFocus="#suite-name"
      size="sm"
    >
      <p className="modal-intro">Group prompts that should run and score together.</p>
      <form onSubmit={submit} className="modal-form">
        <TextInput id="suite-name" labelText="Suite name" placeholder="e.g. Release candidate guardrail" maxLength={81} {...form.register('name')} invalid={Boolean(form.formState.errors.name)} invalidText={form.formState.errors.name?.message} />
        <Controller
          name="promptIds"
          control={form.control}
          render={({ field, fieldState }) => (
            <MultiSelect
              id="suite-prompts"
              titleText="Prompt selection"
              label="Choose one or more prompts"
              items={PROMPTS}
              itemToString={(item) => item?.title || ''}
              initialSelectedItems={PROMPTS.filter((prompt) => field.value.includes(prompt.id))}
              onChange={({ selectedItems }) => field.onChange(selectedItems.map((item) => item.id))}
              invalid={Boolean(fieldState.error)}
              invalidText={fieldState.error?.message}
            />
          )}
        />
      </form>
    </Modal>
  );
}

function DeleteModal() {
  const state = useEvalStore();
  const suite = state.suites.find((item) => item.id === state.deleteModal.suiteId);
  return (
    <Modal open={state.deleteModal.open} danger modalHeading="Delete evaluation suite?" primaryButtonText="Delete Suite" secondaryButtonText="Cancel" onRequestClose={state.closeDelete} onSecondarySubmit={state.closeDelete} onRequestSubmit={() => state.deleteSuite(state.deleteModal.suiteId)} size="xs">
      <p>This removes <strong>{suite?.name}</strong> and its run history from this session. You can restore it with Undo.</p>
    </Modal>
  );
}

function NightWindowModal() {
  const state = useEvalStore();
  const form = useForm({ resolver: zodResolver(nightWindowSchema), mode: 'onChange', defaultValues: state.nightWindow || { startTime: '22:00', endTime: '23:30' } });
  const submit = form.handleSubmit(state.saveNightWindow);
  return (
    <Modal open={state.nightModalOpen} modalHeading="Configure Night Window" modalLabel="Automation schedule" primaryButtonText="Save Window" secondaryButtonText="Cancel" primaryButtonDisabled={!form.formState.isValid} onRequestClose={state.closeNightModal} onSecondarySubmit={state.closeNightModal} onRequestSubmit={submit} size="xs">
      <p className="modal-intro">Scheduled suites run within a same-day UTC window.</p>
      <form onSubmit={submit} className="time-form">
        <TextInput id="night-start" labelText="Night start time" type="time" {...form.register('startTime')} invalid={Boolean(form.formState.errors.startTime)} invalidText={form.formState.errors.startTime?.message} />
        <TextInput id="night-end" labelText="Night end time" type="time" {...form.register('endTime')} invalid={Boolean(form.formState.errors.endTime)} invalidText={form.formState.errors.endTime?.message} />
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
      <div><Button kind="primary" renderIcon={Add} onClick={() => state.openSuiteModal('create')}>New Suite</Button>{state.suites.length > 0 && <Button kind="tertiary" onClick={() => state.selectSuite(state.suites[0].id)}>Select first suite</Button>}</div>
    </section>
  );
}

function Metric({ label, value, accent }) {
  return <div className="metric"><span>{label}</span><strong className={accent ? 'accent' : ''}>{value}</strong></div>;
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
  const latest = getLatestRun(suite);
  const averages = useMemo(() => chartAverages(results), [results]);
  const trend = suite.runs.slice(-7).map((run) => ({ date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(run.finishedAt)), score: run.averageScore }));
  if (!latest && !results.length) {
    return <section className="chart-empty"><div><ChartBar size={24} /></div><p>Charts will appear after this suite’s first run.</p></section>;
  }
  return (
    <section className="chart-strip" aria-label="Score charts">
      <article className="panel chart-panel">
        <div className="panel-heading"><div><span className="eyebrow">Latest run</span><h2>Average score by model</h2></div><ScoreBadge score={latest?.averageScore} label={`${latest?.averageScore} avg`} /></div>
        <div className="chart-box">
          <span className="axis-label">Average score</span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={averages} margin={{ top: 10, right: 10, left: 0, bottom: 2 }}>
              <CartesianGrid stroke="#e7e5df" vertical={false} />
              <XAxis dataKey="model" tick={{ fontSize: 11, fill: '#625f59' }} axisLine={false} tickLine={false} />
              <YAxis width={42} domain={[0, 100]} tick={{ fontSize: 11, fill: '#77736c' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(91,91,214,.07)' }} />
              <Bar dataKey="score" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={420} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
      <article className="panel chart-panel trend-panel">
        <div className="panel-heading"><div><span className="eyebrow">Run history</span><h2>7-run score trend</h2></div><span className="trend-caption">Last {trend.length} runs</span></div>
        <div className="chart-box">
          <span className="axis-label">Average score</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 2 }}>
              <CartesianGrid stroke="#e7e5df" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#625f59' }} axisLine={false} tickLine={false} />
              <YAxis width={42} domain={[0, 100]} tick={{ fontSize: 11, fill: '#77736c' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
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

function ResultsTable({ suite, results, live }) {
  const state = useEvalStore();
  const rows = useMemo(() => sortRows(results, state.sort), [results, state.sort]);
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
        <p>Run this suite to populate scored results. Export results is still available with a version 1 JSON artifact and CSV header.</p>
        <Button renderIcon={Play} onClick={() => startRunCommand(suite.id)}>Run Suite</Button>
      </section>
    );
  }
  return (
    <section className="panel results-panel">
      <div className="panel-heading results-heading">
        <div><span className="eyebrow">{live ? 'Live output' : 'Latest output'}</span><h2>Evaluation results</h2></div>
        <div className="results-summary"><span>{results.length} responses</span><span>{results.filter((row) => row.passFail === 'pass').length} passing</span></div>
      </div>
      <TableContainer className="results-table-wrap">
        <Table size="lg" useZebraStyles={false} aria-label="Evaluation results">
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHeader key={column.key}>
                  <button className="sort-button" onClick={() => state.setSort(column.key)} aria-label={`Sort by ${column.label} ${state.sort.key === column.key ? (state.sort.direction === 'asc' ? 'ascending' : 'descending') : 'ascending'}`}>
                    {column.label}<span className={state.sort.key === column.key ? 'sort-active' : ''}>{state.sort.key === column.key && state.sort.direction === 'desc' ? '↓' : '↑'}</span>
                  </button>
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.rowId} className="result-row" style={{ '--row-delay': live ? `${(index % MODELS.length) * 80}ms` : '0ms' }} onClick={() => state.selectResult(row.rowId)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.selectResult(row.rowId); } }} aria-label={`Open details for ${row.promptTitle}, ${row.model}, score ${row.score}`}>
                <TableCell><span className="prompt-cell" title={row.promptTitle}>{row.promptTitle}</span></TableCell>
                <TableCell><span className="model-dot" style={{ background: MODEL_COLORS[row.model] }} />{row.model}</TableCell>
                <TableCell><strong className="table-score">{row.score}</strong></TableCell>
                <TableCell>{row.latencyMs.toLocaleString()}</TableCell>
                <TableCell>{row.tokens.toLocaleString()}</TableCell>
                <TableCell><PassBadge value={row.passFail} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}

function ComparisonTable({ results }) {
  const prompts = [...new Set(results.map((row) => row.promptTitle))];
  return (
    <section className="panel comparison-panel">
      <div className="panel-heading"><div><span className="eyebrow">Side-by-side</span><h2>Model comparison</h2></div><span className="trend-caption">Score · latency</span></div>
      <div className="comparison-scroll">
        <table className="comparison-table">
          <thead><tr><th>Prompt</th>{MODELS.map((model) => <th key={model}><span className="model-line" style={{ background: MODEL_COLORS[model] }} />{model}</th>)}</tr></thead>
          <tbody>{prompts.map((prompt) => <tr key={prompt}><th title={prompt}>{prompt}</th>{MODELS.map((model) => {
            const row = results.find((result) => result.promptTitle === prompt && result.model === model);
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
        <div className="panel-heading compact"><div><span className="eyebrow">Run execution</span><h2>{run.status === 'complete' ? 'Run complete' : run.paused ? 'Run paused' : run.status === 'failed' ? 'Action required' : 'Evaluating prompts'}</h2></div><StatusPill status={run.paused ? 'paused' : run.status} /></div>
        <div className="rollup-grid"><Metric label="Complete" value={`${completed} of ${run.steps.length}`} accent /><Metric label="Elapsed" value={formatDuration(run.elapsedMs)} /><Metric label="Failures" value={failed} /></div>
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
            <li key={step.id} className={`step-item ${run.highlightedStep === index ? 'highlighted' : ''}`}>
              <div className="step-index">{index + 1}</div>
              <div className="step-content">
                <strong>{step.title}</strong>
                <div className="step-state"><StatusPill status={step.status} />{step.attempts > 0 && <span>Attempt {step.attempts} of 3</span>}</div>
                {step.status === 'retrying' && <p className="retry-copy">Waiting {step.retryIn}s before retry {step.attempts + 1} of 3</p>}
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

function DetailPanel({ row }) {
  const state = useEvalStore();
  const open = Boolean(state.disclosureOpen[row.rowId]);
  return (
    <motion.aside className="detail-panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.24, ease: 'easeOut' }} aria-label="Result detail">
      <div className="detail-top"><div><span className="eyebrow">Result detail</span><h2>{row.promptTitle}</h2></div><IconButton label="Close result detail" kind="ghost" onClick={state.closeDetail}><Close /></IconButton></div>
      <div className="detail-metrics"><div><span>Model</span><strong><i className="model-dot" style={{ background: MODEL_COLORS[row.model] }} />{row.model}</strong></div><div><span>Score</span><strong>{row.score}/100</strong></div><div><span>Outcome</span><PassBadge value={row.passFail} /></div></div>
      <div className="detail-section"><h3>Full prompt</h3><p>{row.promptText}</p></div>
      <div className="detail-section response"><h3>Model response</h3><p>{row.response}</p></div>
      <div className={`disclosure ${open ? 'open' : ''}`}>
        <button onClick={() => state.toggleDisclosure(row.rowId)} aria-expanded={open}><span><span className="eyebrow">Rubric</span><strong>Scoring breakdown</strong></span><ChevronDown className="disclosure-chevron" /></button>
        <div className="disclosure-content" aria-hidden={!open}>
          <div>{row.scoringBreakdown.map((item) => <div className="rubric-row" key={item.dimension}><span>{item.dimension}</span><div><i style={{ width: `${item.score}%` }} /></div><strong>{item.score}</strong></div>)}</div>
        </div>
      </div>
    </motion.aside>
  );
}

function ExportDrawer() {
  const state = useEvalStore();
  const ref = useRef(null);
  useDialogFocus(state.exportOpen, state.closeExport, ref);
  const document = compileExportDocument(state);
  const json = JSON.stringify(document, null, 2);
  const csv = compileCsv(state);
  return (
    <AnimatePresence>
      {state.exportOpen && <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={state.closeExport}>
        <motion.aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="export-title" className="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.26, ease: 'easeOut' }} onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-header"><div><span className="eyebrow">Live session artifact</span><h2 id="export-title">Export results</h2><p>{document?.suite.name} · {document?.run.results.length || 0} result records</p></div><IconButton label="Close export results" kind="ghost" onClick={state.closeExport}><Close /></IconButton></div>
          <div className="drawer-body">
            <Tabs selectedIndex={state.exportTab === 'json' ? 0 : 1} onChange={({ selectedIndex }) => state.setExportTab(selectedIndex === 0 ? 'json' : 'csv')}>
              <TabList aria-label="Export formats" contained><Tab>JSON</Tab><Tab>CSV</Tab></TabList>
            </Tabs>
            {!document?.run.results.length && <InlineNotification lowContrast hideCloseButton kind="info" title="No run results yet" subtitle="The JSON artifact contains version 1 metadata and an empty results array; the CSV artifact contains its header line." />}
            <div className="artifact-preview"><div className="preview-bar"><span>{state.exportTab === 'json' ? 'eval-run-results.json' : 'eval-run-results.csv'}</span><span>{state.exportTab === 'json' ? json.split('\n').length : csv.split('\n').length} lines</span></div><pre>{state.exportTab === 'json' ? json : csv}</pre></div>
          </div>
          <div className="drawer-footer">
            <div className="copy-wrap"><Button kind="ghost" renderIcon={Copy} onClick={() => copyActiveArtifact().catch(() => state.pushToast('Copy unavailable', 'Clipboard permission was not granted.'))}>Copy</Button>{state.copied && <span className="copied-confirm" role="status"><CheckmarkFilled />Copied</span>}</div>
            <Button kind="tertiary" renderIcon={Download} onClick={() => downloadArtifact('csv')}>Download CSV</Button>
            <Button kind="primary" renderIcon={Download} onClick={() => downloadArtifact('json')}>Download JSON</Button>
          </div>
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  );
}

function ImportDrawer() {
  const state = useEvalStore();
  const ref = useRef(null);
  useDialogFocus(state.importOpen, state.closeImport, ref);
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
  return (
    <AnimatePresence>
      {state.importOpen && <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={state.closeImport}>
        <motion.aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="import-title" className="drawer import-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.26 }} onMouseDown={(event) => event.stopPropagation()}>
          <div className="drawer-header"><div><span className="eyebrow">Round-trip results</span><h2 id="import-title">Import results</h2><p>Replace the selected suite’s latest run.</p></div><IconButton label="Close import results" kind="ghost" onClick={state.closeImport}><Close /></IconButton></div>
          <form className="drawer-body import-form" onSubmit={submit}>
            <InlineNotification lowContrast hideCloseButton kind="info" title="Validated before replacement" subtitle="The current results remain unchanged if any required result field is invalid." />
            <FileUploaderButton labelText="Choose exported JSON" buttonKind="tertiary" accept={['.json', 'application/json']} onChange={onFile} />
            <span className="or-divider">or paste the exported document</span>
            <TextArea id="import-document" labelText="Import JSON" placeholder={'{\n  "version": 1,\n  ...\n}'} rows={18} {...form.register('document')} invalid={Boolean(form.formState.errors.document)} invalidText={form.formState.errors.document?.message} />
          </form>
          <div className="drawer-footer"><Button kind="ghost" onClick={state.closeImport}>Cancel</Button><Button kind="primary" renderIcon={Upload} onClick={submit} disabled={!form.formState.isValid}>Import results</Button></div>
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  );
}

function Toasts() {
  const state = useEvalStore();
  return <div className="toast-stack" aria-label="Notifications">{state.toasts.map((toast) => <motion.div key={toast.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><ToastNotification lowContrast kind="success" title={toast.title} subtitle={toast.subtitle} timeout={0} onClose={() => state.dismissToast(toast.id)} /></motion.div>)}</div>;
}

function Workspace() {
  const state = useEvalStore();
  const suite = state.suites.find((item) => item.id === state.selectedSuiteId);
  if (!suite) return <main className="main-content"><EmptyWorkspace /></main>;
  const latest = getLatestRun(suite);
  const run = state.activeRun?.suiteId === suite.id ? state.activeRun : null;
  const live = run && !['complete', 'stopped'].includes(run.status);
  const results = live ? run.producedResults : (latest?.results || []);
  const selectedRow = results.find((row) => row.rowId === state.selectedResultId) || latest?.results.find((row) => row.rowId === state.selectedResultId);
  return (
    <main className="main-content">
      <div className="workspace-title">
        <div><span className="eyebrow">Evaluation overview</span><h2>{suite.name}</h2><p>{suite.promptIds.length} prompts · Latest run {formatDateTime(suite.lastRunAt)}</p></div>
        <div className="overview-metrics"><Metric label="Average" value={suite.averageScore ?? '—'} accent /><Metric label="Pass rate" value={latest?.results.length ? `${Math.round((latest.passCount / latest.results.length) * 100)}%` : '—'} /><Metric label="Total tokens" value={latest?.totalTokens?.toLocaleString() || '—'} /></div>
      </div>
      <Charts suite={suite} results={latest?.results || []} />
      <div className={`content-grid ${run ? 'with-run' : ''}`}>
        <div className="result-region">{state.mainView === 'comparison' ? (results.length ? <ComparisonTable results={results} /> : <ResultsTable suite={suite} results={results} live={live} />) : <ResultsTable suite={suite} results={results} live={live} />}</div>
        {run && <RunInspector run={run} />}
      </div>
      <AnimatePresence>{selectedRow && <DetailPanel row={selectedRow} />}</AnimatePresence>
    </main>
  );
}

export default function App() {
  const state = useEvalStore();
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) useEvalStore.getState().redo(); else useEvalStore.getState().undo();
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
      {state.suiteModal.open && <SuiteModal key={`${state.suiteModal.mode}-${state.suiteModal.suiteId || 'new'}`} />}
      <DeleteModal />
      {state.nightModalOpen && <NightWindowModal key={state.nightWindow?.startTime || 'new'} />}
      <ExportDrawer />
      <ImportDrawer />
      <Toasts />
      <div className="sr-only" aria-live="assertive">{state.ariaMessage}</div>
    </div>
  );
}
