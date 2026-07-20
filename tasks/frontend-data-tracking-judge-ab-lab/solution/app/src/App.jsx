import { useEffect, useMemo, useRef, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { flushSync } from 'react-dom'
import {
  ActionIcon, Badge, Button, Checkbox, Divider, Group, MantineProvider, Menu, Modal, MultiSelect,
  NumberInput, Paper, Popover, Progress, ScrollArea, Select, Stack, Table, Text, Textarea, TextInput, Tooltip,
} from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconAdjustments, IconArrowDown, IconArrowUp, IconArrowsSort, IconBolt, IconCheck, IconChevronDown,
  IconChevronRight, IconCircleCheck, IconCircleX, IconClipboard, IconCode, IconCoin, IconCommand,
  IconCopy, IconDownload, IconFileExport, IconFilter, IconFlask, IconHistory, IconLayoutGrid,
  IconListSearch, IconMenu2, IconMoon, IconPlayerPlay, IconPlus, IconRefresh, IconRotateClockwise,
  IconSearch, IconSparkles, IconSun, IconTrash, IconUpload, IconX,
} from '@tabler/icons-react'
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ChartTooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import {
  attributionInputSchema, createRescoreSchema, createSavedPairSchema, formatZodError, labResultsSchema,
  DIMENSIONS, SCORER_MODELS,
} from './contracts.js'
import { TASKS } from './seed.js'
import { compileLabResults, deriveCompareSummary, pairedTrials, useLabStore, visibleTrials } from './store.js'

const causeLabels = {
  'scorer-noise': 'Scorer noise',
  'rubric-change-effect': 'Rubric change effect',
  'harness-change-effect': 'Harness change effect',
}
const causeShort = { 'scorer-noise': 'noise', 'rubric-change-effect': 'rubric', 'harness-change-effect': 'harness' }

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('fallback');
    }
  } catch (err) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    textArea.remove();
  }
}

const palette = ['#6558d3', '#16a394', '#e18b3f', '#d64f72', '#3b82c4', '#a66cc5']

function ScoreBadge({ result }) {
  if (!result) return <span className="muted">—</span>
  return (
    <div className="score-cell">
      <span className="score-number">{result.totalReward.toFixed(2)}</span>
      <Badge color={result.pass ? 'teal' : 'red'} variant="filled" size="sm" leftSection={result.pass ? <IconCheck size={11}  aria-hidden="true" /> : <IconX size={11}  aria-hidden="true" />}>
        {result.pass ? 'Pass' : 'Fail'}
      </Badge>
    </div>
  )
}

function Delta({ value }) {
  const neutral = Math.abs(value) < 0.005
  const positive = value > 0
  return <span className={`delta ${neutral ? 'neutral' : positive ? 'positive' : 'negative'}`}>{neutral ? '→' : positive ? '↑' : '↓'} {value >= 0 ? '+' : ''}{value.toFixed(2)}</span>
}

function EmptyState({ icon: Icon = IconListSearch, title, children }) {
  return <div className="empty-state"><div className="empty-icon"><Icon aria-hidden="true" size={24} /></div><h3>{title}</h3><p>{children}</p></div>
}

function SectionTitle({ eyebrow, title, description, actions }) {
  return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="section-actions">{actions}</div>}</div>
}

function Header({ onRescore, onExport, onPalette }) {
  const { activeView, setView, theme, toggleTheme, undo, redo, undoStack, redoStack } = useLabStore()
  const nav = [
    { id: 'experiments', label: 'Experiments', icon: IconLayoutGrid },
    { id: 'compare', label: 'Compare', icon: IconAdjustments },
    { id: 'cost', label: 'Cost', icon: IconCoin },
  ]
  return <header className="app-header">
    <div className="brand"><span className="brand-mark"><IconFlask size={20}  aria-hidden="true" /></span><div><strong>Rescore</strong><span>A/B LAB</span></div></div>
    <nav className="desktop-nav" aria-label="Primary navigation">
      {nav.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'nav-item active' : 'nav-item'} onClick={() => setView(id)}><Icon aria-hidden="true" size={16} />{label}</button>)}
    </nav>
    <div className="header-actions">
      <Tooltip label="Undo attribution"><ActionIcon variant="subtle" aria-label="Undo attribution" disabled={!undoStack.length} onClick={undo}><IconHistory size={18}  aria-hidden="true" /></ActionIcon></Tooltip>
      <Tooltip label="Redo attribution"><ActionIcon variant="subtle" aria-label="Redo attribution" disabled={!redoStack.length} onClick={redo}><IconRotateClockwise size={18}  aria-hidden="true" /></ActionIcon></Tooltip>
      <Tooltip label="Command palette (⌘K)"><ActionIcon variant="subtle" aria-label="Open command palette" onClick={onPalette}><IconCommand size={18}  aria-hidden="true" /></ActionIcon></Tooltip>
      <Button className="header-export" variant="default" leftSection={<IconFileExport size={16}  aria-hidden="true" />} onClick={onExport}>Export lab results</Button>
      <Button className="header-rescore" leftSection={<IconSparkles size={16}  aria-hidden="true" />} onClick={onRescore}>Rescore with new label</Button>
      <Tooltip label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}><ActionIcon variant="default" aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={toggleTheme}>{theme === 'light' ? <IconMoon size={18}  aria-hidden="true" /> : <IconSun size={18}  aria-hidden="true" />}</ActionIcon></Tooltip>
      <Menu shadow="md" width={190} position="bottom-end">
        <Menu.Target><ActionIcon className="mobile-menu" variant="default" aria-label="Open navigation"><IconMenu2 size={18}  aria-hidden="true" /></ActionIcon></Menu.Target>
        <Menu.Dropdown>{nav.map(({ id, label, icon: Icon }) => <Menu.Item key={id} leftSection={<Icon aria-hidden="true" size={16} />} onClick={() => setView(id)}>{label}</Menu.Item>)}<Menu.Divider /><Menu.Item leftSection={<IconSparkles size={16}  aria-hidden="true" />} onClick={onRescore}>New rescore</Menu.Item><Menu.Item leftSection={<IconFileExport size={16}  aria-hidden="true" />} onClick={onExport}>Export lab results</Menu.Item></Menu.Dropdown>
      </Menu>
    </div>
  </header>
}

function SuggestionChips() {
  const { activeChip, toggleChip } = useLabStore()
  const chips = [
    { id: 'baseline-fails', label: 'Failing on Baseline' },
    { id: 'big-deltas', label: 'Big deltas' },
    ...TASKS.map((task) => ({ id: `task:${task}`, label: task })),
  ]
  return <div className="suggestions" aria-label="Filter suggestions"><span><IconBolt size={14}  aria-hidden="true" />Suggestions</span>{chips.map((chip) => <button key={chip.id} aria-pressed={activeChip === chip.id} className={activeChip === chip.id ? 'chip active' : 'chip'} onClick={() => toggleChip(chip.id)}>{chip.label}</button>)}</div>
}

