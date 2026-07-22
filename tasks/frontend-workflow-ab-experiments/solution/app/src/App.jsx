import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button, TextInput, TextArea, Select, SelectItem, NumberInput, Modal, Tag, Toggle,
  InlineLoading, ToastNotification, ProgressBar, Tabs, TabList, Tab, TabPanels, TabPanel, Slider,
  Tile, Checkbox, Dropdown, RadioButtonGroup, RadioButton, FileUploaderDropContainer
} from '@carbon/react'
import {
  Add, Archive, ArrowLeft, ChartBar, CheckmarkFilled, ChevronRight, Close, Copy, DataBase,
  Download, Edit, Flag, Pause, Play, Redo, Renew, Search, SettingsAdjust, TrashCan, Undo, Upload,
  WarningAlt, Locked, IbmWatsonMachineLearning, DocumentExport, Filter, Events, List, Trophy, Menu
} from '@carbon/icons-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
  Area, ComposedChart, ReferenceLine, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts'
import { motion, AnimatePresence } from 'motion/react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useStudio, getVisibleExperiments } from './store'
import { experimentSchema, criterionSchema, decisionSchema, LETTERS, MODELS, STATUSES, reportSchema } from './contracts'
import { defaultExperiment } from './data'
import { computeStatistics, criterionMeans, matrixMetrics, passRates, cumulativeData, sampleRows, usableSamples } from './stats'

const COLORS = ['#7c5cff', '#10b9a7', '#f59e42', '#e85aad']
const statusKind = { pending: 'gray', running: 'blue', paused: 'teal', completed: 'green', decided: 'purple', archived: 'cool-gray' }
const statusLabel = value => value.charAt(0).toUpperCase() + value.slice(1)
const fmtDate = value => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not started'
const truncate = value => value.length > 60 ? `${value.slice(0, 60)}…` : value

function useRestoreLauncherOnUnmount(launcherButtonRef) {
  useEffect(() => () => {
    const launcher = launcherButtonRef.current
    const restoreFocus = () => launcher?.isConnected && launcher.focus()
    // Carbon's modal cleanup can run after React unmounts the dialog. Restore
    // immediately, then once more after that cleanup has settled so Escape
    // reliably returns keyboard users to the control that opened the modal.
    window.setTimeout(restoreFocus, 0)
    window.setTimeout(restoreFocus, 80)
  }, [launcherButtonRef])
}

function App() {
  const store = useStudio()
  const modalLauncherRef = useRef(null)
  const panelLauncherRef = useRef(null)
  const rememberLauncher = event => { modalLauncherRef.current = event.currentTarget }
  const rememberPanelLauncher = event => { panelLauncherRef.current = event.currentTarget }
  useEffect(() => {
    const timer = setInterval(() => useStudio.getState().tickRuns(), 200)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const focusSearch = event => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      const search = document.querySelector('input[aria-label="Search experiments"]')
      if (!search) return
      event.preventDefault()
      search.focus()
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])
  const modalOpen = !!(store.designer || store.criterionOpen || store.decisionFor || store.reportFor || store.confirm)
  useEffect(() => {
    document.querySelectorAll('.modal-backdrop-target').forEach(node => {
      if (modalOpen) node.setAttribute('inert', '')
      else node.removeAttribute('inert')
    })
  }, [modalOpen])
  const active = store.experiments.find(item => item.id === store.activeExperimentId)
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header />
    <div className="studio-layout modal-backdrop-target">
      <SideRail />
      <main id="main-content" className="main-stage">
        {store.view === 'experiments' && <Library rememberLauncher={rememberLauncher} rememberPanelLauncher={rememberPanelLauncher} />}
        {store.view === 'criteria' && <CriteriaView rememberLauncher={rememberLauncher} />}
        {store.view === 'prompts' && <PromptsView />}
      </main>
      <AnimatePresence>{active && <ResultsPanel key={active.id} experiment={active} rememberLauncher={rememberLauncher} launcherButtonRef={panelLauncherRef} />}</AnimatePresence>
    </div>
    {store.designer && <DesignerModal launcherButtonRef={modalLauncherRef} />}
    {store.criterionOpen && <CriterionModal launcherButtonRef={modalLauncherRef} />}
    {store.decisionFor && <DecisionModal launcherButtonRef={modalLauncherRef} />}
    {store.reportFor && <ReportModal launcherButtonRef={modalLauncherRef} />}
    {store.confirm && <ConfirmDialog launcherButtonRef={modalLauncherRef} />}
    {store.toast && <div className="toast-wrap toast-enter" key={store.toast.id}><ToastNotification kind={store.toast.kind} title={store.toast.title} timeout={0} /></div>}
    <div className="sr-only" aria-live="polite" aria-atomic="true">{store.announcement}</div>
  </div>
}

function Header() {
  const past = useStudio(state => state.past)
  const future = useStudio(state => state.future)
  const undo = useStudio(state => state.undo)
  const redo = useStudio(state => state.redo)
  return <header className="top-header">
    <div className="brand-mark"><span className="brand-glyph"><IbmWatsonMachineLearning size={20} aria-hidden="true" /></span><div><span className="eyebrow">Prompt Operations</span><h1>Signal Lab</h1></div></div>
    <div className="header-actions">
      <span className="session-status"><span className="live-dot" /> Session workspace</span>
      <Button kind="ghost" size="sm" renderIcon={Undo} iconDescription="Undo" hasIconOnly disabled={!past.length} onClick={undo} tooltipPosition="bottom" />
      <Button kind="ghost" size="sm" renderIcon={Redo} iconDescription="Redo" hasIconOnly disabled={!future.length} onClick={redo} tooltipPosition="bottom" />
    </div>
  </header>
}

function SideRail() {
  const view = useStudio(state => state.view)
  const setField = useStudio(state => state.setField)
  const items = [
    { id: 'experiments', label: 'Experiments', icon: ChartBar },
    { id: 'criteria', label: 'Criteria', icon: SettingsAdjust },
    { id: 'prompts', label: 'Prompt library', icon: DataBase }
  ]
  return <nav className="side-rail" aria-label="Studio views">
    <div className="side-label">Studio</div>
    {items.map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setField('view', item.id)}><item.icon size={18} /><span>{item.label}</span></button>)}
    <div className="rail-spacer" />
    <div className="rail-note"><span>v1 contract</span><strong>API-ready</strong></div>
  </nav>
}

