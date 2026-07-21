import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion, ActionIcon, Badge, Button, Drawer, Modal, NumberInput,
  SegmentedControl, Select, Switch, Table, TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconActivity, IconAlertTriangle, IconArrowDown, IconArrowUp, IconBolt, IconBrain,
  IconCheck, IconChevronRight, IconClipboard, IconClock, IconCopy, IconDatabase,
  IconDownload, IconFilter, IconFlask, IconLayoutBoard, IconMenu2, IconPlayerPause,
  IconPlayerPlay, IconRefresh, IconSearch, IconServer, IconSparkles, IconTable,
  IconTimeline, IconX,
} from '@tabler/icons-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useReducedMotion } from '@mantine/hooks';
import { baseModels } from './seed';
import { BENCHMARKS, CLUSTERS, JOB_TYPES, makeJobConfigSchema, sanitizeJobConfig } from './schemas';
import { buildExportText, getEligibleCheckpoints, getEligibleDatasets, runUsesDataset, usePipelineStore } from './store';
import { registerWebMCP } from './webmcp';

function Icon({ icon: Comp, label, size = 18, decorative = false }) {
  if (decorative) return <Comp size={size} aria-hidden="true" focusable="false" />;
  return <Comp size={size} role="img" aria-label={label} title={label} focusable="false" />;
}

const statusClass = {
  Pending: 'status-pending', Running: 'status-running', Complete: 'status-complete',
  Failed: 'status-failed', Skipped: 'status-skipped',
};

const statusDot = {
  Pending: '#8b93a1', Running: '#4f6ef7', Complete: '#18a875', Failed: '#e34b5f', Skipped: '#a2a8b3',
};

const phaseLabel = { data: 'Data generation', fineTune: 'Fine-tuning', evaluation: 'Evaluation' };
const fmtTime = (iso) => iso ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }).format(new Date(iso)) : '—';
const mean = (values) => values?.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const spread = (values) => values?.length ? Math.max(...values) - Math.min(...values) : 0;

function StatusChip({ status }) {
  return <span className={`status-chip ${statusClass[status]} ${status === 'Running' ? 'is-live' : ''}`} aria-label={`Status ${status}`}><span className="status-dot" aria-hidden="true" />{status}</span>;
}