function FilterBar() {
  const { labels, filters, setFilter, sort, setSort, clearFilters } = useLabStore()
  return <Paper className="filter-bar" withBorder>
    <div className="filter-heading"><IconFilter size={16}  aria-hidden="true" /><strong>Refine collection</strong></div>
    <Select label="Task" aria-label="Filter by task" value={filters.task} onChange={(value) => setFilter('task', value)} data={[{ value: 'all', label: 'All tasks' }, ...TASKS.map((task) => ({ value: task, label: task }))]} />
    <Select label="Pass state" aria-label="Filter by pass state" value={filters.passState} onChange={(value) => setFilter('passState', value)} data={[{ value: 'all', label: 'All outcomes' }, { value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }]} />
    <Select label="Outcome / reward label" aria-label="Pass filter and reward sort label" value={filters.passLabel} onChange={(value) => setFilter('passLabel', value)} data={labels.map((label) => label.name)} />
    <NumberInput label="Abs. delta above" aria-label="Minimum absolute delta" value={filters.deltaMin} onChange={(value) => setFilter('deltaMin', Number(value) || 0)} min={0} max={1} step={0.01} decimalScale={2} prefix="≥ " />
    <div className="sort-control"><Select label="Sort rows" aria-label="Sort rows" value={sort.type} onChange={(value) => setSort(value)} data={[{ value: 'task-name', label: 'Task name' }, { value: 'label-reward', label: `${sort.label} reward` }, { value: 'delta-size', label: 'Delta size' }]} /><Tooltip label={`Reverse to ${sort.direction === 'asc' ? 'descending' : 'ascending'}`}><ActionIcon variant="default" aria-label={`Sort ${sort.direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setSort(sort.type, sort.label)}>{sort.direction === 'asc' ? <IconArrowUp size={14}  aria-hidden="true" /> : <IconArrowDown size={14}  aria-hidden="true" />}</ActionIcon></Tooltip></div>
    <Button variant="subtle" leftSection={<IconRefresh size={15}  aria-hidden="true" />} onClick={clearFilters}>Clear all</Button>
  </Paper>
}

function LabelHeader({ label, trials }) {
  const results = trials.map((trial) => trial.results[label.name]).filter(Boolean)
  const mean = results.reduce((sum, result) => sum + result.totalReward, 0) / Math.max(results.length, 1)
  const cost = results.reduce((sum, result) => sum + result.scorerCost, 0)
  return <div className="label-header"><strong>{label.name}</strong><span>{label.scorerModel}</span><small>{label.configNote}</small><div><b>{mean.toFixed(2)}</b> mean <i>·</i> <b>${cost.toFixed(3)}</b></div></div>
}

function ExperimentsView() {
  const [parent] = useAutoAnimate()
  const state = useLabStore()
  const rows = visibleTrials(state)
  const shown = state.labels.filter((label) => state.shownLabels.includes(label.name))
  return <main className="page-shell">
    <SectionTitle eyebrow="Completed benchmark runs" title="Experiments" description="Rescore the same traces, switch the label columns, and isolate where scoring changes the decision." actions={<div className="collection-stat"><strong>{rows.length}</strong><span>of 12 trials</span></div>} />
    <SuggestionChips />
    <FilterBar />
    <Paper className="table-card" withBorder>
      <div className="table-toolbar"><div><h2>Trial Collection</h2><p>Scores use a fixed pass threshold of 0.70.</p></div><MultiSelect label="Visible label columns" aria-label="Choose visible label columns" value={state.shownLabels} onChange={state.setShownLabels} data={state.labels.map((label) => label.name)} hidePickedOptions searchable clearable={false} /></div>
      <div className="table-scroll">
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead><Table.Tr><Table.Th className="sticky-col"><button className="sort-header" onClick={() => state.setSort('task-name')}>Trial / task <IconArrowsSort size={13}  aria-hidden="true" /></button></Table.Th>{shown.map((label) => <Table.Th key={label.name}><LabelHeader label={label} trials={rows} /></Table.Th>)}</Table.Tr></Table.Thead>
          <Table.Tbody ref={parent}>{rows.map((trial) => <Table.Tr key={trial.id}><Table.Td className="sticky-col"><div className="trial-cell"><strong>{trial.id}</strong><span>{trial.taskName}</span></div></Table.Td>{shown.map((label) => <Table.Td key={label.name}><ScoreBadge result={trial.results[label.name]} /></Table.Td>)}</Table.Tr>)}</Table.Tbody>
        </Table>
      </div>
      {!rows.length && <EmptyState title="No Trials Match These Filters">Clear a filter or lower the delta threshold to bring completed trials back into the collection.</EmptyState>}
      <div className="table-footer"><span>{rows.length} visible rows</span><span>Delta pair: {state.deltaPair.join(' → ')}</span></div>
    </Paper>
  </main>
}

function SummaryMetric({ label, value, tone }) {
  return <div className={`summary-metric ${tone || ''}`}><span>{label}</span><strong>{value}</strong></div>
}

function CostDisclosure({ side, label, total, rows }) {
  const highlightTrial = useLabStore((state) => state.highlightTrial)
  const [opened, setOpened] = useState(false)
  return <Popover width={310} position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
    <Popover.Target><button className="summary-metric interactive" onClick={() => setOpened((value) => !value)} aria-expanded={opened}><span>{side} scoring cost <IconChevronDown size={12}  aria-hidden="true" /></span><strong>${total.toFixed(3)}</strong></button></Popover.Target>
    <Popover.Dropdown><div className="disclosure-head"><strong>{label} cost sources</strong><span>{rows.length} trials</span></div><ScrollArea.Autosize mah={260}><div className="source-list">{rows.map((trial) => <button key={trial.id} onClick={() => { highlightTrial(trial.id); setOpened(false); document.getElementById(`pair-${trial.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}><span>{trial.id}<small>{trial.taskName}</small></span><b>${trial.results[label].scorerCost.toFixed(3)}</b></button>)}</div></ScrollArea.Autosize></Popover.Dropdown>
  </Popover>
}