function Library({ rememberLauncher, rememberPanelLauncher }) {
  const state = useStudio()
  const visible = getVisibleExperiments(state)
  const [rowsRef] = useAutoAnimate({ duration: 260 })
  const selectedVisible = visible.filter(item => state.selectedIds.includes(item.id))
  const openDelete = event => { rememberLauncher(event); state.setField('confirm', { type: 'delete', count: state.selectedIds.length }) }
  const openArchive = event => { rememberLauncher(event); state.setField('confirm', { type: 'archive', count: state.selectedIds.length }) }
  return <section className="page-section" aria-labelledby="library-title">
    <div className="page-heading">
      <div><span className="eyebrow accent">Experiment Workspace</span><h2 id="library-title">Experiment Library</h2><p>Design, run, evaluate, and package prompt experiments.</p></div>
      <Button renderIcon={Add} onClick={event => { rememberLauncher(event); state.openDesigner() }}>New Experiment</Button>
    </div>
    <div className="library-card">
      <div className="toolbar-row">
        <div className="search-box"><Search size={18} /><input aria-label="Search experiments" value={state.search} onChange={event => state.setSearch(event.target.value)} placeholder="Search experiments" /><kbd>⌘ K</kbd></div>
        <div className="filter-group" aria-label="Filter by status">
          {STATUSES.filter(status => status !== 'archived').map(status => <button key={status} aria-pressed={state.filters.includes(status)} className={`filter-button ${state.filters.includes(status) ? 'selected' : ''}`} onClick={() => state.toggleFilter(status)}>{statusLabel(status)}</button>)}
        </div>
        <Toggle id="archived-toggle" size="sm" labelText="Archived" labelA="" labelB="" toggled={state.showArchived} onToggle={value => state.setField('showArchived', value)} />
      </div>
      <div className="active-filter-row">
        <span><strong>{visible.length}</strong> experiment{visible.length === 1 ? '' : 's'}</span>
        {state.filters.map(filter => <Tag key={filter} type="purple" filter onClose={() => state.toggleFilter(filter)} title={`Remove ${statusLabel(filter)} filter`}>{statusLabel(filter)}</Tag>)}
        {(state.filters.length > 0 || state.search || state.showArchived) && <button className="text-action" onClick={state.clearFilters}>Clear filters</button>}
      </div>
      <AnimatePresence>{state.selectedIds.length > 0 && <motion.div className="bulk-bar" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><strong>{state.selectedIds.length} selected</strong><Button size="sm" kind="secondary" renderIcon={Archive} onClick={openArchive}>Archive selected</Button><Button size="sm" kind="danger--tertiary" renderIcon={TrashCan} onClick={openDelete}>Delete selected</Button><Button size="sm" kind="ghost" onClick={() => state.setField('selectedIds', [])}>Clear</Button></motion.div>}</AnimatePresence>
      <div className="table-scroll">
        {visible.length ? <table className="experiment-table">
          <thead><tr><th className="check-cell"><Checkbox id="select-all" labelText="Select all visible experiments" hideLabel checked={visible.length > 0 && selectedVisible.length === visible.length} onChange={() => state.selectAll(visible.map(item => item.id))} /></th><th>Name</th><th>Variants</th><th>Sample size</th><th>Status</th><th>Started</th><th>Actions</th></tr></thead>
          <tbody ref={rowsRef}>
            {visible.map(experiment => <ExperimentRow key={experiment.id} experiment={experiment} rememberLauncher={rememberLauncher} rememberPanelLauncher={rememberPanelLauncher} />)}
          </tbody>
        </table> : <div className="empty-state"><div className="empty-icon"><Filter size={26} /></div><h3>No experiments match</h3><p>Adjust the status filters or search to bring experiments back into view.</p><Button kind="tertiary" size="sm" onClick={state.clearFilters}>Clear filters</Button></div>}
      </div>
    </div>
  </section>
}

function ExperimentRow({ experiment, rememberLauncher, rememberPanelLauncher }) {
  const state = useStudio()
  const selected = state.selectedIds.includes(experiment.id)
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  const current = Math.min(...letters.map(letter => experiment.progress[letter] || 0))
  const total = experiment.minimumSampleSize
  const open = event => { if (['completed', 'decided', 'running', 'paused'].includes(experiment.status)) { rememberPanelLauncher(event); state.selectExperiment(experiment.id) } }
  return <tr className={experiment.isNew ? 'new-row' : ''} onDoubleClick={open}>
    <td className="check-cell"><Checkbox id={`select-${experiment.id}`} labelText={`Select ${experiment.name}`} hideLabel checked={selected} onChange={() => state.toggleSelected(experiment.id)} /></td>
    <td><button className="experiment-name" onClick={open} title={experiment.name}>{truncate(experiment.name)}</button><span className="experiment-id">{experiment.id}</span></td>
    <td><div className="variant-stack">{experiment.variants.map((variant, index) => <span key={`${experiment.id}-${index}`}><i style={{ background: COLORS[index] }}>{LETTERS[index]}</i>{variant.title}</span>)}</div></td>
    <td><strong>{experiment.minimumSampleSize}</strong><span className="muted-unit"> / variant</span></td>
    <td><div className="status-cell"><Tag type={statusKind[experiment.status]}>{statusLabel(experiment.status)}</Tag>{experiment.status === 'running' && <InlineLoading description={`${current} of ${total}`} />}</div></td>
    <td>{fmtDate(experiment.startedAt)}</td>
    <td><div className="row-actions">
      {experiment.status === 'pending' && <><Button size="sm" kind="ghost" renderIcon={Play} onClick={event => { rememberPanelLauncher(event); state.startRun(experiment.id) }}>Run Experiment</Button><Button size="sm" kind="ghost" renderIcon={Edit} onClick={event => { rememberLauncher(event); state.openDesigner(experiment.id) }}>Edit</Button></>}
      {experiment.status === 'running' && <><Button size="sm" kind="ghost" renderIcon={Pause} onClick={() => state.pauseRun(experiment.id)}>Pause</Button><Button size="sm" kind="ghost" onClick={open}>View run</Button></>}
      {experiment.status === 'paused' && <><Button size="sm" kind="ghost" renderIcon={Play} onClick={() => state.resumeRun(experiment.id)}>Resume</Button><Button size="sm" kind="ghost" onClick={open}>View run</Button></>}
      {['completed', 'decided'].includes(experiment.status) && <Button size="sm" kind="ghost" renderIcon={ChevronRight} onClick={open}>View results</Button>}
      {experiment.status === 'archived' ? <Button size="sm" kind="ghost" renderIcon={Renew} onClick={() => state.unarchive(experiment.id)}>Unarchive</Button> : <Button size="sm" kind="ghost" hasIconOnly renderIcon={Archive} iconDescription="Archive experiment" onClick={event => { rememberLauncher(event); state.archiveOne(experiment.id) }} />}
    </div></td>
  </tr>
}

