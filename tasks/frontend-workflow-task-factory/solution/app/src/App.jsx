import { useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconActivity, IconAlertTriangle, IconArrowLeft, IconArrowRight, IconBinaryTree,
  IconBook2, IconChartHistogram, IconCheck, IconCircleCheck,
  IconCircleDashed, IconCircleX, IconClipboard, IconClock, IconCode, IconDatabase,
  IconChevronDown, IconDownload, IconExternalLink, IconFile, IconFileCode, IconFilter, IconGitPullRequest,
  IconHistory, IconInfoCircle, IconLoader2, IconMenu2, IconMinus, IconPlayerSkipForward,
  IconPlus, IconRefresh, IconSearch, IconServer, IconSparkles, IconStack2, IconTerminal2, IconX,
} from '@tabler/icons-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Button, Badge, Card, EmptyState, Select, ToastStack } from './components/ui'
import { cn, downloadText, formatTime } from './lib/utils'
import { createTaskSchema, repositoryIds, taskManifestSchema } from './lib/schemas'
import {
  acceptedTasks, EVENT_STATUSES, isAccepted, repositoryRollup, STAGES,
  useFactoryStore, VERDICTS,
} from './store/factoryStore'

const VERDICT_COLORS = {
  'good-success': '#2b8a62',
  'bad-success': '#db7835',
  'good-failure': '#3c82c4',
  'bad-failure': '#bc4961',
  'infrastructure-error': '#7d64b4',
}
const LANG_COLORS = ['#2c6e56', '#6d9f71', '#93ba78', '#cfb45c', '#8073b3']

function statusIcon(status, size = 13) {
  if (status === 'complete') return <IconCheck className="status-icon" size={size} stroke={2.5} />
  if (status === 'running') return <IconLoader2 className="status-icon running-spin" size={size} />
  if (status === 'failed') return <IconX className="status-icon" size={size} stroke={2.5} />
  if (status === 'skipped') return <IconPlayerSkipForward className="status-icon" size={size} />
  return <IconCircleDashed className="status-icon" size={size} />
}

function StageStrip({ stages }) {
  return (
    <div className="stage-strip" aria-label="Pipeline stages">
      {stages.map((stage) => (
        <div
          className={cn('stage-cell', `stage-${stage.status}`)}
          key={stage.name}
          title={`${stage.name}: ${stage.status}, attempt ${stage.attemptCount}${stage.completedAt ? ` · completed ${formatTime(stage.completedAt)} UTC` : stage.startedAt ? ` · started ${formatTime(stage.startedAt)} UTC` : ''}`}
          aria-label={`${stage.name} stage, ${stage.status}, attempt ${stage.attemptCount}${stage.completedAt ? `, completed ${formatTime(stage.completedAt)} UTC` : ''}`}
        >
          {statusIcon(stage.status)}
          <span>
            <span className="stage-name">{stage.name}</span>
            <span className="stage-status">{stage.status}</span>
          </span>
          {(stage.attemptCount > 1 || ['running', 'failed'].includes(stage.status)) && <span className="stage-attempt">a{stage.attemptCount}</span>}
        </div>
      ))}
    </div>
  )
}

function AppSidebar() {
  const activeView = useFactoryStore((s) => s.activeView)
  const navigate = useFactoryStore((s) => s.navigate)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const mobileNavOpen = useFactoryStore((s) => s.mobileNavOpen)
  const runningCount = useFactoryStore((s) => s.runningIds.length)
  const nav = [
    { id: 'repositories', label: 'Repositories', icon: IconDatabase },
    { id: 'timeline', label: 'Timeline', icon: IconHistory },
    { id: 'analytics', label: 'Analytics', icon: IconChartHistogram },
  ]
  return (
    <aside className={cn('sidebar', mobileNavOpen && 'mobile-open')} aria-label="Primary navigation">
      <div className="brand">
        <div className="brand-mark"><IconBinaryTree size={20} /></div>
        <div className="brand-copy"><strong>Forgebeam</strong><span>Task factory / ops</span></div>
      </div>
      <p className="nav-label">Workspace</p>
      <nav className="nav-list">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} className={cn('nav-item', (activeView === id || (id === 'repositories' && ['repository-pipeline', 'task-detail'].includes(activeView))) && 'active')} onClick={() => navigate(id)}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <Button className="create-sidebar" onClick={() => setCreateDialogOpen(true)}><IconPlus size={17} />Create task</Button>
      <div className="sidebar-spacer" />
      <div className="factory-status">
        <div><span className="live-dot" />Factory online</div>
        <p>{runningCount ? `${runningCount} pipeline run${runningCount > 1 ? 's' : ''} advancing` : 'Watchers synced · queue idle'}</p>
      </div>
    </aside>
  )
}