function PassWheel({ summary }) {
  const rings = [
    { label: summary.labelA, rate: summary.passRateA, radius: 46, color: '#6558d3' },
    { label: summary.labelB, rate: summary.passRateB, radius: 33, color: '#16a394' },
  ]
  return <Paper className="pass-wheel" withBorder><div><span className="eyebrow">Pass rate</span><strong>Threshold wheel</strong></div><div className="wheel-content"><svg viewBox="0 0 120 120" role="img" aria-label={`${summary.labelA} pass rate ${Math.round(summary.passRateA * 100)} percent; ${summary.labelB} pass rate ${Math.round(summary.passRateB * 100)} percent`}>
    {rings.map((ring) => { const length = 2 * Math.PI * ring.radius; return <g key={ring.label}><circle cx="60" cy="60" r={ring.radius} fill="none" stroke="var(--wheel-track)" strokeWidth="8" /><circle className="wheel-ring" cx="60" cy="60" r={ring.radius} fill="none" stroke={ring.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={length} strokeDashoffset={length * (1 - ring.rate)} transform="rotate(-90 60 60)" /></g> })}
    <text x="60" y="57" textAnchor="middle" className="wheel-number">{Math.round((summary.passRateA + summary.passRateB) * 50)}%</text><text x="60" y="71" textAnchor="middle" className="wheel-label">combined</text>
  </svg><div className="wheel-legend">{rings.map((ring) => <div key={ring.label}><i style={{ background: ring.color }} /><span>{ring.label}</span><b>{Math.round(ring.rate * 100)}%</b></div>)}</div></div></Paper>
}

function CompareChart({ rows, labelA, labelB, highlightedTrialId, setHighlighted }) {
  const data = rows.map((trial) => ({ id: trial.id, task: trial.taskName, a: trial.results[labelA].totalReward, b: trial.results[labelB].totalReward }))
  return <Paper className="chart-card compare-chart" withBorder><div className="card-heading"><div><span className="eyebrow">Paired rewards</span><h2>A × B Agreement Map</h2></div><span>{data.length} paired trials</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 16, bottom: 10, left: 0 }} onClick={(event) => event?.activePayload?.[0]?.payload?.id && setHighlighted(event.activePayload[0].payload.id)}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" /><XAxis type="number" dataKey="a" name={labelA} domain={[0, 1]} tickFormatter={(value) => value.toFixed(1)} /><YAxis type="number" dataKey="b" name={labelB} domain={[0, 1]} tickFormatter={(value) => value.toFixed(1)} /><ZAxis range={[70, 70]} /><ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--muted)" strokeDasharray="5 5" />
    <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><strong>{payload[0].payload.id}</strong><span>{payload[0].payload.task}</span><div>{labelA} <b>{payload[0].payload.a.toFixed(2)}</b></div><div>{labelB} <b>{payload[0].payload.b.toFixed(2)}</b></div></div> : null} />
    <Scatter data={data} fill="#6558d3" shape={(props) => <circle cx={props.cx} cy={props.cy} r={props.payload.id === highlightedTrialId ? 8 : 6} fill={props.payload.b >= props.payload.a ? '#16a394' : '#d64f72'} stroke="var(--surface)" strokeWidth="2" className="chart-mark" />} />
  </ScatterChart></ResponsiveContainer></div><div className="axis-labels"><span>← {labelA} reward →</span><span>{labelB} reward rises vertically</span></div></Paper>
}

function AttributionRollup({ labelA, labelB }) {
  const attributions = useLabStore((state) => state.attributions)
  const items = attributions.filter((item) => item.labelA === labelA && item.labelB === labelB)
  const counts = Object.keys(causeLabels).map((cause) => ({ cause, count: items.filter((item) => item.cause === cause).length }))
  return <Paper className="rollup" withBorder><div><span className="eyebrow">Attribution rollup</span><h2>{items.length ? `${items.length} tagged flip${items.length === 1 ? '' : 's'}` : 'No Flips Tagged Yet'}</h2><p>{items.length ? 'Causes update as operator judgments change.' : 'Open a trial, expand a differing criterion, and tag its likely cause.'}</p></div><div className="rollup-counts">{counts.map((item) => <div key={item.cause}><strong>{item.count}</strong><span>{causeShort[item.cause]}</span></div>)}</div></Paper>
}

function SavedPairControls({ onSave }) {
  const { savedPairs, applyPair, deletePair } = useLabStore()
  return <Group gap="xs"><Button variant="default" size="sm" leftSection={<IconPlus size={14}  aria-hidden="true" />} onClick={onSave}>Save comparison pair</Button><Menu width={290} position="bottom-end"><Menu.Target><Button variant="subtle" size="sm" rightSection={<IconChevronDown size={14}  aria-hidden="true" />}>Saved pairs {savedPairs.length ? `(${savedPairs.length})` : ''}</Button></Menu.Target><Menu.Dropdown>{savedPairs.length ? savedPairs.map((pair) => <div className="saved-pair-row" key={pair.name}><button className="saved-pair-apply" onClick={() => applyPair(pair.name)}><strong>{pair.name}</strong><span>{pair.labelA} → {pair.labelB}</span></button><button className="saved-pair-delete" aria-label={`Delete ${pair.name}`} onClick={() => { if (window.confirm(`Delete saved pair “${pair.name}”?`)) deletePair(pair.name) }}><IconTrash size={14}  aria-hidden="true" /></button></div>) : <Menu.Label>No saved pairs. Save the current A/B selection for quick recall.</Menu.Label>}</Menu.Dropdown></Menu></Group>
}

function CompareView({ onSavePair }) {
  const [parent] = useAutoAnimate()
  const openAttribution = (detail) => state.setAttributionContext({ ...detail, trialId: state.openedTrialId, labelA: state.compareA, labelB: state.compareB })
  const state = useLabStore()
  const rows = pairedTrials(state)
  const summary = deriveCompareSummary(state)
  const labelOptions = state.labels.map((label) => label.name)
  return <main className="page-shell">
    <SectionTitle eyebrow="Paired label analysis" title="Compare" description="Inspect decision shifts, scoring cost, and criterion-level disagreement on the same completed traces." actions={<SavedPairControls onSave={onSavePair} />} />
    <Paper className="pair-picker" withBorder><div><span className="pair-letter a">A</span><Select label="Reference label" aria-label="Select label A" value={state.compareA} onChange={(value) => state.setCompare('A', value)} data={labelOptions.map((name) => ({ value: name, label: name, disabled: name === state.compareB }))} searchable clearable error={state.compareError?.startsWith('labelA') ? state.compareError : null} /></div><IconChevronRight className="pair-arrow" size={22}  aria-hidden="true" /><div><span className="pair-letter b">B</span><Select label="Candidate label" aria-label="Select label B" value={state.compareB} onChange={(value) => state.setCompare('B', value)} data={labelOptions.map((name) => ({ value: name, label: name, disabled: name === state.compareA }))} searchable clearable error={state.compareError?.startsWith('labelB') ? state.compareError : null} /></div><div className="pair-context"><span>{rows.length} paired traces</span><small>Positive delta means B improved</small></div></Paper>
    <FilterBar />
    {!summary || !state.compareA || !state.compareB ? <Paper withBorder><EmptyState icon={IconAdjustments} title="Pick Two Distinct Labels">Choose a reference label A and candidate label B to generate paired rewards, cost totals, and criterion flips.</EmptyState></Paper> : <>
      <div className="summary-layout"><Paper className="summary-strip" withBorder><SummaryMetric label="Mean Δ (B − A)" value={`${summary.meanDelta >= 0 ? '+' : ''}${summary.meanDelta.toFixed(3)}`} tone={summary.meanDelta >= 0 ? 'good' : 'bad'} /><SummaryMetric label="Wins / losses / ties" value={`${summary.wins} / ${summary.losses} / ${summary.ties}`} /><CostDisclosure side="A" label={state.compareA} total={summary.costA} rows={rows} /><CostDisclosure side="B" label={state.compareB} total={summary.costB} rows={rows} /><SummaryMetric label="Cost Δ" value={`${summary.costB - summary.costA >= 0 ? '+' : '−'}$${Math.abs(summary.costB - summary.costA).toFixed(3)}`} /></Paper><PassWheel summary={summary} /></div>
      <div className="compare-grid"><CompareChart rows={rows} labelA={state.compareA} labelB={state.compareB} highlightedTrialId={state.highlightedTrialId} setHighlighted={state.highlightTrial} /><AttributionRollup labelA={state.compareA} labelB={state.compareB} /></div>
      <Paper className="table-card paired-card" withBorder><div className="table-toolbar"><div><h2>Paired Trial Results</h2><p>Open a row to inspect all 16 criterion verdicts.</p></div><Badge variant="filled">{rows.length} common trials</Badge></div><div className="table-scroll"><Table verticalSpacing="sm" highlightOnHover><Table.Thead><Table.Tr><Table.Th>Trial / task</Table.Th><Table.Th>{state.compareA} · A</Table.Th><Table.Th>{state.compareB} · B</Table.Th><Table.Th><button className="sort-header" onClick={() => state.setSort('delta-size')}>Δ B − A <IconArrowsSort size={13}  aria-hidden="true" /></button></Table.Th><Table.Th /></Table.Tr></Table.Thead><Table.Tbody ref={parent}>{rows.map((trial) => { const delta = trial.results[state.compareB].totalReward - trial.results[state.compareA].totalReward; return <Table.Tr id={`pair-${trial.id}`} key={trial.id} className={state.highlightedTrialId === trial.id ? 'highlight-row' : ''}><Table.Td><div className="trial-cell"><strong>{trial.id}</strong><span>{trial.taskName}</span></div></Table.Td><Table.Td><ScoreBadge result={trial.results[state.compareA]} /></Table.Td><Table.Td><ScoreBadge result={trial.results[state.compareB]} /></Table.Td><Table.Td><Delta value={delta} /></Table.Td><Table.Td><Button variant="subtle" size="compact-sm" rightSection={<IconChevronRight size={14}  aria-hidden="true" />} onClick={() => state.openTrial(trial.id)}>Open diff</Button></Table.Td></Table.Tr> })}</Table.Tbody></Table></div>{!rows.length && <EmptyState title="No Paired Trials Match">Clear a filter to restore trials shared by both selected labels.</EmptyState>}</Paper>
    </>}
    <TrialDiffModal onAttribute={openAttribution} />
    <AttributionModal context={state.attributionContext} onClose={() => state.setAttributionContext(null)} />
  </main>
}