function CriteriaView({ rememberLauncher }) {
  const criteria = useStudio(state => state.criteria)
  const setField = useStudio(state => state.setField)
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow accent">Evaluation System</span><h2>Scoring Criteria</h2><p>Reusable judges that define success across every experiment.</p></div><Button renderIcon={Add} onClick={event => { rememberLauncher(event); setField('criterionOpen', true) }}>New Criterion</Button></div><div className="criteria-grid">{criteria.map((criterion, index) => <Tile key={criterion.id} className="criterion-card"><div className="criterion-top"><span className="criterion-index">0{index + 1}</span><Tag type="outline">Pass ≥ {criterion.passThreshold}</Tag></div><div className="criterion-radial"><ResponsiveContainer width="100%" height={120}><RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: criterion.passThreshold, fill: COLORS[index % COLORS.length] }]} startAngle={90} endAngle={-270}><PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar dataKey="value" background={{ fill: '#292f40' }} cornerRadius={8} isAnimationActive={false} /></RadialBarChart></ResponsiveContainer><strong>{criterion.passThreshold}%</strong></div><h3>{criterion.label || criterion.name}</h3><p>{criterion.description}</p></Tile>)}</div></section>
}

function PromptsView() {
  const prompts = useStudio(state => state.prompts)
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow accent">Version Registry</span><h2>Prompt Library</h2><p>Seeded prompt assets and the current promoted head versions.</p></div></div><div className="prompt-list">{prompts.map((prompt, index) => <Tile key={prompt.id} className="prompt-row"><span className="prompt-icon"><List size={20} /></span><div><h3>{prompt.name}</h3><code>{prompt.id}</code></div><span className="prompt-meta">Head version</span><Tag type={String(prompt.head).includes('promoted') ? 'purple' : 'blue'}>{prompt.head}</Tag></Tile>)}</div></section>
}

function ResultsPanel({ experiment, rememberLauncher, launcherButtonRef }) {
  const state = useStudio()
  const statistics = computeStatistics(experiment)
  const complete = ['completed', 'decided'].includes(experiment.status)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const close = () => { state.closePanel(); window.setTimeout(() => launcherButtonRef.current?.focus(), reducedMotion ? 0 : 260) }
  return <motion.aside className="results-panel" aria-label={`Results for ${experiment.name}`} initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.2, 0, 0.38, 0.9] }}>
    <div className="panel-header">
      <div className="panel-topline"><Button kind="ghost" size="sm" renderIcon={ArrowLeft} onClick={close}>Back</Button><Tag type={statusKind[experiment.status]}>{statusLabel(experiment.status)}</Tag><Button kind="ghost" size="sm" renderIcon={Close} hasIconOnly iconDescription="Close results" onClick={close} /></div>
      <span className="eyebrow accent">{experiment.id}</span><h2>{experiment.name}</h2><p>{experiment.hypothesis}</p>
      {experiment.decision && <div className="decision-banner"><Locked size={18} /><div><strong>{experiment.decision.choice === 'declare-winner' ? `Variant ${experiment.decision.winnerVariant} declared winner` : statusLabel(experiment.decision.choice.replace('-', ' '))}</strong><p>{experiment.decision.rationale}</p></div></div>}
      {!complete && <RunProgress experiment={experiment} />}
      <div className="panel-actions">
        {experiment.status === 'completed' && <Button size="sm" renderIcon={Trophy} onClick={event => { rememberLauncher(event); state.setField('decisionFor', experiment.id) }}>Decide</Button>}
        {complete && <Button size="sm" kind="secondary" renderIcon={DocumentExport} onClick={event => { rememberLauncher(event); state.setField('reportFor', experiment.id) }}>Export report</Button>}
        {experiment.decision?.choice === 'declare-winner' && <Button size="sm" kind="tertiary" onClick={event => { rememberLauncher(event); state.setField('confirm', { type: 'promote', experimentId: experiment.id }) }}>Promote winner</Button>}
      </div>
    </div>
    {complete ? <div className="panel-body"><SummaryStrip experiment={experiment} statistics={statistics} /><Tabs selectedIndex={['results', 'monitoring', 'matrix', 'analytics', 'inspector'].indexOf(state.activeTab)} onChange={({ selectedIndex }) => state.setField('activeTab', ['results', 'monitoring', 'matrix', 'analytics', 'inspector'][selectedIndex])}><TabList aria-label="Result views" contained><Tab renderIcon={ChartBar}>Results</Tab><Tab renderIcon={Events}>Monitoring</Tab><Tab renderIcon={List}>Matrix</Tab><Tab renderIcon={SettingsAdjust}>Analytics</Tab><Tab renderIcon={Flag}>Inspector</Tab></TabList><TabPanels><TabPanel>{state.activeTab === 'results' && <ResultsTab experiment={experiment} />}</TabPanel><TabPanel>{state.activeTab === 'monitoring' && <MonitoringTab experiment={experiment} />}</TabPanel><TabPanel>{state.activeTab === 'matrix' && <MatrixTab experiment={experiment} />}</TabPanel><TabPanel>{state.activeTab === 'analytics' && <AnalyticsTab experiment={experiment} />}</TabPanel><TabPanel>{state.activeTab === 'inspector' && <InspectorTab experiment={experiment} />}</TabPanel></TabPanels></Tabs></div> : <div className="panel-body running-results"><SummaryStrip experiment={experiment} statistics={statistics} /><Timeline experiment={experiment} /></div>}
  </motion.aside>
}

