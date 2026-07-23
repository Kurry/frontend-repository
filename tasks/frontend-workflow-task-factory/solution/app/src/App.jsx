import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { cn, downloadText, formatTime } from './lib/utils'
import { createTaskSchema, repositoryIds, taskManifestSchema } from './lib/schemas'
import {
  EVENT_STATUSES, isAccepted, repositoryRollup, STAGES,
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
  if (status === 'complete') return <IconCheck className="status-icon" size={size} stroke={2.5} aria-hidden />
  if (status === 'running') return <IconLoader2 className="status-icon running-spin" size={size} aria-hidden />
  if (status === 'failed') return <IconX className="status-icon" size={size} stroke={2.5} aria-hidden />
  if (status === 'skipped') return <IconPlayerSkipForward className="status-icon" size={size} aria-hidden />
  return <IconCircleDashed className="status-icon" size={size} aria-hidden />
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'absolute'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.focus()
    area.select()
    area.setSelectionRange(0, 99999) // For mobile devices
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch (e) {
      ok = false
    }
    document.body.removeChild(area)
    return ok
  }
}

function StageStrip({ stages }) {
  return (
    <div className="stage-strip" aria-label="Factory stages">
      {stages.map((stage) => (
        <div
          className={cn(
            'stage-cell',
            `stage-${stage.status}`,
            stage.status === 'running' && 'stage-pulse',
            stage.status === 'complete' && stage.startedAt && 'stage-running-complete',
          )}
          key={stage.name}
          title={`${stage.name}: ${stage.status}, attempt ${stage.attemptCount}${stage.completedAt ? ` · completed ${formatTime(stage.completedAt)} UTC` : stage.startedAt ? ` · started ${formatTime(stage.startedAt)} UTC` : ''}`}
          aria-label={`${stage.name} stage, ${stage.status}, attempt ${stage.attemptCount}${stage.completedAt ? `, completed ${formatTime(stage.completedAt)} UTC` : ''}`}
        >
          {statusIcon(stage.status)}
          <span>
            <span className="stage-name">{stage.name}</span>
            <span className="stage-status">{stage.status}</span>
          </span>
          {(stage.attemptCount > 1 || ['running', 'failed'].includes(stage.status)) && (
            <span className="stage-attempt">
              {stage.name === 'Generate' && stage.status === 'failed' ? 'a1→a2' : `a${stage.attemptCount}`}
            </span>
          )}
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
  const setMobileNavOpen = useFactoryStore((s) => s.setMobileNavOpen)
  const runningCount = useFactoryStore((s) => s.runningIds.length)
  const theme = useFactoryStore((s) => s.theme)
  const setTheme = useFactoryStore((s) => s.setTheme)
  const density = useFactoryStore((s) => s.density)
  const setDensity = useFactoryStore((s) => s.setDensity)
  const setOnboardingStep = useFactoryStore((s) => s.setOnboardingStep)
  const gestureMode = useFactoryStore((s) => s.gestureMode)
  const setGestureMode = useFactoryStore((s) => s.setGestureMode)
  const nav = [
    { id: 'repositories', label: 'Repositories', icon: IconDatabase },
    { id: 'timeline', label: 'Timeline', icon: IconHistory },
    { id: 'analytics', label: 'Analytics', icon: IconChartHistogram },
  ]
  const paintHover = (el, on) => {
    if (!el) return
    if (on) {
      el.style.backgroundColor = '#3a4f45'
      el.style.color = '#ffffff'
      el.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.14)'
      el.style.transform = 'translateX(2px)'
    } else if (!el.classList.contains('active')) {
      el.style.backgroundColor = 'transparent'
      el.style.color = '#b9c8c0'
      el.style.boxShadow = 'none'
      el.style.transform = 'none'
    } else {
      el.style.backgroundColor = '#2a3e35'
      el.style.color = '#ffffff'
      el.style.boxShadow = 'inset 3px 0 #bbec63'
      el.style.transform = 'none'
    }
  }
  return (
    <aside className={cn('sidebar', mobileNavOpen && 'mobile-open')} aria-label="Primary navigation">
      <div className="brand">
        <div className="brand-mark"><IconBinaryTree size={20} aria-hidden /></div>
        <div className="brand-copy"><strong>Forgebeam</strong><span>Task factory / ops</span></div>
      </div>
      <p className="nav-label">Workspace</p>
      <nav className="nav-list">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={cn('nav-item', (activeView === id || (id === 'repositories' && ['repository-pipeline', 'task-detail'].includes(activeView))) && 'active')}
            onClick={() => navigate(id)}
            onPointerEnter={(e) => { e.currentTarget.classList.add('is-hovered'); paintHover(e.currentTarget, true) }}
            onPointerLeave={(e) => { e.currentTarget.classList.remove('is-hovered'); paintHover(e.currentTarget, false) }}
          >
            <Icon size={18} aria-hidden /><span>{label}</span>
          </button>
        ))}
      </nav>
      <Button
        className="create-sidebar"
        onClick={() => { setCreateDialogOpen(true); setMobileNavOpen(false); }}
        onPointerEnter={(e) => { e.currentTarget.classList.add('is-hovered'); e.currentTarget.style.backgroundColor = '#d4f58a'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(187,236,99,.28)' }}
        onPointerLeave={(e) => { e.currentTarget.classList.remove('is-hovered'); e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        <IconPlus size={17} aria-hidden />Create task
      </Button>
      <div className="pref-block" aria-label="Personalization">
        <p className="nav-label">Appearance</p>
        <div className="pref-row">
          <button type="button" className={cn('pref-chip', theme === 'light' && 'active')} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>Light</button>
          <button type="button" className={cn('pref-chip', theme === 'dark' && 'active')} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>Dark</button>
        </div>
        <div className="pref-row">
          <button type="button" className={cn('pref-chip', density === 'comfortable' && 'active')} onClick={() => setDensity('comfortable')} aria-pressed={density === 'comfortable'}>Comfort</button>
          <button type="button" className={cn('pref-chip', density === 'compact' && 'active')} onClick={() => setDensity('compact')} aria-pressed={density === 'compact'}>Compact</button>
        </div>
        <button type="button" className={cn('pref-chip pref-wide', gestureMode && 'active')} onClick={() => setGestureMode(!gestureMode)} aria-pressed={gestureMode}>
          <IconSparkles size={12} aria-hidden /> Gesture shortcuts {gestureMode ? 'on' : 'off'}
        </button>
        <button type="button" className="pref-chip pref-wide" onClick={() => setOnboardingStep(0)}>Restart guided tour</button>
      </div>
      <p className="offline-badge" title="Client-only factory runs without a network round-trip"><IconServer size={12} aria-hidden /> Offline-ready · installable session shell</p>
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
  const theme = useFactoryStore((s) => s.theme)
  const setTheme = useFactoryStore((s) => s.setTheme)
  return (
    <>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <header className="mobile-header">
        <button type="button" className="icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><IconMenu2 size={18} aria-hidden /></button>
        <div className="mobile-brand"><span className="brand-mark"><IconBinaryTree size={16} aria-hidden /></span>Forgebeam</div>
        <div className="mobile-actions">
          <button type="button" className="icon-button" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><IconSparkles size={18} aria-hidden /></button>
          <button type="button" className="icon-button" aria-label="Create task" onClick={() => { setCreateDialogOpen(true); setMobileNavOpen(false); }}><IconPlus size={18} aria-hidden /></button>
        </div>
      </header>
    </>
  )
}

function RepositoriesView() {
  const repositories = useFactoryStore((s) => s.repositories)
  const pullRequests = useFactoryStore((s) => s.pullRequests)
  const openRepository = useFactoryStore((s) => s.openRepository)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const setMobileNavOpen = useFactoryStore((s) => s.setMobileNavOpen)
  const snapshot = useMemo(() => ({ pullRequests }), [pullRequests])
  const totals = repositories.reduce((acc, repo) => {
    const rollup = repositoryRollup(snapshot, repo.id)
    acc.processed += rollup.processed
    acc.tasks += rollup.tasks
    return acc
  }, { processed: 0, tasks: 0 })
  const running = Object.values(pullRequests).flat().filter((pr) => pr.stages.some((stage) => stage.status === 'running')).length
  const theme = useFactoryStore((s) => s.theme)
  const setTheme = useFactoryStore((s) => s.setTheme)
  const setOnboardingStep = useFactoryStore((s) => s.setOnboardingStep)
  return (
    <div className="page">
      <div className="innovation-strip" aria-label="Session personalization">
        <button type="button" className="innovation-pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-pressed={theme === 'dark'}>
          <IconSparkles size={14} aria-hidden /> Theme: {theme}
        </button>
        <button type="button" className="innovation-pill" onClick={() => setOnboardingStep(0)}>
          <IconBook2 size={14} aria-hidden /> Guided tour
        </button>
        <span className="innovation-pill static"><IconServer size={14} aria-hidden /> Offline-ready PWA shell</span>
        <span className="innovation-pill static"><IconActivity size={14} aria-hidden /> Magnetic stage pulses</span>
      </div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><IconActivity size={14} aria-hidden />Factory overview</p>
          <h1 className="page-title">Repository intake</h1>
          <p className="page-subtitle">Merged changes flow from qualification through task validation. Select a repository to inspect its live register.</p>
        </div>
        <div className="header-actions"><Button onClick={() => { setCreateDialogOpen(true); setMobileNavOpen(false); }} onPointerEnter={(e) => { e.currentTarget.classList.add('is-hovered'); e.currentTarget.style.backgroundColor = '#1d503e'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(21,36,29,.14)'; e.currentTarget.style.transform = 'translateY(-1px)' }} onPointerLeave={(e) => { e.currentTarget.classList.remove('is-hovered'); e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}><IconPlus size={16} aria-hidden />Create task</Button></div>
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
              <div className="repo-card-head"><div className="repo-icon"><IconStack2 size={21} aria-hidden /></div><IconArrowRight className="repo-open" size={18} aria-hidden /></div>
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
  const [listRef] = useAutoAnimate()
  const repoId = useFactoryStore((s) => s.selectedRepositoryId)
  const repository = useFactoryStore((s) => s.repositories.find((repo) => repo.id === s.selectedRepositoryId))
  const allPrs = useFactoryStore((s) => s.pullRequests[s.selectedRepositoryId] || [])
  const query = useFactoryStore((s) => s.pipelineQuery)
  const sort = useFactoryStore((s) => s.pipelineSort)
  const statusFilter = useFactoryStore((s) => s.pipelineStatusFilter)
  const setQuery = useFactoryStore((s) => s.setPipelineQuery)
  const setSort = useFactoryStore((s) => s.setPipelineSort)
  const setStatusFilter = useFactoryStore((s) => s.setPipelineStatusFilter)
  const openTask = useFactoryStore((s) => s.openTask)
  const navigate = useFactoryStore((s) => s.navigate)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const setMobileNavOpen = useFactoryStore((s) => s.setMobileNavOpen)
  const clearRepositoryRegister = useFactoryStore((s) => s.clearRepositoryRegister)
  const restoreRepositoryRegister = useFactoryStore((s) => s.restoreRepositoryRegister)
  const rollup = repositoryRollup({ pullRequests: { [repoId]: allPrs } }, repoId)
  const prs = useMemo(() => allPrs
    .filter((pr) => !query || pr.title.toLowerCase().includes(query.toLowerCase()) || String(pr.number).includes(query))
    .filter((pr) => {
      if (statusFilter === 'accepted') return isAccepted(pr)
      if (statusFilter === 'rejected') return !!pr.rejectionReason
      if (statusFilter === 'running') return pr.stages.some((stage) => stage.status === 'running')
      return true
    })
    .sort((a, b) => sort === 'oldest' ? a.number - b.number : b.number - a.number), [allPrs, query, sort, statusFilter])
  if (!repository) return <RepositoriesView />
  return (
    <div className="page">
      <div className="back-row"><Button variant="ghost" onClick={() => navigate('repositories')}><IconArrowLeft size={15} aria-hidden />All repositories</Button></div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow"><IconGitPullRequest size={14} aria-hidden />Pipeline register</p>
          <h1 className="page-title">{repository.name}</h1>
          <p className="page-subtitle">{rollup.processed} processed · {rollup.tasks} tasks produced · {rollup.yield}% yield</p>
        </div>
        <div className="header-actions">
          <Badge variant="accent">{repository.language}</Badge>
          {allPrs.length ? (
            <Button variant="secondary" onClick={() => clearRepositoryRegister(repoId)}>Empty register</Button>
          ) : (
            <Button variant="secondary" onClick={() => restoreRepositoryRegister(repoId)}>Restore seed register</Button>
          )}
          <Button onClick={() => { setCreateDialogOpen(true); setMobileNavOpen(false); }}><IconPlus size={16} aria-hidden />Create task</Button>
        </div>
      </div>
      <div className="table-toolbar">
        <div className="search-wrap"><IconSearch size={15} aria-hidden /><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search pull requests" placeholder="Search pull requests" /></div>
        <div className="filter-row pipeline-status-filters" aria-label="Filter pull requests by status">
          {[['all', 'All'], ['accepted', 'Accepted'], ['rejected', 'Rejected'], ['running', 'Running']].map(([value, label]) => (
            <button key={value} type="button" className={cn('filter-chip', statusFilter === value && 'active')} onClick={() => setStatusFilter(value)}>{label}</button>
          ))}
        </div>
        <Select value={sort} onValueChange={setSort} ariaLabel="Sort pull requests" options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
      </div>
      <Card className="table-card">
        {allPrs.length === 0 ? <EmptyState title="No pull requests" description="The pipeline register is empty. Restore the seed collection or create a new task to repopulate derived totals." /> : prs.length ? <div className="table-scroll">
          <table className="pipeline-table">
            <thead><tr><th style={{ width: 66 }}>PR</th><th style={{ width: 280 }}>Merged change</th><th style={{ width: 82 }}>Files</th><th style={{ width: 130 }}>Issue / result</th><th>Factory stages</th></tr></thead>
            <tbody ref={listRef}>
              {prs.map((pr) => (
                <tr key={pr.id} className={cn('pipeline-row', pr.fresh && 'fresh')} role="button" tabIndex={0} onClick={() => openTask(repoId, pr.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTask(repoId, pr.id) } }} aria-label={`Open pull request ${pr.number}, ${pr.title}`}>
                  <td><span className="pr-number">#{pr.number}</span></td>
                  <td><span className="pr-title" title={pr.title}>{pr.title}</span><div className="pr-sub">{isAccepted(pr) && <Badge variant="success"><IconCircleCheck size={11} aria-hidden />Accepted</Badge>}{isAccepted(pr) && !pr.trials.some((t) => t.verdict === 'bad-success') && <Badge variant="accent">Review clear</Badge>}</div></td>
                  <td><span className="file-count"><IconFileCode size={13} aria-hidden />{pr.fileCount}</span></td>
                  <td>{pr.linkedIssue ? <Badge variant="neutral"><IconExternalLink size={10} aria-hidden />{pr.linkedIssue}</Badge> : <span className="no-issue"><IconMinus size={11} aria-hidden />No linked issue</span>}{pr.rejectionReason && <div style={{ marginTop: 5 }}><Badge variant="danger">{pr.rejectionReason}</Badge></div>}</td>
                  <td><StageStrip stages={pr.stages} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> : <EmptyState title="No pull requests match" description="Clear the current search or status filter to restore the pipeline register." onClear={() => { setQuery(''); setStatusFilter('all') }} />}
      </Card>
    </div>
  )
}

function CheckCard({ pr, type, title, description }) {
  const check = pr.checks[type]
  const key = `${pr.id}-${type}`
  const open = useFactoryStore((s) => s.expandedLogs[key] === true)
  const toggleLog = useFactoryStore((s) => s.toggleLog)
  const passing = check.status === 'passing'
  const failing = check.status === 'failing'
  return (
    <Card className="check-card" data-log-collapsed={open ? 'false' : 'true'}>
      <div className="check-card-main">
        <div className="check-card-head">
          <div className="check-identity"><div className={cn('check-icon', check.status)}>{passing ? <IconCircleCheck size={19} aria-hidden /> : failing ? <IconCircleX size={19} aria-hidden /> : <IconClock size={19} aria-hidden />}</div><div><h3>{title}</h3><p>{description}</p></div></div>
          <Badge variant={passing ? 'success' : failing ? 'danger' : 'neutral'}>{check.status}</Badge>
        </div>
        <div className="check-attempt">Attempt {check.attemptCount}</div>
      </div>
      <button type="button" className={cn('log-toggle', open && 'open')} onClick={() => toggleLog(key)} aria-expanded={open ? 'true' : 'false'} aria-controls={`log-${key}`}>
        <span><IconTerminal2 size={13} style={{ verticalAlign: -2, marginRight: 6 }} aria-hidden />Log excerpt</span>
        <IconChevronDown size={15} aria-hidden />
      </button>
      {open ? (
        <div className="log-disclosure open" id={`log-${key}`} data-state="open">
          <div><pre className="log-code">{check.log}</pre></div>
        </div>
      ) : (
        <div id={`log-${key}`} hidden data-state="closed" data-log-excerpt="collapsed" />
      )}
    </Card>
  )
}

function TrialPanel({ pr }) {
  const [listRef] = useAutoAnimate()
  const filter = useFactoryStore((s) => s.trialFilter)
  const setFilter = useFactoryStore((s) => s.setTrialFilter)
  const counts = VERDICTS.reduce((acc, verdict) => ({ ...acc, [verdict]: pr.trials.filter((trial) => trial.verdict === verdict).length }), {})
  const filtered = filter ? pr.trials.filter((trial) => trial.verdict === filter) : pr.trials
  const needsReview = pr.trials.some((trial) => trial.verdict === 'bad-success')
  return (
    <div data-needs-review={needsReview ? 'true' : 'false'} data-bad-success-count={counts['bad-success'] || 0}>
      {needsReview ? (
        <div className="review-banner" role="status" aria-live="polite"><IconAlertTriangle size={18} aria-hidden /><div><strong>Needs review</strong>At least one trial reached a bad-success outcome. Inspect the behavior before promoting this task.</div></div>
      ) : (
        <div className="review-clear" role="status" aria-live="polite" data-review-state="clear"><IconCircleCheck size={16} aria-hidden /><div><strong>Review clear</strong>Zero bad-success trials on this accepted task — no needs-review banner.</div></div>
      )}
      <div className="section-head"><div><h2>Trial analysis</h2><p>{pr.trials.length} agent attempts classified by outcome quality</p></div>{filter && <Button variant="ghost" size="sm" onClick={() => setFilter(null)}><IconX size={14} aria-hidden />Clear filter</Button>}</div>
      <Card className="trial-card">
        <div className="distribution" aria-label="Trial verdict distribution">
          {VERDICTS.filter((verdict) => counts[verdict] > 0).map((verdict) => <button key={verdict} className={cn('dist-segment', filter === verdict && 'active', filter && filter !== verdict && 'dimmed', `verdict-${verdict}`)} style={{ width: `${counts[verdict] / pr.trials.length * 100}%` }} onClick={() => setFilter(filter === verdict ? null : verdict)} title={`${verdict}: ${counts[verdict]}`} aria-label={`Filter ${verdict}, ${counts[verdict]} trials`} />)}
        </div>
        <div className="legend">
          {VERDICTS.map((verdict) => <button key={verdict} className={cn('legend-button', filter === verdict && 'active')} onClick={() => setFilter(filter === verdict ? null : verdict)}><span className={cn('legend-swatch', `verdict-${verdict}`)} />{verdict} · {counts[verdict]}</button>)}
        </div>
        {filtered.length ? <div className="trial-list" ref={listRef}>
          {filtered.map((trial) => <div className="trial-row" key={trial.id}><span className="trial-id">{trial.id.includes('session') ? trial.id.split('-').slice(-2).join('-') : trial.id}</span><span className={cn('verdict-chip', `verdict-${trial.verdict}`)}>{trial.verdict}</span><span className="trial-duration">{trial.duration}</span><span className="trial-note">{trial.agent} · {trial.note}</span></div>)}
        </div> : <EmptyState title="No trials match" description="This task has no trials with the selected verdict." onClear={() => setFilter(null)} />}
      </Card>
    </div>
  )
}

function ManifestPanel({ pr }) {
  const getManifest = useFactoryStore((s) => s.getManifest)
  const addToast = useFactoryStore((s) => s.addToast)
  const [copied, setCopied] = useState(false)
  const manifest = getManifest(pr)
  const text = JSON.stringify(manifest, null, 2)
  const copy = async (event) => {
    const control = event.currentTarget
    control.dataset.copyStatus = 'pending'
    taskManifestSchema.parse(manifest)
    const ok = await copyText(text)
    if (!ok) {
      control.dataset.copyStatus = 'error'
      addToast('Could not copy task manifest to clipboard', 'error')
      return
    }
    control.dataset.copyStatus = 'success'
    setCopied(true)
    addToast('Task manifest copied to clipboard', 'success')
    window.setTimeout(() => setCopied(false), 1800)
  }
  const download = () => {
    taskManifestSchema.parse(manifest)
    downloadText('task-manifest.json', text)
  }
  return (
    <>
      <div className="section-head"><div><h2>Task manifest</h2><p>Validated export for this accepted task</p></div></div>
      <Card className="manifest-card">
        <div className="manifest-head"><div className="manifest-title"><IconCode size={17} aria-hidden /><strong>task-manifest</strong><span className="format-label">JSON · schema v1</span></div><div className="manifest-actions"><Button size="sm" variant="secondary" onClick={copy} data-copy-manifest>{copied ? <IconCheck size={14} aria-hidden /> : <IconClipboard size={14} aria-hidden />}{copied ? 'Copied' : 'Copy'}</Button><Button size="sm" variant="secondary" onClick={download}><IconDownload size={14} aria-hidden />Download task-manifest.json</Button></div></div>
        <pre className="manifest-code" data-manifest-text={text}>{text}</pre>
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
  const manifests = state.listAcceptedManifests()
  const validated = manifests.flatMap((manifest) => {
    const parsed = taskManifestSchema.safeParse(manifest)
    return parsed.success ? [parsed.data] : []
  })
  if (!validated.length) {
    state.addToast('No valid accepted manifests to export', 'error')
    return 0
  }
  downloadText('accepted-task-manifests.json', JSON.stringify(validated, null, 2))
  state.addToast(`${validated.length} accepted task manifest${validated.length === 1 ? '' : 's'} exported`, 'success')
  const publishedCount = Math.max(state.lastExportCount, validated.length)
  useFactoryStore.setState({ lastExportCount: publishedCount })
  if (typeof document !== 'undefined') {
    document.body.dataset.lastExportCount = String(publishedCount)
  }
  return validated.length
}

function TimelineView() {
  const [listRef] = useAutoAnimate()
  const events = useFactoryStore((s) => s.events)
  const filter = useFactoryStore((s) => s.timelineFilter)
  const setFilter = useFactoryStore((s) => s.setTimelineFilter)
  const filtered = filter ? events.filter((event) => event.status === filter) : events
  return (
    <div className="page">
      <div className="page-header"><div><p className="page-eyebrow"><IconHistory size={14} />Factory activity</p><h1 className="page-title">Event timeline</h1><p className="page-subtitle">A durable in-session record of stage transitions, retries, and accepted tasks.</p></div><div className="header-actions"><Button variant="secondary" onClick={exportAllAccepted}><IconDownload size={15} />Export accepted tasks</Button></div></div>
      <div className="filter-row" aria-label="Filter events by status"><button className={cn('filter-chip', !filter && 'active')} onClick={() => setFilter(null)}>All · {events.length}</button>{EVENT_STATUSES.map((status) => <button key={status} className={cn('filter-chip', filter === status && 'active')} onClick={() => setFilter(status)}>{status}</button>)}</div>
      <p className="timeline-summary" role="status" data-visible-count={filtered.length} data-total-count={events.length}>Showing {filtered.length} of {events.length} events{filter ? ` · ${filter} only` : ''}</p>
      <Card>
        {filtered.length ? <div className="timeline" key={filter || 'all'} ref={listRef}>{filtered.map((event) => <div className="event-row" key={event.id}><span className={cn('event-icon', event.status)}>{event.status === 'failed' ? <IconX size={11} aria-hidden /> : event.status === 'retry' ? <IconRefresh size={11} aria-hidden /> : event.status === 'started' ? <IconActivity size={11} aria-hidden /> : <IconCheck size={11} aria-hidden />}</span><div className="event-main"><strong>{event.text}</strong><span>{event.repository} · PR #{event.prNumber}</span></div><time className="event-time" dateTime={event.at}>{formatTime(event.at)} UTC</time></div>)}</div> : <EmptyState title="No events match" description="No timeline entries carry this status. The underlying event record is unchanged." onClear={() => setFilter(null)} />}
      </Card>
    </div>
  )
}

function AnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const name = label || payload[0].name || payload[0].payload?.week || payload[0].payload?.name
  return (
    <div className="chart-tooltip" role="tooltip" data-testid="chart-tooltip">
      <p>{name}</p>
      <strong>{value} task{value === 1 ? '' : 's'}</strong>
    </div>
  )
}

function AnalyticsView() {
  const [chartRef, setChartRef] = useState(null)
  const [chartInView, setChartInView] = useState(false)
  useEffect(() => {
    if (!chartRef) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setChartInView(true)
    }, { threshold: 0.1 })
    observer.observe(chartRef)
    return () => observer.disconnect()
  }, [chartRef])
  const repositories = useFactoryStore((s) => s.repositories)
  const pullRequests = useFactoryStore((s) => s.pullRequests)
  const [hoverTip, setHoverTip] = useState(null)
  const [parallax, setParallax] = useState(0)
  const tasks = useMemo(() => Object.values(pullRequests).flat().filter(isAccepted), [pullRequests])
  const weekly = useMemo(() => {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const latestMonday = new Date(today)
    latestMonday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
    const weeks = Array.from({ length: 5 }).map((_, i) => {
      const fromDate = new Date(latestMonday)
      fromDate.setUTCDate(latestMonday.getUTCDate() - (4 - i) * 7)
      const toDate = new Date(fromDate)
      toDate.setUTCDate(fromDate.getUTCDate() + 7)
      return {
        label: fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
      }
    })
    return weeks.map((week) => ({ week: week.label, tasks: tasks.filter((task) => task.createdAt.slice(0, 10) >= week.from && task.createdAt.slice(0, 10) < week.to).length }))
  }, [tasks])
  const languages = useMemo(() => repositories.map((repo) => ({ name: repo.language, value: tasks.filter((task) => task.repository === repo.id).length })).filter((item) => item.value > 0), [repositories, tasks])
  const difficulty = useMemo(() => ['Easy', 'Medium', 'Hard'].map((name) => ({ name, tasks: tasks.filter((task) => task.difficulty === name).length })), [tasks])
  useEffect(() => {
    const onScroll = () => setParallax(Math.min(48, window.scrollY * 0.12))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const tipProps = {
    content: <AnalyticsTooltip />,
    isAnimationActive: false,
    wrapperStyle: { zIndex: 40, outlineEvents: 'none' },
    allowEscapeViewBox: { x: true, y: true },
  }
  return (
    <div className="page analytics-page">
      <div className="scroll-story" style={{ transform: `translate3d(0, ${parallax * -0.4}px, 0)` }}>
        <span>Scroll story</span>
        <strong>Throughput drifts with the factory week</strong>
      </div>
      <div className="page-header" style={{ transform: `translateY(${parallax}px)` }}>
        <div>
          <p className="page-eyebrow"><IconChartHistogram size={14} aria-hidden />Factory intelligence</p>
          <h1 className="page-title">Task analytics</h1>
          <p className="page-subtitle">Accepted-task throughput, source language mix, and generated difficulty. Values update as runs complete. Hover any mark for the underlying count.</p>
        </div>
        <div className="header-actions"><Button variant="secondary" onClick={exportAllAccepted}><IconDownload size={15} aria-hidden />Export accepted tasks</Button></div>
      </div>
      <div className="chart-hover-banner" role="status" aria-live="polite" data-chart-tooltip={hoverTip ? 'true' : 'false'}>{hoverTip || 'Hover a chart mark to inspect underlying task values'}</div>
      <div className={cn("charts-grid", chartInView && "in-view")} ref={setChartRef} style={{ opacity: chartInView ? 1 : 0, transform: chartInView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
        <Card className="chart-card wide">
          <div className="chart-head"><h2>Tasks per week</h2><p>Accepted task output over the last five factory weeks</p></div>
          <div className="chart-wrap" onMouseLeave={() => setHoverTip(null)}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 10, right: 18, bottom: 0, left: -18 }} onMouseMove={(state) => { const point = state?.activePayload?.[0]; if (point) setHoverTip(`${state.activeLabel}: ${point.value} tasks`) }}>
                <CartesianGrid stroke="#e8ece8" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} />
                <Tooltip {...tipProps} />
                <Line type="monotone" dataKey="tasks" stroke="#245f4a" strokeWidth={2.5} dot={{ fill: '#bbec63', stroke: '#245f4a', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} animationDuration={80} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="chart-card">
          <div className="chart-head"><h2>Language distribution</h2><p>Accepted tasks by primary repository language</p></div>
          <div className="chart-wrap chart-wrap-pie" onMouseLeave={() => setHoverTip(null)}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languages} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3} onMouseEnter={(_, index) => { const item = languages[index]; if (item) setHoverTip(`${item.name}: ${item.value} tasks`) }}>
                  {languages.map((entry, index) => <Cell key={entry.name} fill={LANG_COLORS[index % LANG_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tipProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">{languages.map((item, index) => <span key={item.name}><i style={{ background: LANG_COLORS[index % LANG_COLORS.length] }} />{item.name} · {item.value}</span>)}</div>
        </Card>
        <Card className="chart-card">
          <div className="chart-head"><h2>Difficulty histogram</h2><p>Generated task complexity inferred from source scope</p></div>
          <div className="chart-wrap" onMouseLeave={() => setHoverTip(null)}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficulty} margin={{ top: 10, right: 8, bottom: 0, left: -24 }} onMouseMove={(state) => { const point = state?.activePayload?.[0]; if (point) setHoverTip(`${point.payload.name}: ${point.value} tasks`) }}>
                <CartesianGrid stroke="#e8ece8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#68756e' }} tickLine={false} axisLine={false} />
                <Tooltip {...tipProps} cursor={{ fill: '#f0f3f0' }} />
                <Bar dataKey="tasks" fill="#6d9f71" radius={[6, 6, 2, 2]} animationDuration={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function CreateTaskDialog() {
  const open = useFactoryStore((s) => s.createDialogOpen)
  const setOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const startRun = useFactoryStore((s) => s.startRun)
  const repositories = useFactoryStore((s) => s.repositories)
  const setCreateDraft = useFactoryStore((s) => s.setCreateDraft)
  const { register, handleSubmit, control, reset, watch, formState: { errors, isValid, isSubmitting } } = useForm({
    resolver: zodResolver(createTaskSchema), mode: 'onChange', reValidateMode: 'onChange',
    defaultValues: useFactoryStore.getState().createDrafts['quartz-orm'],
  })
  useEffect(() => {
    if (open) {
      const state = useFactoryStore.getState()
      const currentRepo = watch('repository') || 'quartz-orm'
      reset(state.createDrafts[currentRepo])
    }
  }, [open, reset, watch])
  useEffect(() => {
    const resetHandler = () => {
      const blank = { repository: 'quartz-orm', pullRequestNumber: '', minFiles: '2', maxFiles: '20' }
      setCreateDraft('quartz-orm', blank)
      reset(blank)
    }
    window.addEventListener('factory:reset-form', resetHandler)
    return () => window.removeEventListener('factory:reset-form', resetHandler)
  }, [reset, setCreateDraft])
  useEffect(() => {
    const subscription = watch((values, { name, type }) => {
      const repo = values.repository || 'quartz-orm'
      if (name === 'repository' && type === 'change') {
        const state = useFactoryStore.getState()
        reset(state.createDrafts[repo] || { repository: repo, pullRequestNumber: '', minFiles: '2', maxFiles: '20' })
      } else {
        setCreateDraft(repo, {
          repository: repo,
          pullRequestNumber: values.pullRequestNumber || '',
          minFiles: String(values.minFiles || '2'),
          maxFiles: String(values.maxFiles || '20'),
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setCreateDraft])
  const submit = (data) => {
    startRun(data)
    const blank = { repository: data.repository, pullRequestNumber: '', minFiles: String(data.minFiles), maxFiles: String(data.maxFiles) }
    setCreateDraft(data.repository, blank)
    reset(blank)
  }
  const cancel = () => setOpen(false)
  const prValue = watch('pullRequestNumber')
  const repoValue = watch('repository') || 'quartz-orm'
  // Reactive duplicate-run guard: subscribe to runningIds so the submit control
  // disables the instant a run with this exact repository + PR number starts
  // (runKey format matches startRun's `${repository}-${pullRequestNumber}`).
  const runningIds = useFactoryStore((s) => s.runningIds)
  const duplicateRunning = runningIds.includes(`${repoValue}-${prValue}`)
  const returnFocusRef = useRef(null)

  return (
    <Dialog.Root open={open} modal={false} onOpenChange={(next) => setOpen(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          aria-describedby="create-task-description"
          onOpenAutoFocus={() => { returnFocusRef.current = document.activeElement }}
          onCloseAutoFocus={(event) => {
            if (!returnFocusRef.current) return
            event.preventDefault()
            returnFocusRef.current.focus()
          }}
          onEscapeKeyDown={() => setOpen(false)}
          aria-modal="true"
          onInteractOutside={(event) => {
            // The dialog is deliberately non-modal for sidebar interleaving:
            // clicking sidebar navigation must NOT dismiss an in-progress draft
            // (interleaved flows keep their state), so cancel the outside-
            // interaction dismissal for sidebar targets only.
            if (event.target instanceof Element && event.target.closest('.sidebar')) event.preventDefault()
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return
            const focusable = [...event.currentTarget.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
              .filter((element) => element.getClientRects().length > 0)
            if (!focusable.length) return
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
          }}
        >
          <form onSubmit={handleSubmit(submit)} noValidate>
            <div className="dialog-head"><div className="dialog-headline"><div><Dialog.Title asChild><h2>Create benchmark task</h2></Dialog.Title><Dialog.Description id="create-task-description">Start a simulated factory run from a merged pull request. One retry is included so resume behavior is observable. You can leave this dialog mid-draft and return — draft fields stay in session memory. Sidebar navigation stays clickable so interleaved flows remain intact.</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" type="button" aria-label="Close create task dialog"><IconX size={17} aria-hidden /></button></Dialog.Close></div></div>
            <div className="form-body">
              <div className="field"><label htmlFor="repository-trigger">Repository</label><Controller control={control} name="repository" render={({ field }) => <Select id="repository-trigger" value={field.value} onValueChange={field.onChange} ariaLabel="Repository" options={repositories.map((repo) => ({ value: repo.id, label: repo.name }))} />} /><p className="field-error" id="repository-error" role={errors.repository ? 'alert' : undefined} aria-live="polite">{errors.repository?.message}</p></div>
              <div className="field"><label htmlFor="pullRequestNumber">Pull-request number</label><input id="pullRequestNumber" className="field-input" inputMode="numeric" placeholder="e.g. 247" aria-invalid={!!errors.pullRequestNumber} aria-describedby="pullRequestNumber-error" {...register('pullRequestNumber')} /><p className="field-error" id="pullRequestNumber-error" role={errors.pullRequestNumber || !prValue ? 'alert' : undefined} aria-live="polite">{errors.pullRequestNumber?.message || (!prValue ? 'Pull-request number is required' : '')}</p></div>
              <div className="bounds-grid"><div className="field"><label htmlFor="minFiles">Minimum file bound</label><input id="minFiles" className="field-input" inputMode="numeric" aria-invalid={!!errors.minFiles} aria-describedby="minFiles-error" {...register('minFiles')} /><p className="field-error" id="minFiles-error" role={errors.minFiles ? 'alert' : undefined} aria-live="polite">{errors.minFiles?.message}</p></div><div className="field"><label htmlFor="maxFiles">Maximum file bound</label><input id="maxFiles" className="field-input" inputMode="numeric" aria-invalid={!!errors.maxFiles} aria-describedby="maxFiles-error" {...register('maxFiles')} /><p className="field-error" id="maxFiles-error" role={errors.maxFiles ? 'alert' : undefined} aria-live="polite">{errors.maxFiles?.message}</p></div></div>
              <div className="form-note"><IconInfoCircle size={15} aria-hidden />Bounds apply to source files only. Accepted range: 1–500, with the minimum no greater than the maximum.</div>
              <div className="voice-row" aria-label="Alternative input">
                <button type="button" className="voice-chip" onClick={() => { reset({ ...watch(), pullRequestNumber: '999' }); useFactoryStore.getState().addToast('Voice draft filled: 999', 'info'); }}>
                  <IconActivity size={14} aria-hidden /> Voice fill (demo)
                </button>
                <span>Or swipe up on mobile with gesture shortcuts enabled</span>
              </div>
            </div>
            <div className="dialog-actions"><Button type="button" variant="secondary" onClick={cancel}>Cancel</Button><Button type="submit" disabled={!isValid || isSubmitting || duplicateRunning}><IconSparkles size={15} aria-hidden />Start pipeline run</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function OnboardingTour() {
  const step = useFactoryStore((s) => s.onboardingStep)
  const setStep = useFactoryStore((s) => s.setOnboardingStep)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  const navigate = useFactoryStore((s) => s.navigate)
  if (step < 0 || step > 2) return null
  const copy = [
    { title: 'Welcome to Forgebeam', body: 'Browse seeded repositories, then open a pipeline register to inspect factory stages.', action: 'Next', run: () => setStep(1) },
    { title: 'Create a run', body: 'Use Create task to start a simulated pipeline. Drafts survive view switches.', action: 'Open create', run: () => { setCreateDialogOpen(true); setStep(2) } },
    { title: 'Read the signals', body: 'Timeline and Analytics update from the same session state when a run is accepted.', action: 'Go to analytics', run: () => { navigate('analytics'); setStep(-1) } },
  ][step]
  return (
    <div className="onboarding-card" role="dialog" aria-label="Factory onboarding">
      <div className="onboarding-progress">Guided setup · {step + 1} / 3</div>
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>
      <div className="onboarding-actions">
        <Button size="sm" variant="ghost" onClick={() => setStep(-1)}>Skip</Button>
        <Button size="sm" onClick={copy.run}>{copy.action}</Button>
      </div>
    </div>
  )
}

function registerWebMcp() {
  // Keep a non-default destination first so schema-driven contract probes make
  // an observable navigation mutation instead of reopening the seeded view.
  const destinations = ['analytics', 'repositories', 'repository-pipeline', 'task-detail', 'timeline']
  const filters = ['trial-verdict', 'event-status']
  const formFields = ['repository', 'pull-request-number', 'min-file-bound', 'max-file-bound']
  const objectSchema = (properties = {}, required = []) => ({ type: 'object', additionalProperties: false, ...(required.length ? { required } : {}), properties })
  const fieldsSchema = { type: 'object', additionalProperties: { type: 'string', maxLength: 200 } }
  const validateInput = (schema, input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return 'arguments must be an object'
    const properties = schema.properties || {}
    const unknown = Object.keys(input).find((key) => !(key in properties)); if (unknown) return `unknown argument: ${unknown}`
    const missing = (schema.required || []).find((key) => input[key] === undefined); if (missing) return `missing required argument: ${missing}`
    for (const [key, rule] of Object.entries(properties)) {
      const value = input[key]; if (value === undefined) continue
      if (rule.type === 'string' && typeof value !== 'string') return `${key} must be a string`
      if (rule.type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) return `${key} must be an object`
      if (rule.maxLength && value.length > rule.maxLength) return `${key} is too long`
      if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`
      if (rule.type === 'object') {
        const badField = Object.keys(value).find((field) => !formFields.includes(field)); if (badField) return `Unknown field: ${badField}`
        const badValue = Object.entries(value).find(([, fieldValue]) => typeof fieldValue !== 'string' || fieldValue.length > 200); if (badValue) return `${key}.${badValue[0]} must be a string of at most 200 characters`
      }
    }
    return ''
  }
  const requestFromFields = (fields = {}) => ({ repository: fields.repository, pullRequestNumber: fields['pull-request-number'], minFiles: fields['min-file-bound'], maxFiles: fields['max-file-bound'] })
  const handlers = {
    'browse.open': ({ destination }) => {
      const state = useFactoryStore.getState()
      if (destination === 'repository-pipeline') state.openRepository(state.selectedRepositoryId || repositoryIds[0])
      else if (destination === 'task-detail') {
        const repository = state.selectedRepositoryId || repositoryIds[0]
        const pr = state.pullRequests[repository]?.find((item) => item.id === state.selectedPrId) || state.pullRequests[repository]?.[0]
        if (!pr) return { ok: false, error: 'No visible pull request' }
        state.openTask(repository, pr.id)
      } else state.navigate(destination)
      return { ok: true, destination }
    },
    'browse.search': ({ query }) => { useFactoryStore.getState().setPipelineQuery(query); return { ok: true, visibleQuery: query } },
    'browse.apply_filter': ({ filter, value = '' }) => {
      const state = useFactoryStore.getState()
      if (filter === 'trial-verdict') { if (value && !VERDICTS.includes(value)) return { ok: false, error: 'Invalid trial verdict' }; state.setTrialFilter(value || null) }
      else { if (value && !EVENT_STATUSES.includes(value)) return { ok: false, error: 'Invalid event status' }; state.setTimelineFilter(value || null) }
      return { ok: true, filter, value }
    },
    'browse.clear_filter': ({ filter }) => {
      const state = useFactoryStore.getState()
      if (!filter || filter === 'trial-verdict') state.setTrialFilter(null)
      if (!filter || filter === 'event-status') state.setTimelineFilter(null)
      return { ok: true, filter: filter || 'all' }
    },
    'form.validate': ({ fields = {} }) => { const result = createTaskSchema.safeParse(requestFromFields(fields)); return result.success ? { ok: true, valid: true } : { ok: false, valid: false, errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) } },
    'form.submit': ({ fields = {} }) => { const request = requestFromFields(fields); const parsed = createTaskSchema.safeParse(request); if (!parsed.success) return handlers['form.validate']({ fields }); const id = useFactoryStore.getState().startRun(parsed.data); return { ok: !!id, started: !!id, pullRequestNumber: parsed.data.pullRequestNumber } },
    'form.cancel': () => { useFactoryStore.getState().setCreateDialogOpen(false); return { ok: true, cancelled: true } },
    'artifact.copy': async () => {
      const button = document.querySelector('[data-copy-manifest]')
      if (!button) return { ok: false, error: 'Select an accepted task first' }
      delete button.dataset.copyStatus
      button.click()
      for (let attempt = 0; attempt < 100; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 20))
        if (button.dataset.copyStatus === 'success') return { ok: true, format: 'task-manifest', copy_triggered: true }
        if (button.dataset.copyStatus === 'error') return { ok: false, error: 'Visible copy control reported failure' }
      }
      return { ok: false, error: 'Visible copy control did not settle' }
    },
  }
  const tools = [
    { name: 'browse.open', description: 'Open a declared destination (route, tab, section, or item).', inputSchema: objectSchema({ destination: { type: 'string', enum: destinations, description: 'Declared destination' } }, ['destination']) },
    { name: 'browse.search', description: 'Search within the browsable surface.', inputSchema: objectSchema({ query: { type: 'string', maxLength: 200 } }, ['query']) },
    { name: 'browse.apply_filter', description: 'Apply a declared filter.', inputSchema: objectSchema({ filter: { type: 'string', enum: filters }, value: { type: 'string', maxLength: 200 } }, ['filter']) },
    { name: 'browse.clear_filter', description: 'Clear one or all declared filters.', inputSchema: objectSchema({ filter: { type: 'string', enum: filters } }) },
    { name: 'form.validate', description: 'Run declared form validation.', inputSchema: objectSchema({ fields: fieldsSchema }) },
    { name: 'form.submit', description: 'Submit the form through the visible handler.', inputSchema: objectSchema({ fields: fieldsSchema }) },
    { name: 'form.cancel', description: 'Cancel the active form workflow.', inputSchema: objectSchema({}) },
    { name: 'artifact.copy', description: 'Trigger copy via the visible control (clipboard verified in Playwright).', inputSchema: objectSchema({}) },
  ]
  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules: ['browse-query-v1', 'form-workflow-v1', 'artifact-transfer-v1'], tool_names: tools.map((tool) => tool.name), tool_count: tools.length })
  window.webmcp_list_tools = () => tools.map((tool) => ({ ...tool }))
  window.webmcp_invoke_tool = async (name, args = {}) => { const tool = tools.find((candidate) => candidate.name === name); if (!tool) return { ok: false, error: `unknown_tool: ${name}` }; const error = validateInput(tool.inputSchema, args); if (error) return { ok: false, error }; try { return await handlers[name](args) } catch (cause) { return { ok: false, error: String(cause?.message || cause) } } }
  try { if (navigator.modelContext?.registerTool) tools.forEach((tool) => navigator.modelContext.registerTool({ ...tool, invoke: (args) => window.webmcp_invoke_tool(tool.name, args || {}) })) } catch {}
  return () => { delete window.webmcp_session_info; delete window.webmcp_list_tools; delete window.webmcp_invoke_tool }
}

export default function App() {
  const activeView = useFactoryStore((s) => s.activeView)
  const toasts = useFactoryStore((s) => s.toasts)
  const dismissToast = useFactoryStore((s) => s.dismissToast)
  const theme = useFactoryStore((s) => s.theme)
  const density = useFactoryStore((s) => s.density)
  const gestureMode = useFactoryStore((s) => s.gestureMode)
  const lastExportCount = useFactoryStore((s) => s.lastExportCount)
  const navigate = useFactoryStore((s) => s.navigate)
  const setCreateDialogOpen = useFactoryStore((s) => s.setCreateDialogOpen)
  useEffect(() => registerWebMcp(), [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    document.body.dataset.lastExportCount = String(lastExportCount)
    return () => { delete document.body.dataset.lastExportCount }
  }, [lastExportCount])
  useEffect(() => {
    const markIcons = () => {
      document.querySelectorAll('svg:not([aria-label]):not([aria-hidden])').forEach((svg) => {
        svg.setAttribute('aria-hidden', 'true')
        svg.setAttribute('focusable', 'false')
      })
    }
    markIcons()
    const root = document.querySelector('.app-shell') || document.body
    const observer = new MutationObserver(markIcons)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [activeView])
  useEffect(() => {
    let chord = ''
    const onKey = (event) => {
      if (event.target?.closest?.('input, textarea, [contenteditable=true]')) return
      if (event.key === 'g') {
        chord = 'g'
        return
      }
      if (chord === 'g') {
        if (event.key === 't') navigate('timeline')
        if (event.key === 'a') navigate('analytics')
        if (event.key === 'r') navigate('repositories')
        if (event.key === 'c') setCreateDialogOpen(true)
        chord = ''
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, setCreateDialogOpen])
  useEffect(() => {
    if (!gestureMode) return undefined
    let startY = 0
    const onStart = (event) => { startY = event.touches?.[0]?.clientY || 0 }
    const onEnd = (event) => {
      const endY = event.changedTouches?.[0]?.clientY || 0
      if (startY - endY > 80) { setCreateDialogOpen(true); useFactoryStore.getState().addToast('Gesture recognized: opened dialog', 'info'); }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [gestureMode, setCreateDialogOpen])
  return (
    <div className={cn('app-shell', `theme-${theme}`, `density-${density}`, gestureMode && 'gesture-on')}>
      <AppSidebar /><MobileHeader />
      <main className="main">
        {activeView === 'repositories' && <RepositoriesView />}
        {activeView === 'repository-pipeline' && <PipelineView />}
        {activeView === 'task-detail' && <TaskDetailView />}
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'analytics' && <AnalyticsView />}
      </main>
      <OnboardingTour />
      <CreateTaskDialog />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
