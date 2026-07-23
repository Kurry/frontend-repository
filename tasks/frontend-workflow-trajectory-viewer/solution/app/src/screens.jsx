import React, { useEffect, useMemo } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowsDownUp, Check, CircleNotch, Clock, Database, File, FolderOpen, ListChecks } from '@phosphor-icons/react'
import { useAppStore } from './store'
import { taskById } from './data'
import { Button, SectionLabel, StatusPill } from './ui'

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg border border-violet-500/35 bg-violet-500/12 font-mono text-xs font-bold text-violet-400">TF</div><div><div className="text-sm font-semibold tracking-tight">Traceframe</div><div className="text-[10px] uppercase tracking-[.18em] text-mist-500">Trajectory reviewer</div></div></div>
}

export function CatalogScreen() {
  const tasks = useAppStore((state) => state.tasks)
  const openTask = useAppStore((state) => state.openTask)
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_70%_-10%,rgba(139,124,246,.13),transparent_35%)]">
      <header className="border-b border-ink-700/80 bg-ink-950/80 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between"><Brand /><span className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-mist-500">Reviewer workspace · seeded</span></div></header>
      <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="mb-10 max-w-2xl"><div className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-violet-400">Benchmark registry</div><h1 className="text-4xl font-semibold tracking-[-.04em] text-white md:text-5xl">Choose a task to inspect.</h1><p className="mt-4 max-w-xl text-base leading-7 text-mist-300">Compare agent trials, trace every workspace mutation, and compile a review package from step-level evidence.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {tasks.map((task, index) => {
            const best = Math.max(...task.trials.map((trial) => trial.reward))
            return <button key={task.id} onClick={() => openTask(task.id)} className="group min-h-64 rounded-xl border border-ink-700 bg-ink-900/85 p-5 text-left shadow-[0_14px_40px_rgba(0,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-500/45 hover:bg-ink-850 focus-visible:outline-2 focus-visible:outline-violet-400"><div className="flex items-center justify-between"><span className="font-mono text-xs text-mist-500">TASK 0{index + 1}</span><span className="rounded-full border border-mint-500/20 bg-mint-500/10 px-2 py-1 font-mono text-[10px] text-mint-500">BEST {best.toFixed(2)}</span></div><h2 className="mt-10 text-xl font-semibold tracking-tight text-white">{task.name}</h2><p className="mt-3 min-h-16 text-sm leading-6 text-mist-300">{task.short}</p><div className="mt-7 flex items-center gap-2 border-t border-ink-700 pt-4 text-xs text-mist-500"><Database size={15} /> {task.trials.length} trials <span className="ml-auto text-violet-400 transition group-hover:translate-x-1">Open task →</span></div></button>
          })}
        </div>
      </div>
    </div>
  )
}

function FileList({ files }) {
  return <div className="mt-3 overflow-hidden rounded-lg border border-ink-700 bg-ink-950/50">{files.map((file) => <div key={file.path} className="flex items-center gap-2 border-b border-ink-800 px-3 py-2.5 font-mono text-xs text-mist-300 last:border-0 hover:bg-ink-800"><File size={14} className="shrink-0 text-mist-500" /><span className="min-w-0 truncate" title={file.path}>{file.path}</span></div>)}</div>
}