function RunProgress({ experiment }) {
  const state = useStudio()
  return <div className="run-progress"><div className="run-progress-title"><strong>Evaluation in progress</strong><span>Same input set · {experiment.minimumSampleSize} samples each</span></div>{experiment.variants.map((variant, index) => { const letter = LETTERS[index]; const value = experiment.progress[letter] || 0; return <div className="progress-line" key={letter}><div><span><i style={{ background: COLORS[index] }}>{letter}</i>{variant.title}</span><strong>{value} of {experiment.minimumSampleSize}</strong></div><ProgressBar hideLabel label={`${letter} progress`} value={value} max={experiment.minimumSampleSize} /></div>})}<div className="run-controls">{experiment.status === 'running' ? <Button size="sm" kind="secondary" renderIcon={Pause} onClick={() => state.pauseRun(experiment.id)}>Pause run</Button> : <Button size="sm" renderIcon={Play} onClick={() => state.resumeRun(experiment.id)}>Resume run</Button>}</div></div>
}

function Timeline({ experiment }) {
  const filter = useStudio(state => state.timelineFilter)
  const setField = useStudio(state => state.setField)
  const entries = filter === 'all' ? experiment.timeline : experiment.timeline.filter(item => item.type === filter)
  return <div className="timeline-region"><div className="section-heading"><div><h3>Run timeline</h3><p>Live run transitions and sample milestones.</p></div><Dropdown id="timeline-filter" size="sm" label="Event type" titleText="" selectedItem={filter} items={['all', 'started', 'milestone', 'paused', 'resumed', 'completed']} itemToString={item => statusLabel(item || 'all')} onChange={({ selectedItem }) => setField('timelineFilter', selectedItem)} /></div>{entries.length ? <ol className="timeline-list">{entries.map(entry => <li key={entry.id}><span className={`timeline-dot ${entry.type}`} /><div><strong>{entry.text}</strong><time>{fmtDate(entry.at)}</time></div></li>)}</ol> : <div className="inline-empty">No {filter} events in this run yet.</div>}</div>
}

function SummaryStrip({ experiment, statistics }) {
  const minCount = Math.min(...experiment.variants.map((_, index) => experiment.samples[LETTERS[index]]?.length || 0))
  const remaining = Math.max(0, experiment.minimumSampleSize - minCount)
  const underpowered = remaining > 0
  const verdict = statistics.pValue < 0.05
  return <div className="summary-wrap">
    <div className={`power-banner ${underpowered ? '' : statistics.insufficient ? 'warning' : verdict ? 'success' : 'warning'}`} aria-live="polite" aria-atomic="true">
    {underpowered ? <><Events size={18} /><div><strong>Underpowered</strong><span>{remaining} sample{remaining === 1 ? '' : 's'} per variant remaining before the significance verdict activates.</span></div></>
    : statistics.insufficient ? <><WarningAlt size={18} /><div><strong>Insufficient data</strong><span>Every response for at least one variant is flagged. Unflag a response to compute statistics.</span></div></>
    : <><CheckmarkFilled size={18} /><div><strong>{verdict ? 'Significance reached' : 'Not significant'}</strong><span>Minimum sample size reached · p-value {statistics.pValue.toFixed(4)}</span></div></>}
  </div>
    <div className="summary-strip">
      <Tile className="stat-tile"><span>Winner</span>{underpowered || statistics.winner === 'Tie' ? <strong className="winner-value tie-badge">Tie</strong> : <Tag type={!underpowered && verdict ? 'green' : 'gray'} className="winner-badge">{`Variant ${statistics.winner}`}</Tag>}<small>{underpowered ? 'Verdict pending' : verdict ? 'Significant' : 'Not significant'}</small></Tile>
      <Tile className="stat-tile"><span>Win rate</span><strong>{(statistics.winRate * 100).toFixed(1)}%</strong><small>Leader vs. baseline</small></Tile>
      <Tile className="stat-tile"><span>p-value</span><strong>{statistics.pValue < 0.000001 ? statistics.pValue.toExponential(2) : statistics.pValue.toFixed(6)}</strong><small>Two-sample t-test</small></Tile>
      <Tile className="stat-tile"><span>95% confidence interval</span><strong>[{statistics.confidenceInterval[0].toFixed(2)}, {statistics.confidenceInterval[1].toFixed(2)}]</strong><small>Score delta</small></Tile>
    </div>
  </div>
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return <section className={`chart-card ${className}`}><div className="chart-heading"><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</section>
}

