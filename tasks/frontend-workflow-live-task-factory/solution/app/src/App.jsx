import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Switch from '@radix-ui/react-switch'
import * as Tabs from '@radix-ui/react-tabs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Archive, ArrowClockwise, ArrowLeft, ArrowRight, BracketsCurly, Check, CheckCircle,
  CircleNotch, Clock, CloudArrowDown, Code, Command, Copy, Database, DownloadSimple,
  Eye, EyeSlash, FileArrowUp, FileCode, FileText, Funnel, GithubLogo, Info, Key,
  LinkSimple, ListChecks, MagnifyingGlass, Package, Pause, Play, Plug, PlugsConnected,
  Plus, Queue, Robot, Rows, SidebarSimple, Sparkle, SquaresFour, Trash, Warning,
  X, XCircle,
} from '@phosphor-icons/react'
import {
  addRepositorySchema,
  aiConnectionSchema,
  githubConnectionSchema,
  importErrors,
  rejectActionSchema,
  rejectReasons,
} from './lib/schemas'
import { allFixturePrs, findFixture } from './lib/fixtures'
import {
  cardId,
  difficultyFor,
  isTestFile,
  selectMode,
  selectTriageStats,
  sourceCount,
  sourceFiles,
  useAppStore,
} from './store/useAppStore'
import { registerWebMCP } from './lib/webmcp'

const cx = (...parts) => parts.filter(Boolean).join(' ')
const titleReason = (reason) => ({
  'too-few-files': 'Too few files',
  'too-many-files': 'Too many files',
  'docs-only': 'Docs only',
  'no-linked-issue': 'No linked issue',
}[reason] || reason)
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
const formatTime = (value) => value ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)) : '—'

function Button({ variant = 'outline', size = '', className = '', children, ...props }) {
  return <button className={cx('btn', `btn-${variant}`, size && `btn-${size}`, className)} {...props}>{children}</button>
}

function Coachmark({ kind, title, children, className = '' }) {
  const dismissed = useAppStore((state) => state.coachmarks[kind])
  const dismiss = useAppStore((state) => state.dismissCoachmark)
  if (dismissed) return null
  return (
    <div className={cx('coachmark', className)} role="note">
      <button onClick={() => dismiss(kind)} aria-label={`Dismiss ${title} tip`}><X size={12} /></button>
      <strong>{title}</strong>{children}
    </div>
  )
}

function ModeChip() {
  const mode = useAppStore(selectMode)
  return <div className={cx('mode-chip', mode === 'live' ? 'mode-live' : 'mode-demo')}><span className="mode-dot" />{mode === 'live' ? 'Live' : 'Demo data'}</div>
}

function TopBar() {
  const githubStatus = useAppStore((state) => state.githubStatus)
  const aiStatus = useAppStore((state) => state.aiStatus)
  const setConnectionsOpen = useAppStore((state) => state.setConnectionsOpen)
  const setCommandOpen = useAppStore((state) => state.setCommandOpen)
  const setMobileNavOpen = useAppStore((state) => state.setMobileNavOpen)
  return (
    <header className="topbar">
      <div className="brand-wrap">
        <Button className="icon-mobile btn-icon" variant="ghost" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><SidebarSimple size={20} /></Button>
        <div className="brand-mark"><BracketsCurly size={21} weight="bold" /></div>
        <div><div className="brand-title">TaskFoundry</div><div className="brand-subtitle">Evaluation task console</div></div>
      </div>
      <div className="top-actions">
        <ModeChip />
        <div className="status-pair" aria-label="Connection status" aria-live="polite">
          <span className={cx('connection-chip', githubStatus === 'connected' && 'connected')}><GithubLogo size={13} /> GitHub {githubStatus === 'connected' ? 'ready' : 'off'}</span>
          <span className={cx('connection-chip', aiStatus === 'connected' && 'connected')}><Robot size={13} /> AI {aiStatus === 'connected' ? 'ready' : 'off'}</span>
        </div>
        <Button variant="outline" className="keyboard-btn" onClick={() => setCommandOpen(true)}><Command size={14} /> Search <span className="mono tiny">⌘K</span></Button>
        <Button variant="primary" onClick={() => setConnectionsOpen(true)}><Plug size={15} /> Connections</Button>
      </div>
      <Coachmark kind="connections" title="Connect when you’re ready" className="coachmark-connection">The whole factory works on fixtures now. Add credentials here later to switch the same controls to live data.</Coachmark>
    </header>
  )
}

const navItems = [
  { id: 'candidates', label: 'Candidates', icon: Rows },
  { id: 'triage', label: 'Triage', icon: SquaresFour },
  { id: 'runs', label: 'Runs', icon: ListChecks },
  { id: 'library', label: 'Library', icon: Archive },
]

function Sidebar() {
  const active = useAppStore((state) => state.activeView)
  const setView = useAppStore((state) => state.setView)
  const open = useAppStore((state) => state.mobileNavOpen)
  const setOpen = useAppStore((state) => state.setMobileNavOpen)
  return <>
    {open && <button className="mobile-nav-overlay" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <aside className={cx('sidebar', open && 'open')}>
      <div className="nav-label">Workbench</div>
      <nav className="nav-list" aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={cx('nav-item', active === id && 'active')} aria-current={active === id ? 'page' : undefined} onClick={() => setView(id)}><Icon size={18} weight={active === id ? 'fill' : 'regular'} />{label}</button>)}
      </nav>
      <div className="nav-foot"><strong>Portable by design</strong>Every completed run becomes a validated JSON bundle you can export, import, and keep.</div>
    </aside>
  </>
}

function ConnectionStatus({ status, connectedText }) {
  return <span className={cx('credential-status', status === 'connected' && 'connected')}>
    {status === 'checking' ? <CircleNotch className="spinner" size={11} /> : status === 'connected' ? <CheckCircle size={11} weight="fill" /> : <span className="mode-dot" />}
    {status === 'checking' ? 'Checking' : status === 'connected' ? connectedText : 'Disconnected'}
  </span>
}