function FlipRow({ criterionA, criterionB, labelA, labelB, trialId, onAttribute }) {
  const [expanded, setExpanded] = useState(false)
  const attributions = useLabStore((state) => state.attributions);
  const attribution = attributions.find((item) => item.trialId === trialId && item.criterionId === criterionA.id && item.labelA === labelA && item.labelB === labelB);
  return <div className="flip-row"><div className="flip-main" onClick={() => setExpanded(v => !v)} style={{ cursor: "pointer" }}><button className="flip-expander" aria-expanded={expanded} onClick={(e) => { e.stopPropagation(); setExpanded((value) => !value); }}><IconChevronRight size={17} className={expanded ? 'rotated' : ''}  aria-hidden="true" /><span><strong>{criterionA.title || criterionA.id}</strong><small>{criterionA.id}</small></span></button><div className="verdict-pair"><Badge color={criterionA.verdict === 'pass' ? 'teal' : 'red'} variant="filled">A · {criterionA.verdict}</Badge><IconChevronRight size={14}  aria-hidden="true" /><Badge color={criterionB.verdict === 'pass' ? 'teal' : 'red'} variant="filled">B · {criterionB.verdict}</Badge></div>{attribution && <Badge color="violet" variant="outline">{causeLabels[attribution.cause]}</Badge>}<Button variant="subtle" size="compact-sm" onClick={(e) => { e.stopPropagation(); onAttribute({ criterionA, criterionB, attribution }); }}>{attribution ? 'Edit attribution' : 'Attribute'}</Button></div><div className={expanded ? 'reasoning open' : 'reasoning'} aria-hidden={!expanded}><div><span>{labelA}</span><p>{criterionA.reasoning}</p></div><div><span>{labelB}</span><p>{criterionB.reasoning}</p></div></div></div>
}

function TrialDiffModal({ onAttribute, suspendEscape = false }) {
  const { openedTrialId, closeTrial, trials, compareA, compareB } = useLabStore()
  const trial = trials.find((item) => item.id === openedTrialId)
  if (!trial || !compareA || !compareB) return null
  const resultA = trial.results[compareA]
  const resultB = trial.results[compareB]
  if (!resultA || !resultB) return null
  const groups = [
    { id: 'only-a', title: `Failing Only Under ${compareA}`, tone: 'a', criteria: resultA.criteria.filter((item, index) => item.verdict === 'fail' && resultB.criteria[index].verdict === 'pass') },
    { id: 'only-b', title: `Failing Only Under ${compareB}`, tone: 'b', criteria: resultA.criteria.filter((item, index) => item.verdict === 'pass' && resultB.criteria[index].verdict === 'fail') },
    { id: 'agreements', title: 'Agreements', tone: 'agree', criteria: resultA.criteria.filter((item, index) => item.verdict === resultB.criteria[index].verdict) },
  ]
  const flips = groups[0].criteria.length + groups[1].criteria.length
  return <Modal opened onClose={closeTrial} closeOnEscape={!suspendEscape} closeOnClickOutside={!suspendEscape} size="xl" keepMounted={true} withinPortal={false} title={<div><Text size="xs" c="dimmed">Criterion verdict diff</Text><Text fw={700}>{trial.id} · {trial.taskName}</Text></div>}>
    <div className="diff-summary"><div><span className="pair-letter a">A</span><span className="diff-label"><strong>{compareA}</strong><small>{resultA.scorerModel} · ${resultA.scorerCost.toFixed(3)} · {resultA.toolCalls} calls · {resultA.duration.toFixed(1)}s</small></span><b>{resultA.totalReward.toFixed(2)}</b></div><IconChevronRight size={18}  aria-hidden="true" /><div><span className="pair-letter b">B</span><span className="diff-label"><strong>{compareB}</strong><small>{resultB.scorerModel} · ${resultB.scorerCost.toFixed(3)} · {resultB.toolCalls} calls · {resultB.duration.toFixed(1)}s</small></span><b>{resultB.totalReward.toFixed(2)}</b></div><Badge color={flips ? 'orange' : 'teal'} variant="filled">{flips} verdict flip{flips === 1 ? '' : 's'}</Badge></div>
    <div className="dimension-scores" aria-label="Dimension score comparison">{DIMENSIONS.map((dimension) => <div key={dimension}><span>{dimension}</span><strong><i>A</i> {resultA.dimensions[dimension].toFixed(2)}</strong><strong><i>B</i> {resultB.dimensions[dimension].toFixed(2)}</strong></div>)}</div>
    {flips === 0 ? <EmptyState icon={IconCircleCheck} title="The two labels fully agree on this trial">All 16 criteria have matching pass/fail verdicts across correctness, visual, motion, and technical. The reward may still differ because the labels weight evidence differently.</EmptyState> : <div className="diff-groups">{groups.map((group) => <section key={group.id} className={`diff-group ${group.tone}`}><div className="diff-group-title"><h3>{group.title}</h3><Badge variant="filled">{group.criteria.length}</Badge></div>{group.criteria.length ? DIMENSIONS.map((dimension) => { const dimensionCriteria = group.criteria.filter((criterion) => criterion.dimension === dimension); return dimensionCriteria.length ? <div className="dimension-block" key={dimension}><h4>{dimension}</h4>{dimensionCriteria.map((criterionA) => { const criterionB = resultB.criteria.find((item) => item.id === criterionA.id); return criterionA.verdict !== criterionB.verdict ? <FlipRow key={criterionA.id} criterionA={criterionA} criterionB={criterionB} labelA={compareA} labelB={compareB} trialId={trial.id} onAttribute={onAttribute} /> : <div key={criterionA.id} className="agreement-row"><span>{criterionA.title || criterionA.id}</span><Badge color={criterionA.verdict === 'pass' ? 'teal' : 'red'} variant="filled">Both {criterionA.verdict}</Badge></div> })}</div> : null }) : <p className="group-empty">No criteria in this group.</p>}</section>)}</div>}
  </Modal>
}