function ResultsTab({ experiment }) {
  const criteria = useStudio(state => state.criteria)
  const sort = useStudio(state => state.sampleSort)
  const setField = useStudio(state => state.setField)
  const barData = criterionMeans(experiment, criteria)
  const statistics = computeStatistics(experiment)
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  const maxLength = Math.max(...letters.map(letter => usableSamples(experiment, letter).length))
  const diffData = Array.from({ length: maxLength }, (_, index) => {
    const leader = statistics.leader || letters[1]
    const baseline = statistics.baseline || letters[0]
    const leadMean = usableSamples(experiment, leader).slice(0, index + 1).reduce((sum, item) => sum + item.score, 0) / (index + 1)
    const baseMean = usableSamples(experiment, baseline).slice(0, index + 1).reduce((sum, item) => sum + item.score, 0) / (index + 1)
    const delta = Number.isFinite(leadMean - baseMean) ? leadMean - baseMean : 0
    const band = 8 / Math.sqrt(index + 1)
    return { sample: index + 1, delta, lower: delta - band, upper: delta + band, range: [delta - band, delta + band] }
  })
  const rows = sampleRows(experiment).sort((a, b) => sort === 'asc' ? a.delta - b.delta : b.delta - a.delta)
  return <div className="results-grid"><ChartCard title="Criterion performance" subtitle="Mean score by scoring criterion"><div className="chart-frame chart-bars-animate"><ResponsiveContainer width="100%" height={280}><BarChart data={barData} barGap={3}><CartesianGrid stroke="#252a3a" vertical={false} /><XAxis dataKey="criterion" tick={{ fill: '#a9b0c3', fontSize: 11 }} /><YAxis domain={[40, 100]} tick={{ fill: '#7f8799' }} /><Tooltip contentStyle={{ background: '#161b2a', border: '1px solid #343b52' }} /><Legend />{letters.map((letter, index) => <Bar key={letter} dataKey={letter} fill={COLORS[index]} radius={[3, 3, 0, 0]} animationDuration={400} name={`Variant ${letter}`} />)}</BarChart></ResponsiveContainer></div></ChartCard>
    <ChartCard title="Score distributions" subtitle="Unflagged response scores by variant"><DistributionStrip experiment={experiment} /></ChartCard>
    <ChartCard title="Difference and confidence" subtitle={`Leading variant vs. baseline · shaded 95% confidence band`} className="wide-card"><div className="chart-frame"><ResponsiveContainer width="100%" height={240}><ComposedChart data={diffData}><CartesianGrid stroke="#252a3a" vertical={false} /><XAxis dataKey="sample" tick={{ fill: '#7f8799' }} /><YAxis tick={{ fill: '#7f8799' }} /><Tooltip contentStyle={{ background: '#161b2a', border: '1px solid #343b52' }} /><ReferenceLine y={0} stroke="#687087" strokeDasharray="4 4" /><Area type="monotone" dataKey="range" fill="#7c5cff" fillOpacity={0.2} stroke="none" /><Line type="monotone" dataKey="delta" stroke="#9b86ff" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div></ChartCard>
    <section className="sample-card wide-card"><div className="chart-heading"><div><h3>Sample-level comparison</h3><p>Every seeded input and paired score.</p></div></div><div className="sample-table-wrap"><table className="sample-table"><thead><tr><th>Input</th>{letters.map(letter => <th key={letter}>Variant {letter}</th>)}<th><button onClick={() => setField('sampleSort', sort === 'asc' ? 'desc' : 'asc')}>Score delta {sort === 'asc' ? '↑' : '↓'}</button></th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.input}</td>{letters.map(letter => <td key={letter}>{row[letter]?.toFixed(1) ?? '—'}</td>)}<td className={row.delta >= 0 ? 'positive' : 'negative'}>{row.delta >= 0 ? '+' : ''}{row.delta.toFixed(2)}</td></tr>)}</tbody></table></div></section>
    <div className="wide-card completed-timeline"><Timeline experiment={experiment} /></div>
  </div>
}

function DistributionStrip({ experiment }) {
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  return <div className="distribution-list">{letters.map((letter, index) => {
    const values = usableSamples(experiment, letter).map(item => item.score)
    const bins = Array.from({ length: 8 }, (_, bin) => values.filter(value => value >= 40 + bin * 7.5 && value < 40 + (bin + 1) * 7.5).length)
    const max = Math.max(...bins, 1)
    return <div className="distribution-row" key={letter}><div className="distribution-label"><i style={{ background: COLORS[index] }}>{letter}</i><span>{experiment.variants[index].title}</span></div><div className="mini-histogram" aria-label={`Variant ${letter} score histogram`}>{bins.map((value, bin) => <span key={bin} style={{ height: `${Math.max(8, value / max * 100)}%`, background: COLORS[index] }} title={`${value} responses`} />)}</div><strong>{(values.reduce((sum, value) => sum + value, 0) / (values.length || 1)).toFixed(1)}</strong></div>
  })}</div>
}

