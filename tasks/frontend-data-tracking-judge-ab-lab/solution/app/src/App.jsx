import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon, Button, Divider, Group, MantineProvider, Menu, Modal, MultiSelect, NumberInput, Paper,
  Popover, Progress, ScrollArea, Select, Stack, Table, Textarea, TextInput, Tooltip,
} from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  IconAdjustments, IconArrowDown, IconArrowUp, IconArrowsSort, IconBolt, IconBook, IconBulb, IconCheck,
  IconChevronDown, IconChevronRight, IconCircleCheck, IconCircleX, IconClipboard, IconCode, IconCoin,
  IconCommand, IconCopy, IconDownload, IconFileExport, IconFilter, IconFlask, IconHistory, IconKeyboard,
  IconLayoutGrid, IconListSearch, IconMenu2, IconMicrophone, IconMoon, IconPlayerPlay, IconPlus,
  IconRefresh, IconRotateClockwise, IconSearch, IconSparkles, IconSun, IconTrash, IconUpload, IconX,
} from '@tabler/icons-react'
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ChartTooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import {
  attributionInputSchema, createRescoreSchema, createSavedPairSchema, formatZodError, labResultsSchema,
  DIMENSIONS, SCORER_MODELS,
} from './contracts.js'
import { TASKS } from './seed.js'
import {
  compileLabResults, deriveCompareSummary, flipsForTrial, labInsights, pairedTrials, trialDelta,
  useLabStore, visibleTrials,
} from './store.js'
import { registerWebMcp } from './webmcp.js'

const CHART_IMPROVED = '#0e8f76'
const CHART_REGRESSED = '#c04a63'
const SERIES_PALETTE = ['#0e8f76', '#c47b16', '#3f76b4', '#c04a63', '#7a63c2', '#5b8a3c']

const CAUSE_LABELS = {
  'scorer-noise': 'Scorer noise',
  'rubric-change-effect': 'Rubric change effect',
  'harness-change-effect': 'Harness change effect',
}
const CAUSE_SHORT = { 'scorer-noise': 'noise', 'rubric-change-effect': 'rubric', 'harness-change-effect': 'harness' }

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true }
  } catch { /* fall through to legacy copy path */ }
  try {
    const area = window.document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.opacity = '0'
    window.document.body.appendChild(area)
    area.focus()
    area.select()
    const ok = window.document.execCommand('copy')
    window.document.body.removeChild(area)
    return ok
  } catch { return false }
}

function ScoreBadge({ result }) {
  if (!result) return <span className="muted">—</span>
  return (
    <span className="score-cell">
      <span className="score-number">{result.totalReward.toFixed(2)}</span>
      <span className={result.pass ? 'badge-pass' : 'badge-fail'}>
        {result.pass ? <IconCheck size={11} aria-hidden="true" /> : <IconX size={11} aria-hidden="true" />}
        {result.pass ? 'Pass' : 'Fail'}
      </span>
    </span>
  )
}

function Delta({ value }) {
  const neutral = Math.abs(value) < 0.005
  const positive = value > 0
  return (
    <span className={`delta ${neutral ? 'neutral' : positive ? 'positive' : 'negative'}`}>
      <span aria-hidden="true">{neutral ? '→' : positive ? '▲' : '▼'}</span>
      <span>{neutral ? '0.00' : `${positive ? '+' : '−'}${Math.abs(value).toFixed(2)}`}</span>
      <span className="visually-hidden">{neutral ? 'no change' : positive ? 'improvement' : 'regression'}</span>
    </span>
  )
}

function EmptyState({ icon: Icon = IconListSearch, title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true"><Icon size={22} /></span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

function SectionTitle({ eyebrow, title, description, actions }) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  )
}

function Reveal({ children, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduce) { el?.classList.add('in'); return undefined }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { el.classList.add('in'); observer.disconnect() } })
    }, { threshold: 0.06 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduce])
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>
}

function BackgroundLayers() {
  const ref = useRef(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        const el = ref.current
        if (el) {
          el.style.setProperty('--par-near', `${y * -0.07}px`)
          el.style.setProperty('--par-far', `${y * -0.03}px`)
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])
  return (
    <div aria-hidden="true" className="bg-layers" ref={ref}>
      <i className="bg-glow one" />
      <i className="bg-glow two" />
      <i className="bg-grid" />
    </div>
  )
}