function AttributionModal({ context, onClose }) {
  const saveAttribution = useLabStore((state) => state.saveAttribution)
  const { register, control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(attributionInputSchema), defaultValues: { cause: context?.attribution?.cause || '', note: context?.attribution?.note || '' } })
  if (!context) return null
  const submit = (values) => {
    saveAttribution({ trialId: context.trialId, criterionId: context.criterionA.id, labelA: context.labelA, labelB: context.labelB, cause: values.cause, note: values.note })
    onClose()
  }
  return <Modal opened onClose={onClose} title="Attribute verdict flip" size="md" keepMounted={true} withinPortal={false}><form onSubmit={handleSubmit(submit)} noValidate className="modal-form"><div className="form-context"><span>{context.trialId}</span><strong>{context.criterionA.title || context.criterionA.id}</strong><small>{context.labelA} → {context.labelB}</small></div><Controller name="cause" control={control} render={({ field }) => <Select {...field} label="Cause" placeholder="Choose a closed-enum cause" data={Object.entries(causeLabels).map(([value, label]) => ({ value, label }))} error={errors.cause?.message} required />} /><Textarea label="Note" description="Optional operator context, up to 200 characters." minRows={3} maxLength={201} {...register('note')} error={errors.note?.message} /><Group justify="flex-end"><Button variant="default" onClick={onClose}>Cancel</Button><Button type="submit">Save attribution</Button></Group></form></Modal>
}

function SavePairModal({ opened, onClose }) {
  const { compareA, compareB, savedPairs, labels, savePair } = useLabStore()
  const schema = useMemo(() => createSavedPairSchema(savedPairs, labels.map((label) => label.name)), [savedPairs, labels])
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema), values: { name: '', labelA: compareA || '', labelB: compareB || '' } })
  const submit = (record) => { savePair(record); reset(); onClose() }
  return <Modal opened={opened} onClose={onClose} title="Save comparison pair"><form onSubmit={handleSubmit(submit)} className="modal-form" noValidate><TextInput label="Pair name" placeholder="e.g. Weekly rubric check" {...register('name')} error={errors.name?.message} required /><input type="hidden" {...register('labelA')} /><input type="hidden" {...register('labelB')} /><div className="locked-pair"><div><span>Label A</span><strong>{compareA || 'Not selected'}</strong></div><IconChevronRight size={16}  aria-hidden="true" /><div><span>Label B</span><strong>{compareB || 'Not selected'}</strong></div></div>{errors.labelB && <p className="field-error">{errors.labelB.message}</p>}<Group justify="flex-end"><Button variant="default" onClick={onClose}>Cancel</Button><Button type="submit">Save comparison pair</Button></Group></form></Modal>
}

function RunPanel() {
  const { run, selectRunStep } = useLabStore()
  const [eventFilter, setEventFilter] = useState('all')
  if (!run.label) return null
  const complete = run.steps.filter((step) => step.status === 'complete').length
  const events = run.events.filter((event) => eventFilter === 'all' || event.status === eventFilter)
  return <div className="run-panel"><div className="run-top"><div><span className="eyebrow">Live rescore</span><h2>{run.label.labelName}</h2><p>{run.label.scorerModel} · {run.label.configNote || 'No config note'}</p></div><div className="run-count"><strong>{complete} <i>/ 12</i></strong><span>steps complete</span></div></div><Progress value={(complete / 12) * 100} animated={run.active} size="lg" radius="xl" aria-label={`${complete} of 12 steps complete`} /><div className="run-rollups"><SummaryMetric label="Steps complete" value={`${complete}/12`} /><SummaryMetric label="Failures encountered" value={run.failures} tone={run.failures ? 'bad' : ''} /><SummaryMetric label="Elapsed" value={`${(run.elapsed / 1000).toFixed(1)}s`} /></div><div className="run-columns"><div className="steps-list" aria-label="Rescore steps">{run.steps.map((step) => <button key={step.trialId} className={`${step.status} ${run.selectedStep === step.trialId ? 'selected' : ''}`} onClick={() => selectRunStep(step.trialId)}><span className="step-icon">{step.status === 'complete' ? <IconCheck size={15}  aria-hidden="true" /> : step.status === 'running' ? <i className="spinner" /> : step.status === 'retrying' ? <IconRefresh size={15}  aria-hidden="true" /> : <i />}</span><span><strong>{step.trialId}</strong><small>{step.taskName}</small></span><b>{step.status === 'retrying' ? `retry ${step.attempt} of 3` : step.status}</b></button>)}</div><div className="timeline"><div className="timeline-head"><strong>Event Timeline</strong><Select size="xs" aria-label="Filter run events" value={eventFilter} onChange={setEventFilter} data={['all', 'started', 'running', 'retrying', 'complete']} /></div><ScrollArea.Autosize mah={430}><ol>{events.map((event) => <li key={event.id}><button onClick={() => event.trialId && selectRunStep(event.trialId)}><i className={event.status} /><span><strong>{event.text}</strong><small>{event.time}</small></span></button></li>)}</ol></ScrollArea.Autosize></div></div></div>
}

function RescoreModal({ opened, onClose }) {
  const { labels, startRescore, run } = useLabStore()
  const schema = useMemo(() => createRescoreSchema(labels), [labels])
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { labelName: '', scorerModel: '', configNote: '' } })
  const submit = (record) => { startRescore(record); reset() }
  const canClose = !run.active
  return <Modal opened={opened} onClose={() => canClose && onClose()} closeOnEscape={canClose} withCloseButton={canClose} size={run.label ? 'xl' : 'md'} title={run.label ? 'Rescore run' : 'Rescore with new label'}>
    {!run.label || (!run.active && !run.completed) ? <form onSubmit={handleSubmit(submit)} className="modal-form" noValidate><div className="form-intro"><span className="form-icon"><IconSparkles size={20}  aria-hidden="true" /></span><div><strong>Create An Alternative Scoring Label</strong><p>The 12 completed traces will be rescored in place. One step demonstrates retry handling.</p></div></div><TextInput label="Label name" placeholder="e.g. Rubric v3" {...register('labelName')} error={errors.labelName?.message} required /><Controller name="scorerModel" control={control} render={({ field }) => <Select {...field} label="Scorer model" placeholder="Choose a scorer" data={SCORER_MODELS} error={errors.scorerModel?.message} required />} /><Textarea label="Config note" description="Optional, up to 120 characters." maxLength={121} {...register('configNote')} error={errors.configNote?.message} /><Group justify="flex-end"><Button variant="default" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting || run.active} leftSection={<IconPlayerPlay size={16}  aria-hidden="true" />}>Start rescore</Button></Group></form> : <RunPanel />}
    {run.completed && <Group justify="flex-end" mt="md"><Button onClick={onClose}>Done</Button></Group>}
  </Modal>
}