function ConnectionsPanel() {
  const open = useAppStore((state) => state.connectionsOpen)
  const setOpen = useAppStore((state) => state.setConnectionsOpen)
  const store = useAppStore()
  const [showGithub, setShowGithub] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const gh = useForm({ resolver: zodResolver(githubConnectionSchema), defaultValues: { githubToken: '' } })
  const ai = useForm({ resolver: zodResolver(aiConnectionSchema), defaultValues: { aiBaseUrl: store.aiBaseUrl, aiApiKey: '' } })

  useEffect(() => { ai.setValue('aiBaseUrl', store.aiBaseUrl) }, [store.aiBaseUrl])
  const submitGithub = gh.handleSubmit(async ({ githubToken }) => { store.setCredential('githubToken', githubToken); await store.connectGithub() })
  const submitAI = ai.handleSubmit(async ({ aiBaseUrl, aiApiKey }) => { store.setAiBaseUrl(aiBaseUrl); store.setCredential('aiApiKey', aiApiKey); await store.connectAI() })

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="sheet" aria-describedby="connections-description">
          <div className="sheet-head">
            <div><Dialog.Title className="sheet-title">Connections</Dialog.Title><Dialog.Description id="connections-description" className="sheet-description">Credentials stay in memory for this tab only. Reloading clears both keys and returns to demo data.</Dialog.Description></div>
            <Dialog.Close asChild><Button variant="ghost" className="btn-icon" aria-label="Close Connections"><X size={18} /></Button></Dialog.Close>
          </div>

          <section className="card credential-card">
            <div className="credential-head"><div className="credential-name"><GithubLogo size={20} /> GitHub</div><ConnectionStatus status={store.githubStatus} connectedText={store.githubLogin ? `Connected · ${store.githubLogin}` : 'Connected'} /></div>
            <form className="credential-form" onSubmit={submitGithub} noValidate>
              <label className="field">
                <span className="field-label">GitHub token</span>
                <span className="input-wrap"><input className={cx('input', gh.formState.errors.githubToken && 'error')} type={showGithub ? 'text' : 'password'} autoComplete="off" aria-invalid={!!gh.formState.errors.githubToken} aria-describedby="github-token-error" {...gh.register('githubToken')} /><button type="button" className="field-toggle" onClick={() => setShowGithub((value) => !value)} aria-label={showGithub ? 'Hide GitHub token' : 'Show GitHub token'}>{showGithub ? <EyeSlash size={16} /> : <Eye size={16} />}</button></span>
                {gh.formState.errors.githubToken && <span id="github-token-error" className="field-error">{gh.formState.errors.githubToken.message}</span>}
              </label>
              {store.githubError && <div className="notice error"><Warning size={15} /> <span>{store.githubError}. Check the token and try again; demo data is still available.</span></div>}
              <div className="credential-actions">{store.githubStatus === 'connected' ? <Button type="button" variant="danger" onClick={() => { store.disconnectGithub(); gh.reset() }}>Disconnect GitHub</Button> : <Button type="submit" variant="primary" disabled={store.githubStatus === 'checking'}>{store.githubStatus === 'checking' ? <CircleNotch className="spinner" size={14} /> : <PlugsConnected size={14} />} Connect GitHub</Button>}</div>
            </form>
          </section>

          <section className="card credential-card">
            <div className="credential-head"><div className="credential-name"><Robot size={20} /> AI endpoint</div><ConnectionStatus status={store.aiStatus} connectedText="Connected" /></div>
            <form className="credential-form" onSubmit={submitAI} noValidate>
              <label className="field"><span className="field-label">AI base URL</span><input className={cx('input', ai.formState.errors.aiBaseUrl && 'error')} type="url" aria-invalid={!!ai.formState.errors.aiBaseUrl} aria-describedby="ai-url-error" {...ai.register('aiBaseUrl')} />{ai.formState.errors.aiBaseUrl && <span id="ai-url-error" className="field-error">{ai.formState.errors.aiBaseUrl.message}</span>}</label>
              <label className="field">
                <span className="field-label">AI API key</span>
                <span className="input-wrap"><input className={cx('input', ai.formState.errors.aiApiKey && 'error')} type={showAI ? 'text' : 'password'} autoComplete="off" aria-invalid={!!ai.formState.errors.aiApiKey} aria-describedby="ai-key-error" {...ai.register('aiApiKey')} /><button type="button" className="field-toggle" onClick={() => setShowAI((value) => !value)} aria-label={showAI ? 'Hide AI API key' : 'Show AI API key'}>{showAI ? <EyeSlash size={16} /> : <Eye size={16} />}</button></span>
                {ai.formState.errors.aiApiKey && <span id="ai-key-error" className="field-error">{ai.formState.errors.aiApiKey.message}</span>}
              </label>
              {store.aiError && <div className="notice error"><Warning size={15} /> <span>{store.aiError}. Check the URL and key; deterministic demo generation remains active.</span></div>}
              <div className="credential-actions">{store.aiStatus === 'connected' ? <Button type="button" variant="danger" onClick={() => { store.disconnectAI(); ai.setValue('aiApiKey', '') }}>Disconnect AI</Button> : <Button type="submit" variant="primary" disabled={store.aiStatus === 'checking'}>{store.aiStatus === 'checking' ? <CircleNotch className="spinner" size={14} /> : <PlugsConnected size={14} />} Connect AI</Button>}</div>
            </form>
          </section>

          <section className="card card-pad" style={{ marginTop: 15 }}>
            <div className="credential-head"><div><div className="credential-name"><Sparkle size={18} /> Coachmarks</div><p className="field-help" style={{ marginTop: 5 }}>Restore the first-run tips across Connections, Triage, and Runs.</p></div><Button variant="outline" size="sm" onClick={() => { store.resetCoachmarks(); store.toast('Tips reset', 'All three coachmarks are visible again.') }}><ArrowClockwise size={13} /> Reset tips</Button></div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ActiveChips({ filters, clear, setFilter }) {
  const chips = []
  if (filters.min != null || filters.max != null) chips.push({ key: 'range', label: `Source files ${filters.min ?? 'any'}–${filters.max ?? 'any'}`, remove: () => setFilter({ min: null, max: null }) })
  if (filters.requireIssue) chips.push({ key: 'issue', label: 'Linked issue required', remove: () => setFilter({ requireIssue: false }) })
  if (!chips.length) return null
  return <div className="chip-row" aria-label="Active filters">{chips.map((chip) => <span className="chip" key={chip.key}>{chip.label}<button onClick={chip.remove} aria-label={`Remove ${chip.label} filter`}><X size={11} /></button></span>)}<Button variant="ghost" size="sm" onClick={clear}>Clear all</Button></div>
}

function AddRepositoryForm() {
  const addRepository = useAppStore((state) => state.addRepository)
  const [notice, setNotice] = useState('')
  const form = useForm({ resolver: zodResolver(addRepositorySchema), defaultValues: { repository: '' } })
  const submit = form.handleSubmit(async (payload) => {
    const result = await addRepository(payload)
    setNotice(result.notice || '')
    if (result.ok) { form.reset(); setNotice('Repository added from GitHub.') }
  })
  return <form onSubmit={submit} noValidate>
    <div className="inline-form">
      <label className="field"><span className="field-label">Repository</span><input className={cx('input', form.formState.errors.repository && 'error')} aria-invalid={!!form.formState.errors.repository} aria-describedby="repository-error" {...form.register('repository')} />{form.formState.errors.repository && <span id="repository-error" className="field-error">repository: {form.formState.errors.repository.message}</span>}</label>
      <Button type="submit" variant="primary"><Plus size={14} /> Add repository</Button>
    </div>
    {notice && <div className={cx('notice', notice.includes('added') && 'success')} style={{ marginTop: 9 }}><Info size={14} /><span>{notice}</span></div>}
  </form>
}

function PrDetail({ repo, pr }) {
  const sources = sourceFiles(pr)
  return <div className="detail">
    <div className="detail-top"><div><div className="eyebrow"><GithubLogo size={12} /> Pull request #{pr.number}</div><h3 className="section-title">{pr.title}</h3></div><span className={cx('difficulty', `difficulty-${sources.length >= 3 && sources.length <= 10 ? difficultyFor(sources.length) : 'hard'}`)}>{sources.length} source files</span></div>
    <p className="detail-body">{pr.body}</p>
    {pr.linkedIssue ? <div className="issue-card"><LinkSimple size={17} /><div><strong>Linked issue #{pr.linkedIssue.number}</strong><div className="subtle" style={{ marginTop: 2 }}>{pr.linkedIssue.title}</div></div></div> : <div className="notice"><Warning size={15} /><span><strong>No linked issue.</strong> This PR only carries context from its title and body.</span></div>}
    <div className="list-head" style={{ marginTop: 17 }}><div><h4 className="section-title">Changed files</h4><div className="subtle tiny" style={{ marginTop: 3 }}>{pr.files.length} changed · {sources.length} non-test source</div></div></div>
    <div className="table-wrap"><table><thead><tr><th>Filename</th><th>Additions</th><th>Deletions</th></tr></thead><tbody>{pr.files.map((file) => <tr key={file.filename}><td className="file-name">{file.filename}{isTestFile(file.filename) && <span className="test-badge">Test file</span>}</td><td className="additions">+{file.additions}</td><td className="deletions">−{file.deletions}</td></tr>)}</tbody></table></div>
  </div>
}

function CandidatesView() {
  const repositories = useAppStore((state) => state.repositories)
  const selectedRepo = useAppStore((state) => state.selectedRepo)
  const selectedPr = useAppStore((state) => state.selectedPr)
  const loadedCounts = useAppStore((state) => state.loadedCounts)
  const filters = useAppStore((state) => state.sourceFilters)
  const selectRepo = useAppStore((state) => state.selectRepo)
  const selectPr = useAppStore((state) => state.selectPr)
  const loadMore = useAppStore((state) => state.loadMore)
  const setFilters = useAppStore((state) => state.setSourceFilters)
  const clearFilters = useAppStore((state) => state.clearSourceFilters)
  const repo = repositories.find((item) => item.name === selectedRepo) || repositories[0]
  const filtered = repo.prs.filter((pr) => {
    const count = sourceCount(pr)
    return (filters.min == null || count >= filters.min) && (filters.max == null || count <= filters.max) && (!filters.requireIssue || !!pr.linkedIssue)
  })
  const loaded = filtered.slice(0, loadedCounts[repo.name] || 5)
  const detailPr = repo.prs.find((pr) => pr.number === selectedPr)
  return <div className="view">
    <div className="page-head"><div><div className="eyebrow"><Sparkle size={12} /> Candidate discovery</div><h1 className="page-title">Find the right merged change.</h1><p className="page-description">Review real pull request shape, separate tests from source, and narrow the queue before triage.</p></div><div style={{ minWidth: 330, maxWidth: 470, width: '100%' }}><AddRepositoryForm /></div></div>
    <div className="candidate-grid">
      <section className="card card-pad repo-panel"><div className="list-head"><div><h2 className="section-title">Repositories</h2><div className="subtle tiny" style={{ marginTop: 3 }}>{repositories.length} workspaces</div></div><Database size={19} className="subtle" /></div><div className="repo-list">{repositories.map((item) => <button className={cx('repo-row', item.name === repo.name && 'active')} key={item.name} onClick={() => selectRepo(item.name)}><div className="repo-row-top"><span className="repo-name">{item.name}</span><ArrowRight size={13} /></div><div className="repo-desc">{item.description}</div><div className="meta-line"><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span className="language-dot" />{item.language}</span><span>{item.prs.length} merged PRs</span></div></button>)}</div></section>
      <section className="card card-pad">
        <div className="list-head"><div><div className="eyebrow" style={{ marginBottom: 4 }}>{repo.language} repository</div><h2 className="section-title">{repo.name}</h2></div><span className="connection-chip"><GithubLogo size={13} /> {repo.prs.length} merged</span></div>
        <div className="filter-row">
          <label className="field number-field"><span className="field-label">Min files</span><input className="input" type="number" min="0" max="99" value={filters.min ?? ''} onChange={(event) => setFilters({ min: event.target.value === '' ? null : Number(event.target.value) })} /></label>
          <label className="field number-field"><span className="field-label">Max files</span><input className="input" type="number" min="0" max="99" value={filters.max ?? ''} onChange={(event) => setFilters({ max: event.target.value === '' ? null : Number(event.target.value) })} /></label>
          <label className="switch-field"><Switch.Root className="switch-root" checked={filters.requireIssue} onCheckedChange={(requireIssue) => setFilters({ requireIssue })} aria-label="Require linked issue"><Switch.Thumb className="switch-thumb" /></Switch.Root> Require linked issue</label>
        </div>
        <ActiveChips filters={filters} clear={clearFilters} setFilter={setFilters} />
        {loaded.length ? <><div className="pr-list">{loaded.map((pr, index) => <button key={pr.number} className={cx('pr-row', selectedPr === pr.number && 'active')} style={{ animationDelay: `${index * 25}ms` }} onClick={() => selectPr(repo.name, pr.number)}><span className="pr-num">#{pr.number}</span><span className="pr-title">{pr.title}</span><span className="pr-meta"><Clock size={12} />{formatDate(pr.merged_at).replace(', 2026', '')}</span><span className="pr-meta">{pr.linkedIssue ? <><LinkSimple size={12} /> Issue</> : <><XCircle size={12} /> No issue</>}</span><span className="pr-meta"><FileCode size={12} /> {pr.files.length} / {sourceCount(pr)} src</span></button>)}</div><div className="list-footer"><span>Loaded {loaded.length} of {filtered.length} matching PRs</span>{loaded.length < filtered.length && <Button variant="outline" size="sm" onClick={() => loadMore(repo.name)}>Load next page <ArrowRight size={12} /></Button>}</div></> : <div className="empty-state"><div className="empty-icon"><Funnel size={20} /></div><h3>No pull requests match</h3><p>Active filters: source files {filters.min ?? 'any'}–{filters.max ?? 'any'}{filters.requireIssue ? ', linked issue required' : ''}. Clear them to restore the full list.</p><Button variant="outline" onClick={clearFilters}>Clear filters</Button></div>}
        {detailPr && <PrDetail repo={repo} pr={detailPr} />}
      </section>
    </div>
  </div>
}

function ReasonBadge({ reason, count }) {
  return <span className={cx('reason-badge', `reason-${reason}`)}>{titleReason(reason)}{count != null ? ` · ${count}` : ''}</span>
}

function RejectDialog({ repo, pr }) {
  const [open, setOpen] = useState(false)
  const triage = useAppStore((state) => state.triagePr)
  const form = useForm({ resolver: zodResolver(rejectActionSchema), defaultValues: { reason: '' } })
  const submit = form.handleSubmit(({ reason }) => { triage(repo, pr.number, 'rejected', reason); setOpen(false); form.reset() })
  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); if (!value) form.reset() }}><Dialog.Trigger asChild><Button variant="ghost" size="sm"><XCircle size={13} /> Reject PR</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-center" aria-describedby="reject-description"><div className="dialog-head"><div><Dialog.Title className="dialog-title">Reject PR #{pr.number}</Dialog.Title><Dialog.Description id="reject-description" className="dialog-description">Choose one closed reason. The payload is stored with the card and reflected in board stats.</Dialog.Description></div><Dialog.Close asChild><Button className="btn-icon" variant="ghost" aria-label="Close reject reason chooser"><X size={17} /></Button></Dialog.Close></div><form onSubmit={submit} noValidate><label className="field" style={{ marginTop: 16 }}><span className="field-label">Reject reason</span><select className={cx('select', form.formState.errors.reason && 'error')} aria-invalid={!!form.formState.errors.reason} aria-describedby="reject-error" {...form.register('reason')}><option value="">Choose a reject reason</option>{rejectReasons.map((reason) => <option key={reason} value={reason}>{titleReason(reason)}</option>)}</select>{form.formState.errors.reason && <span id="reject-error" className="field-error">reason: {form.formState.errors.reason.message}</span>}</label><div className="dialog-actions"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="submit" variant="danger">Reject PR</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function TriageCard({ item, column }) {
  const placement = useAppStore((state) => state.triage[cardId(item.repo, item.pr.number)])
  const triage = useAppStore((state) => state.triagePr)
  const startRun = useAppStore((state) => state.startRun)
  const queue = useAppStore((state) => state.batchQueue)
  const toggleQueue = useAppStore((state) => state.toggleBatchQueue)
  const toast = useAppStore((state) => state.toast)
  const queued = queue.some((entry) => cardId(entry.repo, entry.prNumber) === cardId(item.repo, item.pr.number))
  const launch = () => {
    const result = startRun(item.repo, item.pr.number)
    if (!result.ok) toast('Pipeline blocked', result.error)
  }
  return <article className="triage-card">
    <div className="triage-card-meta"><span className="mono">{item.repo.split('/')[1]} · #{item.pr.number}</span><span>{sourceCount(item.pr)} src</span></div>
    <h3 className="triage-card-title">{item.pr.title}</h3>
    <div className="triage-card-meta"><span>{item.language}</span><span>{item.pr.linkedIssue ? `Issue #${item.pr.linkedIssue.number}` : 'No linked issue'}</span></div>
    {placement?.reason && <div style={{ marginTop: 8 }}><ReasonBadge reason={placement.reason} /></div>}
    <div className="triage-actions">
      {column === 'inbox' && <><Button variant="primary" size="sm" onClick={() => triage(item.repo, item.pr.number, 'accepted')}><Check size={13} /> Accept</Button><RejectDialog repo={item.repo} pr={item.pr} /></>}
      {column === 'accepted' && <><Button variant="primary" size="sm" onClick={launch}><Play size={13} /> Run pipeline</Button><Button variant={queued ? 'primary' : 'ghost'} size="sm" onClick={() => toggleQueue(item.repo, item.pr.number)}><Queue size={13} /> {queued ? 'Queued' : 'Queue'}</Button></>}
      {column === 'rejected' && <Button variant="ghost" size="sm" onClick={() => triage(item.repo, item.pr.number, 'accepted')}><ArrowClockwise size={13} /> Accept instead</Button>}
    </div>
  </article>
}

function TriageView() {
  const triage = useAppStore((state) => state.triage)
  const repositories = useAppStore((state) => state.repositories)
  const stats = useMemo(() => selectTriageStats({ triage }), [triage])
  const rejectFilter = useAppStore((state) => state.rejectedFilter)
  const setRejectFilter = useAppStore((state) => state.setRejectedFilter)
  const candidates = repositories.flatMap((repo) => repo.prs.map((pr) => ({ repo: repo.name, language: repo.language, pr })))
  const columns = ['inbox', 'accepted', 'rejected']
  return <div className="view">
    <div className="page-head"><div><div className="eyebrow"><SquaresFour size={12} /> Decision board</div><h1 className="page-title">Shape the evaluation queue.</h1><p className="page-description">Accept strong candidates, reject with a bounded reason, and undo the last move without losing context.</p></div></div>
    <Coachmark kind="triage" title="Triage is reversible" className="coachmark-inline">Move a card to Accepted or choose a precise reject reason. The toast’s Undo restores both the card and every total.</Coachmark>
    <div className="stats-grid"><div className="card stat-card"><div className="stat-label">Candidates</div><div className="stat-value">{stats.total}</div></div><div className="card stat-card"><div className="stat-label">Accepted</div><div className="stat-value">{stats.accepted}</div></div><div className="card stat-card"><div className="stat-label">Rejected</div><div className="stat-value">{stats.rejected}</div></div><div className="card stat-card"><div className="stat-label">Rejected breakdown</div><div className="reason-row">{rejectReasons.map((reason) => <ReasonBadge key={reason} reason={reason} count={stats.reasons[reason]} />)}</div></div></div>
    <div className="board">{columns.map((column) => {
      let items = candidates.filter((item) => (triage[cardId(item.repo, item.pr.number)]?.column || 'inbox') === column)
      if (column === 'rejected' && rejectFilter !== 'all') items = items.filter((item) => triage[cardId(item.repo, item.pr.number)]?.reason === rejectFilter)
      return <section className="board-column" key={column}><div className="column-head"><div className="column-name">{column === 'inbox' ? <Rows size={15} /> : column === 'accepted' ? <CheckCircle size={15} /> : <XCircle size={15} />}{column[0].toUpperCase() + column.slice(1)} <span className="count-badge">{items.length}</span></div>{column === 'rejected' && <label><span className="sr-only">Filter rejected cards by reason</span><select className="select reject-filter" value={rejectFilter} onChange={(event) => setRejectFilter(event.target.value)}><option value="all">All reasons</option>{rejectReasons.map((reason) => <option key={reason} value={reason}>{titleReason(reason)}</option>)}</select></label>}</div><div className="triage-list">{items.map((item) => <TriageCard key={cardId(item.repo, item.pr.number)} item={item} column={column} />)}{!items.length && <div className="empty-state" style={{ padding: 22 }}><p>{column === 'rejected' && rejectFilter !== 'all' ? `No cards rejected for ${titleReason(rejectFilter)}.` : `No cards in ${column}.`}</p></div>}</div></section>
    })}</div>
  </div>
}

function StatusBadge({ status, attempt, maxAttempts }) {
  const Icon = status === 'complete' ? CheckCircle : status === 'failed' ? XCircle : status === 'pending' ? Clock : CircleNotch
  return <span className={cx('status', `status-${status}`)}><Icon className={status === 'running' ? 'spinner' : ''} size={11} weight={status === 'complete' ? 'fill' : 'regular'} />{status}{['running', 'retrying'].includes(status) && maxAttempts > 1 ? ` · ${attempt}/${maxAttempts}` : ''}</span>
}

function downloadFile(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

function CopyButton({ text, label = 'Copy' }) {
  const toast = useAppStore((state) => state.toast)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast('Copied', `${label} is on the clipboard.`)
    setTimeout(() => setCopied(false), 1800)
  }
  return <Button variant="outline" size="sm" onClick={copy}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : label}</Button>
}

function PackageViewer({ bundle, onBack }) {
  if (!bundle) return null
  const exportBundle = () => downloadFile(`${bundle.repo.replace('/', '-')}-pr-${bundle.pr_number}.task-package.json`, JSON.stringify(bundle, null, 2), 'application/json')
  return <section className="package-viewer" aria-label={`Task package for ${bundle.repo} PR ${bundle.pr_number}`}>
    <div className="package-hero"><div>{onBack && <Button variant="ghost" size="sm" onClick={onBack} style={{ color: '#dafa9e', paddingLeft: 0 }}><ArrowLeft size={13} /> Library</Button>}<div className="eyebrow" style={{ color: '#dafa9e', marginTop: onBack ? 6 : 0 }}><Package size={12} /> TaskPackageBundle</div><h3>{bundle.repo} · PR #{bundle.pr_number}</h3><p>schemaVersion: {bundle.schemaVersion} · created {formatDate(bundle.created_at)}</p></div><div className="package-actions"><CopyButton text={JSON.stringify(bundle, null, 2)} label="Copy bundle" /><Button variant="dark" size="sm" onClick={exportBundle}><DownloadSimple size={13} /> Download bundle</Button></div></div>
    <div className="package-body"><Tabs.Root defaultValue="instruction"><Tabs.List className="tabs-list"><Tabs.Trigger className="tab" value="instruction">Instruction</Tabs.Trigger><Tabs.Trigger className="tab" value="config">Task config</Tabs.Trigger><Tabs.Trigger className="tab" value="metadata">Metadata</Tabs.Trigger><Tabs.Trigger className="tab" value="patch">Patch note</Tabs.Trigger></Tabs.List>
      <Tabs.Content className="part" value="instruction"><div className="part-head"><span className="part-label">instruction.md · Generated in this run</span><div className="part-actions"><CopyButton text={bundle.instruction} /><Button variant="outline" size="sm" onClick={() => downloadFile(`pr-${bundle.pr_number}-instruction.md`, bundle.instruction)}><DownloadSimple size={12} /> Download</Button></div></div><pre className="code-block">{bundle.instruction}</pre></Tabs.Content>
      <Tabs.Content className="part" value="config"><div className="part-head"><span className="part-label">task.toml · Validated config</span><div className="part-actions"><CopyButton text={bundle.task_config} /><Button variant="outline" size="sm" onClick={() => downloadFile(`pr-${bundle.pr_number}-task.toml`, bundle.task_config)}><DownloadSimple size={12} /> Download</Button></div></div><pre className="code-block">{bundle.task_config}</pre></Tabs.Content>
      <Tabs.Content className="part" value="metadata"><div className="part-head"><span className="part-label">Package metadata</span><CopyButton text={JSON.stringify({ schemaVersion: bundle.schemaVersion, repo: bundle.repo, pr_number: bundle.pr_number, base_sha: bundle.base_sha, language: bundle.language, difficulty: bundle.difficulty, source_file_count: bundle.source_file_count, created_at: bundle.created_at }, null, 2)} /></div><div className="metadata-grid"><div className="metadata-item"><span>Repository</span><strong>{bundle.repo}</strong></div><div className="metadata-item"><span>Pull request</span><strong>#{bundle.pr_number}</strong></div><div className="metadata-item"><span>Language</span><strong>{bundle.language}</strong></div><div className="metadata-item"><span>Difficulty</span><strong>{bundle.difficulty}</strong></div><div className="metadata-item"><span>Source files</span><strong>{bundle.source_file_count}</strong></div><div className="metadata-item"><span>Base commit SHA</span><strong className="mono">{bundle.base_sha}</strong></div></div></Tabs.Content>
      <Tabs.Content className="part" value="patch"><div className="part-head"><span className="part-label">Bug-patch placeholder</span><CopyButton text={bundle.patch_note} /></div><div className="patch-note">{bundle.patch_note}</div></Tabs.Content>
    </Tabs.Root></div>
  </section>
}

function StageOutput({ stage, run }) {
  if (stage.id === 'fetch' && stage.output) return <div className="fetch-grid"><div className="fetch-item"><strong>Title</strong>{stage.output.title}</div><div className="fetch-item"><strong>Linked issue</strong>{stage.output.issue ? `#${stage.output.issue.number} · ${stage.output.issue.title}` : 'No linked issue'}</div><div className="fetch-item"><strong>Base commit</strong><span className="mono">{stage.output.baseSha}</span></div><div className="fetch-item"><strong>Source files fed forward</strong>{stage.output.sourceFiles.join(', ') || 'None'}</div></div>
  if (stage.id === 'evaluate') return <><div className="stream-block">{stage.output || (stage.status === 'pending' ? 'Waiting for Fetch to complete.' : '')}{stage.status === 'running' && <span className="stream-cursor" aria-label="Streaming" />}</div>{stage.verdict && <div className={cx('verdict', stage.verdict)}>{stage.verdict === 'substantial' ? <CheckCircle size={18} weight="fill" /> : <Warning size={18} weight="fill" />}<div><strong>{stage.verdict[0].toUpperCase() + stage.verdict.slice(1)} verdict</strong><div style={{ marginTop: 2 }}>{stage.reason}</div>{stage.verdict === 'trivial' && <div style={{ marginTop: 4 }}><strong>Run ended after Evaluate. No package was created.</strong></div>}</div></div>}</>
  if (stage.id === 'generate') return <div className="stream-block">{stage.output || (stage.status === 'pending' ? 'Waiting for a substantial verdict.' : '')}{stage.status === 'running' && <span className="stream-cursor" aria-label="Streaming" />}</div>
  if (stage.id === 'package' && stage.output) return <PackageViewer bundle={stage.output} />
  return null
}

function StageCard({ stage, run }) {
  const retry = useAppStore((state) => state.retryStage)
  const highlighted = useAppStore((state) => state.highlightedStage)
  return <section id={`stage-${stage.id}`} className={cx('stage-card', highlighted === stage.id && 'highlighted')}>
    <div className="stage-head"><div className={cx('stage-icon', `status-${stage.status}`)}>{stage.id === 'fetch' ? <CloudArrowDown size={16} /> : stage.id === 'evaluate' ? <ListChecks size={16} /> : stage.id === 'generate' ? <FileText size={16} /> : <Package size={16} />}</div><div><div className="stage-title">{stage.label}</div><div className="stage-time">{stage.startedAt ? `Started ${formatTime(stage.startedAt)}` : 'Not started'}{stage.completedAt ? ` · finished ${formatTime(stage.completedAt)}` : ''}</div></div><StatusBadge status={stage.status} attempt={stage.attempt} maxAttempts={stage.maxAttempts} /></div>
    {(stage.status !== 'pending' || stage.output) && <div className="stage-output">{stage.status === 'retrying' && <div className="notice" style={{ marginBottom: 9 }}><Clock size={15} /><span><strong>{stage.error?.status} {stage.error?.message}</strong><br />Reset in {stage.countdown ?? 0}s · attempt {stage.attempt} of {stage.maxAttempts}</span></div>}{stage.status === 'failed' && <div className="error-block" style={{ marginBottom: 9 }}><strong>{stage.error?.status}: {stage.error?.message}</strong><div style={{ marginTop: 8 }}><Button variant="danger" size="sm" onClick={retry}><ArrowClockwise size={12} /> Retry {stage.label}</Button></div></div>}<StageOutput stage={stage} run={run} /></div>}
  </section>
}

function Timeline({ run }) {
  const filter = useAppStore((state) => state.timelineFilter)
  const setFilter = useAppStore((state) => state.setTimelineFilter)
  const highlight = useAppStore((state) => state.setHighlightedStage)
  const items = filter === 'all' ? run.timeline : run.timeline.filter((item) => item.status === filter)
  return <aside className="card timeline"><div className="list-head"><div><h3 className="section-title">Event timeline</h3><div className="subtle tiny" style={{ marginTop: 3 }}>{run.timeline.length} stage transitions</div></div><Clock size={17} /></div><label className="field" style={{ marginTop: 11 }}><span className="field-label">Filter by status</span><select className="select" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="running">Running</option><option value="retrying">Retrying</option><option value="complete">Complete</option><option value="failed">Failed</option></select></label><div className="timeline-list">{items.map((item) => <button key={item.id} className={cx('timeline-entry', item.status)} onClick={() => { highlight(item.stage); document.getElementById(`stage-${item.stage}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}><span className="timeline-dot" /><span><div className="timeline-message"><strong>{item.stage[0].toUpperCase() + item.stage.slice(1)}</strong> · {item.message}</div><div className="timeline-time">{formatTime(item.timestamp)}</div></span></button>)}{!items.length && <p className="subtle tiny">No timeline entries match this status.</p>}</div></aside>
}

function BatchComposer() {
  const repositories = useAppStore((state) => state.repositories)
  const triage = useAppStore((state) => state.triage)
  const queue = useAppStore((state) => state.batchQueue)
  const toggle = useAppStore((state) => state.toggleBatchQueue)
  const start = useAppStore((state) => state.startBatch)
  const batch = useAppStore((state) => state.batch)
  const report = useAppStore((state) => state.batchReport)
  const [error, setError] = useState('')
  const accepted = repositories.flatMap((repo) => repo.prs.map((pr) => ({ repo: repo.name, pr }))).filter((item) => triage[cardId(item.repo, item.pr.number)]?.column === 'accepted')
  const launch = async () => { const result = await start(); if (!result.ok) setError(result.error); else setError('') }
  return <section className="card batch-card"><div className="list-head"><div><div className="eyebrow" style={{ marginBottom: 4 }}><Queue size={12} /> Sequential batch</div><h2 className="section-title">Batch composer</h2><div className="subtle tiny" style={{ marginTop: 3 }}>Queue at least 2 accepted PRs. Each item runs to one final outcome.</div></div><Button variant="primary" disabled={queue.length < 2 || batch?.status === 'running'} onClick={launch}><Play size={13} /> Start batch · {queue.length}</Button></div><div className="accepted-strip">{accepted.map((item) => { const queued = queue.some((entry) => cardId(entry.repo, entry.prNumber) === cardId(item.repo, item.pr.number)); return <button key={cardId(item.repo, item.pr.number)} className={cx('queue-item', queued && 'queued')} onClick={() => toggle(item.repo, item.pr.number)}><span>{queued ? <CheckCircle size={13} weight="fill" /> : <Plus size={13} />}</span>{item.repo.split('/')[1]} #{item.pr.number}</button> })}</div>{error && <p className="field-error" style={{ marginTop: 8 }}>{error}</p>}
    {batch && <div style={{ marginTop: 14 }}><div className="list-footer"><strong>Overall progress</strong><span>{batch.completed} of {batch.total} complete</span></div><div className="progress-track" style={{ marginTop: 7 }}><div className="progress-fill" style={{ width: `${(batch.completed / batch.total) * 100}%` }} /></div><div className="batch-items">{batch.items.map((item) => <div className="batch-row" key={cardId(item.repo, item.prNumber)}><strong>{item.repo} #{item.prNumber}</strong><span>{item.stage}</span><span className={cx('status', `status-${item.status === 'queued' ? 'pending' : item.status === 'complete' ? 'complete' : 'running'}`)}>{item.outcome || item.status}</span></div>)}</div></div>}
    {report && <div style={{ marginTop: 14 }}><div className="list-head"><div><h3 className="section-title">BatchRunReport</h3><div className="subtle tiny">Every queued PR appears in exactly one bucket.</div></div><Button variant="outline" size="sm" onClick={() => downloadFile(`batch-report-${Date.now()}.json`, JSON.stringify(report, null, 2), 'application/json')}><DownloadSimple size={12} /> Download report</Button></div><div className="report-grid">{['packaged', 'trivial', 'failed', 'skipped'].map((key) => <div className="report-bucket" key={key}><strong>{report[key]}</strong><span className="tiny">{key}</span></div>)}</div></div>}
  </section>
}

function RunsView() {
  const run = useAppStore((state) => state.run)
  const repositories = useAppStore((state) => state.repositories)
  const triage = useAppStore((state) => state.triage)
  const pause = useAppStore((state) => state.pauseRun)
  const resume = useAppStore((state) => state.resumeRun)
  const startRun = useAppStore((state) => state.startRun)
  const [startError, setStartError] = useState('')
  const accepted = repositories.flatMap((repo) => repo.prs.map((pr) => ({ repo: repo.name, language: repo.language, pr }))).filter((item) => triage[cardId(item.repo, item.pr.number)]?.column === 'accepted')
  const launch = (repo, number) => { const result = startRun(repo, number); setStartError(result.ok ? '' : result.error) }
  return <div className="view">
    <div className="page-head"><div><div className="eyebrow"><ListChecks size={12} /> Pipeline runner</div><h1 className="page-title">From merged change to task package.</h1><p className="page-description">Watch each checkpoint, preserve completed outputs across recovery, and finish with portable session work.</p></div></div>
    <Coachmark kind="pipeline" title="Runs preserve checkpoints" className="coachmark-inline">Start from any accepted PR. You can pause mid-stream, inspect events, and retry only the failed stage.</Coachmark>
    <BatchComposer />
    {!run ? <section className="card card-pad"><div className="list-head"><div><h2 className="section-title">Accepted PRs</h2><div className="subtle tiny" style={{ marginTop: 3 }}>Choose a candidate to start one stage sequence.</div></div></div><div className="pr-list">{accepted.map((item) => <div className="pr-row" key={cardId(item.repo, item.pr.number)} style={{ gridTemplateColumns: '54px minmax(180px, 1fr) 100px auto' }}><span className="pr-num">#{item.pr.number}</span><span><span className="pr-title" style={{ display: 'block' }}>{item.pr.title}</span><span className="subtle tiny">{item.repo}</span></span><span className="pr-meta"><FileCode size={12} /> {sourceCount(item.pr)} source</span><Button variant="primary" size="sm" onClick={() => launch(item.repo, item.pr.number)}>Run pipeline <ArrowRight size={12} /></Button></div>)}</div>{startError && <div className="notice error" style={{ marginTop: 10 }}><Warning size={14} />{startError}</div>}</section> : <>
      <div className="run-banner"><div><div className="eyebrow" style={{ color: '#dafa9e', marginBottom: 4 }}>Active run · {run.status}</div><strong>{run.repo} · PR #{run.prNumber}</strong><div className="subtle tiny" style={{ marginTop: 4 }}>Started {formatTime(run.startedAt)} · {run.language}</div></div><div className="run-controls">{run.status === 'running' && (run.paused ? <Button variant="dark" size="sm" onClick={resume}><Play size={13} /> Resume</Button> : <Button variant="dark" size="sm" onClick={pause}><Pause size={13} /> Pause</Button>)}<Button variant="ghost" size="sm" style={{ color: '#d8e3dc' }} onClick={() => useAppStore.setState({ run: null })}>Choose another</Button></div></div>
      <div className="runs-layout"><div className="stage-list">{run.stages.map((stage) => <StageCard key={stage.id} stage={stage} run={run} />)}</div><Timeline run={run} /></div>
    </>}
  </div>
}

function ImportBundle() {
  const importPackage = useAppStore((state) => state.importPackage)
  const [errors, setErrors] = useState([])
  const inputRef = useRef(null)
  const read = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const value = JSON.parse(await file.text())
      const result = importErrors(value)
      if (result.errors.length) setErrors(result.errors)
      else { importPackage(result.data); setErrors([]) }
    } catch {
      setErrors([{ field: 'bundle', message: 'bundle must contain valid JSON' }])
    }
    event.target.value = ''
  }
  return <div><input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={read} aria-label="Import TaskPackageBundle JSON" /><Button variant="primary" onClick={() => inputRef.current?.click()}><FileArrowUp size={14} /> Import bundle</Button>{errors.length > 0 && <div className="notice error import-errors" role="alert"><Warning size={15} /><div><strong>Bundle rejected. Fix these fields:</strong>{errors.map((error, index) => <div key={`${error.field}-${index}`}><span className="mono">{error.field}</span>: {error.message}</div>)}</div></div>}</div>
}

function DeletePackage({ bundle }) {
  const remove = useAppStore((state) => state.deletePackage)
  return <AlertDialog.Root><AlertDialog.Trigger asChild><Button variant="danger"><Trash size={13} /> Delete package</Button></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="dialog-center"><AlertDialog.Title className="dialog-title">Delete this package?</AlertDialog.Title><AlertDialog.Description className="dialog-description">This removes exactly {bundle.repo} PR #{bundle.pr_number} created {formatDate(bundle.created_at)}. Export it first if you need a recoverable copy.</AlertDialog.Description><div className="dialog-actions"><AlertDialog.Cancel asChild><Button variant="ghost">Cancel</Button></AlertDialog.Cancel><AlertDialog.Action asChild><Button variant="danger" onClick={() => remove(bundle)}>Delete package</Button></AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
}

function LibraryView() {
  const packages = useAppStore((state) => state.packages)
  const selected = useAppStore((state) => state.selectedPackage)
  const select = useAppStore((state) => state.selectPackage)
  const filters = useAppStore((state) => state.libraryFilters)
  const setFilters = useAppStore((state) => state.setLibraryFilters)
  const clearFilters = useAppStore((state) => state.clearLibraryFilters)
  const repos = [...new Set(packages.map((item) => item.repo))]
  const languages = [...new Set(packages.map((item) => item.language))]
  const active = Object.entries(filters).filter(([, value]) => value !== 'all')
  const filtered = packages.filter((item) => (filters.repo === 'all' || item.repo === filters.repo) && (filters.difficulty === 'all' || item.difficulty === filters.difficulty) && (filters.language === 'all' || item.language === filters.language))
  if (selected) return <div className="view"><div className="page-head"><div><div className="eyebrow"><Archive size={12} /> Package library</div><h1 className="page-title">Inspect the portable artifact.</h1></div><DeletePackage bundle={selected} /></div><PackageViewer bundle={selected} onBack={() => useAppStore.setState({ selectedPackage: null })} /></div>
  return <div className="view"><div className="page-head"><div><div className="eyebrow"><Archive size={12} /> Persistent library</div><h1 className="page-title">Keep the work that runs produced.</h1><p className="page-description">Every entry is the exact validated bundle stored at completion or import, ready to reopen and re-export.</p></div><ImportBundle /></div>
    <div className="card library-tools"><label className="field filter-field"><span className="field-label">Repository</span><select className="select" value={filters.repo} onChange={(event) => setFilters({ repo: event.target.value })}><option value="all">All repositories</option>{repos.map((repo) => <option key={repo} value={repo}>{repo}</option>)}</select></label><label className="field filter-field"><span className="field-label">Difficulty</span><select className="select" value={filters.difficulty} onChange={(event) => setFilters({ difficulty: event.target.value })}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label className="field filter-field"><span className="field-label">Language</span><select className="select" value={filters.language} onChange={(event) => setFilters({ language: event.target.value })}><option value="all">All languages</option>{languages.map((language) => <option key={language} value={language}>{language}</option>)}</select></label><div className="chip-row" style={{ flex: 1 }}>{active.map(([key, value]) => <span className="chip" key={key}>{key}: {value}<button aria-label={`Remove ${key} filter`} onClick={() => setFilters({ [key]: 'all' })}><X size={11} /></button></span>)}</div></div>
    {filtered.length ? <div className="card library-list">{filtered.map((bundle) => <button className="library-row" key={`${bundle.repo}-${bundle.pr_number}-${bundle.created_at}`} onClick={() => select(bundle)}><span className="library-primary"><span className="package-icon"><Package size={16} weight="fill" /></span><span><span className="library-name">{bundle.repo}</span><span className="library-sub">Pull request #{bundle.pr_number}</span></span></span><span className={cx('difficulty', `difficulty-${bundle.difficulty}`)}>{bundle.difficulty}</span><span className="subtle tiny">{bundle.language}</span><span className="subtle tiny">{formatDate(bundle.created_at)}</span><span style={{ justifySelf: 'end' }}><ArrowRight size={15} /></span></button>)}</div> : <div className="empty-state"><div className="empty-icon"><Archive size={20} /></div><h3>No packages match</h3><p>Active filters: {active.map(([key, value]) => `${key} = ${value}`).join(', ')}. Clear filters to return to the full persistent library.</p><Button variant="outline" onClick={clearFilters}>Clear filters</Button></div>}
  </div>
}

function CommandPalette() {
  const open = useAppStore((state) => state.commandOpen)
  const setOpen = useAppStore((state) => state.setCommandOpen)
  const repositories = useAppStore((state) => state.repositories)
  const packages = useAppStore((state) => state.packages)
  const [query, setQuery] = useState('')
  useEffect(() => {
    const listener = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(!useAppStore.getState().commandOpen) } }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
  useEffect(() => { if (!open) setQuery('') }, [open])
  const lower = query.toLowerCase()
  const repoResults = repositories.filter((repo) => repo.name.toLowerCase().includes(lower)).slice(0, 4)
  const prResults = repositories.flatMap((repo) => repo.prs.map((pr) => ({ repo, pr }))).filter(({ pr }) => String(pr.number).includes(lower) || pr.title.toLowerCase().includes(lower)).slice(0, 6)
  const packageResults = packages.filter((item) => item.repo.toLowerCase().includes(lower) || String(item.pr_number).includes(lower)).slice(0, 5)
  const choose = (fn) => { fn(); setOpen(false) }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="palette" aria-describedby={undefined}><Dialog.Title className="sr-only">Search TaskFoundry</Dialog.Title><div className="palette-search"><MagnifyingGlass size={18} /><input autoFocus className="palette-input" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search repositories, pull requests, and packages" /><span className="palette-esc">Esc</span></div><div className="palette-results">{[
      ['Repositories', repoResults, (repo) => repo.name, (repo) => repo.language, Database, (repo) => () => useAppStore.getState().selectRepo(repo.name)],
      ['Pull requests', prResults, ({ pr }) => `#${pr.number} · ${pr.title}`, ({ repo }) => repo.name, GithubLogo, ({ repo, pr }) => () => useAppStore.getState().selectPr(repo.name, pr.number)],
      ['Library packages', packageResults, (item) => `${item.repo} · PR #${item.pr_number}`, (item) => `${item.difficulty} · ${item.language}`, Package, (item) => () => useAppStore.getState().selectPackage(item)],
    ].map(([label, items, primary, secondary, Icon, action]) => items.length > 0 && <section className="palette-group" key={label}><div className="palette-label">{label}</div>{items.map((item, index) => <button className="palette-item" key={`${label}-${index}`} onClick={() => choose(action(item))}><span className="palette-item-icon"><Icon size={14} /></span><span><div className="palette-item-title">{primary(item)}</div><div className="palette-item-sub">{secondary(item)}</div></span></button>)}</section>)}{!repoResults.length && !prResults.length && !packageResults.length && <div className="empty-state"><h3>No results</h3><p>Search by repository, PR number or title, or package metadata.</p></div>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function Toasts() {
  const toasts = useAppStore((state) => state.toasts)
  const dismiss = useAppStore((state) => state.dismissToast)
  return <div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div className="toast" key={toast.id}><div className="toast-icon"><Check size={14} weight="bold" /></div><div><strong>{toast.title}</strong><p>{toast.message}</p></div><div className="toast-actions">{toast.undo && <button onClick={() => { toast.undo(); dismiss(toast.id) }}>Undo</button>}<button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X size={11} /></button></div></div>)}</div>
}

function AppView() {
  const active = useAppStore((state) => state.activeView)
  return active === 'triage' ? <TriageView /> : active === 'runs' ? <RunsView /> : active === 'library' ? <LibraryView /> : <CandidatesView />
}

export default function App() {
  const announcement = useAppStore((state) => state.announcement)
  useEffect(() => { registerWebMCP() }, [])
  return <div className="app-shell"><TopBar /><Sidebar /><main className="main"><AppView /></main><ConnectionsPanel /><CommandPalette /><Toasts /><div className="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</div></div>
}