function InsightsStrip() {
  const state = useLabStore()
  const insights = useMemo(() => labInsights(state), [state])
  return (
    <section className="insights" aria-label="Live lab notes">
      <span className="insights-title"><IconBulb size={15} aria-hidden="true" />Lab notes</span>
      <div className="insights-list">
        <AnimatePresence initial={false} mode="popLayout">
          {insights.map((note) => (
            <motion.p key={note} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.24 }}>
              {note}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}

function Header() {
  const { activeView, setView, theme, toggleTheme, undo, redo, undoStack, redoStack, openRescore, setExportOpen, setPaletteOpen } = useLabStore()
  const nav = [
    { id: 'experiments', label: 'Experiments', icon: IconLayoutGrid },
    { id: 'compare', label: 'Compare', icon: IconAdjustments },
    { id: 'cost', label: 'Cost', icon: IconCoin },
  ]
  return (
    <header className="app-header">
      <button className="brand" onClick={() => setView('experiments')}>
        <span className="brand-mark" aria-hidden="true"><IconFlask size={19} /></span>
        <span className="brand-name"><strong>Rescore</strong><span>A/B lab</span></span>
      </button>
      <nav className="desktop-nav" aria-label="Primary">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeView === id ? 'nav-item active' : 'nav-item'} aria-current={activeView === id ? 'page' : undefined} onClick={() => setView(id)}>
            <Icon size={15} aria-hidden="true" />{label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <Tooltip label="Undo attribution save"><ActionIcon variant="subtle" className="icon-btn" aria-label="Undo attribution save" disabled={!undoStack.length} onClick={undo}><IconHistory size={18} aria-hidden="true" /></ActionIcon></Tooltip>
        <Tooltip label="Redo attribution save"><ActionIcon variant="subtle" className="icon-btn" aria-label="Redo attribution save" disabled={!redoStack.length} onClick={redo}><IconRotateClockwise size={18} aria-hidden="true" /></ActionIcon></Tooltip>
        <Tooltip label="Command palette (Command-K or Control-K)"><ActionIcon variant="subtle" className="icon-btn" aria-label="Open command palette (Command-K or Control-K)" onClick={() => setPaletteOpen(true)}><IconCommand size={18} aria-hidden="true" /></ActionIcon></Tooltip>
        <Button className="header-export" variant="default" leftSection={<IconFileExport size={15} aria-hidden="true" />} onClick={() => setExportOpen(true)}>Export lab results</Button>
        <Button className="header-rescore" leftSection={<IconSparkles size={15} aria-hidden="true" />} onClick={openRescore}>Rescore with new label</Button>
        <Tooltip label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><ActionIcon variant="default" className="icon-btn" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={toggleTheme}>{theme === 'light' ? <IconMoon size={18} aria-hidden="true" /> : <IconSun size={18} aria-hidden="true" />}</ActionIcon></Tooltip>
        <Menu shadow="md" width={240} position="bottom-end">
          <Menu.Target><ActionIcon className="icon-btn mobile-menu" variant="default" aria-label="Open navigation menu"><IconMenu2 size={18} aria-hidden="true" /></ActionIcon></Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Views</Menu.Label>
            {nav.map(({ id, label, icon: Icon }) => <Menu.Item key={id} leftSection={<Icon size={15} aria-hidden="true" />} onClick={() => setView(id)}>{label}</Menu.Item>)}
            <Menu.Divider />
            <Menu.Label>Actions</Menu.Label>
            <Menu.Item leftSection={<IconSparkles size={15} aria-hidden="true" />} onClick={openRescore}>Rescore with new label</Menu.Item>
            <Menu.Item leftSection={<IconFileExport size={15} aria-hidden="true" />} onClick={() => setExportOpen(true)}>Export lab results</Menu.Item>
            <Menu.Item leftSection={theme === 'light' ? <IconMoon size={15} aria-hidden="true" /> : <IconSun size={15} aria-hidden="true" />} onClick={toggleTheme}>Switch to {theme === 'light' ? 'dark' : 'light'} theme</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </header>
  )
}

function SuggestionChips() {
  const { activeChip, toggleChip } = useLabStore()
  const chips = [
    { id: 'baseline-fails', label: 'Failing on Baseline' },
    { id: 'big-deltas', label: 'Big deltas' },
    ...TASKS.map((task) => ({ id: `task:${task}`, label: task })),
  ]
  return (
    <div className="suggestions" role="group" aria-label="Filter suggestions">
      <span className="suggestions-title"><IconBolt size={13} aria-hidden="true" />Suggestions</span>
      {chips.map((chip) => (
        <button key={chip.id} aria-pressed={activeChip === chip.id} className={activeChip === chip.id ? 'chip active' : 'chip'} onClick={() => toggleChip(chip.id)}>
          {chip.label}
        </button>
      ))}
    </div>
  )
}

function FilterBar() {
  const { labels, filters, setFilter, sort, setSort, clearFilters } = useLabStore()
  return (
    <Paper className="filter-bar" withBorder>
      <div className="filter-heading"><IconFilter size={15} aria-hidden="true" /><strong>Refine the collection</strong></div>
      <Select label="Task" aria-label="Filter by task" value={filters.task} onChange={(value) => setFilter('task', value ?? 'all')} data={[{ value: 'all', label: 'All tasks' }, ...TASKS.map((task) => ({ value: task, label: task }))]} />
      <Select label="Pass state" aria-label="Filter by pass state" value={filters.passState} onChange={(value) => setFilter('passState', value ?? 'all')} data={[{ value: 'all', label: 'All outcomes' }, { value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }]} />
      <Select label="Outcome label" aria-label="Label used for the pass filter and reward sort" value={filters.passLabel} onChange={(value) => setFilter('passLabel', value ?? 'Baseline')} data={labels.map((label) => label.name)} />
      <NumberInput label="Abs. delta above" aria-label="Minimum absolute delta between the delta pair" value={filters.deltaMin} onChange={(value) => setFilter('deltaMin', Number(value) || 0)} min={0} max={1} step={0.01} decimalScale={2} prefix="≥ " hideControls />
      <div className="sort-control">
        <Select label="Sort rows" aria-label="Sort rows" value={sort.type} onChange={(value) => value && setSort(value)} data={[{ value: 'task-name', label: 'Task name' }, { value: 'label-reward', label: `${sort.label} reward` }, { value: 'delta-size', label: 'Delta size' }]} />
        <Tooltip label="Reverse sort direction"><ActionIcon variant="default" className="icon-btn sort-flip" aria-label={`Sort ${sort.direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setSort(sort.type, sort.label)}>{sort.direction === 'asc' ? <IconArrowUp size={14} aria-hidden="true" /> : <IconArrowDown size={14} aria-hidden="true" />}</ActionIcon></Tooltip>
      </div>
      <Button variant="subtle" className="clear-filters" leftSection={<IconRefresh size={14} aria-hidden="true" />} onClick={clearFilters}>Clear all filters</Button>
    </Paper>
  )
}

function ExperimentsView() {
  const state = useLabStore()
  const rows = visibleTrials(state)
  const shown = state.labels.filter((label) => state.shownLabels.includes(label.name))
  const newestLabel = state.labels.length > 4 ? state.labels.at(-1).name : null
  return (
    <main className="page-shell">
      <SectionTitle
        eyebrow="Completed benchmark runs"
        title="Experiments"
        description="Rescore the same 12 traces under alternative scorer configs, switch the label columns, and isolate where scoring changes the decision."
        actions={<div className="collection-stat"><strong>{rows.length}</strong><span>of 12 trials</span></div>}
      />
      <InsightsStrip />
      <SuggestionChips />
      <Reveal><FilterBar /></Reveal>
      <Reveal>
        <Paper className="table-card" withBorder>
          <div className="table-toolbar">
            <div><h2>Trial collection</h2><p>Every score uses the fixed pass threshold of 0.70 total reward.</p></div>
            <MultiSelect label="Visible label columns" aria-label="Choose visible label columns" value={state.shownLabels} onChange={state.setShownLabels} data={state.labels.map((label) => label.name)} searchable clearable={false} />
          </div>
          <div className="table-scroll">
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className="trial-col"><button className="sort-header" onClick={() => state.setSort('task-name')}>Trial and task <IconArrowsSort size={13} aria-hidden="true" /></button></Table.Th>
                  {shown.map((label) => (
                    <Table.Th key={label.name} className={label.name === newestLabel ? 'col-enter' : ''}>
                      <LabelHeader label={label} trials={rows} />
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <AnimatePresence initial={false}>
                  {rows.map((trial) => (
                    <motion.tr
                      key={trial.id}
                      className="lab-row"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22 }}
                    >
                      <Table.Td><div className="trial-cell"><strong>{trial.id}</strong><span>{trial.taskName}</span></div></Table.Td>
                      {shown.map((label) => (
                        <Table.Td key={label.name} className={label.name === newestLabel ? 'col-enter' : ''}><ScoreBadge result={trial.results[label.name]} /></Table.Td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </Table.Tbody>
            </Table>
          </div>
          {!rows.length && <EmptyState title="No trials match these filters">Clear a filter or lower the delta threshold to bring completed trials back into the collection.</EmptyState>}
          <div className="table-footer"><span>{rows.length} visible rows</span><span>Delta pair: {state.deltaPair.join(' → ')}</span></div>
        </Paper>
      </Reveal>
    </main>
  )
}

function LabelHeader({ label, trials }) {
  const results = trials.map((trial) => trial.results[label.name]).filter(Boolean)
  const mean = results.reduce((sum, result) => sum + result.totalReward, 0) / Math.max(results.length, 1)
  const cost = results.reduce((sum, result) => sum + result.scorerCost, 0)
  return (
    <div className="label-header">
      <strong>{label.name}</strong>
      <span>{label.scorerModel}</span>
      <small>{label.configNote}</small>
      <div className="label-header-nums"><b>{mean.toFixed(2)}</b> mean <i aria-hidden="true">·</i> <b>${cost.toFixed(3)}</b></div>
    </div>
  )
}

function SummaryMetric({ label, value, tone }) {
  return <div className={`summary-metric ${tone || ''}`}><span>{label}</span><strong>{value}</strong></div>
}

function CostDisclosure({ side, label, total, rows }) {
  const highlightTrial = useLabStore((s) => s.highlightTrial)
  const [opened, setOpened] = useState(false)
  return (
    <Popover width={320} position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
      <Popover.Target>
        <button className="summary-metric interactive" onClick={() => setOpened((value) => !value)} aria-expanded={opened}>
          <span>{side} scoring cost <IconChevronDown size={12} aria-hidden="true" className={opened ? 'rotated' : ''} /></span>
          <strong>${total.toFixed(3)}</strong>
        </button>
      </Popover.Target>
      <Popover.Dropdown>
        <div className="disclosure-head"><strong>{label} cost sources</strong><span>{rows.length} trials</span></div>
        <ScrollArea.Autosize mah={260}>
          <div className="source-list">
            {rows.map((trial) => (
              <button
                key={trial.id}
                onClick={() => {
                  highlightTrial(trial.id)
                  setOpened(false)
                  window.document.getElementById(`pair-${trial.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <span>{trial.id}<small>{trial.taskName}</small></span>
                <b>${trial.results[label].scorerCost.toFixed(3)}</b>
              </button>
            ))}
          </div>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  )
}

function WheelRing({ rate, radius, color, mounted }) {
  const length = 2 * Math.PI * radius
  return (
    <g>
      <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--wheel-track)" strokeWidth="9" />
      <circle
        cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={mounted ? length * (1 - rate) : length}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
    </g>
  )
}

function PassWheel({ summary, visibleCount }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const rings = [
    { label: summary.labelA, rate: summary.passRateA, radius: 46, color: CHART_IMPROVED },
    { label: summary.labelB, rate: summary.passRateB, radius: 32, color: '#c47b16' },
  ]
  return (
    <Paper className="pass-wheel" withBorder>
      <div className="pass-wheel-head"><span className="eyebrow">Pass rate</span><strong>Threshold wheel at 0.70</strong></div>
      <div className="wheel-content">
        <svg viewBox="0 0 120 120" role="img" aria-label={`${summary.labelA} pass rate ${Math.round(summary.passRateA * 100)} percent; ${summary.labelB} pass rate ${Math.round(summary.passRateB * 100)} percent`}>
          {rings.map((ring) => <WheelRing key={ring.label} rate={ring.rate} radius={ring.radius} color={ring.color} mounted={mounted} />)}
          <text x="60" y="57" textAnchor="middle" className="wheel-number">{Math.round((summary.passRateA + summary.passRateB) * 50)}%</text>
          <text x="60" y="71" textAnchor="middle" className="wheel-label">combined</text>
        </svg>
        <div className="wheel-legend">
          {rings.map((ring) => (
            <div key={ring.label}>
              <i aria-hidden="true" style={{ background: ring.color }} />
              <span>{ring.label}</span>
              <b>{Math.round(ring.rate * 100)}% · {Math.round(ring.rate * visibleCount)}/{visibleCount} pass</b>
            </div>
          ))}
        </div>
      </div>
    </Paper>
  )
}