function Sidebar({ mobile = false }) {
  const activeView = usePipelineStore((s) => s.activeView);
  const setView = usePipelineStore((s) => s.setView);
  const nav = [
    { id: 'pipeline', label: 'Pipeline board', icon: IconLayoutBoard },
    { id: 'datasets', label: 'Datasets', icon: IconDatabase },
    { id: 'results', label: 'Results', icon: IconTable },
  ];
  return (
    <aside className={mobile ? 'mobile-sidebar' : 'sidebar'} aria-label="Primary navigation">
      <div className="brand"><div className="brand-mark"><Icon icon={IconBolt} label="Relay brand mark" size={18} /></div><div><strong>Relay</strong><span>agent research</span></div></div>
      <nav className="nav-list">
        <p className="eyebrow nav-label">Workspace</p>
        {nav.map(({ id, label, icon: NavIcon }) => (
          <button key={id} type="button" className={`nav-item ${activeView === id ? 'active' : ''}`} onClick={() => setView(id)} aria-current={activeView === id ? 'page' : undefined}>
            <Icon icon={NavIcon} label={label} size={18} /><span>{label}</span>{activeView === id && <span className="nav-indicator" aria-hidden="true" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot"><div className="sim-dot" aria-hidden="true" /><div><strong>Simulation online</strong><span>1 second tick · in memory</span></div></div>
    </aside>
  );
}

function Rollups() {
  const runs = usePipelineStore((s) => s.runs);
  const trialData = usePipelineStore((s) => s.trialData);
  const active = runs.filter((r) => r.phases.some((p) => p.status === 'Running')).length;
  const queues = CLUSTERS.map((cluster) => ({ cluster, count: runs.filter((r) => r.phases.some((p) => (p.status === 'Running' || p.status === 'Pending') && p.cluster === cluster)).length }));
  const cost = runs.reduce((sum, r) => sum + r.cost, 0);
  const modelMeans = [...new Set(trialData.map((x) => x.model))].map((model) => ({ model, value: mean(trialData.filter((x) => x.model === model).flatMap((x) => x.trials.map((t) => t.score))) }));
  return (
    <section className="rollup-strip" aria-label="Live pipeline rollups">
      <div className="rollup"><span className="rollup-icon indigo"><Icon icon={IconActivity} label="Active jobs" size={17} /></span><div><span>Active jobs</span><strong data-testid="active-jobs">{active}</strong></div><em>live</em></div>
      <div className="rollup queues"><span className="rollup-icon violet"><Icon icon={IconServer} label="Cluster queue" size={17} /></span><div><span>Cluster queue</span><strong>{queues.map((q) => <small key={q.cluster}>{q.cluster} <b>{q.count}</b></small>)}</strong></div></div>
      <div className="rollup"><span className="rollup-icon amber"><Icon icon={IconSparkles} label="Simulated cost" size={17} /></span><div><span>Simulated cost</span><strong>${cost.toFixed(2)}</strong></div><em>session</em></div>
      <div className="rollup score"><span className="rollup-icon green"><Icon icon={IconBrain} label="Mean benchmark score" size={17} /></span><div><span>Mean benchmark score / model</span><strong className="model-rollup">{modelMeans.map((item)=><small key={item.model} title={`${item.model} ${item.value.toFixed(3)}`}>{item.model.split('-')[0]} <b>{item.value.toFixed(3)}</b></small>)}</strong></div></div>
    </section>
  );
}

function ProgressBar({ value, max }) {
  const percent = Math.min(100, (value / Math.max(1, max)) * 100);
  return <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><span style={{ width: `${percent}%` }} /></div>;
}

function PhaseCard({ runId, phase, highlighted = false, detailed = false }) {
  const pausePhase = usePipelineStore((s) => s.pausePhase);
  const resumePhase = usePipelineStore((s) => s.resumePhase);
  const retryPhase = usePipelineStore((s) => s.retryPhase);
  const reducedMotion = useReducedMotion();
  const isRunning = phase.status === 'Running';
  const taskTarget = phase.count * 100;
  const runningMean = mean(phase.scores);
  return (
    <article className={`phase-card ${highlighted ? 'highlighted' : ''} ${detailed ? 'detail-phase' : ''}`} data-phase={phase.key}>
      <div className="phase-head"><div><span className="phase-index">{phase.key === 'data' ? '01' : phase.key === 'fineTune' ? '02' : '03'}</span><h3>{phase.title}</h3></div><StatusChip status={phase.status} /></div>
      <dl className="config-grid">
        <div><dt>Dataset</dt><dd>{phase.dataset}</dd></div>
        <div><dt>Model</dt><dd title={phase.model}>{phase.model}</dd></div>
        <div><dt>{phase.key === 'fineTune' ? 'Epochs' : 'Trials'}</dt><dd>{phase.count}</dd></div>
        <div><dt>Cluster</dt><dd><span className="cluster-dot" />{phase.cluster}</dd></div>
      </dl>
      {isRunning && (
        <div className="live-panel">
          {phase.key === 'data' && <><div className="metric-row"><span>Tasks generated</span><strong>{phase.current.toLocaleString()} <small>/ {taskTarget.toLocaleString()}</small></strong></div><ProgressBar value={phase.current} max={taskTarget} /></>}
          {phase.key === 'fineTune' && <><div className="metric-row"><span>Training progress</span><strong>epoch {phase.current} of {phase.count}</strong></div><div className="micro-chart" aria-label="Live loss curve"><ResponsiveContainer width="100%" height="100%"><AreaChart data={phase.loss}><defs><linearGradient id={`loss-${runId}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6d5dfc" stopOpacity={.3}/><stop offset="95%" stopColor="#6d5dfc" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="loss" stroke="#6d5dfc" strokeWidth={2} fill={`url(#loss-${runId})`} isAnimationActive={!reducedMotion}/></AreaChart></ResponsiveContainer></div></>}
          {phase.key === 'evaluation' && <><div className="metric-row"><span>Evaluation progress</span><strong>trial {phase.current} of {phase.count}</strong></div><ProgressBar value={phase.current} max={phase.count} /><div className="running-mean"><span>Running mean</span><b>{phase.scores.length ? runningMean.toFixed(3) : '—'}</b></div></>}
          <Button className="phase-action" variant="subtle" size="compact-xs" leftSection={phase.paused ? <Icon icon={IconPlayerPlay} label="Resume" size={14} decorative /> : <Icon icon={IconPlayerPause} label="Pause" size={14} decorative />} onClick={(e) => { e.preventDefault(); e.stopPropagation(); phase.paused ? resumePhase(runId, phase.key) : pausePhase(runId, phase.key); }} onMouseDown={(e) => e.stopPropagation()}>
            {phase.paused ? 'Resume' : 'Pause'}
          </Button>
          {phase.paused && <span className="checkpoint-note"><Icon icon={IconCheck} label="Checkpoint frozen" size={12} decorative /> checkpoint frozen</span>}
        </div>
      )}
      {phase.status === 'Complete' && <div className="output-line"><Icon icon={IconCheck} label="Complete" size={14} decorative /><span>Output sealed</span><time>{fmtTime(phase.completedAt)}</time></div>}
      {phase.status === 'Pending' && <div className="pending-line"><Icon icon={IconClock} label="Pending" size={14} decorative />Waiting on upstream phase</div>}
      {phase.status === 'Skipped' && <div className="pending-line muted"><Icon icon={IconChevronRight} label="Skipped" size={14} decorative />Not required for this job</div>}
      {phase.status === 'Failed' && (
        <div className="failure-panel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <div className="failure-title"><Icon icon={IconAlertTriangle} label="Failed phase" size={15} decorative /><strong>{phase.errorCategory}</strong><span>attempt {phase.attempt} of {phase.maxAttempts}</span></div>
          {phase.retryRemaining > 0 && (
            <div className="backoff" aria-live="polite" aria-atomic="true">
              <span className="spinner" aria-hidden="true" />
              Automatic retry — retrying in <b data-backoff={phase.retryRemaining}>{phase.retryRemaining}s</b>, attempt {phase.attempt} of {phase.maxAttempts}
            </div>
          )}
          <p role="alert">{phase.errorSummary || 'Phase failed; retry from the saved checkpoint.'}</p>
          <Button color="red" variant="light" size="compact-sm" leftSection={<Icon icon={IconRefresh} label="Retry" size={14} decorative />} onClick={(e) => { e.preventDefault(); e.stopPropagation(); retryPhase(runId, phase.key); }} onMouseDown={(e) => e.stopPropagation()}>
            Retry from checkpoint
          </Button>
        </div>
      )}
    </article>
  );
}

function RunStrip({ run }) {
  const selectRun = usePipelineStore((s) => s.selectRun);
  const onOpen = () => selectRun(run.id);
  return (
    <article className={`run-strip ${run.isNew ? 'new-run' : ''}`}>
      <button type="button" className="run-strip-open" aria-label={`Open details for ${run.id}`} onClick={onOpen}>
        <header className="run-header"><div><span className="run-id">{run.id}</span><h2>{run.label}</h2></div><div className="run-meta"><span>{fmtTime(run.createdAt)}</span><span>${run.cost.toFixed(2)}</span><Icon icon={IconChevronRight} label="Open run" size={17} /></div></header>
      </button>
      <div className="phase-flow">
        {run.phases.map((p, index) => <div className="phase-slot" key={p.key}><PhaseCard runId={run.id} phase={p}/>{index < 2 && <div className={`connector ${p.status === 'Complete' ? 'filled' : ''}`} aria-hidden="true"><span/><Icon icon={IconChevronRight} label="" size={15} decorative /></div>}</div>)}
      </div>
    </article>
  );
}

function Board() {
  const runs = usePipelineStore((s) => s.runs);
  const datasetFilter = usePipelineStore((s) => s.datasetFilter);
  const setDatasetFilter = usePipelineStore((s) => s.setDatasetFilter);
  const openSubmission = usePipelineStore((s) => s.openSubmission);
  const pushAlert = usePipelineStore((s) => s.pushAlert);
  const reducedMotion = useReducedMotion();
  const [parent, enableAnimations] = useAutoAnimate({ duration: 220 });
  useEffect(() => enableAnimations(!reducedMotion), [enableAnimations, reducedMotion]);
  const visible = datasetFilter ? runs.filter((r) => runUsesDataset(r, datasetFilter)) : runs;
  const downloadExport = () => {
    const text = buildExportText();
    downloadText(text, 'research-pipeline-export.json');
    pushAlert(`Exported ${runs.length} runs`, 'indigo');
  };
  return (
    <div className="view board-view">
      <div className="view-heading"><div><p className="eyebrow">Live workspace</p><h1>Pipeline board</h1><p>Watch datasets become checkpoints, then benchmark results.</p></div><div className="heading-actions"><Button variant="default" leftSection={<Icon icon={IconDownload} label="Export" size={16} decorative />} onClick={downloadExport}>Export runs</Button><Button leftSection={<Icon icon={IconFlask} label="Submit job" size={16} decorative />} onClick={openSubmission}>Submit job</Button></div></div>
      <div className="board-toolbar"><div><span className="section-count" data-testid="run-count">{visible.length} runs</span><span className="updated"><span className="sim-dot" aria-hidden="true"/>advancing live</span></div>{datasetFilter && <button type="button" className="active-filter" onClick={() => setDatasetFilter(null)} aria-label={`Clear dataset filter ${datasetFilter}`}><Icon icon={IconFilter} label="Active filter" size={14} /><span className="filter-chip-label">{datasetFilter}</span><Icon icon={IconX} label="Clear" size={13} /></button>}</div>
      <div className="run-list" ref={parent}>
        {visible.map((run) => <RunStrip key={run.id} run={run}/>) }
        {!visible.length && <EmptyState title={`No runs use ${datasetFilter}`} body={`The dataset filter “${datasetFilter}” matches zero runs. Clear the filter to restore the full board.`} action="Clear dataset filter" onAction={() => setDatasetFilter(null)} />}
      </div>
    </div>
  );
}

function EmptyState({ title, body, action, onAction }) {
  return <div className="empty-state" role="status"><span><Icon icon={IconSearch} label="Empty state" size={22} /></span><h3>{title}</h3><p>{body}</p>{action && <Button variant="light" onClick={onAction}>{action}</Button>}</div>;
}

function DatasetCard({ dataset }) {
  const setDatasetFilter = usePipelineStore((s) => s.setDatasetFilter);
  const reducedMotion = useReducedMotion();
  const runName = usePipelineStore((s) => s.runs.find((r)=>r.id===dataset.runId)?.label ?? 'Archived generation study');
  return (
    <button type="button" className="dataset-card" onClick={() => setDatasetFilter(dataset.name)} aria-label={`Filter runs by ${dataset.name}`}>
      <div className="dataset-top"><span className="dataset-icon"><Icon icon={IconDatabase} label="Dataset" size={19} /></span><Badge variant="light" color="gray">Ready</Badge></div>
      <h2>{dataset.name}</h2><p className="dataset-size">{dataset.tasks.toLocaleString()} <span>tasks</span></p>
      <div className="distribution" aria-label={`Task type distribution for ${dataset.name}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={dataset.distribution} barCategoryGap={5}><Bar dataKey="value" fill="#6d5dfc" radius={[4,4,0,0]} isAnimationActive={!reducedMotion}/><XAxis dataKey="type" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#7c8493'}}/></BarChart></ResponsiveContainer></div>
      <div className="provenance"><span>Generation provenance</span><strong>{runName}</strong><small>{dataset.runId}</small><p>{dataset.config}</p></div>
      <div className="dataset-action">Trace on pipeline <Icon icon={IconChevronRight} label="Trace on pipeline" size={14} /></div>
    </button>
  );
}

function DatasetsView() {
  const datasets = usePipelineStore((s) => s.datasets);
  const [query, setQuery] = useState('');
  const reducedMotion = useReducedMotion();
  const [datasetGridRef, enableAnimations] = useAutoAnimate({ duration: 220 });
  useEffect(() => enableAnimations(!reducedMotion), [enableAnimations, reducedMotion]);
  const filtered = datasets.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="view"><div className="view-heading"><div><p className="eyebrow">Training inventory</p><h1>Datasets</h1><p>Trace generated task sets back to the run and recipe that produced them.</p></div><TextInput value={query} onChange={(e) => setQuery(e.currentTarget.value)} leftSection={<Icon icon={IconSearch} label="Search" size={16} />} placeholder="Search datasets" aria-label="Search datasets" className="search-input"/></div>
      <div className="catalog-summary"><strong>{datasets.reduce((s,d)=>s+d.tasks,0).toLocaleString()}</strong><span>curated tasks across {datasets.length} datasets</span><div>{['Plan','Tool','Verify'].map((x,i)=><span key={x}><i style={{background:['#6d5dfc','#15a8a0','#e49744'][i]}}/>{x}</span>)}</div></div>
      <div className="dataset-grid" ref={datasetGridRef}>{filtered.map((d)=><DatasetCard dataset={d} key={d.id}/>)}</div>
      {!filtered.length && <EmptyState title={`No datasets match “${query}”`} body="Try a different dataset name." action="Clear search" onAction={() => setQuery('')}/>} 
    </div>
  );
}

function getResultRows(trialData) {
  const models = [...new Set(trialData.map((x) => x.model))];
  return models.map((model) => {
    const cells = Object.fromEntries(BENCHMARKS.map((b) => [b, trialData.find((x) => x.model === model && x.benchmark === b)?.trials ?? []]));
    const all = Object.values(cells).flat();
    return { model, cells, mean: mean(all.map((t)=>t.score)), spread: spread(all.map((t)=>t.score)), cost: all.length * .34, trials: all.length };
  });
}

function ResultCell({ model, benchmark, trials }) {
  const setDrilldown = usePipelineStore((s) => s.setDrilldown);
  if (!trials.length) return <span className="no-result">—</span>;
  const scores = trials.map((t)=>t.score);
  return <button className="result-cell" onClick={()=>setDrilldown({model,benchmark})}><strong>{mean(scores).toFixed(3)}</strong><span>± {spread(scores).toFixed(2)} · ${(trials.length*.34).toFixed(2)}</span><small>{trials.length} trials</small></button>;
}

function SortHeader({ label, sortKey, sort, setSort, align }) {
  const active = sort.key === sortKey;
  const toggle = () => {
    if (active) setSort({ key: sortKey, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else setSort({ key: sortKey, dir: 'asc' });
  };
  return (
    <button type="button" className={`sort-header ${align === 'right' ? 'align-right' : ''} ${active ? 'active' : ''}`} onClick={toggle} aria-label={`Sort by ${label} ${active && sort.dir === 'asc' ? 'descending' : 'ascending'}`} data-sort-key={sortKey} data-sort-dir={active ? sort.dir : 'none'}>
      {label}
      {active ? (sort.dir === 'desc' ? <Icon icon={IconArrowDown} label="Descending" size={13} /> : <Icon icon={IconArrowUp} label="Ascending" size={13} />) : null}
    </button>
  );
}

function ResultsView() {
  const trialData = usePipelineStore((s) => s.trialData);
  const comparison = usePipelineStore((s) => s.comparison);
  const setComparison = usePipelineStore((s) => s.setComparison);
  const sort = usePipelineStore((s) => s.resultSort);
  const setResultSort = usePipelineStore((s) => s.setResultSort);
  const setSort = ({key,dir}) => setResultSort(key,dir);
  const [tableBody, enableAnimations] = useAutoAnimate({duration:220});
  const reducedMotion = useReducedMotion();
  useEffect(() => enableAnimations(!reducedMotion), [enableAnimations, reducedMotion]);
  const rows = useMemo(() => {
    const raw = getResultRows(trialData).slice();
    const dir = sort.dir === 'asc' ? 1 : -1;
    raw.sort((a, b) => {
      const delta = (a[sort.key] - b[sort.key]) * dir;
      if (delta !== 0) return delta;
      return a.model.localeCompare(b.model);
    });
    return raw;
  }, [trialData, sort]);
  const modelNames = rows.map((r)=>r.model);
  const comparisonData = BENCHMARKS.map((benchmark) => {
    const a = trialData.find((x)=>x.model===comparison[0]&&x.benchmark===benchmark)?.trials ?? [];
    const b = trialData.find((x)=>x.model===comparison[1]&&x.benchmark===benchmark)?.trials ?? [];
    return { benchmark, a:Number(mean(a.map(t=>t.score)).toFixed(3)), b:Number(mean(b.map(t=>t.score)).toFixed(3)) };
  });
  return (
    <div className="view"><div className="view-heading"><div><p className="eyebrow">Evaluation intelligence</p><h1>Results</h1><p>Compare checkpoints across the shared benchmark trial store.</p></div><div className="result-kpi"><span>Best observed</span><strong>{Math.max(...rows.map(r=>r.mean)).toFixed(3)}</strong></div></div>
      <section className="leaderboard-panel"><div className="panel-heading"><div><h2>Model leaderboard</h2><p>Mean score, spread, cost, and trial count per benchmark</p></div><span className="live-pill"><span className="sim-dot"/>Live results</span></div>
        <div className="table-scroll" tabIndex={0} aria-label="Leaderboard horizontal scroll region"><Table className="leaderboard" highlightOnHover data-sort={`${sort.key}-${sort.dir}`}><Table.Thead><Table.Tr><Table.Th>Model checkpoint</Table.Th>{BENCHMARKS.map(b=><Table.Th key={b}>{b}</Table.Th>)}<Table.Th><SortHeader label="Mean" sortKey="mean" sort={sort} setSort={setSort}/></Table.Th><Table.Th><SortHeader label="Spread" sortKey="spread" sort={sort} setSort={setSort}/></Table.Th><Table.Th><SortHeader label="Cost" sortKey="cost" sort={sort} setSort={setSort}/></Table.Th><Table.Th><SortHeader label="Trials" sortKey="trials" sort={sort} setSort={setSort}/></Table.Th></Table.Tr></Table.Thead><Table.Tbody ref={tableBody}>{rows.map((row,index)=><Table.Tr key={row.model} data-model={row.model} data-mean={row.mean.toFixed(3)} data-order={index} style={{'--row-index':index}} className="leaderboard-row"><Table.Td><div className="model-name"><span aria-hidden="true">{row.model.slice(0,2).toUpperCase()}</span><div><strong>{row.model}</strong><small>checkpoint</small></div></div></Table.Td>{BENCHMARKS.map(b=><Table.Td key={b}><ResultCell model={row.model} benchmark={b} trials={row.cells[b]}/></Table.Td>)}<Table.Td className="aggregate"><strong>{row.mean.toFixed(3)}</strong></Table.Td><Table.Td className="aggregate"><strong>± {row.spread.toFixed(2)}</strong></Table.Td><Table.Td className="aggregate"><strong>${row.cost.toFixed(2)}</strong></Table.Td><Table.Td className="aggregate"><strong>{row.trials}</strong></Table.Td></Table.Tr>)}</Table.Tbody></Table></div>
      </section>
      <section className="comparison-panel"><div className="panel-heading"><div><h2>Head-to-head comparison</h2><p>Paired benchmark means from the same trial data</p></div><div className="comparison-pickers"><Select aria-label="First comparison model" value={comparison[0]} onChange={(v)=>v&&setComparison(0,v)} data={modelNames.filter(x=>x!==comparison[1])}/><span>vs</span><Select aria-label="Second comparison model" value={comparison[1]} onChange={(v)=>v&&setComparison(1,v)} data={modelNames.filter(x=>x!==comparison[0])}/></div></div>
        <div className="comparison-content"><div className="comparison-chart" aria-label="Model score comparison chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparisonData} margin={{top:10,right:12,left:-15,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef3"/><XAxis dataKey="benchmark" tick={{fontSize:11,fill:'#737b8b'}} axisLine={false} tickLine={false}/><YAxis domain={[0,1]} tick={{fontSize:10,fill:'#9399a6'}} axisLine={false} tickLine={false}/><ChartTooltip formatter={(v)=>Number(v).toFixed(3)}/><Bar name={comparison[0]} dataKey="a" fill="#6d5dfc" radius={[5,5,0,0]} isAnimationActive={!reducedMotion}/><Bar name={comparison[1]} dataKey="b" fill="#16aaa1" radius={[5,5,0,0]} isAnimationActive={!reducedMotion}/></BarChart></ResponsiveContainer></div><div className="delta-strip"><span className="delta-title">Difference <small>{comparison[0]} − {comparison[1]}</small></span>{comparisonData.map(d=>{const delta=d.a-d.b;return <div key={d.benchmark}><span>{d.benchmark}</span><strong className={delta>=0?'positive':'negative'}>{delta>=0?'+':''}{delta.toFixed(3)}</strong></div>})}</div></div>
      </section>
    </div>
  );
}

function TraceExcerpt({ trial, instant = false, onComplete }) {
  const full = `Planner decomposed the benchmark prompt into ${3 + trial.id.length % 3} checks. Tool selection confidence rose after schema inspection; verifier reconciled the final response against two constraints.`;
  const [text, setText] = useState(()=>instant ? full : '');
  useEffect(()=>{
    if (text.length >= full.length) { onComplete?.(); return; }
    const id = setInterval(()=>setText((t)=>full.slice(0,Math.min(full.length,t.length+4))),35);
    return ()=>clearInterval(id);
  },[text.length,full,onComplete]);
  return <div className="trace-box"><span className="trace-label"><Icon icon={IconTimeline} label="Simulated trace" size={13} />Simulated trace</span><p>{text}<span className={text.length<full.length?'stream-caret':''}/></p>{text.length<full.length&&<small>streaming trace…</small>}</div>;
}

function TrialDrilldown() {
  const drilldown = usePipelineStore((s)=>s.drilldown);
  const setDrilldown = usePipelineStore((s)=>s.setDrilldown);
  const trialData = usePipelineStore((s)=>s.trialData);
  const [expandedTrial,setExpandedTrial] = useState(null);
  const [completedTraces,setCompletedTraces] = useState(()=>new Set());
  const entry = drilldown ? trialData.find((x)=>x.model===drilldown.model&&x.benchmark===drilldown.benchmark) : null;
  useEffect(()=>{setExpandedTrial(null);setCompletedTraces(new Set())},[drilldown?.model,drilldown?.benchmark]);
  return <Drawer opened={Boolean(drilldown)} onClose={()=>setDrilldown(null)} position="right" size="md" withinPortal keepMounted={false} title={<div className="drawer-title"><span className="eyebrow">Trial drill-down</span><strong>{drilldown?.benchmark}</strong><small>{drilldown?.model}</small></div>} overlayProps={{backgroundOpacity:.25,blur:2}} closeOnEscape closeOnClickOutside closeButtonProps={{'aria-label':'Close trial drill-down'}}>
    {entry && <><div className="drill-summary"><div><span>Mean score</span><strong>{mean(entry.trials.map(t=>t.score)).toFixed(3)}</strong></div><div><span>Spread</span><strong>± {spread(entry.trials.map(t=>t.score)).toFixed(2)}</strong></div><div><span>Trials</span><strong>{entry.trials.length}</strong></div></div><Accordion value={expandedTrial} onChange={setExpandedTrial} variant="separated" className="trial-list">{entry.trials.map((trial)=><Accordion.Item value={trial.id} key={trial.id}><Accordion.Control><div className="trial-row"><strong>{trial.id}</strong><span>score <b>{trial.score.toFixed(3)}</b></span><span>{trial.duration}s</span></div></Accordion.Control><Accordion.Panel>{expandedTrial===trial.id&&<TraceExcerpt trial={trial} instant={completedTraces.has(trial.id)} onComplete={()=>setCompletedTraces((seen)=>{if(seen.has(trial.id))return seen;const next=new Set(seen);next.add(trial.id);return next})}/>}</Accordion.Panel></Accordion.Item>)}</Accordion></>}
  </Drawer>;
}

function RunDetail() {
  const selectedRunId = usePipelineStore((s)=>s.selectedRunId);
  const selectRun = usePipelineStore((s)=>s.selectRun);
  const runs = usePipelineStore((s)=>s.runs);
  const timelinePhase = usePipelineStore((s)=>s.timelinePhase);
  const timelineStatus = usePipelineStore((s)=>s.timelineStatus);
  const highlightedPhase = usePipelineStore((s)=>s.highlightedPhase);
  const setTimelinePhase = usePipelineStore((s)=>s.setTimelinePhase);
  const setTimelineStatus = usePipelineStore((s)=>s.setTimelineStatus);
  const setHighlightedPhase = usePipelineStore((s)=>s.setHighlightedPhase);
  const [timelineListRef] = useAutoAnimate({duration:220});
  const run = runs.find((r)=>r.id===selectedRunId);
  const filtered = run?.events.filter((e)=>(timelinePhase==='all'||e.phase===timelinePhase)&&(timelineStatus==='all'||e.status===timelineStatus)) ?? [];
  return <Drawer opened={Boolean(run)} onClose={()=>selectRun(null)} position="right" size="xl" withinPortal keepMounted={false} title={run ? <div className="drawer-title"><span className="eyebrow">Run detail</span><strong>{run.id} · {run.label}</strong><small>Submitted {fmtTime(run.createdAt)}</small></div> : ''} overlayProps={{backgroundOpacity:.2,blur:2}} classNames={{body:'run-drawer-body', content:'run-drawer-content'}} closeOnEscape closeOnClickOutside closeButtonProps={{'aria-label':'Close run detail'}}>
    {run && <div className="run-detail"><section><div className="detail-section-title"><h2>Phase outputs</h2><span>Click a timeline event to locate its phase</span></div><div className="detail-phases">{run.phases.map((p)=><div key={p.key}><PhaseCard runId={run.id} phase={p} detailed highlighted={highlightedPhase===p.key}/><dl className="output-meta"><div><dt>Started</dt><dd>{fmtTime(p.startedAt)}</dd></div><div><dt>Completed</dt><dd>{fmtTime(p.completedAt)}</dd></div><div><dt>Output</dt><dd>{p.output ?? 'Not available yet'}</dd></div></dl></div>)}</div></section>
      <section className="timeline-section"><div className="detail-section-title"><h2>Event timeline</h2><span>{run.events.length} recorded transitions</span></div><div className="timeline-filters"><Select aria-label="Filter timeline by phase" value={timelinePhase} onChange={setTimelinePhase} data={[{value:'all',label:'All phases'},...Object.entries(phaseLabel).map(([value,label])=>({value,label}))]}/><Select aria-label="Filter timeline by status" value={timelineStatus} onChange={setTimelineStatus} data={['all','Pending','Running','Complete','Failed','Skipped'].map((x)=>({value:x,label:x==='all'?'All statuses':x}))}/>{(timelinePhase!=='all'||timelineStatus!=='all')&&<Button variant="subtle" leftSection={<Icon icon={IconX} label="Clear" size={14} />} onClick={()=>{setTimelinePhase('all');setTimelineStatus('all')}}>Clear</Button>}</div>
        <div className="timeline-list" ref={timelineListRef}>{filtered.map((e)=><button type="button" key={e.id} className={`timeline-entry ${highlightedPhase===e.phase?'selected':''}`} onClick={()=>setHighlightedPhase(e.phase)}><span className="timeline-marker" style={{background:statusDot[e.status]}} aria-hidden="true"/><div><span>{phaseLabel[e.phase]}</span><strong>{e.message}</strong><time>{fmtTime(e.timestamp)}</time></div><StatusChip status={e.status}/></button>)}{!filtered.length&&<EmptyState title="No timeline events match" body={`No events match the selected ${timelinePhase} / ${timelineStatus} filters. Clear filters to restore the full timeline.`} action="Clear timeline filters" onAction={()=>{setTimelinePhase('all');setTimelineStatus('all')}}/>}</div>
      </section></div>}
  </Drawer>;
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

const suggestions = [
  { label:'Helix auto-tune', values:{jobType:'Fine-tune',dataset:'Helix-12K',model:'atlas-mini',count:6,cluster:'aurora',autoEvaluate:true} },
  { label:'Nova data forge', values:{jobType:'Data generation',dataset:'Nova-Synth',model:'lumen-2b',count:12,cluster:'cinder'} },
  { label:'Switchboard eval', values:{jobType:'Evaluate',dataset:'Helix-12K',model:'quill-2b-ft-1027',count:3,cluster:'basalt',benchmark:'Switchboard',repetitions:3} },
];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="field-error" role="alert" aria-live="polite">{message}</p>;
}

function SubmissionDrawer() {
  const opened = usePipelineStore((s)=>s.submissionOpen);
  const close = usePipelineStore((s)=>s.closeSubmission);
  const runs = usePipelineStore((s)=>s.runs);
  const submitJob = usePipelineStore((s)=>s.submitJob);
  const setDraft = usePipelineStore((s)=>s.setFormDraft);
  const pushAlert = usePipelineStore((s)=>s.pushAlert);
  const importJobConfig = usePipelineStore((s)=>s.importJobConfig);
  const importError = usePipelineStore((s)=>s.importError);
  const clearImportError = usePipelineStore((s)=>s.clearImportError);
  const importRef = useRef(null);
  const submitLock = useRef(false);
  const eligibleDatasets = useMemo(()=>getEligibleDatasets(runs),[runs]);
  const eligibleCheckpoints = useMemo(()=>getEligibleCheckpoints(runs),[runs]);
  const schema = useMemo(()=>makeJobConfigSchema(eligibleDatasets,eligibleCheckpoints),[eligibleDatasets,eligibleCheckpoints]);
  const { control, watch, reset, handleSubmit, trigger, formState:{errors,isValid,isSubmitting} } = useForm({
    resolver:zodResolver(schema), mode:'onChange', reValidateMode:'onChange',
    defaultValues:{jobType:'Fine-tune',dataset:'',model:'',count:5,cluster:'aurora',benchmark:undefined,repetitions:3,autoEvaluate:true},
  });
  const values = watch();
  useEffect(()=>{ if(opened) setTimeout(()=>trigger(),0); },[opened,trigger]);
  useEffect(()=>{ setDraft(values); },[values,setDraft]);
  useEffect(()=>{ trigger(); },[schema,trigger]);
  const jobType = values.jobType;
  const datasetOptions = jobType==='Fine-tune' ? eligibleDatasets : [...new Set(runs.filter(r=>r.phases[0].status==='Complete').map(r=>r.phases[0].dataset))];
  const modelOptions = jobType==='Evaluate' ? eligibleCheckpoints : baseModels;
  const previewObject = {jobType:values.jobType,dataset:values.dataset||'',model:values.model||'',count:Number(values.count)||0,cluster:values.cluster||''};
  if(jobType==='Evaluate'){previewObject.benchmark=values.benchmark||'';previewObject.repetitions=Number(values.repetitions)||0}
  if(jobType==='Fine-tune') previewObject.autoEvaluate=Boolean(values.autoEvaluate);
  const preview = JSON.stringify(previewObject,null,2);
  const applySuggestion = (item) => reset({...item.values,repetitions:item.values.repetitions??3,benchmark:item.values.benchmark,autoEvaluate:item.values.autoEvaluate??false});
  useEffect(()=>{
    const fill = (e) => { reset({...e.detail,repetitions:e.detail.repetitions??3,autoEvaluate:e.detail.autoEvaluate??false}); setTimeout(()=>trigger(),0); };
    window.addEventListener('relay:form-fill',fill);
    return ()=>window.removeEventListener('relay:form-fill',fill);
  },[reset,trigger]);
  const onSubmit = (raw) => {
    if (submitLock.current || isSubmitting) return;
    submitLock.current = true;
    const exact = sanitizeJobConfig(raw,eligibleDatasets,eligibleCheckpoints);
    submitJob(exact, { force: true });
    setTimeout(()=>{ submitLock.current = false; }, 800);
  };
  const copy = async()=>{try{await navigator.clipboard.writeText(preview);}catch{/* headless */}pushAlert('Exact job config copied to clipboard','green')};
  const onImportFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const ok = importJobConfig(text);
    if (ok) close();
  };
  return <Modal opened={opened} onClose={close} size="min(960px, 96vw)" centered withinPortal keepMounted={false} title={<div className="drawer-title"><span className="eyebrow">New pipeline work</span><strong>Submit a research job</strong><small>Configure one phase; Relay preserves the downstream chain.</small></div>} overlayProps={{backgroundOpacity:.28,blur:3}} transitionProps={{transition:'fade',duration:220}} closeButtonProps={{'aria-label':'Close submission panel'}} closeOnEscape closeOnClickOutside trapFocus returnFocus>
    <div className="suggestions"><span><Icon icon={IconSparkles} label="Quick configurations" size={14} />Quick configurations</span><div>{suggestions.map((s)=><button type="button" key={s.label} onClick={()=>applySuggestion(s)}>{s.label}</button>)}</div></div>
    <form className="submission-layout" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="job-form">
        <div className="form-section"><span className="form-step">01</span><div><h2>Job shape</h2><p>Choose the phase this job should execute.</p></div></div>
        <Controller name="jobType" control={control} render={({field})=>(
          <div>
            <Select {...field} value={field.value??null} onChange={(v)=>reset({jobType:v,dataset:'',model:'',count:5,cluster:values.cluster||'aurora',benchmark:undefined,repetitions:3,autoEvaluate:false})} label="Job type" data={JOB_TYPES} error={errors.jobType?.message} allowDeselect={false} required/>
            <FieldError message={errors.jobType?.message} />
          </div>
        )}/>
        <div className="form-section compact"><span className="form-step">02</span><div><h2>Inputs & compute</h2><p>Eligible inputs are gated by completed upstream phases.</p></div></div>
        <Controller name="dataset" control={control} render={({field})=>(
          <div>
            <Select {...field} value={field.value||null} onChange={field.onChange} searchable label="Dataset" placeholder="Select an eligible dataset" data={datasetOptions} error={errors.dataset?.message} required description={jobType==='Fine-tune'?'Only datasets from completed generation runs can be selected.':undefined} nothingFoundMessage="No completed datasets available"/>
            <FieldError message={errors.dataset?.message} />
          </div>
        )}/>
        <Controller name="model" control={control} render={({field})=>(
          <div>
            <Select {...field} value={field.value||null} onChange={field.onChange} searchable label="Model" placeholder="Select a model" data={modelOptions} error={errors.model?.message} required description={jobType==='Evaluate'?'Only checkpoints produced by a completed fine-tune can be selected.':undefined} nothingFoundMessage="No completed checkpoints available"/>
            <FieldError message={errors.model?.message} />
          </div>
        )}/>
        <div className="form-row"><Controller name="count" control={control} render={({field})=>(
          <div>
            <NumberInput {...field} value={field.value??''} onChange={field.onChange} label={jobType==='Fine-tune'?'Epoch count':jobType==='Data generation'?'Trial count':'Trial budget'} min={1} max={50} clampBehavior="none" error={errors.count?.message} required/>
            <FieldError message={errors.count?.message} />
          </div>
        )}/><Controller name="cluster" control={control} render={({field})=>(
          <div>
            <Select {...field} value={field.value??null} onChange={field.onChange} label="Cluster" data={CLUSTERS} error={errors.cluster?.message} allowDeselect={false} required/>
            <FieldError message={errors.cluster?.message} />
          </div>
        )}/></div>
        {jobType==='Evaluate'&&<div className="conditional-fields"><span className="conditional-label">Evaluation settings</span><div className="form-row"><Controller name="benchmark" control={control} render={({field})=>(
          <div>
            <Select {...field} value={field.value||null} onChange={field.onChange} label="Benchmark" placeholder="Select benchmark" data={BENCHMARKS} error={errors.benchmark?.message} required/>
            <FieldError message={errors.benchmark?.message} />
          </div>
        )}/><Controller name="repetitions" control={control} render={({field})=>(
          <div>
            <NumberInput {...field} value={field.value??''} onChange={field.onChange} label="Repetition count" min={1} max={10} clampBehavior="none" error={errors.repetitions?.message} required/>
            <FieldError message={errors.repetitions?.message} />
          </div>
        )}/></div></div>}
        {jobType==='Fine-tune'&&<Controller name="autoEvaluate" control={control} render={({field})=><Switch checked={field.value} onChange={(e)=>field.onChange(e.currentTarget.checked)} label="Start evaluation automatically when training completes" description="Adds a timeline trigger and starts the evaluation phase from the saved checkpoint."/>}/>}
        <div className="import-block">
          <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Import job-config JSON file" onChange={(e)=>{ const f=e.target.files?.[0]; e.target.value=''; onImportFile(f); }} />
          <Button type="button" variant="default" leftSection={<Icon icon={IconClipboard} label="Import" size={15} />} onClick={()=>{ clearImportError(); importRef.current?.click(); }}>Import job-config</Button>
          {importError && <p className="field-error" role="alert" aria-live="assertive">{importError}</p>}
        </div>
      </div>
      <aside className="preview-panel"><div className="preview-heading"><div><span className="eyebrow">Request body</span><h2>Config preview</h2></div><span className={isValid?'valid-config':'invalid-config'}>{isValid?<><Icon icon={IconCheck} label="Valid" size={13} />Valid</>:<><Icon icon={IconAlertTriangle} label="Incomplete" size={13} />Incomplete</>}</span></div><pre aria-label="Live job configuration preview">{preview}</pre><div className="preview-actions"><Button type="button" variant="default" leftSection={<Icon icon={IconCopy} label="Copy" size={15} />} onClick={copy}>Copy</Button><Button type="button" variant="default" leftSection={<Icon icon={IconDownload} label="Download" size={15} />} onClick={()=>downloadText(preview,'job-config.json')}>Download job-config.json</Button></div><div className="preview-note"><Icon icon={IconCheck} label="Schema note" size={15} /><p>Copy, download, and successful submission use this exact request-body schema.</p></div><Button type="submit" size="md" fullWidth disabled={!isValid||isSubmitting||submitLock.current} loading={isSubmitting} leftSection={<Icon icon={IconBolt} label="Submit" size={16} />}>Submit job</Button><Button type="button" variant="subtle" color="gray" fullWidth onClick={close}>Cancel</Button></aside>
    </form>
  </Modal>;
}

function App() {
  const activeView = usePipelineStore((s)=>s.activeView);
  const tick = usePipelineStore((s)=>s.tick);
  const alerts = usePipelineStore((s)=>s.alerts);
  const dismissAlert = usePipelineStore((s)=>s.dismissAlert);
  const mobileNavOpen = usePipelineStore((s)=>s.mobileNavOpen);
  const setMobileNav = usePipelineStore((s)=>s.setMobileNav);
  const density = usePipelineStore((s)=>s.density);
  const setDensity = usePipelineStore((s)=>s.setDensity);
  const openSubmission = usePipelineStore((s)=>s.openSubmission);
  const shown = useRef(new Set());
  useEffect(()=>{const id=setInterval(tick,1000);return()=>clearInterval(id)},[tick]);
  useEffect(()=>{registerWebMCP()},[]);
  useEffect(()=>{
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSubmission();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSubmission]);
  useEffect(()=>{
    alerts.forEach((alert)=>{if(!shown.current.has(alert.id)){shown.current.add(alert.id);notifications.show({message:alert.message,color:alert.color,autoClose:3200,withBorder:true,onClose:()=>dismissAlert(alert.id)})}})
  },[alerts,dismissAlert]);
  const latestAlert=alerts.at(-1)?.message??'';
  const autoTrigger = alerts.filter((a)=>a.message.includes('automatic evaluation')).at(-1)?.message ?? '';
  return <div className={`app-shell density-${density}`}>
    <Sidebar/>
    <header className="mobile-header"><div className="brand"><div className="brand-mark"><Icon icon={IconBolt} label="Relay" size={17} /></div><strong>Relay</strong></div><ActionIcon className="mobile-nav-toggle" variant="default" size={44} aria-label="Open navigation" onClick={()=>setMobileNav(true)}><Icon icon={IconMenu2} label="Open navigation" size={20} /></ActionIcon></header>
    <main className="main-shell">
      <Rollups/>
      <div className="prefs-bar" aria-label="Display preferences">
        <span>Density</span>
        <SegmentedControl size="xs" value={density} onChange={setDensity} data={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'}]} aria-label="Board density preference"/>
        <small className="shortcut-hint"><Icon icon={IconSparkles} label="Shortcut" size={12} /> ⌘K submit job</small>
      </div>
      <div className="canvas">{activeView==='pipeline'?<Board/>:activeView==='datasets'?<DatasetsView/>:<ResultsView/>}</div>
    </main>
    <Drawer opened={mobileNavOpen} onClose={()=>setMobileNav(false)} position="left" size="280px" withinPortal withCloseButton closeButtonProps={{'aria-label':'Close navigation'}} classNames={{body:'mobile-nav-body'}} closeOnEscape closeOnClickOutside><Sidebar mobile/></Drawer>
    <SubmissionDrawer/><RunDetail/><TrialDrilldown/>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{latestAlert}</div>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{autoTrigger}</div>
  </div>;
}

export default App;