export function TaskScreen() {
  const taskId = useAppStore((state) => state.activeTaskId)
  const side = useAppStore((state) => state.filesystemSide)
  const sort = useAppStore((state) => state.trialSort)
  const openCatalog = useAppStore((state) => state.openCatalog)
  const openTrial = useAppStore((state) => state.openTrial)
  const setSide = useAppStore((state) => state.setFilesystemSide)
  const toggleSort = useAppStore((state) => state.toggleSort)
  const task = taskById(taskId)
  const sorted = useMemo(() => [...task.trials].sort((a, b) => sort === 'asc' ? a.reward - b.reward : b.reward - a.reward), [sort, task.trials])
  const files = side === 'reference' ? task.referenceFiles : task.trials[0].files
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-950">
      <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-950/90 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between"><Brand /><Button variant="ghost" onClick={openCatalog}><ArrowLeft size={15} /> Task catalog</Button></div></header>
      <div className="mx-auto w-full min-w-0 max-w-7xl overflow-hidden px-4 py-8 md:px-6">
        <div className="mb-8"><div className="mb-2 font-mono text-xs uppercase tracking-[.15em] text-violet-400">{task.id}</div><h1 className="text-3xl font-semibold tracking-[-.03em] text-white md:text-4xl">{task.name}</h1><p className="mt-3 text-mist-300">{task.short}</p></div>
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,.8fr)]">
          <section className="min-w-0 rounded-xl border border-ink-700 bg-ink-900 p-5 panel-shadow"><SectionLabel>Task Instruction</SectionLabel><div className="rich mt-5 min-w-0 break-words"><ReactMarkdown components={{ h1: ({ children }) => <h3 className="text-xl font-semibold tracking-tight text-white">{children}</h3>, h2: ({ children }) => <h3 className="text-base font-semibold text-white">{children}</h3>, h3: ({ children }) => <h4 className="text-sm font-semibold text-mist-100">{children}</h4> }}>{task.instruction}</ReactMarkdown></div></section>
          <aside className="min-w-0 rounded-xl border border-ink-700 bg-ink-900 p-5"><SectionLabel>Configuration</SectionLabel><dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-ink-700 bg-ink-700 sm:grid-cols-2">{Object.entries(task.config).map(([key, value]) => <div key={key} className="min-w-0 bg-ink-850 p-3"><dt className="break-words text-[10px] uppercase tracking-wider text-mist-500">{key}</dt><dd className="mt-1 break-words text-sm text-mist-100">{value}</dd></div>)}</dl></aside>
        </div>
        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
          <section className="min-w-0 rounded-xl border border-ink-700 bg-ink-900 p-5"><SectionLabel aside={<ToggleGroup.Root type="single" value={side} onValueChange={(value) => value && setSide(value)} aria-label="Filesystem source" className="flex rounded-md border border-ink-700 bg-ink-950 p-0.5"><ToggleGroup.Item value="reference" className="rounded px-2.5 py-1.5 text-[11px] text-mist-500 data-[state=on]:bg-ink-700 data-[state=on]:text-white">Reference</ToggleGroup.Item><ToggleGroup.Item value="trial" className="rounded px-2.5 py-1.5 text-[11px] text-mist-500 data-[state=on]:bg-violet-500 data-[state=on]:text-white">Trial final</ToggleGroup.Item></ToggleGroup.Root>}>Environment files</SectionLabel><FileList files={files} /></section>
          <section className="min-w-0 rounded-xl border border-ink-700 bg-ink-900 p-5"><SectionLabel>Evaluator tests</SectionLabel><div className="mt-3 overflow-hidden rounded-lg border border-ink-700">{task.tests.map((test, i) => <div key={test} className="flex min-w-0 items-center gap-3 border-b border-ink-700 px-3 py-3 text-sm text-mist-300 last:border-0"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint-500/10 font-mono text-[10px] text-mint-500">{i + 1}</span><span className="min-w-0 break-words">{test}</span></div>)}</div></section>
        </div>
        <section className="mt-8 min-w-0 max-w-full"><div className="mb-3 flex items-end justify-between gap-3"><div className="min-w-0"><SectionLabel>Trial comparison</SectionLabel><p className="mt-1 text-sm text-mist-500">Open a run to review its complete trajectory.</p></div><span className="shrink-0 font-mono text-[10px] text-mist-500">3 RUNS</span></div><div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-ink-700 bg-ink-900"><table className="w-max min-w-full border-collapse text-left text-sm"><thead><tr className="border-b border-ink-700 text-[10px] uppercase tracking-[.13em] text-mist-500"><th className="px-4 py-3 font-semibold">Model</th><th className="px-4 py-3 font-semibold"><button onClick={toggleSort} className="flex items-center gap-1.5 rounded px-1 py-1 hover:bg-ink-700" aria-label={`Sort reward ${sort === 'asc' ? 'descending' : 'ascending'}`}>Reward <ArrowsDownUp size={13} /> <span className="text-violet-400">{sort}</span></button></th><th className="px-4 py-3 font-semibold">Outcome</th><th className="px-4 py-3 font-semibold">Duration</th><th className="px-4 py-3 font-semibold">Step count</th></tr></thead><tbody>{sorted.map((trial) => <tr key={trial.id} tabIndex={0} role="button" onClick={() => openTrial(trial.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openTrial(trial.id) } }} className="group cursor-pointer border-b border-ink-800 transition hover:bg-ink-800 focus-visible:bg-ink-800 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-violet-400 last:border-0"><td className="px-4 py-3.5 font-medium text-white">{trial.model}<div className="font-mono text-[10px] font-normal text-mist-500">{trial.id}</div></td><td className="px-4 py-3.5 font-mono text-violet-400">{trial.reward.toFixed(2)}</td><td className="px-4 py-3.5"><StatusPill status={trial.outcome} /></td><td className="px-4 py-3.5 font-mono text-xs text-mist-300">{trial.duration}</td><td className="px-4 py-3.5 font-mono text-xs text-mist-300">{trial.stepCount}</td></tr>)}</tbody></table></div></section>
      </div>
    </div>
  )
}