function CompareTip({ active, payload, labelA, labelB }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{point.id}</strong>
      <span>{point.task}</span>
      <div>{labelA} <b>{point.a.toFixed(2)}</b></div>
      <div>{labelB} <b>{point.b.toFixed(2)}</b></div>
      <div className="tip-delta">Δ {point.b - point.a >= 0 ? '+' : '−'}{Math.abs(point.b - point.a).toFixed(2)}</div>
    </div>
  )
}

function CompareChart({ rows, labelA, labelB }) {
  const highlightTrial = useLabStore((s) => s.highlightTrial)
  const data = rows.map((trial) => ({
    id: trial.id,
    task: trial.taskName,
    a: trial.results[labelA].totalReward,
    b: trial.results[labelB].totalReward,
  }))
  const improved = data.filter((point) => point.b >= point.a)
  const regressed = data.filter((point) => point.b < point.a)
  const markClick = (point) => {
    const id = point?.payload?.id ?? point?.id
    if (id) {
      highlightTrial(id)
      window.document.getElementById(`pair-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  return (
    <Paper className="chart-card compare-chart" withBorder>
      <div className="card-heading">
        <div><span className="eyebrow">Paired rewards</span><h2>Reward agreement map</h2></div>
        <span>{data.length} paired trials</span>
      </div>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 14, right: 18, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" dataKey="a" name={labelA} domain={[0, 1]} tickCount={6} tickFormatter={(value) => value.toFixed(1)} aria-label={`${labelA} reward`} />
            <YAxis type="number" dataKey="b" name={labelB} domain={[0, 1]} tickCount={6} tickFormatter={(value) => value.toFixed(1)} aria-label={`${labelB} reward`} />
            <ZAxis range={[90, 90]} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--chart-ref)" strokeDasharray="6 6" />
            <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<CompareTip labelA={labelA} labelB={labelB} />} />
            <Scatter name="B at or above A" data={improved} fill={CHART_IMPROVED} isAnimationActive={false} activeDot={{ r: 9, strokeWidth: 2, stroke: 'var(--surface)' }} onClick={markClick} />
            <Scatter name="B below A" data={regressed} fill={CHART_REGRESSED} isAnimationActive={false} activeDot={{ r: 9, strokeWidth: 2, stroke: 'var(--surface)' }} onClick={markClick} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span><i aria-hidden="true" style={{ background: CHART_IMPROVED }} />▲ {labelB} at or above {labelA}</span>
        <span><i aria-hidden="true" style={{ background: CHART_REGRESSED }} />▼ {labelB} below {labelA}</span>
        <span className="axis-note">{labelA} reward on the horizontal axis · {labelB} reward on the vertical axis</span>
      </div>
    </Paper>
  )
}

function AttributionRollup({ labelA, labelB }) {
  const attributions = useLabStore((s) => s.attributions)
  const items = attributions.filter((item) => item.labelA === labelA && item.labelB === labelB)
  const counts = Object.keys(CAUSE_LABELS).map((cause) => ({ cause, count: items.filter((item) => item.cause === cause).length }))
  return (
    <Paper className="rollup" withBorder>
      <div>
        <span className="eyebrow">Attribution rollup</span>
        <h2>{items.length ? `${items.length} tagged flip${items.length === 1 ? '' : 's'}` : 'No flips tagged yet'}</h2>
        <p>{items.length ? 'Counts update the moment an operator judgment is saved, undone, or redone.' : 'Open a trial from the paired table, expand a differing criterion, and tag its likely cause.'}</p>
      </div>
      <div className="rollup-counts" aria-label="Tagged flips by cause">
        {counts.map((item) => <div key={item.cause}><strong>{item.count}</strong><span>{CAUSE_SHORT[item.cause]}</span></div>)}
      </div>
    </Paper>
  )
}

function SavedPairControls() {
  const { savedPairs, applyPair, deletePair, setSavePairOpen, compareA, compareB } = useLabStore()
  const [confirming, setConfirming] = useState(null)
  return (
    <Group gap="xs">
      <Button variant="default" size="sm" leftSection={<IconPlus size={14} aria-hidden="true" />} disabled={!compareA || !compareB} onClick={() => setSavePairOpen(true)}>Save pair</Button>
      <Menu width={310} position="bottom-end">
        <Menu.Target><Button variant="subtle" size="sm" rightSection={<IconChevronDown size={14} aria-hidden="true" />}>Saved pairs {savedPairs.length ? `(${savedPairs.length})` : ''}</Button></Menu.Target>
        <Menu.Dropdown>
          {savedPairs.length ? savedPairs.map((pair) => (
            <div className="saved-pair-row" key={pair.name}>
              <button className="saved-pair-apply" onClick={() => applyPair(pair.name)}>
                <strong>{pair.name}</strong>
                <span>{pair.labelA} → {pair.labelB}</span>
              </button>
              {confirming === pair.name ? (
                <span className="pair-confirm">
                  <button className="pair-confirm-yes" onClick={() => { deletePair(pair.name); setConfirming(null) }}>Delete</button>
                  <button className="pair-confirm-no" onClick={() => setConfirming(null)}>Keep</button>
                </span>
              ) : (
                <button className="saved-pair-delete" aria-label={`Delete saved pair ${pair.name}`} onClick={() => setConfirming(pair.name)}><IconTrash size={14} aria-hidden="true" /></button>
              )}
            </div>
          )) : <Menu.Label>No saved pairs yet. Save the current A/B selection for one-tap recall.</Menu.Label>}
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}

function CompareView() {
  const state = useLabStore()
  const rows = pairedTrials(state)
  const summary = deriveCompareSummary(state)
  const labelOptions = state.labels.map((label) => label.name)
  const pairReady = Boolean(state.compareA && state.compareB && state.compareA !== state.compareB)
  return (
    <main className="page-shell">
      <SectionTitle
        eyebrow="Paired label analysis"
        title="Compare"
        description="Inspect decision shifts, scoring cost, and criterion-level disagreement on the same completed traces."
        actions={<SavedPairControls />}
      />
      <InsightsStrip />
      <Reveal>
        <Paper className="pair-picker" withBorder>
          <div className="picker-cell">
            <span className="pair-letter a" aria-hidden="true">A</span>
            <Select label="Reference label (A)" aria-label="Select label A" placeholder="Pick the reference label" value={state.compareA || null} onChange={(value) => state.setCompare('A', value)} data={labelOptions} searchable clearable />
          </div>
          <IconChevronRight className="pair-arrow" size={22} aria-hidden="true" />
          <div className="picker-cell">
            <span className="pair-letter b" aria-hidden="true">B</span>
            <Select label="Candidate label (B)" aria-label="Select label B" placeholder="Pick the candidate label" value={state.compareB || null} onChange={(value) => state.setCompare('B', value)} data={labelOptions} searchable clearable />
          </div>
          <div className="pair-context"><span>{rows.length} paired traces</span><small>Positive delta means B improved over A</small></div>
          {state.pairRejection && <p className="field-error pair-error" role="alert">{state.pairRejection}</p>}
        </Paper>
      </Reveal>
      <Reveal><FilterBar /></Reveal>
      {!pairReady ? (
        <Reveal>
          <Paper withBorder>
            <EmptyState icon={IconAdjustments} title="Pick two distinct labels to compare">
              Choose a reference label for A and a different candidate label for B. The paired table, summary strip, reward agreement map, pass-rate wheel, and attribution rollup all derive live from that pair.
            </EmptyState>
          </Paper>
        </Reveal>
      ) : (
        <>
          <Reveal>
            <div className="summary-layout">
              <Paper className="summary-strip" withBorder>
                <SummaryMetric label="Mean Δ (B − A)" value={`${summary.meanDelta >= 0 ? '+' : '−'}${Math.abs(summary.meanDelta).toFixed(3)}`} tone={summary.meanDelta >= 0 ? 'good' : 'bad'} />
                <SummaryMetric label="Wins / losses / ties" value={`${summary.wins} / ${summary.losses} / ${summary.ties}`} />
                <CostDisclosure side="A" label={state.compareA} total={summary.costA} rows={rows} />
                <CostDisclosure side="B" label={state.compareB} total={summary.costB} rows={rows} />
                <SummaryMetric label="Cost Δ (B − A)" value={`${summary.costB - summary.costA >= 0 ? '+' : '−'}$${Math.abs(summary.costB - summary.costA).toFixed(3)}`} />
              </Paper>
              <PassWheel summary={summary} visibleCount={rows.length} />
            </div>
          </Reveal>
          <Reveal>
            <div className="compare-grid">
              <CompareChart rows={rows} labelA={state.compareA} labelB={state.compareB} />
              <AttributionRollup labelA={state.compareA} labelB={state.compareB} />
            </div>
          </Reveal>
          <Reveal>
            <Paper className="table-card paired-card" withBorder>
              <div className="table-toolbar">
                <div><h2>Paired trial results</h2><p>Activate a row to inspect all 16 criterion verdicts and attribute flips.</p></div>
                <span className="count-badge">{rows.length} common trials</span>
              </div>
              <div className="table-scroll">
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Trial and task</Table.Th>
                      <Table.Th>{state.compareA} · A</Table.Th>
                      <Table.Th>{state.compareB} · B</Table.Th>
                      <Table.Th><button className="sort-header" onClick={() => state.setSort('delta-size')}>Δ B − A <IconArrowsSort size={13} aria-hidden="true" /></button></Table.Th>
                      <Table.Th aria-label="Open criterion diff" />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <AnimatePresence initial={false}>
                      {rows.map((trial) => {
                        const delta = trialDelta(trial, state.compareA, state.compareB)
                        return (
                          <motion.tr
                            id={`pair-${trial.id}`}
                            key={trial.id}
                            className={`lab-row clickable ${state.highlightedTrialId === trial.id ? 'highlight-row' : ''}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.22 }}
                            onClick={() => state.openTrial(trial.id)}
                          >
                            <Table.Td><div className="trial-cell"><strong>{trial.id}</strong><span>{trial.taskName}</span></div></Table.Td>
                            <Table.Td><ScoreBadge result={trial.results[state.compareA]} /></Table.Td>
                            <Table.Td><ScoreBadge result={trial.results[state.compareB]} /></Table.Td>
                            <Table.Td><Delta value={delta} /></Table.Td>
                            <Table.Td><Button variant="subtle" size="compact-sm" rightSection={<IconChevronRight size={14} aria-hidden="true" />} onClick={(event) => { event.stopPropagation(); state.openTrial(trial.id) }}>Open diff</Button></Table.Td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </Table.Tbody>
                </Table>
              </div>
              {!rows.length && <EmptyState title="No paired trials match">Clear a filter to restore the trials shared by both selected labels.</EmptyState>}
            </Paper>
          </Reveal>
        </>
      )}
    </main>
  )
}