function MonitoringTab({ experiment }) {
  const data = cumulativeData(experiment)
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  return <ChartCard title="Sequential monitoring" subtitle="Cumulative mean score as samples arrive"><div className="chart-frame monitor"><ResponsiveContainer width="100%" height={380}><LineChart data={data}><CartesianGrid stroke="#252a3a" /><XAxis dataKey="sample" label={{ value: 'Samples collected', position: 'insideBottom', offset: -5, fill: '#8f97aa' }} tick={{ fill: '#8f97aa' }} /><YAxis domain={['dataMin - 4', 'dataMax + 4']} tick={{ fill: '#8f97aa' }} /><Tooltip content={<MonitoringTooltip />} /><Legend /><ReferenceLine x={experiment.minimumSampleSize} stroke="#f59e42" strokeDasharray="5 5" label={{ value: 'Minimum sample size', fill: '#f59e42', position: 'insideTopRight' }} />{letters.map((letter, index) => <Line key={letter} type="monotone" dataKey={letter} name={`Variant ${letter}`} stroke={COLORS[index]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer></div></ChartCard>
}

function MonitoringTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label} samples</strong>{payload.map(item => <span key={item.dataKey} style={{ color: item.color }}>Variant {item.dataKey}: {Number(item.value).toFixed(2)} cumulative mean</span>)}</div>
}

function MatrixTab({ experiment }) {
  const metrics = matrixMetrics(experiment)
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  return <section className="matrix-card"><div className="chart-heading"><div><h3>Comparison matrix</h3><p>Operational and quality metrics from unflagged responses.</p></div></div><div className="matrix-scroll"><table className="matrix-table"><thead><tr><th>Metric</th>{experiment.variants.map((variant, index) => <th key={LETTERS[index]}><i style={{ background: COLORS[index] }}>{LETTERS[index]}</i><span>{variant.title}</span></th>)}</tr></thead><tbody>{metrics.map(metric => { const values = Object.values(metric.values); const best = metric.lower ? Math.min(...values.filter(value => value > 0)) : Math.max(...values); return <tr key={metric.label}><th>{metric.label}{metric.label === 'Token efficiency' && <small className="matrix-help" title="Mean score earned per 100 generated tokens">Score per 100 tokens</small>}</th>{letters.map(letter => <td key={letter} className={metric.values[letter] === best ? 'best-cell' : ''}><strong>{metric.format(metric.values[letter])}</strong>{metric.values[letter] === best && <span>Best</span>}</td>)}</tr> })}</tbody></table></div></section>
}

function AnalyticsTab({ experiment }) {
  const criteria = useStudio(state => state.criteria)
  const rates = passRates(experiment, criteria)
  return <section><div className="chart-heading"><div><h3>Criterion pass analytics</h3><p>Share of unflagged responses meeting each judge threshold.</p></div></div><div className="radial-grid">{rates.map((criterion, index) => <Tile key={criterion.id} className="radial-card"><div className="radial-chart"><ResponsiveContainer width="100%" height={180}><RadialBarChart innerRadius="76%" outerRadius="100%" data={[{ value: criterion.value, fill: COLORS[index % COLORS.length] }]} startAngle={90} endAngle={-270}><PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar dataKey="value" background={{ fill: '#292f40' }} cornerRadius={8} animationDuration={400} /></RadialBarChart></ResponsiveContainer><strong>{criterion.value.toFixed(0)}%</strong></div><h4>{criterion.label || criterion.name}</h4><p>Pass threshold ≥ {criterion.passThreshold}</p></Tile>)}</div></section>
}

function InspectorTab({ experiment }) {
  const state = useStudio()
  const letter = state.inspectorVariant
  const all = experiment.samples[letter] || []
  const list = state.flaggedOnly ? all.filter(item => experiment.flaggedResponseIds.includes(item.id)) : all
  const locked = experiment.status === 'decided'
  return <section><div className="inspector-controls"><Dropdown id="inspector-variant" titleText="Inspect variant" label="Select variant" selectedItem={letter} items={experiment.variants.map((_, index) => LETTERS[index])} itemToString={item => `Variant ${item}`} onChange={({ selectedItem }) => state.setField('inspectorVariant', selectedItem)} /><Toggle id="flagged-only" labelText="Flagged only" labelA="All" labelB="Flagged" toggled={state.flaggedOnly} onToggle={value => state.setField('flaggedOnly', value)} /></div><p className="control-help">Flagging an outlier excludes that response from the summary, charts, matrix, analytics, and exported report until it is unflagged.</p>{locked && <div className="locked-note"><Locked size={17} />Outlier controls are locked because a decision has been confirmed.</div>}<div className="inspector-list">{list.map(sample => { const flagged = experiment.flaggedResponseIds.includes(sample.id); return <article key={sample.id} className={`response-card ${flagged ? 'flagged' : ''}`}><div className="response-top"><div><span className="sample-id">{sample.id}</span><h4>{sample.input}</h4></div><Button size="sm" kind={flagged ? 'danger--tertiary' : 'ghost'} renderIcon={Flag} disabled={locked} onClick={() => state.toggleOutlier(experiment.id, sample.id)}>{flagged ? 'Unflag outlier' : 'Flag outlier'}</Button></div><p className="response-text">{sample.response}</p><div className="response-metrics">{Object.entries(sample.criterionScores).map(([name, score]) => <span key={name}>{name.replace('-', ' ')} <strong>{score.toFixed(1)}</strong></span>)}<span>Latency <strong>{sample.latency} ms</strong></span><span>Tokens <strong>{sample.tokens}</strong></span></div></article>})}{!list.length && <div className="empty-state compact"><Flag size={24} /><h3>No flagged responses</h3><p>Flag an outlier to make it appear in this filtered view.</p></div>}</div></section>
}

function DesignerModal({ launcherButtonRef }) {
  useRestoreLauncherOnUnmount(launcherButtonRef)
  const state = useStudio()
  const existing = state.designer === 'new' ? null : state.experiments.find(item => item.id === state.designer)
  const defaults = existing ? { name: existing.name, hypothesis: existing.hypothesis, successMetric: existing.successMetric, minimumSampleSize: existing.minimumSampleSize, variants: existing.variants.map(variant => ({ ...variant, temperature: Number(variant.temperature), trafficAllocation: Number(variant.trafficAllocation) })) } : defaultExperiment
  const { register, control, handleSubmit, watch, formState: { errors, isValid, isSubmitting }, setError, reset } = useForm({ resolver: zodResolver(experimentSchema), mode: 'onChange', defaultValues: structuredClone(defaults) })
  React.useEffect(() => { reset(structuredClone(defaults)) }, [state.designer, existing?.id, existing?.minimumSampleSize])
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
  const values = watch()
  const total = (values.variants || []).reduce((sum, item) => sum + Number(item.trafficAllocation || 0), 0)
  const [previewResults, setPreviewResults] = useState([])
  const [previewInput, setPreviewInput] = useState('Explain the key idea clearly and concisely.')
  const submit = async payload => { const result = await state.saveExperiment(payload); if (!result.ok) setError('root', { message: result.error }) }
  const runPreview = () => setPreviewResults((values.variants || []).map((variant, index) => ({ letter: LETTERS[index], title: variant.title, model: variant.model, latency: 590 + index * 161 + previewInput.length, tokens: 104 + index * 29 + Math.round(previewInput.length / 3), text: `${variant.title} via ${variant.model}: ${previewInput} — this ${index % 2 ? 'evidence-aware, detailed' : 'direct, compact'} response uses ${variant.promptId}.` })))
  return <Modal open preventCloseOnClickOutside launcherButtonRef={launcherButtonRef} selectorPrimaryFocus="#experiment-name" modalHeading={existing ? 'Edit Experiment' : 'New Experiment'} modalLabel="ExperimentUpsert · API-shaped design" primaryButtonText={existing ? 'Save Changes' : 'Create Experiment'} secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || total !== 100 || isSubmitting} onRequestClose={state.closeDesigner} onRequestSubmit={handleSubmit(submit)} size="lg" className="designer-modal">
    <div className="modal-intro">Configure 2–4 ordered variants. Every valid submission is the exact experiment API request body.</div>
    <div aria-live="polite" aria-atomic="true">{errors.root && <div className="form-error global">{errors.root.message}</div>}</div>
    <div className="form-grid two"><TextInput id="experiment-name" labelText="Experiment name" invalid={!!errors.name} invalidText={errors.name?.message} {...register('name')} /><Select id="success-metric" labelText="Success metric" invalid={!!errors.successMetric} invalidText={errors.successMetric?.message} {...register('successMetric')}>{state.criteria.map(criterion => <SelectItem key={criterion.id} value={criterion.name} text={criterion.label || criterion.name} />)}</Select></div>
    <TextArea id="hypothesis" labelText="Hypothesis" rows={3} invalid={!!errors.hypothesis} invalidText={errors.hypothesis?.message} {...register('hypothesis')} />
    <Controller control={control} name="minimumSampleSize" render={({ field }) => <NumberInput id="minimum-sample-size" label="Minimum sample size" min={1} max={500} value={field.value} onChange={(_, { value }) => field.onChange(Number(value))} invalid={!!errors.minimumSampleSize} invalidText={errors.minimumSampleSize?.message} />} />
    <div className={`allocation-status ${total === 100 ? 'valid' : 'invalid'}`}><div><strong>Traffic allocation</strong><span>{total === 100 ? 'Ready to run' : 'Traffic allocation rule: values must sum to exactly 100%'}</span></div><b>{total}%</b></div>
    <div aria-live="polite" aria-atomic="true">{errors.variants?.root?.message && <div className="form-error">{errors.variants.root.message}</div>}</div>
    <div className="variant-editor">{fields.map((field, index) => <section className="variant-card" key={field.id}><div className="variant-card-head"><div><i style={{ background: COLORS[index] }}>{LETTERS[index]}</i><strong>Variant {LETTERS[index]}</strong></div>{index > 1 && <Button kind="ghost" size="sm" renderIcon={TrashCan} onClick={() => remove(index)} iconDescription="Remove variant">Remove</Button>}</div><div className="form-grid three"><TextInput id={`variant-title-${index}`} labelText="Variant title" invalid={!!errors.variants?.[index]?.title} invalidText={errors.variants?.[index]?.title?.message} {...register(`variants.${index}.title`)} /><Select id={`variant-prompt-${index}`} labelText="Prompt" invalid={!!errors.variants?.[index]?.promptId} invalidText={errors.variants?.[index]?.promptId?.message} {...register(`variants.${index}.promptId`)}>{state.prompts.map(prompt => <SelectItem key={prompt.id} value={prompt.id} text={prompt.name} />)}</Select><Select id={`variant-model-${index}`} labelText="Model" invalid={!!errors.variants?.[index]?.model} invalidText={errors.variants?.[index]?.model?.message} {...register(`variants.${index}.model`)}>{MODELS.map(model => <SelectItem key={model} value={model} text={model} />)}</Select></div><div className="form-grid slider-grid"><Controller control={control} name={`variants.${index}.temperature`} render={({ field }) => <NumberInput id={`variant-temperature-${index}`} label="Temperature" min={0} max={2} step={0.1} value={field.value} onChange={(_, { value }) => field.onChange(Number(value))} invalid={!!errors.variants?.[index]?.temperature} invalidText={errors.variants?.[index]?.temperature?.message} />} /><div className="range-field"><span>Traffic allocation <strong>{Number(values.variants?.[index]?.trafficAllocation || 0)}%</strong></span><Controller control={control} name={`variants.${index}.trafficAllocation`} render={({ field: allocation }) => <Slider id={`traffic-allocation-${index}`} labelText={`Variant ${LETTERS[index]} traffic allocation`} ariaLabelInput={`Variant ${LETTERS[index]} traffic allocation`} min={0} max={100} step={1} value={Number(allocation.value || 0)} formatLabel={value => `${value}%`} onChange={({ value }) => allocation.onChange(value)} hideTextInput />} /><small>0%</small><small>100%</small></div></div></section>)}</div>
    <div className="designer-actions"><Button kind="tertiary" size="sm" renderIcon={Add} disabled={fields.length >= 4} onClick={() => append({ title: `Variant ${LETTERS[fields.length]}`, promptId: state.prompts[fields.length]?.id || state.prompts[0].id, model: MODELS[fields.length % MODELS.length], temperature: 0.5, trafficAllocation: 0 })}>Add variant</Button><Button kind="ghost" size="sm" renderIcon={Play} onClick={() => state.setField('previewOpen', !state.previewOpen)}>Preview playground</Button></div>
    {state.previewOpen && <div className="preview-playground"><div className="preview-input"><TextArea id="preview-input" labelText="Shared test input" value={previewInput} onChange={event => setPreviewInput(event.target.value)} rows={2} /><Button renderIcon={Play} onClick={runPreview}>Run preview</Button></div><div className="preview-columns">{(values.variants || []).map((variant, index) => { const response = previewResults[index]; return <div className="preview-column" key={index}><div><i style={{ background: COLORS[index] }}>{LETTERS[index]}</i><strong>{variant.title || `Variant ${LETTERS[index]}`}</strong><span>{variant.model}</span></div>{response ? <><p>{response.text}</p><footer>{response.latency} ms · {response.tokens} tokens</footer></> : <div className="preview-empty">Run the shared input to compare this response.</div>}</div> })}</div></div>}
  </Modal>
}