const ingestItems = ['Parse trajectory steps', 'Index workspace files', 'Build synchronized timeline', 'Prepare review state']

export function IngestScreen() {
  const completed = useAppStore((state) => state.ingest.completed)
  const setCompleted = useAppStore((state) => state.setIngestCompleted)
  const finish = useAppStore((state) => state.finishIngest)
  const activeTrialId = useAppStore((state) => state.activeTrialId)
  useEffect(() => {
    let value = 0
    const timer = window.setInterval(() => {
      value += 1; setCompleted(value)
      if (value >= ingestItems.length) { window.clearInterval(timer); window.setTimeout(finish, 280) }
    }, 400)
    return () => window.clearInterval(timer)
  }, [activeTrialId, finish, setCompleted])
  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_center,rgba(139,124,246,.13),transparent_36%)] px-5"><div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6 panel-shadow"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/10 text-violet-400"><ListChecks size={22} /></div><div><h1 className="text-lg font-semibold text-white">Ingesting trajectory</h1><p className="font-mono text-[10px] text-mist-500">{activeTrialId}</p></div></div><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-violet-500 transition-all duration-300" style={{ width: `${(completed / ingestItems.length) * 100}%` }} /></div><div className="mt-5 space-y-2">{ingestItems.map((item, index) => { const done = index < completed; const current = index === completed; return <div key={item} className={`flex items-center gap-3 rounded-lg border px-3 py-3 transition ${done ? 'border-mint-500/15 bg-mint-500/5' : current ? 'border-violet-500/25 bg-violet-500/5' : 'border-ink-700 bg-ink-850/60'}`}>{done ? <Check size={16} weight="bold" className="text-mint-500" /> : current ? <CircleNotch size={16} className="animate-spin text-violet-400" /> : <span className="h-4 w-4 rounded-full border border-ink-600" />}<span className={`text-sm ${done ? 'text-mist-100' : 'text-mist-500'}`}>{item}</span><span className="ml-auto font-mono text-[10px] uppercase text-mist-500">{done ? 'Complete' : current ? 'Running' : 'Queued'}</span></div>})}</div><div className="mt-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-mist-500"><span>{completed} of {ingestItems.length}</span><span><Clock size={12} className="mr-1 inline" /> Building viewer</span></div></div></div>
}