function FlipRow({ criterionA, criterionB, labelA, labelB, trialId }) {
  const [expanded, setExpanded] = useState(false)
  const attribution = useLabStore((s) => s.attributions.find((item) => item.trialId === trialId && item.criterionId === criterionA.id && item.labelA === labelA && item.labelB === labelB))
  const setAttributionDraft = useLabStore((s) => s.setAttributionDraft)
  return (
    <div className="flip-row">
      <div className="flip-main">
        <button className="flip-expander" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} reasoning for ${criterionA.title || criterionA.id}`} onClick={() => setExpanded((value) => !value)}>
          <IconChevronRight size={16} className={expanded ? 'chev rotated' : 'chev'} aria-hidden="true" />
          <span className="flip-title"><strong>{criterionA.title || criterionA.id}</strong><small>{criterionA.id}</small></span>
        </button>
        <span className="verdict-pair">
          <span className={criterionA.verdict === 'pass' ? 'badge-pass' : 'badge-fail'}>A · {criterionA.verdict}</span>
          <IconChevronRight size={13} aria-hidden="true" />
          <span className={criterionB.verdict === 'pass' ? 'badge-pass' : 'badge-fail'}>B · {criterionB.verdict}</span>
        </span>
        {attribution && <span className="badge-cause" title={attribution.note || undefined}>{CAUSE_LABELS[attribution.cause]}</span>}
        <Button variant="subtle" size="compact-sm" onClick={() => setAttributionDraft({ trialId, criterionId: criterionA.id, labelA, labelB })}>
          {attribution ? 'Edit attribution' : 'Attribute'}
        </Button>
      </div>
      <div className={expanded ? 'reasoning open' : 'reasoning'} aria-hidden={!expanded}>
        <div className="reasoning-inner">
          <div><span>{labelA}</span><p>{criterionA.reasoning}</p></div>
          <div><span>{labelB}</span><p>{criterionB.reasoning}</p></div>
        </div>
      </div>
    </div>
  )
}

function TrialDiffModal() {
  const state = useLabStore()
  const { openedTrialId, closeTrial, trials, compareA, compareB, undo, redo, undoStack, redoStack, paletteOpen, attributionDraft } = state
  const trial = trials.find((item) => item.id === openedTrialId)
  const resultA = trial?.results[compareA]
  const resultB = trial?.results[compareB]
  const open = Boolean(trial && compareA && compareB && resultA && resultB)
  if (!open) return null
  const pairedB = (criterion) => resultB.criteria.find((item) => item.id === criterion.id)
  const groups = [
    { id: 'only-a', title: `Failing only under ${compareA}`, tone: 'a', criteria: resultA.criteria.filter((item) => item.verdict === 'fail' && pairedB(item)?.verdict === 'pass') },
    { id: 'only-b', title: `Failing only under ${compareB}`, tone: 'b', criteria: resultA.criteria.filter((item) => item.verdict === 'pass' && pairedB(item)?.verdict === 'fail') },
    { id: 'agreements', title: 'Agreements', tone: 'agree', criteria: resultA.criteria.filter((item) => item.verdict === pairedB(item)?.verdict) },
  ]
  const flips = groups[0].criteria.length + groups[1].criteria.length
  const firstFlipTrial = trials.find((item) => item.id !== trial.id && flipsForTrial(state, item, compareA, compareB).length > 0)
  return (
    <Modal
      opened
      onClose={closeTrial}
      closeOnEscape={!paletteOpen && !attributionDraft}
      closeOnClickOutside={!attributionDraft}
      size="xl"
      transitionProps={{ transition: 'pop', duration: 220 }}
      title={<div className="modal-title"><span className="eyebrow">Criterion verdict diff</span><strong>{trial.id} · {trial.taskName}</strong></div>}
    >
      <Group justify="flex-end" gap="xs" mb="sm">
        <Tooltip label="Undo attribution save"><ActionIcon variant="default" className="icon-btn" aria-label="Undo attribution save" disabled={!undoStack.length} onClick={undo}><IconHistory size={15} aria-hidden="true" /></ActionIcon></Tooltip>
        <Tooltip label="Redo attribution save"><ActionIcon variant="default" className="icon-btn" aria-label="Redo attribution save" disabled={!redoStack.length} onClick={redo}><IconRotateClockwise size={15} aria-hidden="true" /></ActionIcon></Tooltip>
      </Group>
      <div className="diff-summary">
        <div><span className="pair-letter a" aria-hidden="true">A</span><span className="diff-label"><strong>{compareA}</strong><small>{resultA.scorerModel} · ${resultA.scorerCost.toFixed(3)} · {resultA.toolCalls} tool calls · {resultA.duration.toFixed(1)}s</small></span><b>{resultA.totalReward.toFixed(2)}</b></div>
        <IconChevronRight size={18} aria-hidden="true" />
        <div><span className="pair-letter b" aria-hidden="true">B</span><span className="diff-label"><strong>{compareB}</strong><small>{resultB.scorerModel} · ${resultB.scorerCost.toFixed(3)} · {resultB.toolCalls} tool calls · {resultB.duration.toFixed(1)}s</small></span><b>{resultB.totalReward.toFixed(2)}</b></div>
        <span className={flips ? 'count-badge warn' : 'count-badge good'}>{flips} verdict flip{flips === 1 ? '' : 's'}</span>
      </div>
      <div className="dimension-scores" aria-label="Dimension score comparison">
        {DIMENSIONS.map((dimension) => (
          <div key={dimension}><span>{dimension}</span><strong><i>A</i> {resultA.dimensions[dimension].toFixed(2)}</strong><strong><i>B</i> {resultB.dimensions[dimension].toFixed(2)}</strong></div>
        ))}
      </div>
      {flips === 0 ? (
        <EmptyState icon={IconCircleCheck} title="These two labels fully agree on this trial">
          All 16 criteria carry matching pass/fail verdicts across correctness, visual, motion, and technical. Rewards can still differ because the labels weight evidence differently. For live flips, open {firstFlipTrial ? firstFlipTrial.id : 'another trial'} from the paired table.
        </EmptyState>
      ) : (
        <div className="diff-groups">
          {groups.map((group) => (
            <section key={group.id} className={`diff-group ${group.tone}`}>
              <div className="diff-group-title"><h3>{group.title}</h3><span className="count-badge">{group.criteria.length}</span></div>
              {group.criteria.length ? DIMENSIONS.map((dimension) => {
                const dimensionCriteria = group.criteria.filter((criterion) => criterion.dimension === dimension)
                if (!dimensionCriteria.length) return null
                return (
                  <div className="dimension-block" key={dimension}>
                    <h4>{dimension}</h4>
                    {dimensionCriteria.map((criterionA) => {
                      const criterionB = pairedB(criterionA)
                      return criterionA.verdict !== criterionB.verdict ? (
                        <FlipRow key={criterionA.id} criterionA={criterionA} criterionB={criterionB} labelA={compareA} labelB={compareB} trialId={trial.id} />
                      ) : (
                        <div key={criterionA.id} className="agreement-row">
                          <span>{criterionA.title || criterionA.id}</span>
                          <span className={criterionA.verdict === 'pass' ? 'badge-pass' : 'badge-fail'}>Both {criterionA.verdict}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              }) : <p className="group-empty">No criteria in this group for the selected pair.</p>}
            </section>
          ))}
        </div>
      )}
    </Modal>
  )
}

function AttributionDrawer() {
  const draft = useLabStore((s) => s.attributionDraft)
  const existing = useLabStore((s) => (draft ? s.attributions.find((item) => item.trialId === draft.trialId && item.criterionId === draft.criterionId && item.labelA === draft.labelA && item.labelB === draft.labelB) : null))
  const closer = useRef(null)
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(attributionInputSchema),
    values: { cause: existing?.cause || '', note: existing?.note || '' },
  })
  useEffect(() => {
    if (!draft) return undefined
    closer.current = window.document.activeElement
    const onKey = (event) => { if (event.key === 'Escape') { event.stopPropagation(); useLabStore.getState().setAttributionDraft(null); closer.current?.focus?.() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [draft])
  if (!draft) return null
  const close = () => { useLabStore.getState().setAttributionDraft(null); closer.current?.focus?.() }
  const submit = (values) => {
    const outcome = useLabStore.getState().saveAttribution({ trialId: draft.trialId, criterionId: draft.criterionId, labelA: draft.labelA, labelB: draft.labelB, cause: values.cause, note: values.note ?? '' })
    if (outcome.saved) { reset(); close() }
  }
  return (
    <aside className="attr-drawer" role="dialog" aria-label="Attribute verdict flip">
      <div className="drawer-head">
        <div><span className="eyebrow">Operator judgment</span><h2>Attribute verdict flip</h2></div>
        <ActionIcon variant="subtle" className="icon-btn" aria-label="Close attribution form" onClick={close}><IconX size={16} aria-hidden="true" /></ActionIcon>
      </div>
      <div className="form-context">
        <span>{draft.trialId}</span>
        <strong>{draft.criterionId}</strong>
        <small>{draft.labelA} → {draft.labelB}</small>
      </div>
      <form onSubmit={handleSubmit(submit)} noValidate className="drawer-form">
        <Controller
          name="cause"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Cause"
              placeholder="Choose a closed-enum cause"
              description="The submitted record is the would-be attribution API request body."
              data={Object.entries(CAUSE_LABELS).map(([value, label]) => ({ value, label }))}
              error={errors.cause?.message}
              required
            />
          )}
        />
        <Textarea
          label="Note"
          description="Optional operator context, up to 200 characters."
          minRows={3}
          {...register('note')}
          error={errors.note?.message}
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={close}>Cancel</Button>
          <Button type="submit">Save attribution</Button>
        </Group>
      </form>
      <p className="drawer-note">The drawer stays out of the way — switch views or open the command palette while it is open, then finish the attribution when you return.</p>
    </aside>
  )
}

function SavePairModal() {
  const { savePairOpen, setSavePairOpen, compareA, compareB, savedPairs, labels, savePair } = useLabStore()
  const schema = useMemo(() => createSavedPairSchema(savedPairs, labels.map((label) => label.name)), [savedPairs, labels])
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    values: { name: '', labelA: compareA || '', labelB: compareB || '' },
  })
  const submit = (record) => { savePair(record); reset(); setSavePairOpen(false) }
  return (
    <Modal opened={savePairOpen} onClose={() => setSavePairOpen(false)} title={<div className="modal-title"><span className="eyebrow">Saved comparison pair</span><strong>Save the current pair</strong></div>} transitionProps={{ transition: 'pop', duration: 220 }}>
      <form onSubmit={handleSubmit(submit)} className="modal-form" noValidate>
        <TextInput label="Pair name" placeholder="For example: weekly rubric check" description="Required, unique (case-insensitive), at most 40 characters." {...register('name')} error={errors.name?.message} required />
        <div className="pair-selects">
          <Controller name="labelA" control={control} render={({ field }) => <Select {...field} label="Label A" data={labels.map((label) => label.name)} error={errors.labelA?.message} required />} />
          <Controller name="labelB" control={control} render={({ field }) => <Select {...field} label="Label B" data={labels.map((label) => label.name)} error={errors.labelB?.message} required />} />
        </div>
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={() => setSavePairOpen(false)}>Cancel</Button>
          <Button type="submit">Save pair</Button>
        </Group>
      </form>
    </Modal>
  )
}

function RunPanel() {
  const { run, selectRunStep } = useLabStore()
  const [eventFilter, setEventFilter] = useState('all')
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!run.active) return undefined
    const timer = setInterval(() => setTick((value) => value + 1), 200)
    return () => clearInterval(timer)
  }, [run.active])
  if (!run.label) return null
  const complete = run.steps.filter((step) => step.status === 'complete').length
  const elapsed = run.active ? Date.now() - run.startedAt : run.elapsed
  const events = run.events.filter((event) => eventFilter === 'all' || event.status === eventFilter)
  return (
    <div className="run-panel">
      <div className="run-top">
        <div>
          <span className="eyebrow">Live rescore</span>
          <h2>{run.label.labelName}</h2>
          <p>{run.label.scorerModel} · {run.label.configNote || 'no config note'}</p>
        </div>
        <div className="run-count"><strong>{complete}<i> / 12</i></strong><span>steps complete</span></div>
      </div>
      <Progress value={(complete / 12) * 100} size="lg" radius="xl" aria-label={`${complete} of 12 steps complete`} className="run-progress" />
      <div className="run-rollups">
        <SummaryMetric label="Steps complete" value={`${complete}/12`} />
        <SummaryMetric label="Failures encountered" value={run.failures} tone={run.failures ? 'bad' : ''} />
        <SummaryMetric label="Elapsed" value={`${(elapsed / 1000).toFixed(1)}s`} />
      </div>
      <div className="run-columns">
        <div className="steps-list" role="list" aria-label="Rescore steps">
          {run.steps.map((step) => (
            <button key={step.trialId} role="listitem" className={`step ${step.status} ${run.selectedStep === step.trialId ? 'selected' : ''}`} onClick={() => selectRunStep(step.trialId)}>
              <span className="step-icon" aria-hidden="true">
                {step.status === 'complete' ? <IconCheck size={14} className="step-check" /> : step.status === 'running' ? <i className="spinner" /> : step.status === 'retrying' ? <IconRefresh size={14} /> : <i className="dot" />}
              </span>
              <span className="step-name"><strong>{step.trialId}</strong><small>{step.taskName}</small></span>
              <b className="step-status">{step.status === 'retrying' ? `retry ${step.attempt} of 3` : step.status}</b>
            </button>
          ))}
        </div>
        <div className="timeline">
          <div className="timeline-head">
            <strong>Event timeline</strong>
            <Select size="xs" aria-label="Filter run events by status" value={eventFilter} onChange={(value) => setEventFilter(value ?? 'all')} data={['all', 'started', 'running', 'retrying', 'complete']} />
          </div>
          <ScrollArea.Autosize mah={430}>
            <ol>
              {events.map((event) => (
                <li key={event.id}>
                  <button onClick={() => event.trialId && selectRunStep(event.trialId)}>
                    <i className={event.status} aria-hidden="true" />
                    <span><strong>{event.text}</strong><small>{event.time}</small></span>
                  </button>
                </li>
              ))}
            </ol>
          </ScrollArea.Autosize>
        </div>
      </div>
    </div>
  )
}

function RescoreModal() {
  const { rescoreOpen, setRescoreOpen, labels, run } = useLabStore()
  const schema = useMemo(() => createRescoreSchema(labels), [labels])
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { labelName: '', scorerModel: '', configNote: '' },
  })
  const submit = (record) => {
    const live = useLabStore.getState()
    // Double-activation guard: only the first submit starts a run.
    if (live.run.active || live.run.label) return
    live.startRescore(record)
    reset()
  }
  const canClose = !run.active
  const showForm = !run.label
  return (
    <Modal
      opened={rescoreOpen}
      onClose={() => canClose && setRescoreOpen(false)}
      closeOnEscape={canClose}
      withCloseButton={canClose}
      size={showForm ? 'md' : 'xl'}
      transitionProps={{ transition: 'pop', duration: 220 }}
      title={<div className="modal-title"><span className="eyebrow">{showForm ? 'Rescore with new label' : 'Rescore run'}</span><strong>{showForm ? 'Create an alternative scoring label' : run.label?.labelName}</strong></div>}
    >
      {showForm ? (
        <form onSubmit={handleSubmit(submit)} className="modal-form" noValidate>
          <div className="form-intro">
            <span className="form-icon" aria-hidden="true"><IconSparkles size={19} /></span>
            <div>
              <strong>Rescore the 12 completed traces in place</strong>
              <p>The submitted record is the would-be rescore-run API request body. One step demonstrates retry handling; the run finishes in under 20 seconds.</p>
            </div>
          </div>
          <TextInput label="Label name" placeholder="For example: rubric v3" description="Required, unique among labels (case-insensitive)." {...register('labelName')} error={errors.labelName?.message} required />
          <Controller
            name="scorerModel"
            control={control}
            render={({ field }) => <Select {...field} label="Scorer model" placeholder="Choose a scorer" data={SCORER_MODELS} error={errors.scorerModel?.message} required />}
          />
          <Textarea label="Config note" description="Optional, up to 120 characters." {...register('configNote')} error={errors.configNote?.message} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setRescoreOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={run.active} leftSection={<IconPlayerPlay size={15} aria-hidden="true" />}>Start rescore</Button>
          </Group>
        </form>
      ) : <RunPanel />}
      {run.completed && !run.active && (
        <Group justify="flex-end" mt="md">
          <Button onClick={() => setRescoreOpen(false)}>Done</Button>
        </Group>
      )}
    </Modal>
  )
}

function CostView() {
  const { labels, trials } = useLabStore()
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(() => Object.fromEntries(labels.map((label) => [label.name, true])))
  const [copied, setCopied] = useState(null)
  useEffect(() => setVisible((current) => Object.fromEntries(labels.map((label) => [label.name, current[label.name] ?? true]))), [labels])
  const data = trials.map((trial, index) => {
    const row = { event: index + 1, trial: trial.id }
    labels.forEach((label) => {
      row[label.name] = Number(trials.slice(0, index + 1).reduce((sum, item) => sum + (item.results[label.name]?.scorerCost ?? 0), 0).toFixed(3))
    })
    return row
  })
  const totals = data.at(-1) ?? {}
  const active = labels.filter((label) => visible[label.name])
  const copyConfig = async (label) => {
    const text = `label: ${label.name}\nscorerModel: ${label.scorerModel}\nconfigNote: ${label.configNote}`
    const ok = await copyText(text)
    setCopied(label.name)
    setTimeout(() => setCopied((value) => (value === label.name ? null : value)), 2200)
    notifications.show({
      id: `config-${label.name}`,
      title: ok ? 'Config summary copied' : 'Copy ready',
      message: ok ? `The exact ${label.name} block text is on your clipboard.` : `${label.name} block text is ready — clipboard access was blocked by the browser.`,
      color: 'teal',
      icon: <IconCheck size={15} aria-hidden="true" />,
      autoClose: 2800,
    })
  }
  return (
    <main className="page-shell">
      <SectionTitle eyebrow="Scoring spend" title="Cost" description="Audit cumulative scoring cost in completed-trial order. Every series ends at the same derived total the rest of the lab shows." />
      <InsightsStrip />
      <Reveal>
        <Paper className="chart-card cost-chart-card" withBorder>
          <div className="card-heading">
            <div><span className="eyebrow">Cumulative cost</span><h2>Cost across ordered rescore events</h2></div>
            <span>USD · {trials.length} events</span>
          </div>
          <div className="legend-controls" role="group" aria-label="Toggle cost series">
            {labels.map((label, index) => (
              <button
                key={label.name}
                aria-pressed={Boolean(visible[label.name])}
                className={visible[label.name] ? 'legend-toggle active' : 'legend-toggle'}
                onClick={() => setVisible((current) => ({ ...current, [label.name]: !current[label.name] }))}
              >
                <i aria-hidden="true" style={{ background: SERIES_PALETTE[index % SERIES_PALETTE.length] }} />
                {label.name}
                <strong>${(totals[label.name] ?? 0).toFixed(3)}</strong>
              </button>
            ))}
          </div>
          {active.length ? (
            <div className="cost-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 12, right: 20, bottom: 8, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="event" aria-label="Rescore event order" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(1)}`} aria-label="Cumulative cost in dollars" />
                  <ChartTooltip content={({ active: isActive, payload, label }) => (isActive && payload?.length ? (
                    <div className="chart-tooltip">
                      <strong>Event {label}</strong>
                      {payload.map((item) => <div key={item.name}><i aria-hidden="true" style={{ background: item.stroke }} />{item.name} <b>${Number(item.value).toFixed(3)}</b></div>)}
                    </div>
                  ) : null)} />
                  {labels.map((item, index) => (visible[item.name] ? (
                    <Line key={item.name} type="monotone" dataKey={item.name} stroke={SERIES_PALETTE[index % SERIES_PALETTE.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} animationDuration={reduce ? 0 : 500} />
                  ) : null))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={IconCoin} title="No cost series selected">Re-enable a label in the legend above to restore its cumulative cost line.</EmptyState>
          )}
        </Paper>
      </Reveal>
      <div className="config-grid">
        {labels.map((label, index) => (
          <Reveal key={label.name}>
            <Paper className="config-card" withBorder>
              <div className="config-head">
                <i aria-hidden="true" style={{ background: SERIES_PALETTE[index % SERIES_PALETTE.length] }} />
                <div><strong>{label.name}</strong><span>${(totals[label.name] ?? 0).toFixed(3)} total</span></div>
              </div>
              <pre>{`label: ${label.name}\nscorerModel: ${label.scorerModel}\nconfigNote: ${label.configNote}`}</pre>
              <Button variant="subtle" size="sm" leftSection={copied === label.name ? <IconCheck size={14} aria-hidden="true" /> : <IconCopy size={14} aria-hidden="true" />} onClick={() => copyConfig(label)}>
                {copied === label.name ? 'Copied the exact block' : 'Copy config'}
              </Button>
            </Paper>
          </Reveal>
        ))}
      </div>
    </main>
  )
}