function CriterionModal({ launcherButtonRef }) {
  useRestoreLauncherOnUnmount(launcherButtonRef)
  const state = useStudio()
  const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm({ resolver: zodResolver(criterionSchema), mode: 'onChange', defaultValues: { name: '', description: '', passThreshold: 75 } })
  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = payload => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    const result = state.addCriterion(payload)
    if (!result.ok) {
      setError(result.error.includes('unique') ? 'name' : 'root', { message: result.error })
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }
  return <Modal open preventCloseOnClickOutside launcherButtonRef={launcherButtonRef} selectorPrimaryFocus="#criterion-name" modalHeading="New Scoring Criterion" modalLabel="CriterionUpsert · reusable judge" primaryButtonText="Create Criterion" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || isSubmitting} onRequestClose={() => state.setField('criterionOpen', false)} onRequestSubmit={handleSubmit(submit)}>
    <div aria-live="polite" aria-atomic="true">{errors.root && <div className="form-error global">{errors.root.message}</div>}</div><TextInput id="criterion-name" labelText="Criterion name" invalid={!!errors.name} invalidText={errors.name?.message} {...register('name')} /><TextArea id="criterion-description" labelText="Description" rows={4} invalid={!!errors.description} invalidText={errors.description?.message} {...register('description')} /><NumberInput id="pass-threshold" label="Pass threshold" min={0} max={100} invalid={!!errors.passThreshold} invalidText={errors.passThreshold?.message} {...register('passThreshold')} />
  </Modal>
}