function CostView() {
  const { labels, trials } = useLabStore()
  const [visibleState, setVisible] = useState(() => Object.fromEntries(labels.map((label) => [label.name, true])))
  const visible = useMemo(() => Object.fromEntries(labels.map((label) => [label.name, visibleState[label.name] ?? true])), [labels, visibleState])
  const [copied, setCopied] = useState(null)

  const data = trials.map((trial, index) => {
    const row = { event: index + 1, trial: trial.id }
    labels.forEach((label) => { row[label.name] = Number(trials.slice(0, index + 1).reduce((sum, item) => sum + (item.results[label.name]?.scorerCost ?? 0), 0).toFixed(3)) })
    return row
  })
  const active = labels.filter((label) => visible[label.name])
  const copyConfig = async (label) => {
    const text = `label: ${label.name}\nscorerModel: ${label.scorerModel}\nconfigNote: ${label.configNote}`
    await copyToClipboard(text); setCopied(label.name); setTimeout(() => setCopied(null), 1800)
  }
  return <main className="page-shell"><SectionTitle eyebrow="Scoring spend" title="Cost analytics" description="Audit cumulative scoring cost in completed-trial order. Every series ends at the same derived total used throughout the lab." />
    <Paper className="chart-card cost-chart-card" withBorder><div className="card-heading"><div><span className="eyebrow">Cumulative cost</span><h2>Cost Across Ordered Rescore Events</h2></div><span>USD · {trials.length} events</span></div><div className="legend-controls" aria-label="Toggle cost series">{labels.map((label, index) => <button key={label.name} aria-pressed={!!visible[label.name]} onClick={() => setVisible((current) => ({ ...current, [label.name]: !current[label.name] }))} className={visible[label.name] ? 'active' : ''}><i style={{ background: palette[index % palette.length] }} />{label.name}<strong>${(data.at(-1)?.[label.name] ?? 0).toFixed(3)}</strong></button>)}</div>{active.length ? <div className="cost-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 20, bottom: 8, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" /><XAxis dataKey="event" /><YAxis tickFormatter={(value) => `$${value.toFixed(1)}`} /><ChartTooltip content={({ active: isActive, payload, label }) => isActive && payload?.length ? <div className="chart-tooltip"><strong>Event {label}</strong>{payload.map((item) => <div key={item.name}><i style={{ background: item.stroke }} />{item.name} <b>${item.value.toFixed(3)}</b></div>)}</div> : null} />{labels.map((item, index) => visible[item.name] && <Line key={item.name} type="monotone" dataKey={item.name} stroke={palette[index % palette.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} animationDuration={500} />)}</LineChart></ResponsiveContainer></div> : <EmptyState icon={IconCoin} title="No Cost Series Selected">Re-enable a label in the legend to restore its cumulative cost line.</EmptyState>}</Paper>
    <div className="config-grid">{labels.map((label, index) => <Paper key={label.name} className="config-card" withBorder><div className="config-head"><i style={{ background: palette[index % palette.length] }} /><div><strong>{label.name}</strong><span>${(data.at(-1)?.[label.name] ?? 0).toFixed(3)} total</span></div></div><pre>{`label: ${label.name}\nscorerModel: ${label.scorerModel}\nconfigNote: ${label.configNote}`}</pre><Button variant="subtle" size="sm" leftSection={copied === label.name ? <IconCheck size={15}  aria-hidden="true" /> : <IconCopy size={15}  aria-hidden="true" />} onClick={() => copyConfig(label)}>{copied === label.name ? 'Copied exactly' : 'Copy config'}</Button></Paper>)}</div>
  </main>
}

function ExportModal({ opened, onClose }) {
  const state = useLabStore()
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString())
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (opened) { setGeneratedAt(new Date().toISOString()); setImportError(''); setImportSuccess('') } }, [opened])
  useEffect(() => { if (opened) setGeneratedAt(new Date().toISOString()) }, [state.labels, state.trials, state.attributions, state.savedPairs, state.compareA, state.compareB, state.filters])
  let document
  let json = ''
  try { document = compileLabResults(state, generatedAt); json = JSON.stringify(document, null, 2) } catch (error) { json = JSON.stringify({ schemaVersion: 'rescore-ab-lab-v1', error: formatZodError(error) }, null, 2) }
  const copy = async () => { await copyToClipboard(json); setCopied(true); setTimeout(() => setCopied(false), 1800) }
  const download = () => { const url = URL.createObjectURL(new Blob([json], { type: 'application/json' })); const link = window.document.createElement('a'); link.href = url; link.download = 'lab-results.json'; link.click(); URL.revokeObjectURL(url) }
  const importFile = async (event) => {
    const file = event.target.files?.[0]; if (!file) return
    try { const value = JSON.parse(await file.text()); const parsed = labResultsSchema.safeParse(value); if (!parsed.success) throw parsed.error; state.importDocument(parsed.data); setImportSuccess('Import complete: attributions, saved pairs, labels, and trial results restored.'); setImportError(''); setGeneratedAt(new Date().toISOString()) } catch (error) { setImportError(error instanceof SyntaxError ? 'document: malformed JSON' : formatZodError(error)); setImportSuccess('') }
    event.target.value = ''
  }
  return <Modal opened={opened} onClose={onClose} size="xl" title={<div><Text size="xs" c="dimmed">API-shaped artifact</Text><Text fw={700}>Export lab results</Text></div>} classNames={{ body: 'export-body' }}>
    <div className="export-layout"><div className="export-meta"><div className="schema-stamp"><IconCode size={18}  aria-hidden="true" /><div><strong>rescore-ab-lab-v1</strong><span>Schema valid · generated live</span></div></div><div className="export-counts"><div><strong>{state.labels.length}</strong><span>labels</span></div><div><strong>{state.trials.length}</strong><span>trials</span></div><div><strong>{state.attributions.length}</strong><span>attributions</span></div><div><strong>{state.savedPairs.length}</strong><span>saved pairs</span></div></div><p>The preview includes every required top-level key and reflects all in-session rescoring, attribution, and pair mutations.</p><Stack gap="xs"><Button leftSection={<IconDownload size={16}  aria-hidden="true" />} onClick={download}>Download JSON</Button><Button variant="default" leftSection={copied ? <IconCheck size={16}  aria-hidden="true" /> : <IconClipboard size={16}  aria-hidden="true" />} onClick={copy}>{copied ? 'Copied exact JSON' : 'Copy'}</Button><Button variant="default" leftSection={<IconUpload size={16}  aria-hidden="true" />} onClick={() => inputRef.current?.click()}>Import lab results</Button><input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importFile} /></Stack>{importError && <div className="import-message error" role="alert"><IconCircleX size={16}  aria-hidden="true" /><span><strong>Import rejected</strong>{importError}. No state was changed.</span></div>}{importSuccess && <div className="import-message success" role="status"><IconCircleCheck size={16}  aria-hidden="true" /><span>{importSuccess}</span></div>}</div><div className="json-preview"><div><span>lab-results.json</span><Badge color="teal" variant="filled">Valid JSON</Badge></div><pre tabIndex="0">{json}</pre></div></div>
  </Modal>
}