function ExportModal() {
  const state = useLabStore()
  const { exportOpen, setExportOpen } = state
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString())
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [pasted, setPasted] = useState('')
  const inputRef = useRef(null)
  const stateKey = useMemo(() => JSON.stringify([state.labels.length, state.trials.length, state.attributions.length, state.savedPairs.length, state.compareA, state.compareB, state.filters, state.shownLabels]), [state.labels, state.trials, state.attributions, state.savedPairs, state.compareA, state.compareB, state.filters, state.shownLabels])
  useEffect(() => {
    if (exportOpen) { setGeneratedAt(new Date().toISOString()); setImportError(''); setImportSuccess('') }
  }, [exportOpen])
  useEffect(() => { if (exportOpen) setGeneratedAt(new Date().toISOString()) }, [stateKey, exportOpen])
  const json = useMemo(() => {
    try {
      return JSON.stringify(compileLabResults(useLabStore.getState(), generatedAt), null, 2)
    } catch {
      return JSON.stringify({ schemaVersion: 'rescore-ab-lab-v1', error: 'export: compilation failed' }, null, 2)
    }
  }, [stateKey, generatedAt])
  const copy = async () => {
    await copyText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notifications.show({ id: 'export-copy', title: 'Exact JSON copied', message: 'The full lab-results JSON from the preview is on your clipboard.', color: 'teal', icon: <IconClipboard size={15} aria-hidden="true" />, autoClose: 2600 })
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const link = window.document.createElement('a')
    link.href = url
    link.download = 'lab-results.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  const runImport = (raw) => {
    let value
    try { value = JSON.parse(raw) } catch { setImportError('document: malformed JSON — fix the syntax and import again'); setImportSuccess(''); return }
    const parsed = labResultsSchema.safeParse(value)
    if (!parsed.success) { setImportError(formatZodError(parsed.error)); setImportSuccess(''); return }
    const result = useLabStore.getState().importDocument(parsed.data)
    setImportSuccess(`Import complete: ${result.attributions} attribution${result.attributions === 1 ? '' : 's'} and ${result.savedPairs} saved pair${result.savedPairs === 1 ? '' : 's'} restored. The preview below was regenerated.`)
    setImportError('')
    setPasted('')
  }
  const importFile = async (event) => {
    const file = event.target.files?.[0]
    if (file) runImport(await file.text())
    event.target.value = ''
  }
  return (
    <Modal
      opened={exportOpen}
      onClose={() => setExportOpen(false)}
      size="xl"
      transitionProps={{ transition: 'pop', duration: 240 }}
      title={<div className="modal-title"><span className="eyebrow">API-shaped artifact</span><strong>Export lab results</strong></div>}
    >
      <div className="export-layout">
        <div className="export-meta">
          <div className="schema-stamp">
            <IconCode size={17} aria-hidden="true" />
            <div><strong>rescore-ab-lab-v1</strong><span>Compiled live from session state</span></div>
          </div>
          <div className="export-counts" aria-label="Document counts">
            <div><strong>{state.labels.length}</strong><span>labels</span></div>
            <div><strong>{state.trials.length}</strong><span>trials</span></div>
            <div><strong>{state.attributions.length}</strong><span>attributions</span></div>
            <div><strong>{state.savedPairs.length}</strong><span>saved pairs</span></div>
          </div>
          <p>The preview carries every required top-level key and reflects all in-session rescoring, attribution, and pair mutations.</p>
          <Stack gap="xs">
            <Button leftSection={<IconDownload size={15} aria-hidden="true" />} onClick={download}>Download JSON</Button>
            <Button variant="default" leftSection={copied ? <IconCheck size={15} aria-hidden="true" /> : <IconClipboard size={15} aria-hidden="true" />} onClick={copy}>{copied ? 'Copied exact JSON' : 'Copy'}</Button>
          </Stack>
          <Divider my="sm" label="Import lab results" labelPosition="left" />
          <Stack gap="xs">
            <Button variant="default" leftSection={<IconUpload size={15} aria-hidden="true" />} onClick={() => inputRef.current?.click()}>Import from a JSON file</Button>
            <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Import lab results JSON file" onChange={importFile} />
            <Textarea label="Or paste lab-results JSON" aria-label="Paste lab results JSON" placeholder='{"schemaVersion": "rescore-ab-lab-v1", …}' minRows={3} value={pasted} onChange={(event) => setPasted(event.currentTarget.value)} />
            <Button variant="default" disabled={!pasted.trim()} onClick={() => runImport(pasted)}>Apply pasted import</Button>
          </Stack>
          {importError && (
            <div className="import-message error" role="alert">
              <IconCircleX size={15} aria-hidden="true" />
              <span><strong>Import rejected — </strong>{importError}. Attributions and saved pairs are unchanged.</span>
            </div>
          )}
          {importSuccess && (
            <div className="import-message success" role="status">
              <IconCircleCheck size={15} aria-hidden="true" />
              <span>{importSuccess}</span>
            </div>
          )}
        </div>
        <div className="json-preview">
          <div className="json-preview-head"><span>lab-results.json</span><span className="count-badge good">Schema valid</span></div>
          <pre tabIndex={0} aria-label="Live lab results JSON preview">{json}</pre>
        </div>
      </div>
    </Modal>
  )
}