function DecisionModal({ launcherButtonRef }) {
  useRestoreLauncherOnUnmount(launcherButtonRef)
  const state = useStudio()
  const experiment = state.experiments.find(item => item.id === state.decisionFor)
  const { register, handleSubmit, watch, setError, formState: { errors, isValid } } = useForm({ resolver: zodResolver(decisionSchema), mode: 'onChange', defaultValues: { choice: 'declare-winner', winnerVariant: '', rationale: '' } })
  const choice = watch('choice')
  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = payload => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    const normalized = { ...payload, winnerVariant: payload.choice === 'declare-winner' ? payload.winnerVariant || null : null }
    const result = state.decide(experiment.id, normalized)
    if (!result.ok) {
      setError('root', { message: result.error })
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }
  const close = () => {
    const launcher = launcherButtonRef.current
    state.setField('decisionFor', null)
    const restoreFocus = () => launcher?.isConnected && launcher.focus()
    window.setTimeout(restoreFocus, 0)
    window.setTimeout(restoreFocus, 80)
  }
  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      close()
    }
    document.addEventListener('keydown', closeOnEscape, true)
    return () => document.removeEventListener('keydown', closeOnEscape, true)
  }, [])
  return <Modal open preventCloseOnClickOutside launcherButtonRef={launcherButtonRef} selectorPrimaryFocus="#decision-choice" danger modalHeading="Record Experiment Decision" modalLabel="DecisionUpsert · permanent lock" primaryButtonText="Confirm Decision" secondaryButtonText="Cancel" primaryButtonDisabled={!isValid || isSubmitting} onRequestClose={close} onRequestSubmit={handleSubmit(submit)}>
    <div className="decision-warning"><Locked size={18} /><span>This action locks editing and outlier flags. Decisions are excluded from undo.</span></div><div aria-live="polite" aria-atomic="true">{errors.root && <div className="form-error global">{errors.root.message}</div>}</div><Select id="decision-choice" labelText="Decision choice" invalid={!!errors.choice} invalidText={errors.choice?.message} {...register('choice')}><SelectItem value="declare-winner" text="Declare winner" /><SelectItem value="inconclusive" text="Inconclusive" /><SelectItem value="stop-early" text="Stop early" /></Select>{choice === 'declare-winner' && <Select id="winner-variant" labelText="Winner variant" invalid={!!errors.winnerVariant} invalidText={errors.winnerVariant?.message} {...register('winnerVariant')}><SelectItem value="" text="Choose a variant" />{experiment.variants.map((variant, index) => <SelectItem key={LETTERS[index]} value={LETTERS[index]} text={`Variant ${LETTERS[index]} — ${variant.title}`} />)}</Select>}<TextArea id="decision-rationale" labelText="Decision rationale" rows={5} invalid={!!errors.rationale} invalidText={errors.rationale?.message} {...register('rationale')} />
  </Modal>
}

function ReportModal({ launcherButtonRef }) {
  useRestoreLauncherOnUnmount(launcherButtonRef)
  const state = useStudio()
  const [generatedAt, setGeneratedAt] = useState(Date.now())
  const [importError, setImportError] = useState('')
  const report = useMemo(() => state.compileReport(state.reportFor), [state.reportFor, state.experiments, generatedAt])
  const text = JSON.stringify(report, null, 2)
  const copy = async () => { await navigator.clipboard.writeText(text); state.setField('copied', true); state.notify('Report JSON copied', 'success', 'Report JSON copied to clipboard.'); setTimeout(() => state.setField('copied', false), 2200) }
  const download = () => { const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'experiment-report.json'; anchor.click(); URL.revokeObjectURL(url); state.notify('Experiment report downloaded') }
  const importFile = async event => { const file = event.target.files?.[0]; if (!file) return; const content = await file.text(); const result = state.importReport(content, state.reportFor); if (!result.ok) setImportError(result.error); else { setImportError(''); setGeneratedAt(Date.now()) } event.target.value = '' }
  return <Modal open preventCloseOnClickOutside launcherButtonRef={launcherButtonRef} modalHeading="Experiment Report" modalLabel="ab-experiment-report-v1 · portable result pack" passiveModal onRequestClose={() => state.setField('reportFor', null)} size="lg" className="report-modal">
    <div className="report-toolbar"><div><Tag type="green">Schema Valid</Tag><span>Generated {new Date(report.generatedAt).toLocaleTimeString()}</span></div><div className="report-actions"><Button size="sm" kind="ghost" renderIcon={Renew} onClick={() => setGeneratedAt(Date.now())}>Regenerate</Button><Button size="sm" kind="tertiary" renderIcon={Copy} className="report-action-btn" onClick={copy}>{state.copied ? 'Copied' : 'Copy JSON'}</Button><Button size="sm" renderIcon={Download} className="report-action-btn" onClick={download}>Download JSON</Button></div></div>
    <pre className="json-preview" aria-label="Experiment Report JSON preview">{text}</pre>
    <div className="import-zone"><div><h3>Import report</h3><p>Round-trip a schema-valid Experiment Report JSON onto this experiment.</p></div><label className="import-button"><Upload size={18} />Import JSON<input type="file" accept="application/json,.json" aria-label="Import Experiment Report JSON" onChange={importFile} /></label></div><div aria-live="polite" aria-atomic="true">{importError && <div className="form-error import-error"><WarningAlt size={16} />Import error — {importError}. No changes were applied.</div>}</div>
  </Modal>
}

function ConfirmDialog({ launcherButtonRef }) {
  useRestoreLauncherOnUnmount(launcherButtonRef)
  const state = useStudio()
  const confirm = state.confirm
  const isDelete = confirm.type === 'delete'
  const isArchive = confirm.type === 'archive'
  const isArchiveOne = confirm.type === 'archive-one'
  const action = () => {
    if (isDelete) state.deleteSelected()
    else if (isArchive) state.archiveSelected()
    else if (isArchiveOne) { state.setField('selectedIds', [confirm.experimentId]); state.archiveSelected() }
    else { state.promoteWinner(confirm.experimentId); return }
    state.setField('confirm', null)
  }
  const heading = isDelete ? `Delete ${confirm.count} selected experiment${confirm.count === 1 ? '' : 's'}?` : isArchive ? `Archive ${confirm.count} selected experiment${confirm.count === 1 ? '' : 's'}?` : isArchiveOne ? 'Archive this experiment?' : 'Promote Winning Prompt?'
  return <Modal open preventCloseOnClickOutside launcherButtonRef={launcherButtonRef} danger={isDelete} alert modalHeading={heading} primaryButtonText={isDelete ? 'Delete Experiments' : isArchive || isArchiveOne ? 'Archive Experiments' : 'Promote Winner'} secondaryButtonText="Cancel" onRequestClose={() => state.setField('confirm', null)} onRequestSubmit={action}><p>{isDelete ? 'Only the selected rows will be removed. You can undo this action from the header.' : isArchive || isArchiveOne ? 'The experiment will move to Archived and retain its prior status for restoration.' : 'The winning variant’s prompt becomes the new head version in the prompt library.'}</p></Modal>
}

export default App