function MobileHeader() {
  const mobileNavOpen = useFactoryStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useFactoryStore((s) => s.setMobileNavOpen)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  return (
    <>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <header className="mobile-header">
        <button className="icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><IconMenu2 size={18} /></button>
        <div className="mobile-brand"><span className="brand-mark"><IconBinaryTree size={16} /></span>Forgebeam</div>
        <button className="icon-button" aria-label="Create task" onClick={() => setCreateDialogOpen(true)}><IconPlus size={18} /></button>
      </header>
    </>
  )
}

function RepositoriesView() {
  const repositories = useFactoryStore((s) => s.repositories)
  const pullRequests = useFactoryStore((s) => s.pullRequests)
  const openRepository = useFactoryStore((s) => s.openRepository)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const snapshot = useMemo(() => ({ pullRequests }), [pullRequests])
  const totals = repositories.reduce((acc, repo) => {
    const rollup = repositoryRollup(snapshot, repo.id)
    acc.processed += rollup.processed
    acc.tasks += rollup.tasks
    return acc
  }, { processed: 0, tasks: 0 })
  const running = Object.values(pullRequests).flat().filter((pr) => pr.stages.some((stage) => stage.status === 'running')).length
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><IconActivity size={14} />Factory overview</p>
          <h1 className="page-title">Repository intake</h1>
          <p className="page-subtitle">Merged changes flow from qualification through task validation. Select a repository to inspect its live register.</p>
        </div>
        <div className="header-actions"><Button onClick={() => setCreateDialogOpen(true)}><IconPlus size={16} />Create task</Button></div>
      </div>
      <Card className="overview-strip" aria-label="Factory summary">
        <div className="overview-stat"><span>Repositories</span><strong>{repositories.length}</strong></div>
        <div className="overview-stat"><span>PRs processed</span><strong>{totals.processed}</strong></div>
        <div className="overview-stat"><span>Tasks accepted</span><strong>{totals.tasks}</strong></div>
        <div className="overview-stat"><span>Running now</span><strong>{running}</strong></div>
      </Card>
      <div className="repo-grid">
        {repositories.map((repo) => {
          const rollup = repositoryRollup(snapshot, repo.id)
          return (
            <Card key={repo.id} className="repo-card" role="button" tabIndex={0} aria-label={`Open ${repo.name} pipeline`} onClick={() => openRepository(repo.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRepository(repo.id) } }}>
              <div className="repo-card-head"><div className="repo-icon"><IconStack2 size={21} /></div><IconArrowRight className="repo-open" size={18} /></div>
              <h2>{repo.name}</h2><p>{repo.description}</p>
              <div className="repo-metrics">
                <div className="repo-metric"><span>Language</span><strong style={{ fontSize: 14 }}>{repo.language}</strong></div>
                <div className="repo-metric"><span>Processed</span><strong>{rollup.processed}</strong></div>
                <div className="repo-metric"><span>Tasks · yield</span><strong>{rollup.tasks} · {rollup.yield}%</strong></div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function PipelineView() {
  const repoId = useFactoryStore((s) => s.selectedRepositoryId)
  const repository = useFactoryStore((s) => s.repositories.find((repo) => repo.id === s.selectedRepositoryId))
  const allPrs = useFactoryStore((s) => s.pullRequests[s.selectedRepositoryId] || [])
  const query = useFactoryStore((s) => s.pipelineQuery)
  const sort = useFactoryStore((s) => s.pipelineSort)
  const setQuery = useFactoryStore((s) => s.setPipelineQuery)
  const setSort = useFactoryStore((s) => s.setPipelineSort)
  const openTask = useFactoryStore((s) => s.openTask)
  const navigate = useFactoryStore((s) => s.navigate)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const rollup = repositoryRollup({ pullRequests: { [repoId]: allPrs } }, repoId)
  const prs = useMemo(() => allPrs
    .filter((pr) => !query || pr.title.toLowerCase().includes(query.toLowerCase()) || String(pr.number).includes(query))
    .sort((a, b) => sort === 'oldest' ? a.number - b.number : b.number - a.number), [allPrs, query, sort])
  if (!repository) return <RepositoriesView />
  return (
    <div className="page">
      <div className="back-row"><Button variant="ghost" onClick={() => navigate('repositories')}><IconArrowLeft size={15} />All repositories</Button></div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><IconGitPullRequest size={14} />Pipeline register</p>
          <h1 className="page-title">{repository.name}</h1>
          <p className="page-subtitle">{rollup.processed} processed · {rollup.tasks} tasks produced · {rollup.yield}% yield</p>
        </div>
        <div className="header-actions"><Badge variant="accent">{repository.language}</Badge><Button onClick={() => setCreateDialogOpen(true)}><IconPlus size={16} />Create task</Button></div>
      </div>
      <div className="table-toolbar">
        <div className="search-wrap"><IconSearch size={15} /><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search pull requests" placeholder="Search pull requests" /></div>
        <Select value={sort} onValueChange={setSort} ariaLabel="Sort pull requests" options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
      </div>
      <Card className="table-card">
        {prs.length ? <div className="table-scroll">
          <table className="pipeline-table">
            <thead><tr><th style={{ width: 66 }}>PR</th><th style={{ width: 280 }}>Merged change</th><th style={{ width: 82 }}>Files</th><th style={{ width: 130 }}>Issue / result</th><th>Factory stages</th></tr></thead>
            <tbody>
              {prs.map((pr) => (
                <tr key={pr.id} className={cn('pipeline-row', pr.fresh && 'fresh')} tabIndex={0} onClick={() => openTask(repoId, pr.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTask(repoId, pr.id) } }} aria-label={`Open pull request ${pr.number}, ${pr.title}`}>
                  <td><span className="pr-number">#{pr.number}</span></td>
                  <td><span className="pr-title" title={pr.title}>{pr.title}</span><div className="pr-sub">{isAccepted(pr) && <Badge variant="success"><IconCircleCheck size={11} />Accepted</Badge>}</div></td>
                  <td><span className="file-count"><IconFileCode size={13} />{pr.fileCount}</span></td>
                  <td>{pr.linkedIssue ? <Badge variant="neutral"><IconExternalLink size={10} />{pr.linkedIssue}</Badge> : <span className="no-issue"><IconMinus size={11} />No linked issue</span>}{pr.rejectionReason && <div style={{ marginTop: 5 }}><Badge variant="danger">{pr.rejectionReason}</Badge></div>}</td>
                  <td><StageStrip stages={pr.stages} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> : <EmptyState title="No pull requests match" description="Clear the current search to restore the pipeline register." onClear={() => setQuery('')} />}
      </Card>
    </div>
  )
}

function CheckCard({ pr, type, title, description }) {
  const check = pr.checks[type]
  const key = `${pr.id}-${type}`
  const open = useFactoryStore((s) => !!s.expandedLogs[key])
  const toggleLog = useFactoryStore((s) => s.toggleLog)
  const passing = check.status === 'passing'
  const failing = check.status === 'failing'
  return (
    <Card className="check-card">
      <div className="check-card-main">
        <div className="check-card-head">
          <div className="check-identity"><div className={cn('check-icon', check.status)}>{passing ? <IconCircleCheck size={19} /> : failing ? <IconCircleX size={19} /> : <IconClock size={19} />}</div><div><h3>{title}</h3><p>{description}</p></div></div>
          <Badge variant={passing ? 'success' : failing ? 'danger' : 'neutral'}>{check.status}</Badge>
        </div>
        <div className="check-attempt">Attempt {check.attemptCount}</div>
      </div>
      <button className={cn('log-toggle', open && 'open')} onClick={() => toggleLog(key)} aria-expanded={open} aria-controls={`log-${key}`}><span><IconTerminal2 size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Log excerpt</span><IconChevronDown size={15} /></button>
      <div className={cn('log-disclosure', open && 'open')} id={`log-${key}`}><div><pre>{check.log}</pre></div></div>
    </Card>
  )
}

function TrialPanel({ pr }) {
  const filter = useFactoryStore((s) => s.trialFilter)
  const setFilter = useFactoryStore((s) => s.setTrialFilter)
  const counts = VERDICTS.reduce((acc, verdict) => ({ ...acc, [verdict]: pr.trials.filter((trial) => trial.verdict === verdict).length }), {})
  const filtered = filter ? pr.trials.filter((trial) => trial.verdict === filter) : pr.trials
  const needsReview = pr.trials.some((trial) => trial.verdict === 'bad-success')
  return (
    <>
      {needsReview && <div className="review-banner" role="status"><IconAlertTriangle size={18} /><div><strong>Needs review</strong>At least one trial reached a bad-success outcome. Inspect the behavior before promoting this task.</div></div>}
      <div className="section-head"><div><h2>Trial analysis</h2><p>{pr.trials.length} agent attempts classified by outcome quality</p></div>{filter && <Button variant="ghost" size="sm" onClick={() => setFilter(null)}><IconX size={14} />Clear filter</Button>}</div>
      <Card className="trial-card">
        <div className="distribution" aria-label="Trial verdict distribution">
          {VERDICTS.filter((verdict) => counts[verdict] > 0).map((verdict) => <button key={verdict} className={cn('dist-segment', filter === verdict && 'active', filter && filter !== verdict && 'dimmed', `verdict-${verdict}`)} style={{ width: `${counts[verdict] / pr.trials.length * 100}%` }} onClick={() => setFilter(filter === verdict ? null : verdict)} title={`${verdict}: ${counts[verdict]}`} aria-label={`Filter ${verdict}, ${counts[verdict]} trials`} />)}
        </div>
        <div className="legend">
          {VERDICTS.map((verdict) => <button key={verdict} className={cn('legend-button', filter === verdict && 'active')} onClick={() => setFilter(filter === verdict ? null : verdict)}><span className={cn('legend-swatch', `verdict-${verdict}`)} />{verdict} · {counts[verdict]}</button>)}
        </div>
        {filtered.length ? <div className="trial-list">
          {filtered.map((trial) => <div className="trial-row" key={trial.id}><span className="trial-id">{trial.id.includes('session') ? trial.id.split('-').slice(-2).join('-') : trial.id}</span><span className={cn('verdict-chip', `verdict-${trial.verdict}`)}>{trial.verdict}</span><span className="trial-duration">{trial.duration}</span><span className="trial-note">{trial.agent} · {trial.note}</span></div>)}
        </div> : <EmptyState title="No trials match" description="This task has no trials with the selected verdict." onClear={() => setFilter(null)} />}
      </Card>
    </>
  )
}

function ManifestPanel({ pr }) {
  const getManifest = useFactoryStore((s) => s.getManifest)
  const addToast = useFactoryStore((s) => s.addToast)
  const manifest = getManifest(pr)
  const text = JSON.stringify(manifest, null, 2)
  const copy = async () => {
    taskManifestSchema.parse(manifest)
    await navigator.clipboard.writeText(text)
    addToast('Task manifest copied to clipboard', 'success')
  }
  const download = () => {
    taskManifestSchema.parse(manifest)
    downloadText('task-manifest.json', text)
  }
  return (
    <>
      <div className="section-head"><div><h2>Task manifest</h2><p>Validated export for this accepted task</p></div></div>
      <Card className="manifest-card">
        <div className="manifest-head"><div className="manifest-title"><IconCode size={17} /><strong>task-manifest</strong><span className="format-label">JSON · schema v1</span></div><div className="manifest-actions"><Button size="sm" variant="secondary" onClick={copy}><IconClipboard size={14} />Copy</Button><Button size="sm" variant="secondary" onClick={download}><IconDownload size={14} />Download task-manifest.json</Button></div></div>
        <pre className="manifest-code">{text}</pre>
      </Card>
    </>
  )
}

function TaskDetailView() {
  const repoId = useFactoryStore((s) => s.selectedRepositoryId)
  const prId = useFactoryStore((s) => s.selectedPrId)
  const pr = useFactoryStore((s) => (s.pullRequests[s.selectedRepositoryId] || []).find((item) => item.id === s.selectedPrId))
  const back = useFactoryStore((s) => s.backToPipeline)
  if (!pr) return <PipelineView />
  const accepted = isAccepted(pr)
  const validateReached = ['running', 'complete', 'failed'].includes(pr.stages[4].status)
  return (
    <div className="page">
      <div className="back-row"><Button variant="ghost" onClick={back}><IconArrowLeft size={15} />{repoId} pipeline</Button></div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><IconGitPullRequest size={14} />Pull request #{pr.number}</p>
          <h1 className="page-title">{pr.title}</h1>
          <div className="detail-meta"><Badge variant="neutral"><IconFile size={11} />{pr.fileCount} source files</Badge>{pr.linkedIssue ? <Badge variant="neutral">{pr.linkedIssue}</Badge> : <span className="no-issue">No linked issue</span>}{pr.rejectionReason && <Badge variant="danger">{pr.rejectionReason}</Badge>}{accepted && <Badge variant="success"><IconCircleCheck size={12} />Accepted</Badge>}</div>
        </div>
      </div>
      <Card className="detail-stage-card"><StageStrip stages={pr.stages} /></Card>
      {pr.checks ? <>
        <div className="section-head"><div><h2>Validation checks</h2><p>Paired evidence from the reproduced bug and reference fix</p></div></div>
        <div className="check-grid"><CheckCard pr={pr} type="baseline" title="Baseline check" description="Tests must fail on the reproduced bug" /><CheckCard pr={pr} type="reference" title="Reference check" description="Tests must pass with the fix applied" /></div>
      </> : <Card className="validation-wait">{validateReached ? <><IconLoader2 className="running-spin" size={24} /><strong>Validation checks are running</strong><p>Paired check evidence will appear here when execution settles.</p></> : <><IconClock size={24} /><strong>Validation has not started</strong><p>This run has not reached its paired validation checks.</p></>}</Card>}
      {accepted && <><TrialPanel pr={pr} /><ManifestPanel pr={pr} /></>}
    </div>
  )
}

function exportAllAccepted() {
  const state = useFactoryStore.getState()
  const manifests = acceptedTasks(state).map((pr) => state.getManifest(pr)).filter(Boolean)
  manifests.forEach((manifest) => taskManifestSchema.parse(manifest))
  downloadText('accepted-task-manifests.json', JSON.stringify(manifests, null, 2))
  state.addToast(`${manifests.length} accepted task manifest${manifests.length === 1 ? '' : 's'} exported`, 'success')
  return manifests.length
}

function TimelineView() {
  const events = useFactoryStore((s) => s.events)
  const filter = useFactoryStore((s) => s.timelineFilter)
  const setFilter = useFactoryStore((s) => s.setTimelineFilter)
  const filtered = filter ? events.filter((event) => event.status === filter) : events
  return (
    <div className="page">
      <div className="page-header"><div><p className="page-eyebrow"><IconHistory size={14} />Factory activity</p><h1 className="page-title">Event timeline</h1><p className="page-subtitle">A durable in-session record of stage transitions, retries, and accepted tasks.</p></div><div className="header-actions"><Button variant="secondary" onClick={exportAllAccepted}><IconDownload size={15} />Export accepted tasks</Button></div></div>
      <div className="filter-row" aria-label="Filter events by status"><button className={cn('filter-chip', !filter && 'active')} onClick={() => setFilter(null)}>All · {events.length}</button>{EVENT_STATUSES.map((status) => <button key={status} className={cn('filter-chip', filter === status && 'active')} onClick={() => setFilter(status)}>{status}</button>)}</div>
      <Card>
        {filtered.length ? <div className="timeline">{filtered.map((event) => <div className="event-row" key={event.id}><span className={cn('event-icon', event.status)}>{event.status === 'failed' ? <IconX size={11} /> : event.status === 'retry' ? <IconRefresh size={11} /> : event.status === 'started' ? <IconActivity size={11} /> : <IconCheck size={11} />}</span><div className="event-main"><strong>{event.text}</strong><span>{event.repository} · PR #{event.prNumber}</span></div><time className="event-time" dateTime={event.at}>{formatTime(event.at)} UTC</time></div>)}</div> : <EmptyState title="No events match" description="No timeline entries carry this status. The underlying event record is unchanged." onClear={() => setFilter(null)} />}
      </Card>
    </div>
  )
}

function AnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><p>{label || payload[0].name}</p><strong>{payload[0].value} task{payload[0].value === 1 ? '' : 's'}</strong></div>
}

function AnalyticsView() {
  const repositories = useFactoryStore((s) => s.repositories)
  const pullRequests = useFactoryStore((s) => s.pullRequests)
  const tasks = useMemo(() => Object.values(pullRequests).flat().filter(isAccepted), [pullRequests])
  const weekly = useMemo(() => {
    const weeks = [
      { label: 'Jun 22', from: '2026-06-22', to: '2026-06-29' }, { label: 'Jun 29', from: '2026-06-29', to: '2026-07-06' },
      { label: 'Jul 06', from: '2026-07-06', to: '2026-07-13' }, { label: 'Jul 13', from: '2026-07-13', to: '2026-07-20' },
      { label: 'Jul 20', from: '2026-07-20', to: '2026-07-27' },
    ]
    return weeks.map((week) => ({ week: week.label, tasks: tasks.filter((task) => task.createdAt.slice(0, 10) >= week.from && task.createdAt.slice(0, 10) < week.to).length }))
  }, [tasks])
  const languages = useMemo(() => repositories.map((repo) => ({ name: repo.language, value: tasks.filter((task) => task.repository === repo.id).length })).filter((item) => item.value > 0), [repositories, tasks])
  const difficulty = ['Easy', 'Medium', 'Hard'].map((name) => ({ name, tasks: tasks.filter((task) => task.difficulty === name).length }))
  return (
    <div className="page">
      <div className="page-header"><div><p className="page-eyebrow"><IconChartHistogram size={14} />Factory intelligence</p><h1 className="page-title">Task analytics</h1><p className="page-subtitle">Accepted-task throughput, source language mix, and generated difficulty. Values update as runs complete.</p></div><div className="header-actions"><Button variant="secondary" onClick={exportAllAccepted}><IconDownload size={15} />Export accepted tasks</Button></div></div>
      <div className="charts-grid">
        <Card className="chart-card wide"><div className="chart-head"><h2>Tasks per week</h2><p>Accepted task output over the last five factory weeks</p></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={weekly} margin={{ top: 10, right: 18, bottom: 0, left: -18 }}><CartesianGrid stroke="#e8ece8" vertical={false} /><XAxis dataKey="week" tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} /><Tooltip content={<AnalyticsTooltip />} /><Line type="monotone" dataKey="tasks" stroke="#245f4a" strokeWidth={2.5} dot={{ fill: '#bbec63', stroke: '#245f4a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={350} /></LineChart></ResponsiveContainer></div></Card>
        <Card className="chart-card"><div className="chart-head"><h2>Language distribution</h2><p>Accepted tasks by primary repository language</p></div><div className="chart-wrap chart-wrap-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={languages} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3}>{languages.map((entry, index) => <Cell key={entry.name} fill={LANG_COLORS[index % LANG_COLORS.length]} />)}</Pie><Tooltip content={<AnalyticsTooltip />} /></PieChart></ResponsiveContainer></div><div className="chart-legend">{languages.map((item, index) => <span key={item.name}><i style={{ background: LANG_COLORS[index % LANG_COLORS.length] }} />{item.name} · {item.value}</span>)}</div></Card>
        <Card className="chart-card"><div className="chart-head"><h2>Difficulty histogram</h2><p>Generated task complexity inferred from source scope</p></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={difficulty} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}><CartesianGrid stroke="#e8ece8" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} /><Tooltip content={<AnalyticsTooltip />} cursor={{ fill: '#f0f3f0' }} /><Bar dataKey="tasks" fill="#6d9f71" radius={[6, 6, 2, 2]} animationDuration={350} /></BarChart></ResponsiveContainer></div></Card>
      </div>
    </div>
  )
}

function CreateTaskDialog() {
  const open = useFactoryStore((s) => s.createDialogOpen)
  const setOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const startRun = useFactoryStore((s) => s.startRun)
  const repositories = useFactoryStore((s) => s.repositories)
  const { register, handleSubmit, control, reset, watch, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: zodResolver(createTaskSchema), mode: 'onChange', reValidateMode: 'onChange',
    defaultValues: { repository: 'quartz-orm', pullRequestNumber: '', minFiles: '2', maxFiles: '20' },
  })
  useEffect(() => {
    const resetHandler = () => reset({ repository: 'quartz-orm', pullRequestNumber: '', minFiles: '2', maxFiles: '20' })
    window.addEventListener('factory:reset-form', resetHandler)
    return () => window.removeEventListener('factory:reset-form', resetHandler)
  }, [reset])
  const submit = (data) => startRun(data)
  const cancel = () => { setOpen(false); reset() }
  const prValue = watch('pullRequestNumber')
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-describedby="create-task-description">
          <form onSubmit={handleSubmit(submit)} noValidate>
            <div className="dialog-head"><div className="dialog-headline"><div><Dialog.Title asChild><h2>Create benchmark task</h2></Dialog.Title><Dialog.Description id="create-task-description">Start a simulated factory run from a merged pull request. One retry is included so resume behavior is observable.</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" type="button" aria-label="Close create task dialog"><IconX size={17} /></button></Dialog.Close></div></div>
            <div className="form-body">
              <div className="field"><label htmlFor="repository">Repository</label><Controller control={control} name="repository" render={({ field }) => <Select value={field.value} onValueChange={field.onChange} ariaLabel="Repository" options={repositories.map((repo) => ({ value: repo.id, label: repo.name }))} />} /><p className="field-error" id="repository-error">{errors.repository?.message}</p></div>
              <div className="field"><label htmlFor="pullRequestNumber">Pull-request number</label><input id="pullRequestNumber" className="field-input" inputMode="numeric" placeholder="e.g. 247" aria-invalid={!!errors.pullRequestNumber} aria-describedby="pullRequestNumber-error" {...register('pullRequestNumber')} /><p className="field-error" id="pullRequestNumber-error">{errors.pullRequestNumber?.message || (!prValue ? 'Pull-request number is required' : '')}</p></div>
              <div className="bounds-grid"><div className="field"><label htmlFor="minFiles">Minimum file bound</label><input id="minFiles" className="field-input" inputMode="numeric" aria-invalid={!!errors.minFiles} aria-describedby="minFiles-error" {...register('minFiles')} /><p className="field-error" id="minFiles-error">{errors.minFiles?.message}</p></div><div className="field"><label htmlFor="maxFiles">Maximum file bound</label><input id="maxFiles" className="field-input" inputMode="numeric" aria-invalid={!!errors.maxFiles} aria-describedby="maxFiles-error" {...register('maxFiles')} /><p className="field-error" id="maxFiles-error">{errors.maxFiles?.message}</p></div></div>
              <div className="form-note"><IconInfoCircle size={15} />Bounds apply to source files only. Accepted range: 1–500, with the minimum no greater than the maximum.</div>
            </div>
            <div className="dialog-actions"><Button type="button" variant="secondary" onClick={cancel}>Cancel</Button><Button type="submit" disabled={!isValid || isSubmitting}><IconSparkles size={15} />Start pipeline run</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const unavailable = (operation) => ({ ok: false, unavailable: true, message: `${operation} is not configured for this dashboard.` })

function registerWebMcp() {
  const destinationSchema = { type: 'string', enum: ['repositories', 'repository-pipeline', 'task-detail', 'timeline', 'analytics'] }
  const tools = [
    { name: 'browse_open', description: 'Open a declared dashboard destination.', inputSchema: { type: 'object', properties: { destination: destinationSchema, repository: { type: 'string', enum: repositoryIds }, pullRequestNumber: { type: 'integer' } }, required: ['destination'], additionalProperties: false } },
    { name: 'browse_search', description: 'Search pull requests in the current repository pipeline.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } },
    { name: 'browse_apply_filter', description: 'Apply a declared trial verdict or event status filter.', inputSchema: { type: 'object', properties: { filter: { type: 'string', enum: ['trial-verdict', 'event-status'] }, value: { type: 'string' } }, required: ['filter', 'value'], additionalProperties: false } },
    { name: 'browse_clear_filter', description: 'Clear a declared dashboard filter.', inputSchema: { type: 'object', properties: { filter: { type: 'string', enum: ['trial-verdict', 'event-status'] } }, required: ['filter'], additionalProperties: false } },
    { name: 'browse_sort', description: 'Sort the pull-request register.', inputSchema: { type: 'object', properties: { order: { type: 'string', enum: ['newest', 'oldest'] } }, required: ['order'], additionalProperties: false } },
    { name: 'browse_set_locale', description: 'Set locale when configured.', inputSchema: { type: 'object', properties: { locale: { type: 'string' } }, required: ['locale'], additionalProperties: false } },
    { name: 'browse_set_theme', description: 'Set theme when configured.', inputSchema: { type: 'object', properties: { theme: { type: 'string' } }, required: ['theme'], additionalProperties: false } },
    { name: 'form_validate', description: 'Validate the create-task request body.', inputSchema: { type: 'object', properties: { repository: { type: 'string', enum: repositoryIds }, pullRequestNumber: { type: 'string' }, minFiles: { type: ['string', 'integer'] }, maxFiles: { type: ['string', 'integer'] } }, required: ['repository', 'pullRequestNumber', 'minFiles', 'maxFiles'], additionalProperties: false } },
    { name: 'form_submit', description: 'Validate and start exactly one simulated pipeline run.', inputSchema: { type: 'object', properties: { repository: { type: 'string', enum: repositoryIds }, pullRequestNumber: { type: 'string' }, minFiles: { type: ['string', 'integer'] }, maxFiles: { type: ['string', 'integer'] } }, required: ['repository', 'pullRequestNumber', 'minFiles', 'maxFiles'], additionalProperties: false } },
    { name: 'form_cancel', description: 'Cancel the visible create-task workflow.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'form_reset', description: 'Reset the create-task fields.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'form_advance', description: 'Advance the declared create workflow by submitting valid fields.', inputSchema: { type: 'object', properties: { repository: { type: 'string', enum: repositoryIds }, pullRequestNumber: { type: 'string' }, minFiles: { type: ['string', 'integer'] }, maxFiles: { type: ['string', 'integer'] } }, required: ['repository', 'pullRequestNumber', 'minFiles', 'maxFiles'], additionalProperties: false } },
    { name: 'form_return', description: 'Return from the form to the repository view.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'artifact_copy', description: 'Copy the selected accepted task manifest using the visible product handler.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'artifact_export', description: 'Export accepted task manifests in task-manifest format.', inputSchema: { type: 'object', properties: { scope: { type: 'string', enum: ['selected-task', 'all-accepted'] } }, required: ['scope'], additionalProperties: false } },
    { name: 'artifact_import', description: 'Import an artifact when configured.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'artifact_print_preview', description: 'Preview an artifact for print when configured.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
    { name: 'artifact_convert', description: 'Convert an artifact when configured.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  ]
  const handlers = {
    browse_open: ({ destination, repository, pullRequestNumber }) => {
      const state = useFactoryStore.getState()
      if (destination === 'repository-pipeline') { if (!repositoryIds.includes(repository)) throw new Error('A seeded repository is required'); state.openRepository(repository) }
      else if (destination === 'task-detail') {
        if (!repositoryIds.includes(repository)) throw new Error('A seeded repository is required')
        const pr = state.pullRequests[repository].find((item) => item.number === Number(pullRequestNumber))
        if (!pr) throw new Error('Pull request not found')
        state.openTask(repository, pr.id)
      } else state.navigate(destination)
      return { ok: true, destination }
    },
    browse_search: ({ query }) => { useFactoryStore.getState().setPipelineQuery(query); return { ok: true, visibleQuery: query } },
    browse_apply_filter: ({ filter, value }) => {
      const state = useFactoryStore.getState()
      if (filter === 'trial-verdict') { if (!VERDICTS.includes(value)) throw new Error('Invalid trial verdict'); state.setTrialFilter(value) }
      else { if (!EVENT_STATUSES.includes(value)) throw new Error('Invalid event status'); state.setTimelineFilter(value) }
      return { ok: true, filter, value }
    },
    browse_clear_filter: ({ filter }) => { const state = useFactoryStore.getState(); filter === 'trial-verdict' ? state.setTrialFilter(null) : state.setTimelineFilter(null); return { ok: true, filter } },
    browse_sort: ({ order }) => { useFactoryStore.getState().setPipelineSort(order); return { ok: true, order } },
    browse_set_locale: () => unavailable('Locale selection'), browse_set_theme: () => unavailable('Theme selection'),
    form_validate: (args) => { const result = createTaskSchema.safeParse({ ...args, minFiles: String(args.minFiles), maxFiles: String(args.maxFiles) }); return result.success ? { ok: true, valid: true } : { ok: false, valid: false, errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) } },
    form_submit: (args) => { const parsed = createTaskSchema.safeParse({ ...args, minFiles: String(args.minFiles), maxFiles: String(args.maxFiles) }); if (!parsed.success) return handlers.form_validate(args); const id = useFactoryStore.getState().startRun(parsed.data); return { ok: !!id, started: !!id, pullRequestNumber: parsed.data.pullRequestNumber } },
    form_advance: (args) => handlers.form_submit(args),
    form_cancel: () => { useFactoryStore.getState().setCreateDialogOpen(false); return { ok: true, cancelled: true } },
    form_reset: () => { window.dispatchEvent(new Event('factory:reset-form')); return { ok: true, reset: true } },
    form_return: () => { const state = useFactoryStore.getState(); state.setCreateDialogOpen(false); state.navigate('repositories'); return { ok: true, destination: 'repositories' } },
    artifact_copy: async () => {
      const state = useFactoryStore.getState(); const pr = state.pullRequests[state.selectedRepositoryId]?.find((item) => item.id === state.selectedPrId); const manifest = state.getManifest(pr)
      if (!manifest) throw new Error('Select an accepted task first')
      await navigator.clipboard.writeText(JSON.stringify(manifest, null, 2)); state.addToast('Task manifest copied to clipboard', 'success'); return { ok: true, format: 'task-manifest', copied: true }
    },
    artifact_export: ({ scope }) => {
      const state = useFactoryStore.getState()
      if (scope === 'all-accepted') return { ok: true, format: 'task-manifest', exportedCount: exportAllAccepted() }
      const pr = state.pullRequests[state.selectedRepositoryId]?.find((item) => item.id === state.selectedPrId); const manifest = state.getManifest(pr)
      if (!manifest) throw new Error('Select an accepted task first')
      downloadText('task-manifest.json', JSON.stringify(manifest, null, 2)); return { ok: true, format: 'task-manifest', exportedCount: 1 }
    },
    artifact_import: () => unavailable('Artifact import'), artifact_print_preview: () => unavailable('Print preview'), artifact_convert: () => unavailable('Artifact conversion'),
  }
  window.webmcp_session_info = () => ({ contractVersion: 'zto-webmcp-v1', modules: ['browse-query-v1', 'form-workflow-v1', 'artifact-transfer-v1'], toolNames: tools.map((tool) => tool.name) })
  window.webmcp_list_tools = () => ({ tools })
  window.webmcp_invoke_tool = async (name, args = {}) => { if (!handlers[name]) throw new Error(`Unknown registered tool: ${name}`); return handlers[name](args) }
  return () => { delete window.webmcp_session_info; delete window.webmcp_list_tools; delete window.webmcp_invoke_tool }
}

export default function App() {
  const activeView = useFactoryStore((s) => s.activeView)
  const toasts = useFactoryStore((s) => s.toasts)
  const dismissToast = useFactoryStore((s) => s.dismissToast)
  useEffect(() => registerWebMcp(), [])
  return (
    <div className="app-shell">
      <AppSidebar /><MobileHeader />
      <main className="main">
        {activeView === 'repositories' && <RepositoriesView />}
        {activeView === 'repository-pipeline' && <PipelineView />}
        {activeView === 'task-detail' && <TaskDetailView />}
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'analytics' && <AnalyticsView />}
      </main>
      <CreateTaskDialog />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