function fuzzyMatch(query, value) {
  const q = query.toLowerCase().replace(/\s/g, '')
  const v = value.toLowerCase().replace(/\s/g, '')
  let qi = 0
  for (let index = 0; index < v.length && qi < q.length; index += 1) if (v[index] === q[qi]) qi += 1
  return qi === q.length
}

function CommandPalette() {
  const { paletteOpen, setPaletteOpen, labels, setView, setCompare, openRescore, setExportOpen } = useLabStore()
  const [query, setQuery] = useState('')
  const [assignLabel, setAssignLabel] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const [voiceNote, setVoiceNote] = useState('')
  const recognitionRef = useRef(null)
  useEffect(() => {
    if (!paletteOpen) { setQuery(''); setAssignLabel(null); setActiveIndex(0); setVoiceNote('') }
  }, [paletteOpen])
  useEffect(() => () => recognitionRef.current?.abort?.(), [])
  const commands = [
    { id: 'experiments', label: 'Go to Experiments', hint: 'View destination', icon: IconLayoutGrid, run: () => setView('experiments') },
    { id: 'compare', label: 'Go to Compare', hint: 'View destination', icon: IconAdjustments, run: () => setView('compare') },
    { id: 'cost', label: 'Go to Cost', hint: 'View destination', icon: IconCoin, run: () => setView('cost') },
    { id: 'rescore', label: 'Rescore with new label', hint: 'Action', icon: IconSparkles, run: openRescore },
    { id: 'export', label: 'Export lab results', hint: 'Action', icon: IconFileExport, run: () => setExportOpen(true) },
    ...labels.map((label) => ({ id: `label-${label.name}`, label: label.name, hint: 'Assign as compare label', icon: IconBolt, run: () => setAssignLabel(label.name) })),
  ]
  const matches = commands.filter((item) => fuzzyMatch(query, item.label))
  useEffect(() => setActiveIndex(0), [query, assignLabel])
  const runCommand = (command) => {
    command.run()
    if (!command.id.startsWith('label-')) setPaletteOpen(false)
  }
  const toggleVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) { setVoiceNote('Voice input is not supported in this browser — type instead.'); return }
    if (listening) { recognitionRef.current?.abort(); setListening(false); return }
    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event) => setQuery(event.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => { setListening(false); setVoiceNote('Voice capture was unavailable — type instead.') }
    setVoiceNote('Listening — say a view, action, or label name.')
    setListening(true)
    recognition.start()
  }
  const onKeyDown = (event) => {
    if (assignLabel) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((value) => Math.min(value + 1, matches.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, 0)) }
    else if (event.key === 'Enter' && matches[activeIndex]) { event.preventDefault(); runCommand(matches[activeIndex]) }
  }
  return (
    <Modal opened={paletteOpen} onClose={() => setPaletteOpen(false)} withCloseButton={false} size="lg" padding={0} className="palette-modal" transitionProps={{ transition: 'pop', duration: 220 }}>
      <div className="palette-search">
        <IconSearch size={18} aria-hidden="true" />
        <input
          autoFocus
          aria-label="Search commands"
          placeholder="Type a view, action, or label — or use the mic…"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setAssignLabel(null) }}
          onKeyDown={onKeyDown}
        />
        <Tooltip label={listening ? 'Stop listening' : 'Search by voice'}>
          <button className={listening ? 'voice-btn listening' : 'voice-btn'} aria-label={listening ? 'Stop voice input' : 'Search by voice'} aria-pressed={listening} onClick={toggleVoice}>
            <IconMicrophone size={17} aria-hidden="true" />
          </button>
        </Tooltip>
        <kbd aria-hidden="true">ESC</kbd>
      </div>
      <Divider />
      {voiceNote && <p className="voice-note" role="status">{voiceNote}</p>}
      {assignLabel ? (
        <div className="assignment">
          <span className="eyebrow">Assign compare label</span>
          <h3>{assignLabel}</h3>
          <p>Choose which side of the Compare pair should use this label.</p>
          <div className="assignment-actions">
            <Button onClick={() => { setCompare('A', assignLabel); setView('compare'); setPaletteOpen(false) }}>Set as label A</Button>
            <Button variant="default" onClick={() => { setCompare('B', assignLabel); setView('compare'); setPaletteOpen(false) }}>Set as label B</Button>
          </div>
          <Button variant="subtle" onClick={() => setAssignLabel(null)}>Back to commands</Button>
        </div>
      ) : (
        <ScrollArea.Autosize mah={420}>
          <div className="command-list" role="listbox" aria-label="Command results">
            {matches.map((command, index) => {
              const Icon = command.icon
              return (
                <button
                  key={command.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? 'active' : ''}
                  onClick={() => runCommand(command)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="cmd-icon" aria-hidden="true"><Icon size={17} /></span>
                  <span className="cmd-text"><strong>{command.label}</strong><small>{command.hint}</small></span>
                  <IconChevronRight size={14} aria-hidden="true" />
                </button>
              )
            })}
            {!matches.length && (
              <EmptyState icon={IconSearch} title="No matching command">
                Type “cost”, “export”, “rescore”, or any existing label name — fuzzy matching fills in the rest.
              </EmptyState>
            )}
            {!query && matches.length > 0 && <p className="palette-tip">Start typing to fuzzy-match views, actions, and label names.</p>}
          </div>
        </ScrollArea.Autosize>
      )}
    </Modal>
  )
}