function fuzzyMatch(query, value) {
  const q = query.toLowerCase().replace(/\s/g, '')
  const v = value.toLowerCase().replace(/\s/g, '')
  let qi = 0
  for (let index = 0; index < v.length && qi < q.length; index += 1) if (v[index] === q[qi]) qi += 1
  return qi === q.length
}

function CommandPalette({ opened, onClose, onRescore, onExport }) {
  const { labels, setView, setCompare } = useLabStore()
  const [query, setQuery] = useState('')
  const [assignLabel, setAssignLabel] = useState(null)
  useEffect(() => { if (!opened) { setQuery(''); setAssignLabel(null) } }, [opened])
  const commands = [
    { id: 'experiments', label: 'Go to Experiments', hint: 'View destination', icon: IconLayoutGrid, run: () => setView('experiments') },
    { id: 'compare', label: 'Go to Compare', hint: 'View destination', icon: IconAdjustments, run: () => setView('compare') },
    { id: 'cost', label: 'Go to Cost', hint: 'View destination', icon: IconCoin, run: () => setView('cost') },
    { id: 'rescore', label: 'Rescore with new label', hint: 'Action', icon: IconSparkles, run: onRescore },
    { id: 'export', label: 'Export lab results', hint: 'Action', icon: IconFileExport, run: onExport },
    ...labels.map((label) => ({ id: `label-${label.name}`, label: label.name, hint: 'Assign compare label', icon: IconBolt, run: () => setAssignLabel(label.name) })),
  ]
  const matches = commands.filter((item) => fuzzyMatch(query, item.label))
  const run = (command) => { command.run(); if (!command.id.startsWith('label-')) onClose() }
  return <Modal opened={opened} onClose={onClose} withCloseButton={false} size="lg" padding={0} className="palette-modal" transitionProps={{ transition: 'pop', duration: 220 }}>
    <div className="palette-search"><IconSearch size={19}  aria-hidden="true" /><input autoFocus aria-label="Search commands" placeholder="Type a view, action, or label…" value={query} onChange={(event) => { setQuery(event.target.value); setAssignLabel(null) }} /><kbd>ESC</kbd></div><Divider />
    {assignLabel ? <div className="assignment"><span className="eyebrow">Assign Label</span><h3>{assignLabel}</h3><p>Choose which side of Compare should use this label.</p><div><Button onClick={() => { setCompare('A', assignLabel); setView('compare'); onClose() }}>Set as label A</Button><Button variant="default" onClick={() => { setCompare('B', assignLabel); setView('compare'); onClose() }}>Set as label B</Button></div><Button variant="subtle" onClick={() => setAssignLabel(null)}>Back to commands</Button></div> : <ScrollArea.Autosize mah={420}><div className="command-list">{matches.map((command) => { const Icon = command.icon; return <button key={command.id} onClick={() => run(command)}><span><Icon aria-hidden="true" size={18} /></span><div><strong>{command.label}</strong><small>{command.hint}</small></div><IconChevronRight size={15}  aria-hidden="true" /></button> })}{!matches.length && <EmptyState icon={IconSearch} title="No Matching Command">Type “Cost”, “Export”, “Rescore”, or any existing label name.</EmptyState>}{!query && <p className="palette-tip">Start typing to fuzzy-match views, actions, and labels.</p>}</div></ScrollArea.Autosize>}
  </Modal>
}

function Toast() {
  const { toast, dismissToast } = useLabStore()
  useEffect(() => {
    if (!toast) return
    notifications.show({ id: `lab-${toast.id}`, title: 'Lab updated', message: toast.message, color: 'teal', icon: <IconCheck size={16}  aria-hidden="true" />, autoClose: 3200, withCloseButton: true })
    dismissToast()
  }, [toast, dismissToast])
  return null
}

function useKeyboardPalette(setOpened) {
  useEffect(() => { const handler = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpened((value) => !value) } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [setOpened])
}