function ShortcutsDialog() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName
      if (event.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') setOpen((value) => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const rows = [
    ['Command-K / Control-K', 'Open the command palette'],
    ['?', 'Toggle this shortcut reference'],
    ['Esc', 'Close the topmost dialog, palette, or drawer'],
    ['↑ / ↓ + Enter', 'Move through and run palette commands'],
  ]
  return (
    <>
      <Modal opened={open} onClose={() => setOpen(false)} size="sm" title={<div className="modal-title"><span className="eyebrow">Keyboard</span><strong>Shortcut reference</strong></div>} transitionProps={{ transition: 'pop', duration: 200 }}>
        <div className="shortcuts-list">
          {rows.map(([keys, what]) => <div key={keys}><kbd>{keys}</kbd><span>{what}</span></div>)}
        </div>
      </Modal>
      <Tooltip label="Keyboard shortcuts (?)">
        <button className="shortcuts-fab" aria-label="Open keyboard shortcut reference" onClick={() => setOpen(true)}>
          <IconKeyboard size={17} aria-hidden="true" />
        </button>
      </Tooltip>
    </>
  )
}

const TOUR_STEPS = [
  { title: 'Welcome to the rescore lab', body: 'Twelve completed benchmark trials across four fictional tasks are already scored under four labels: Baseline plus three rescore configs. Everything you see derives from that one shared collection.' },
  { title: 'Experiments first', body: 'Switch which label columns render, narrow rows with suggestion chips and filters, and sort by reward or delta size. Filters compose — clear all returns exactly the 12 seeded rows.' },
  { title: 'Compare the decision shifts', body: 'Pick labels A and B, read the summary strip and pass-rate wheel, hover the reward agreement map, then open a trial to expand each verdict flip and attribute its cause.' },
  { title: 'Audit cost and ship the pack', body: 'The Cost view traces cumulative spend per label. When the lab is done, Export lab results compiles the schema-valid rescore-ab-lab-v1 pack — download, copy, or re-import it any time.' },
]

function OnboardingTour() {
  const { onboarded, setOnboarded, rescoreOpen, exportOpen, paletteOpen, savePairOpen, attributionDraft, openedTrialId } = useLabStore()
  const [step, setStep] = useState(0)
  const hidden = onboarded || rescoreOpen || exportOpen || paletteOpen || savePairOpen || Boolean(attributionDraft) || Boolean(openedTrialId)
  if (hidden) return null
  const finish = () => {
    setOnboarded(true)
    notifications.show({ id: 'tour-done', title: 'Tour complete', message: 'The lab is yours — press Command-K any time to jump around.', color: 'teal', icon: <IconBook size={15} aria-hidden="true" />, autoClose: 3000 })
  }
  return (
    <div className="tour-overlay" role="dialog" aria-label="Guided onboarding tour">
      <div className="tour-card">
        <span className="eyebrow">Guided tour · step {step + 1} of {TOUR_STEPS.length}</span>
        <h2>{TOUR_STEPS[step].title}</h2>
        <p>{TOUR_STEPS[step].body}</p>
        <div className="tour-dots" aria-hidden="true">{TOUR_STEPS.map((item, index) => <i key={item.title} className={index === step ? 'on' : ''} />)}</div>
        <div className="tour-actions">
          <Button variant="subtle" onClick={finish}>Skip tour</Button>
          <span className="tour-nav">
            {step > 0 && <Button variant="default" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < TOUR_STEPS.length - 1 ? <Button onClick={() => setStep(step + 1)}>Next</Button> : <Button onClick={finish}>Start exploring</Button>}
          </span>
        </div>
      </div>
    </div>
  )
}

function Toasts() {
  const toast = useLabStore((s) => s.toast)
  const dismissToast = useLabStore((s) => s.dismissToast)
  useEffect(() => {
    if (!toast) return
    const content = {
      save: ['Attribution saved', 'The flip is tagged and the pair rollup updated.'],
      undo: ['Undo applied', 'The attribution tag and rollup reverted to the previous state.'],
      redo: ['Redo applied', 'The attribution tag and rollup were restored.'],
      run: ['Rescore run complete', `${toast.labelName} is live in the experiment table, both Compare pickers, and the cost chart.`],
      pair: ['Saved pair stored', `${toast.name} is available in the saved pairs menu.`],
      import: ['Lab results imported', `${toast.attributions} attribution${toast.attributions === 1 ? '' : 's'} and ${toast.savedPairs} saved pair${toast.savedPairs === 1 ? '' : 's'} restored.`],
    }
    const [title, message] = content[toast.kind] || ['Lab updated', 'The lab state changed.']
    notifications.show({ id: `lab-${toast.id}`, title, message, color: 'teal', icon: <IconCheck size={15} aria-hidden="true" />, autoClose: 3400, withCloseButton: true })
    dismissToast()
  }, [toast, dismissToast])
  return null
}

function useA11yObservers() {
  useEffect(() => {
    const mark = () => {
      // Decorative SVGs (Tabler icons, Mantine chevrons, chart chrome) get hidden
      // from the accessibility tree; meaningful SVGs carry role/label and are skipped.
      window.document.querySelectorAll('svg:not([aria-hidden]):not([role]):not([aria-label])').forEach((svg) => {
        svg.setAttribute('aria-hidden', 'true')
        svg.setAttribute('focusable', 'false')
      })
      // Mantine renders several interactive controls (multi-select pill removers,
      // menu items) with tabindex="-1"; keep every visible button Tab-reachable.
      window.document.querySelectorAll('button[tabindex="-1"]').forEach((button) => {
        if (button.disabled) return
        button.tabIndex = 0
        if (!button.textContent.trim() && !button.getAttribute('aria-label')) button.setAttribute('aria-label', 'Remove selected label')
      })
    }
    mark()
    let scheduled = false
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => { scheduled = false; mark() })
    })
    observer.observe(window.document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
}

function useGlobalKeys() {
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        const state = useLabStore.getState()
        state.setPaletteOpen(!state.paletteOpen)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}

function AppInner() {
  const theme = useLabStore((s) => s.theme)
  const activeView = useLabStore((s) => s.activeView)
  const liveMessage = useLabStore((s) => s.liveMessage)
  useGlobalKeys()
  useA11yObservers()
  useEffect(() => { registerWebMcp() }, [])
  useEffect(() => { window.document.documentElement.dataset.theme = theme }, [theme])
  return (
    <div className="app-root">
      <BackgroundLayers />
      <Header />
      {activeView === 'experiments' ? <ExperimentsView /> : activeView === 'compare' ? <CompareView /> : <CostView />}
      <TrialDiffModal />
      <AttributionDrawer />
      <SavePairModal />
      <RescoreModal />
      <ExportModal />
      <CommandPalette />
      <ShortcutsDialog />
      <OnboardingTour />
      <Toasts />
      <div className="visually-hidden" aria-live="polite">{liveMessage}</div>
    </div>
  )
}

export default function App() {
  const theme = useLabStore((s) => s.theme)
  return (
    <MantineProvider forceColorScheme={theme} theme={{ primaryColor: 'teal', defaultRadius: 'md' }}>
      <Notifications position="bottom-right" zIndex={1300} />
      <AppInner />
    </MantineProvider>
  )
}