function useWebMcp(actions) {
  useEffect(() => {
    window.__rescoreLabActions = actions
    const tools = [
      ['browse_open', 'Open a bounded lab destination.', { type: 'object', properties: { destination: { enum: ['experiments', 'compare', 'cost', 'trial-criterion-diff'] }, trialId: { type: 'string' } }, required: ['destination'] }, ({ destination, trialId }) => window.__rescoreLabActions.open(destination, trialId)],
      ['browse_search', 'Search the visible trial collection by bounded task or trial text.', { type: 'object', properties: { query: { type: 'string', maxLength: 80 } }, required: ['query'] }, ({ query }) => window.__rescoreLabActions.search(query)],
      ['browse_apply_filter', 'Apply one declared lab filter.', { type: 'object', properties: { filter: { enum: ['task', 'pass-fail', 'delta-size', 'label-columns', 'compare-pair', 'suggestion-chip'] }, value: {} }, required: ['filter', 'value'] }, ({ filter, value }) => window.__rescoreLabActions.applyFilter(filter, value)],
      ['browse_clear_filter', 'Clear shared experiment and comparison filters.', { type: 'object', properties: {} }, () => window.__rescoreLabActions.clearFilters()],
      ['browse_sort', 'Sort trials using a declared sort.', { type: 'object', properties: { sort: { enum: ['task-name', 'label-reward', 'delta-size'] }, label: { type: 'string' } }, required: ['sort'] }, ({ sort, label }) => window.__rescoreLabActions.sort(sort, label)],

      ['entity_create', 'Create a validated attribution record.', { type: 'object', properties: { trialId: { type: 'string' }, criterionId: { type: 'string' }, labelA: { type: 'string' }, labelB: { type: 'string' }, cause: { enum: ['scorer-noise', 'rubric-change-effect', 'harness-change-effect'] }, note: { type: 'string', maxLength: 200 } }, required: ['trialId', 'criterionId', 'labelA', 'labelB', 'cause', 'note'] }, (input) => window.__rescoreLabActions.createAttribution(input)],
      ['entity_select', 'Select a trial for criterion diff.', { type: 'object', properties: { trialId: { type: 'string' } }, required: ['trialId'] }, ({ trialId }) => window.__rescoreLabActions.selectTrial(trialId)],
      ['entity_update', 'Update a validated attribution record.', { type: 'object', properties: { trialId: { type: 'string' }, criterionId: { type: 'string' }, labelA: { type: 'string' }, labelB: { type: 'string' }, cause: { enum: ['scorer-noise', 'rubric-change-effect', 'harness-change-effect'] }, note: { type: 'string', maxLength: 200 } }, required: ['trialId', 'criterionId', 'labelA', 'labelB', 'cause', 'note'] }, (input) => window.__rescoreLabActions.createAttribution(input)],
      ['session_start', 'Start the rescore-run demo using a validated label payload.', { type: 'object', properties: { demo: { enum: ['rescore-run'] }, labelName: { type: 'string', minLength: 1, maxLength: 80 }, scorerModel: { enum: SCORER_MODELS }, configNote: { type: 'string', maxLength: 120 } }, required: ['demo', 'labelName', 'scorerModel', 'configNote'] }, (input) => window.__rescoreLabActions.startRun(input)],
      ['artifact_export', 'Open the lab-results JSON export panel.', { type: 'object', properties: { format: { enum: ['lab-results-json', 'config-summary-text'] } }, required: ['format'] }, ({ format }) => window.__rescoreLabActions.exportArtifact(format)],
      ['artifact_import', 'Open the bounded lab-results JSON import control.', { type: 'object', properties: { mode: { enum: ['lab-results-json'] } }, required: ['mode'] }, () => window.__rescoreLabActions.openImport()],
      ['artifact_copy', 'Open the UI containing bounded artifact copy controls.', { type: 'object', properties: { format: { enum: ['lab-results-json', 'config-summary-text'] } }, required: ['format'] }, ({ format }) => window.__rescoreLabActions.exportArtifact(format)],
    ]
    window.webmcp_session_info = () => ({
      contractVersion: 'zto-webmcp-v1',
      modules: ['browse-query-v1', 'entity-collection-v1', 'command-session-v1', 'artifact-transfer-v1'],
      toolNames: tools.map(([name]) => name),
    })
    window.webmcp_list_tools = () => tools.map(([name, description, inputSchema]) => ({ name, description, inputSchema }))
    window.webmcp_invoke_tool = async (name, args = {}) => {
      const tool = tools.find(([toolName]) => toolName === name)
      if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`)
      return tool[3](args)
    }
    const modelContext = navigator.modelContext
    if (!modelContext?.registerTool || window.__rescoreWebMcpRegistered) return
    window.__rescoreWebMcpRegistered = true
    tools.forEach(([name, description, inputSchema, execute]) => {
      try { modelContext.registerTool({ name, description, inputSchema, execute: async (input) => ({ content: [{ type: 'text', text: JSON.stringify(await execute(input)) }] }) }) }
      catch (error) { if (error?.name !== 'InvalidStateError') console.warn(`WebMCP ${name} registration failed`, error) }
    })
  }, [actions])
}

function AppInner() {
  const state = useLabStore()
  const [rescoreOpen, setRescoreOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [savePairOpen, setSavePairOpen] = useState(false)

  useKeyboardPalette(setPaletteOpen)
  useEffect(() => {
    const interval = setInterval(() => {
      document.querySelectorAll('button.mantine-NumberInput-control, button.mantine-Pill-remove, button.mantine-InputClearButton-root, button.mantine-CloseButton-root').forEach(b => {
        if (b.getAttribute('tabindex') === '-1' && !b.hasAttribute('disabled')) {
          b.setAttribute('tabindex', '0');
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [])

  useEffect(() => { document.documentElement.dataset.theme = state.theme }, [state.theme])

  const webActions = useMemo(() => ({
    open: (destination, trialId) => { flushSync(() => { if (destination === 'trial-criterion-diff') { state.setView('compare'); if (trialId) state.openTrial(trialId) } else state.setView(destination); }); return { visibleDestination: destination } },
    search: (query) => { let matchedTrial = null; flushSync(() => { const trial = state.trials.find((item) => item.id.includes(query) || item.taskName.includes(query)); if (trial) { state.setFilter('task', trial.taskName); matchedTrial = trial.id; } }); return { matchedTrial } },
    applyFilter: (filter, value) => { flushSync(() => { if (filter === 'task') state.setFilter('task', value); else if (filter === 'pass-fail') { state.setFilter('passState', value.state); state.setFilter('passLabel', value.label) } else if (filter === 'delta-size') state.setFilter('deltaMin', Number(value)); else if (filter === 'label-columns') state.setShownLabels(value); else if (filter === 'compare-pair') { state.setCompare('A', value.labelA); state.setCompare('B', value.labelB) } else state.toggleChip(value); }); return { applied: filter } },
    clearFilters: () => { flushSync(() => state.clearFilters()); return { visibleTrials: 12 } },
    sort: (sort, label) => { flushSync(() => state.setSort(sort, label)); return { sort } },
    setTheme: (theme) => { flushSync(() => state.setTheme(theme)); return { theme } },
    createAttribution: (record) => { flushSync(() => state.saveAttribution(record)); return { saved: true, cause: record.cause } },
    selectTrial: (trialId) => { flushSync(() => { state.setView('compare'); state.openTrial(trialId); }); return { trialId } },
    startRun: ({ demo, ...payload }) => { setRescoreOpen(true); state.startRescore(payload); return { started: demo, labelName: payload.labelName } },
    exportArtifact: (format) => { flushSync(() => { if (format === 'lab-results-json') setExportOpen(true); else state.setView('cost'); }); return { opened: format } },
    openImport: () => { flushSync(() => setExportOpen(true)); return { opened: 'lab-results-json' } },
  }), [state])
  useWebMcp(webActions)
  const openRescore = () => { state.prepareRescore(); setRescoreOpen(true) }
  return <div className="app-root"><Header onRescore={openRescore} onExport={() => setExportOpen(true)} onPalette={() => setPaletteOpen(true)} /><div style={{ display: state.activeView === 'experiments' ? 'block' : 'none' }}><ExperimentsView /></div>
   <div style={{ display: state.activeView === 'compare' ? 'block' : 'none' }}><CompareView onSavePair={() => setSavePairOpen(true)} /></div>
   <div style={{ display: state.activeView === 'cost' ? 'block' : 'none' }}><CostView /></div>
    <SavePairModal opened={savePairOpen} onClose={() => setSavePairOpen(false)} />
    <RescoreModal opened={rescoreOpen} onClose={() => setRescoreOpen(false)} />
    <ExportModal opened={exportOpen} onClose={() => setExportOpen(false)} />
    <CommandPalette opened={paletteOpen} onClose={() => setPaletteOpen(false)} onRescore={() => { setPaletteOpen(false); openRescore() }} onExport={() => { setPaletteOpen(false); setExportOpen(true) }} />
    <Toast /><div className="visually-hidden" aria-live="polite">{state.liveMessage}</div>
  </div>
}

export default function App() {
  const theme = useLabStore((state) => state.theme)
  return <MantineProvider forceColorScheme={theme} theme={{ primaryColor: 'violet', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', defaultRadius: 'md' }}><Notifications position="bottom-right" zIndex={1200} /><AppInner /></MantineProvider>
}
