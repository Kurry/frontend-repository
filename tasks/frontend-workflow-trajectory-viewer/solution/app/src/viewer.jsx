import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Highlight, themes } from 'prism-react-renderer'
import ReactMarkdown from 'react-markdown'
import {
  ArrowCounterClockwise, ArrowClockwise, ArrowLeft, Brain, CaretDown, Check, CheckCircle,
  Circle, ClipboardText, Code, Command, Copy, DownloadSimple, Eye, File, FileCode, FileCsv,
  FileImage, FolderOpen, MagnifyingGlass, NotePencil, PencilSimple, SlidersHorizontal,
  TerminalWindow, Trash, UploadSimple, WarningCircle, Wrench, X, XCircle,
} from '@phosphor-icons/react'
import { useAppStore } from './store'
import { restoreDialogOpener } from './dialogFocus'
import { taskById, trialById } from './data'
import {
  annotationSchema, behaviorValues, causeValues, failureReportSchema, impactValues, reviewPackageSchema,
  stageValues, validateStepIndices,
} from './schemas'
import { Button, FieldError, Label, RadixSelect, SectionLabel, StatusPill, Textarea, TextInput, titleCase } from './ui'

const typeMeta = {
  reasoning: { icon: Brain, label: 'Reasoning' },
  'tool-call': { icon: Wrench, label: 'Tool call' },
  observation: { icon: Eye, label: 'Observation' },
  terminal: { icon: TerminalWindow, label: 'Terminal' },
  screenshot: { icon: FileImage, label: 'Screenshot' },
}
const filters = ['all', 'reasoning', 'tool-call', 'observation', 'terminal', 'screenshot']

function Header() {
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const task = taskById(trial.taskId)
  const openTask = useAppStore((state) => state.openTask)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const undoCount = useAppStore((state) => state.undoStack.length)
  const redoCount = useAppStore((state) => state.redoStack.length)
  const openExport = useAppStore((state) => state.openExport)
  const openImport = useAppStore((state) => state.openImport)
  const setChrome = useAppStore((state) => state.setChrome)
  return <header className="relative z-30 flex min-h-16 flex-wrap items-center gap-3 border-b border-ink-700 bg-ink-900 px-3 py-2 md:px-4"><Button variant="ghost" className="px-2" onClick={() => openTask(task.id)} aria-label="Back to task"><ArrowLeft size={16} /></Button><div className="min-w-0 border-l border-ink-700 pl-3"><div className="truncate text-sm font-semibold text-white">{trial.model}</div><div className="truncate font-mono text-[10px] text-mist-500">{trial.id}</div></div><div className="flex items-center gap-2"><span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-1 font-mono text-xs text-violet-400">{trial.reward.toFixed(2)}</span><StatusPill status={trial.outcome} /><span className="hidden font-mono text-xs text-mist-500 sm:inline">{trial.duration}</span></div><div className="ml-auto flex items-center gap-1.5"><Button variant="ghost" className="px-2 md:px-3" onClick={undo} disabled={!undoCount} title="Undo (Ctrl+Z)"><ArrowCounterClockwise size={15} /><span className="hidden md:inline">Undo</span></Button><Button variant="ghost" className="px-2 md:px-3" onClick={redo} disabled={!redoCount} title="Redo (Ctrl+Shift+Z)"><ArrowClockwise size={15} /><span className="hidden md:inline">Redo</span></Button><Button id="btn-import" variant="secondary" className="hidden sm:inline-flex" onClick={openImport}><UploadSimple size={15} /> Import review package</Button><Button id="btn-export" onClick={openExport}><ClipboardText size={15} /> Export</Button><Button id="btn-palette" variant="secondary" className="px-2.5" onClick={() => setChrome({ paletteOpen: true })} aria-label="Open command palette"><Command size={16} /><span className="hidden min-[1025px]:inline font-mono text-[10px]">K</span></Button></div></header>
}

function MobileTabs() {
  const pane = useAppStore((state) => state.chrome.mobilePane)
  const setChrome = useAppStore((state) => state.setChrome)
  return <div className="viewer-pane-tabs border-b border-ink-700 bg-ink-900 p-1" aria-label="Viewer panes">{[['timeline', 'Timeline'], ['workspace', 'Workspace'], ['detail', 'Detail']].map(([value, label]) => <button key={value} onClick={() => setChrome({ mobilePane: value })} className={`flex-1 rounded px-3 py-2 text-xs font-medium ${pane === value ? 'bg-violet-500 text-white' : 'text-mist-500 hover:bg-ink-800'}`}>{label}</button>)}</div>
}

function TimelinePane() {
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const activeIndex = useAppStore((state) => state.activeStepIndex)
  const filter = useAppStore((state) => state.stepTypeFilter)
  const pane = useAppStore((state) => state.chrome.mobilePane)
  const setFilter = useAppStore((state) => state.setStepTypeFilter)
  const setActiveStep = useAppStore((state) => state.setActiveStep)
  const refs = useRef(new Map())
  const visible = useMemo(() => filter === 'all' ? trial.steps : trial.steps.filter((step) => step.type === filter), [filter, trial.steps])
  useEffect(() => { refs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [activeIndex, filter])
  const navigate = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (!visible.length) return
    const current = visible.findIndex((step) => step.index === activeIndex)
    let next = current < 0 ? 0 : current
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = Math.min(visible.length - 1, next + 1)
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = Math.max(0, next - 1)
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = visible.length - 1
    setActiveStep(visible[next].index)
  }
  return <aside className={`desktop-pane ${pane === 'timeline' ? 'mobile-active' : ''} flex w-[21%] min-w-0 flex-col border-r border-ink-700 bg-ink-900`} aria-label="Step timeline"><div className="border-b border-ink-700 p-3"><SectionLabel aside={<span className="font-mono text-[10px] text-mist-500">{visible.length}/{trial.stepCount}</span>}>Step Timeline</SectionLabel><ToggleGroup.Root type="single" value={filter} onValueChange={(value) => value && setFilter(value)} className="scrollbar mt-3 flex gap-1 overflow-x-auto pb-1" aria-label="Filter by step type">{filters.map((value) => <ToggleGroup.Item key={value} value={value} className="whitespace-nowrap rounded border border-ink-700 px-2 py-1.5 text-[10px] capitalize text-mist-500 transition hover:bg-ink-700 data-[state=on]:border-violet-500/40 data-[state=on]:bg-violet-500/12 data-[state=on]:text-violet-400">{value}</ToggleGroup.Item>)}</ToggleGroup.Root><div className="mt-3"><div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-mist-500"><span>Step 1</span><span>Step {trial.stepCount}</span></div><input aria-label="Scrub trial steps" type="range" min="1" max={trial.stepCount} value={activeIndex} onChange={(event) => setActiveStep(Number(event.target.value))} className="h-1.5 w-full cursor-ew-resize accent-violet-500" /></div></div><div tabIndex={0} onKeyDown={navigate} className="scrollbar min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-violet-400" aria-label="Timeline entries">{visible.length ? visible.map((step) => { const Icon = typeMeta[step.type].icon; const active = step.index === activeIndex; return <button key={`${filter}-${step.index}`} ref={(node) => node ? refs.current.set(step.index, node) : refs.current.delete(step.index)} onClick={() => setActiveStep(step.index)} aria-current={active ? 'step' : undefined} className={`annotation-enter group flex w-full items-start gap-2.5 border-b border-ink-800 px-3 py-3 text-left transition duration-200 ${active ? 'bg-violet-500/12 shadow-[inset_3px_0_0_#8b7cf6]' : 'hover:bg-ink-800'}`}><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border font-mono text-[9px] ${active ? 'border-violet-500/35 bg-violet-500/15 text-violet-400' : 'border-ink-700 bg-ink-850 text-mist-500'}`}>{String(step.index).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-mist-500"><Icon size={12} />{typeMeta[step.type].label}<span className="ml-auto font-mono normal-case tracking-normal">{step.timestamp}</span></span><span className={`mt-1 block text-xs leading-4 ${active ? 'text-white' : 'text-mist-300'}`}>{step.summary}</span></span><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${step.status === 'error' ? 'bg-red-500' : 'bg-mint-500'}`} title={step.status} /></button> }) : <div className="grid min-h-72 place-items-center px-6 text-center"><div><SlidersHorizontal size={27} className="mx-auto text-mist-500" /><h3 className="mt-3 text-sm font-semibold text-white">No {filter} steps</h3><p className="mt-1 text-xs leading-5 text-mist-500">This trial has no steps matching the active {filter} filter.</p><Button variant="secondary" className="mt-4" onClick={() => setFilter('all')}>Clear filter</Button></div></div>}</div></aside>
}

const badgeStyle = {
  Added: 'border-mint-500/25 bg-mint-500/10 text-mint-500',
  Modified: 'border-violet-500/25 bg-violet-500/10 text-violet-400',
  Deleted: 'border-red-500/25 bg-red-500/10 text-red-500 line-through',
  Truncated: 'border-amber-500/25 bg-amber-500/10 text-amber-500',
}

function fileIcon(type) {
  if (type === 'code') return FileCode
  if (type === 'image') return FileImage
  if (type === 'table') return FileCsv
  return File
}

function CodeRenderer({ file }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    let copied = false
    try {
      await navigator.clipboard.writeText(file.content)
      copied = true
    } catch {
      const area = document.createElement('textarea')
      area.value = file.content
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      copied = document.execCommand('copy')
      area.remove()
    }
    if (!copied) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return <div className="overflow-hidden rounded-lg border border-ink-700 bg-[#0a0d12]"><div className="flex items-center justify-between border-b border-ink-700 bg-ink-850 px-3 py-2"><span className="font-mono text-[10px] uppercase tracking-wider text-violet-400">{file.language || 'text'}</span><Button variant="ghost" className="min-h-7 px-2 py-1" onClick={copy}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied code.' : 'Copy code'}</Button></div><div aria-live="polite" aria-atomic="true" className="sr-only">{copied ? 'Copied code.' : ''}</div><Highlight theme={themes.vsDark} code={file.content} language={file.language || 'text'}>{({ className, style, tokens, getLineProps, getTokenProps }) => <pre className={`${className} scrollbar max-h-[65vh] overflow-auto p-4 font-mono text-xs leading-6`} style={{ ...style, background: 'transparent' }}>{tokens.map((line, i) => <div key={i} {...getLineProps({ line })}><span className="mr-5 inline-block w-5 select-none text-right text-ink-600">{i + 1}</span>{line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}</div>)}</pre>}</Highlight></div>
}

function FileRenderer({ file, badge }) {
  if (!file) return <div className="grid min-h-80 place-items-center text-center"><div><FolderOpen size={34} className="mx-auto text-mist-500" /><h3 className="mt-3 text-sm font-semibold text-white">Select a workspace file</h3><p className="mt-1 text-xs text-mist-500">Choose a file from the tree to inspect its state.</p></div></div>
  if (badge === 'Deleted') return <div className="grid min-h-80 place-items-center text-center"><div className="max-w-sm"><XCircle size={36} className="mx-auto text-red-500" /><h3 className="mt-3 text-base font-semibold text-white">File deleted at this step</h3><p className="mt-2 text-sm leading-6 text-mist-500">{file.path} is retained in the tree as trajectory evidence, but stale content is not rendered.</p></div></div>
  if (file.type === 'markdown') return <article className="rich max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-5"><ReactMarkdown components={{ h1: ({ children }) => <h3 className="text-base font-semibold tracking-tight text-white">{children}</h3>, h2: ({ children }) => <h4 className="text-sm font-semibold text-white">{children}</h4>, h3: ({ children }) => <h5 className="text-sm font-semibold text-mist-100">{children}</h5> }}>{file.content}</ReactMarkdown></article>
  if (file.type === 'code') return <CodeRenderer file={file} />
  if (file.type === 'image') return <div className="grid min-h-80 place-items-center overflow-hidden rounded-lg border border-ink-700 bg-ink-900 p-4"><img src={file.content} alt={file.path ? `Workspace preview for ${file.path}` : "Workspace image preview"} className="max-h-[62vh] max-w-full rounded-md object-contain" /></div>
  if (file.type === 'table') { const [head, ...rows] = file.content.trim().split('\n').map((row) => row.split(',')); return <div className="scrollbar overflow-auto rounded-lg border border-ink-700"><table className="w-full min-w-96 text-left text-sm"><thead className="bg-ink-800 text-[10px] uppercase tracking-wider text-mist-500"><tr>{head.map((cell) => <th key={cell} className="border-b border-ink-700 px-3 py-2.5">{cell}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-ink-800 last:border-0">{row.map((cell, j) => <td key={j} className="px-3 py-3 font-mono text-xs text-mist-300">{cell}</td>)}</tr>)}</tbody></table></div> }
  return null
}

function WorkspacePane() {
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const task = taskById(trial.taskId)
  const activeIndex = useAppStore((state) => state.activeStepIndex)
  const side = useAppStore((state) => state.filesystemSide)
  const selectedPath = useAppStore((state) => state.selectedFile)
  const pane = useAppStore((state) => state.chrome.mobilePane)
  const setSide = useAppStore((state) => state.setFilesystemSide)
  const setSelected = useAppStore((state) => state.setSelectedFile)
  const files = useMemo(() => side === 'reference' ? task.referenceFiles.map((file) => ({ ...file, badge: null })) : trial.files.filter((file) => !(file.change === 'Added' && file.step > activeIndex)).map((file) => ({ ...file, badge: file.step <= activeIndex ? file.change : null })), [activeIndex, side, task.referenceFiles, trial.files])
  const file = files.find((entry) => entry.path === selectedPath) || files[0]
  const badge = file?.badge
  return <section className={`desktop-pane ${pane === 'workspace' ? 'mobile-active' : ''} flex min-w-0 flex-1 flex-col bg-ink-950`} aria-label="File workspace"><div className="flex min-h-14 flex-wrap items-center gap-3 border-b border-ink-700 bg-ink-900 px-3 py-2"><div><h2 className="text-xs font-semibold text-white">File Workspace</h2><p className="font-mono text-[9px] text-mist-500">State after step {activeIndex}</p></div><ToggleGroup.Root type="single" value={side} onValueChange={(value) => value && setSide(value)} aria-label="Filesystem source" className="ml-auto flex rounded-md border border-ink-700 bg-ink-950 p-0.5"><ToggleGroup.Item value="reference" className="rounded px-2.5 py-1.5 text-[10px] text-mist-500 data-[state=on]:bg-ink-700 data-[state=on]:text-white">Reference</ToggleGroup.Item><ToggleGroup.Item value="trial" className="rounded px-2.5 py-1.5 text-[10px] text-mist-500 data-[state=on]:bg-violet-500 data-[state=on]:text-white">Trial</ToggleGroup.Item></ToggleGroup.Root></div><div key={`workspace-${activeIndex}-${side}`} className="pane-fade flex min-h-0 flex-1"><div className="scrollbar w-[34%] min-w-36 max-w-[200px] overflow-y-auto border-r border-ink-700 bg-ink-900/70 py-2">{files.map((entry) => { const Icon = fileIcon(entry.type); const active = entry.path === file?.path; return <button key={entry.path} onClick={() => setSelected(entry.path)} className={`group flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-ink-800 ${active ? 'bg-ink-800 text-white' : 'text-mist-300'}`} title={entry.path}><Icon size={14} className="shrink-0 text-mist-500" /><span className="min-w-0 flex-1 truncate font-mono text-[11px]">{entry.path}</span>{entry.badge && <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-semibold ${badgeStyle[entry.badge]}`}>{entry.badge}</span>}</button>})}</div><div className="scrollbar min-w-0 flex-1 overflow-y-auto p-4"><div className="mb-3 flex min-w-0 items-center gap-2"><span className="min-w-0 break-all font-mono text-xs text-mist-300">{file?.path || 'No file selected'}</span>{badge && <span className={`ml-auto shrink-0 rounded border px-2 py-1 text-[9px] font-semibold ${badgeStyle[badge]}`}>{badge}</span>}</div><FileRenderer file={file} badge={badge} /></div></div></section>
}

function TerminalPanel({ step, trialId }) {
  const key = `${trialId}:${step.index}`
  const stream = useAppStore((state) => state.terminalByStep[key])
  const setTerminalState = useAppStore((state) => state.setTerminalState)
  const boxRef = useRef(null)
  const output = step.terminal || ''
  useEffect(() => {
    if (!output || stream?.status === 'complete') return
    let position = stream?.text?.length || 0
    if (position === 0) setTerminalState(key, { text: '', status: 'streaming', follow: stream?.follow ?? true })
    const timer = window.setInterval(() => {
      position = Math.min(output.length, position + 1)
      setTerminalState(key, { text: output.slice(0, position), status: position >= output.length ? 'complete' : 'streaming' })
      if (position >= output.length) window.clearInterval(timer)
    }, 18)
    return () => window.clearInterval(timer)
    // The stream intentionally resumes from shared state when this step is reactivated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, output, setTerminalState])
  useEffect(() => {
    if (stream?.follow !== false && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [stream?.follow, stream?.text])
  if (!output) return <section className="rounded-lg border border-ink-700 bg-ink-950 p-4 text-center"><TerminalWindow size={24} className="mx-auto text-mist-500" /><h3 className="mt-2 text-xs font-semibold text-white">No terminal output</h3><p className="mt-1 text-[11px] leading-4 text-mist-500">Select a terminal step in the timeline to inspect its streamed command output.</p></section>
  const status = stream?.status || 'streaming'
  return <section className={`overflow-hidden rounded-lg border ${step.status === 'error' ? 'border-red-500/35' : 'border-ink-700'} bg-[#080b0f]`}><div className="flex items-center justify-between border-b border-ink-700 px-3 py-2"><span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-mist-500"><TerminalWindow size={13} /> Terminal</span><StatusPill status={status} /></div><div ref={boxRef} onScroll={(event) => { const element = event.currentTarget; const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 18; if (!nearBottom && stream?.follow !== false) setTerminalState(key, { follow: false }) }} className={`scrollbar max-h-44 min-h-28 overflow-auto whitespace-pre-wrap p-3 font-mono text-[11px] leading-5 ${step.status === 'error' ? 'text-red-500' : 'text-mist-300'} ${status === 'streaming' ? 'stream-cursor' : ''}`}>{stream?.text || ''}</div>{stream?.follow === false && <button onClick={() => setTerminalState(key, { follow: true })} className="w-full border-t border-amber-500/20 bg-amber-500/10 py-2 text-[10px] font-semibold text-amber-500 hover:bg-amber-500/15">Jump to latest</button>}</section>
}

function StepDetail() {
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const activeIndex = useAppStore((state) => state.activeStepIndex)
  const disclosure = useAppStore((state) => state.disclosureOpen[`${trial.id}:${activeIndex}`])
  const toolOpen = useAppStore((state) => state.toolOutputOpen[`${trial.id}:${activeIndex}`])
  const toggleDisclosure = useAppStore((state) => state.toggleDisclosure)
  const toggleToolOutput = useAppStore((state) => state.toggleToolOutput)
  const step = trial.steps.find((entry) => entry.index === activeIndex)
  const Icon = typeMeta[step.type].icon
  return <div key={activeIndex} className="pane-fade space-y-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-md border border-violet-500/25 bg-violet-500/10 font-mono text-[10px] text-violet-400">{String(step.index).padStart(2, '0')}</span><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-white">{step.summary}</h2><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-mist-500"><Icon size={12} /> {typeMeta[step.type].label} · {step.timestamp}</p></div><span className={`ml-auto h-2 w-2 rounded-full ${step.status === 'error' ? 'bg-red-500' : 'bg-mint-500'}`} title={step.status} /></div><section className="rounded-lg border border-ink-700 bg-ink-850 p-3"><SectionLabel>Step Message</SectionLabel><p className="mt-2 text-xs leading-5 text-mist-300">{step.message}</p></section><section className="overflow-hidden rounded-lg border border-ink-700 bg-ink-850"><button type="button" onClick={() => toggleDisclosure(activeIndex)} aria-expanded={!!disclosure} className="flex w-full items-center justify-between px-3 py-3 text-left hover:bg-ink-800"><span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.11em] text-mist-500"><Brain size={14} /> Reasoning</span><CaretDown size={14} className={`ease-rotate ${disclosure ? 'rotate-180' : ''}`} /></button><div className={`grid ease-height ${disclosure ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'}`}><div className="overflow-hidden"><p className="border-t border-ink-700 px-3 py-3 text-xs leading-5 text-mist-300">{step.reasoning}</p></div></div></section>{step.tool && <section className={`overflow-hidden rounded-lg border ${step.tool.status === 'error' ? 'border-red-500/35 bg-red-500/5' : 'border-ink-700 bg-ink-850'}`}><div className="flex items-center gap-2 border-b border-ink-700 px-3 py-2.5"><Wrench size={14} className={step.tool.status === 'error' ? 'text-red-500' : 'text-violet-400'} /><span className="font-mono text-xs font-semibold text-white">{step.tool.name}</span><span className="ml-auto"><StatusPill status={step.tool.status} /></span></div><div className="px-3 py-2.5"><div className="text-[10px] uppercase tracking-wider text-mist-500">Input summary</div><p className="mt-1 font-mono text-[11px] text-mist-300">{step.tool.input}</p></div><button onClick={() => toggleToolOutput(activeIndex)} aria-expanded={!!toolOpen} className="flex w-full items-center justify-between border-t border-ink-700 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-mist-500 hover:bg-ink-800">Tool output <CaretDown size={13} className={`transition-transform ${toolOpen ? 'rotate-180' : ''}`} /></button><div className={`grid ease-height ${toolOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className={`px-3 pb-3 font-mono text-[11px] leading-5 ${step.tool.status === 'error' ? 'text-red-500' : 'text-mist-300'}`}>{step.tool.output}</p></div></div></section>}{step.observation && <section className="rounded-lg border border-ink-700 bg-ink-850 p-3"><SectionLabel>Observation</SectionLabel><p className="mt-2 text-xs leading-5 text-mist-300">{step.observation}</p></section>}<TerminalPanel step={step} trialId={trial.id} /></div>
}

function EditAnnotation({ note, index, onDone }) {
  const update = useAppStore((state) => state.updateAnnotation)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(annotationSchema), defaultValues: note })
  return <form onSubmit={handleSubmit((body) => { update(index, body.note_text); onDone() })} className="mt-2 rounded-md border border-violet-500/25 bg-ink-950 p-2"><Label htmlFor={`edit-note-${index}`}>Note text</Label><Textarea id={`edit-note-${index}`} rows={3} maxLength={500} aria-describedby={errors.note_text ? `edit-note-error-${index}` : undefined} {...register('note_text')} /><input type="hidden" {...register('step_index')} /><FieldError id={`edit-note-error-${index}`}>{errors.note_text && `note_text: ${errors.note_text.message}`}</FieldError><div className="mt-2 flex gap-2"><Button type="submit" className="min-h-8">Save note</Button><Button type="button" variant="ghost" className="min-h-8" onClick={onDone}>Cancel</Button></div></form>
}

function Annotations() {
  const trialId = useAppStore((state) => state.activeTrialId)
  const annotationsByTrial = useAppStore((state) => state.annotationsByTrial)
  const annotations = annotationsByTrial[trialId] || []
  const setActiveStep = useAppStore((state) => state.setActiveStep)
  const setChrome = useAppStore((state) => state.setChrome)
  const remove = useAppStore((state) => state.deleteAnnotation)
  const [editing, setEditing] = useState(null)
  return <section className="border-t border-ink-700 px-3 py-4"><SectionLabel aside={<Button id="btn-annotate" variant="secondary" className="min-h-8 px-2" onClick={() => setChrome({ noteOpen: true })}><NotePencil size={13} /> Annotate</Button>}>Annotations · {annotations.length}</SectionLabel>{annotations.length ? <div className="mt-3 space-y-2">{annotations.map((note, index) => <div key={`${note.step_index}-${index}-${note.note_text}`} className="annotation-enter rounded-lg border border-ink-700 bg-ink-850 p-2.5"><button type="button" className="w-full text-left" onClick={() => { setActiveStep(Number(note.step_index)); setChrome({ mobilePane: 'detail' }); }}><span className="font-mono text-[9px] uppercase tracking-wider text-violet-400">Step {note.step_index}</span><p className="mt-1 break-words text-xs leading-5 text-mist-300">{note.note_text}</p></button><div className="mt-2 flex gap-1 border-t border-ink-700 pt-2"><Button variant="ghost" className="min-h-7 px-2 py-1" onClick={() => setEditing(editing === index ? null : index)}><PencilSimple size={12} /> Edit</Button><Button variant="ghost" className="min-h-7 px-2 py-1 text-red-500" onClick={() => remove(index)}><Trash size={12} /> Remove</Button></div>{editing === index && <EditAnnotation note={note} index={index} onDone={() => setEditing(null)} />}</div>)}</div> : <div className="mt-3 rounded-lg border border-dashed border-ink-600 bg-ink-850/55 px-4 py-5 text-center"><NotePencil size={22} className="mx-auto text-mist-500" /><p className="mt-2 text-xs font-semibold text-white">No annotations yet</p><p className="mt-1 text-[11px] leading-4 text-mist-500">Notes attach evidence to steps. Use Annotate on the active step.</p></div>}</section>
}

const options = (values) => values.map((value) => ({ value, label: titleCase(value) }))

function FailureReportCard({ report }) {
  const setActiveStep = useAppStore((state) => state.setActiveStep)
  const setChrome = useAppStore((state) => state.setChrome)
  if (!report) return null
  return <section className="report-enter mt-3 rounded-lg border border-red-500/25 bg-red-500/5 p-3"><div className="flex items-center gap-2"><WarningCircle size={16} className="text-red-500" /><h3 className="text-xs font-semibold text-white">Failure report</h3></div><dl className="mt-3 grid grid-cols-2 gap-2">{[['Stage', report.stage], ['Root cause', report.root_cause], ['Behavior', report.behavior], ['Impact', report.impact]].map(([label, value]) => <div key={label} className="rounded border border-ink-700 bg-ink-900 p-2"><dt className="text-[9px] uppercase tracking-wider text-mist-500">{label}</dt><dd className="mt-1 text-[11px] text-mist-100">{titleCase(value)}</dd></div>)}</dl><div className="mt-3"><div className="text-[9px] uppercase tracking-wider text-mist-500">Evidence</div><p className="mt-1 text-xs leading-5 text-mist-300">{report.evidence}</p></div><div className="mt-3 flex flex-wrap gap-1.5">{report.implicated_steps.map((step) => <a key={step} href="#" onClick={(e) => { e.preventDefault(); setActiveStep(Number(step)); setChrome({ mobilePane: 'timeline' }); }} className="rounded border border-violet-500/25 bg-violet-500/10 px-2 py-1 font-mono text-[10px] text-violet-400 hover:bg-violet-500/20">Step {step}</a>)}</div></section>
}

function Classification() {
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const report = useAppStore((state) => state.reportsByTrial[trial.id] || null)
  const submitReport = useAppStore((state) => state.submitReport)
  const { control, register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(failureReportSchema), defaultValues: report || { stage: '', root_cause: '', behavior: '', impact: '', evidence: '', implicated_steps: [] } })
  useEffect(() => { reset(report || { stage: '', root_cause: '', behavior: '', impact: '', evidence: '', implicated_steps: [] }) }, [report, reset])
  const onSubmit = (body) => {
    if (!validateStepIndices(body.implicated_steps, trial)) { setError('implicated_steps', { message: 'implicated_steps contains an index not present on this trial' }); return }
    submitReport(body)
  }
  const namedError = (field) => errors[field] ? `${field}: ${errors[field].message}` : null
  return <section className="border-t border-ink-700 px-3 py-4"><SectionLabel>Failure Classification</SectionLabel><FailureReportCard report={report} /><form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)}><div className="grid grid-cols-2 gap-2"><div><Label id="label-stage">Stage</Label><Controller name="stage" control={control} render={({ field }) => <RadixSelect value={field.value} onValueChange={field.onChange} aria-labelledby="label-stage" placeholder="Select stage" options={options(stageValues)} />} /><FieldError>{namedError('stage')}</FieldError></div><div><Label id="label-root-cause">Root cause</Label><Controller name="root_cause" control={control} render={({ field }) => <RadixSelect value={field.value} onValueChange={field.onChange} aria-labelledby="label-root-cause" placeholder="Select cause" options={options(causeValues)} />} /><FieldError>{namedError('root_cause')}</FieldError></div><div><Label id="label-behavior">Behavior</Label><Controller name="behavior" control={control} render={({ field }) => <RadixSelect value={field.value} onValueChange={field.onChange} aria-labelledby="label-behavior" placeholder="Select behavior" options={options(behaviorValues)} />} /><FieldError>{namedError('behavior')}</FieldError></div><div><Label id="label-impact">Impact</Label><Controller name="impact" control={control} render={({ field }) => <RadixSelect value={field.value} onValueChange={field.onChange} aria-labelledby="label-impact" placeholder="Select impact" options={options(impactValues)} />} /><FieldError>{namedError('impact')}</FieldError></div></div><div><Label htmlFor="failure-evidence">Evidence</Label><Textarea id="failure-evidence" rows={4} minLength={20} maxLength={2000} placeholder="Describe concrete trajectory evidence (20–2000 characters)." aria-describedby={errors.evidence ? 'evidence-error' : undefined} {...register('evidence')} /><FieldError id="evidence-error">{namedError('evidence')}</FieldError></div><div><Label id="label-implicated">Implicated steps</Label><Controller name="implicated_steps" control={control} render={({ field }) => <div className="grid grid-cols-7 gap-1" role="group" aria-labelledby="label-implicated">{trial.steps.map((step) => { const checked = field.value?.includes(step.index); return <label key={step.index} className={`relative cursor-pointer rounded border py-1.5 text-center font-mono text-[10px] transition ${checked ? 'border-violet-500/45 bg-violet-500/15 text-violet-400' : 'border-ink-700 bg-ink-900 text-mist-500 hover:bg-ink-800'}`}><input type="checkbox" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" checked={!!checked} onChange={() => field.onChange(checked ? field.value.filter((value) => value !== step.index) : [...(field.value || []), step.index])} />{step.index}</label>})}</div>} /><FieldError>{namedError('implicated_steps')}</FieldError></div><Button type="submit" disabled={isSubmitting} className="w-full"><WarningCircle size={14} /> {report ? 'Update classification' : 'Classify failure'}</Button></form></section>
}

function DetailPane() {
  const pane = useAppStore((state) => state.chrome.mobilePane)
  return <aside className={`desktop-pane ${pane === 'detail' ? 'mobile-active' : ''} scrollbar flex w-[27%] min-w-0 flex-col overflow-y-auto border-l border-ink-700 bg-ink-900`} aria-label="Step details"><div className="p-3"><StepDetail /></div><Annotations /><Classification /></aside>
}

function NoteDialog() {
  const open = useAppStore((state) => state.chrome.noteOpen)
  const activeIndex = useAppStore((state) => state.activeStepIndex)
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const setChrome = useAppStore((state) => state.setChrome)
  const addAnnotation = useAppStore((state) => state.addAnnotation)
  const wasOpen = useRef(false)
  const draft = useAppStore((state) => state.noteDrafts[trial.id] || ''); const setDraft = useAppStore((state) => state.setNoteDraft); const { register, handleSubmit, reset, setError, watch, formState: { errors } } = useForm({ resolver: zodResolver(annotationSchema), defaultValues: { note_text: draft, step_index: activeIndex } })
  useEffect(() => {
    if (open && !wasOpen.current) reset({ note_text: draft, step_index: activeIndex })
    wasOpen.current = open
  }, [activeIndex, open, reset, draft])
  const noteLength = watch('note_text')?.length || 0
  const submit = (body) => {
    if (!trial.steps.some((step) => step.index === body.step_index)) { setError('step_index', { message: 'step_index must exist on the active trial' }); return }
    addAnnotation(body); setDraft(trial.id, ''); setChrome({ noteOpen: false })
  }
  return <Dialog.Root open={open} onOpenChange={(value) => setChrome({ noteOpen: value })}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" /><Dialog.Content onCloseAutoFocus={(event) => restoreDialogOpener(event, 'note')} className="dialog-enter fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink-600 bg-ink-900 p-5 shadow-2xl"><div className="flex items-start justify-between"><div><Dialog.Title className="text-lg font-semibold text-white">Annotate active step</Dialog.Title><Dialog.Description className="mt-1 text-sm text-mist-500">Attach review evidence to a precise point in the trajectory.</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" className="px-2" aria-label="Close annotation form"><X size={15} /></Button></Dialog.Close></div><form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4"><div><div className="flex justify-between"><Label htmlFor="note-text">Note text</Label><span className={`font-mono text-[10px] ${noteLength > 500 ? 'text-red-500' : 'text-mist-500'}`}>{noteLength}/500</span></div><Textarea id="note-text" autoFocus rows={6} maxLength={500} placeholder="Record the evidence and why it matters." aria-describedby={errors.note_text ? 'note-text-error' : undefined} {...register('note_text')} onChange={(e) => { register('note_text').onChange(e); setDraft(trial.id, e.target.value); }} /><FieldError id="note-text-error">{errors.note_text && `note_text: ${errors.note_text.message}`}</FieldError></div><div><Label htmlFor="step-index">Step index</Label><TextInput id="step-index" type="number" min="1" max={trial.stepCount} aria-describedby={errors.step_index ? 'step-index-error' : undefined} {...register('step_index', { valueAsNumber: true })} /><FieldError id="step-index-error">{errors.step_index && `step_index: ${errors.step_index.message}`}</FieldError></div><div className="flex justify-end gap-2"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="submit"><NotePencil size={14} /> Add note</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function ExportDialog() {
  const open = useAppStore((state) => state.chrome.exportOpen)
  const preview = useAppStore((state) => state.exportPreview)
  const trialId = useAppStore((state) => state.activeTrialId)
  const setChrome = useAppStore((state) => state.setChrome)
  const setFormat = useAppStore((state) => state.setExportFormat)
  const [copied, setCopied] = useState(false)
  const text = preview.format === 'json' ? preview.json : preview.markdown
  const copy = async () => {
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      copied = document.execCommand('copy')
      area.remove()
    }
    if (!copied) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const download = () => {
    const blob = new Blob([text], { type: preview.format === 'json' ? 'application/json' : 'text/markdown' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a')
    link.href = url; link.download = `${trialId}-review.${preview.format === 'json' ? 'json' : 'md'}`; link.click(); URL.revokeObjectURL(url)
  }
  return <Dialog.Root open={open} onOpenChange={(value) => setChrome({ exportOpen: value })}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" /><Dialog.Content onCloseAutoFocus={(event) => restoreDialogOpener(event, 'export')} className="dialog-enter fixed left-1/2 top-1/2 z-[60] flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-900 shadow-2xl"><div className="flex items-start justify-between border-b border-ink-700 px-5 py-4"><div><Dialog.Title className="text-lg font-semibold text-white">Export review package</Dialog.Title><Dialog.Description className="mt-1 text-xs text-mist-500">Compiled live from the current annotations and failure classification.</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" className="px-2" aria-label="Close export panel"><X size={15} /></Button></Dialog.Close></div><Tabs.Root value={preview.format} onValueChange={setFormat} className="flex min-h-0 flex-1 flex-col"><div className="flex flex-wrap items-center gap-2 border-b border-ink-700 px-4 py-2"><Tabs.List className="flex rounded-md border border-ink-700 bg-ink-950 p-0.5"><Tabs.Trigger value="json" className="rounded px-3 py-2 text-xs text-mist-500 data-[state=active]:bg-violet-500 data-[state=active]:text-white">Review JSON</Tabs.Trigger><Tabs.Trigger value="markdown" className="rounded px-3 py-2 text-xs text-mist-500 data-[state=active]:bg-violet-500 data-[state=active]:text-white">Review markdown</Tabs.Trigger></Tabs.List><div className="ml-auto flex gap-2"><Button variant="secondary" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied export.' : 'Copy export'}</Button><Button onClick={download}><DownloadSimple size={14} /> Download export</Button></div></div><div role="status" aria-live="polite" aria-atomic="true" className={`border-b border-ink-700 px-4 py-2 text-xs text-mint-500 ${copied ? 'block' : 'sr-only'}`}>{copied ? 'Copied export to clipboard.' : ''}</div><Tabs.Content value="json" className="scrollbar min-h-0 flex-1 overflow-auto bg-[#080b0f] p-4"><pre className="whitespace-pre font-mono text-[11px] leading-5 text-mist-300">{preview.json}</pre></Tabs.Content><Tabs.Content value="markdown" className="scrollbar min-h-0 flex-1 overflow-auto bg-[#080b0f] p-4"><pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-mist-300">{preview.markdown}</pre></Tabs.Content></Tabs.Root></Dialog.Content></Dialog.Portal></Dialog.Root>
}

const importDraftSchema = z.object({ review_json: z.string().trim().min(1, 'review_json must contain Review JSON text') })

function ImportDialog() {
  const open = useAppStore((state) => state.chrome.importOpen)
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const draft = useAppStore((state) => state.importDraft)
  const setDraft = useAppStore((state) => state.setImportDraft)
  const setChrome = useAppStore((state) => state.setChrome)
  const importReview = useAppStore((state) => state.importReview)
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({ resolver: zodResolver(importDraftSchema), defaultValues: { review_json: draft } })
  useEffect(() => { if (open) reset({ review_json: useAppStore.getState().importDraft }) }, [open, reset])
  const submit = ({ review_json }) => {
    setDraft(review_json)
    let parsed
    try { parsed = JSON.parse(review_json) } catch { setError('review_json', { message: 'JSON is malformed and could not be parsed' }); return }
    const result = reviewPackageSchema.safeParse(parsed)
    if (!result.success) { const issue = result.error.issues[0]; const field = issue.path.join('.') || 'Review JSON'; setError('review_json', { message: `${field}: ${issue.message}` }); return }
    const pkg = result.data
    if (pkg.trial_id !== trial.id) { setError('review_json', { message: `trial_id must match the open trial (${trial.id})` }); return }
    const mismatches = [['task_id', trial.taskId], ['model', trial.model], ['reward', trial.reward], ['outcome', trial.outcome], ['duration', trial.duration], ['step_count', trial.stepCount]]
    const mismatch = mismatches.find(([field, value]) => pkg[field] !== value)
    if (mismatch) { setError('review_json', { message: `${mismatch[0]} must match the open trial` }); return }
    if (!validateStepIndices(pkg.annotations.map((note) => note.step_index), trial)) { setError('review_json', { message: 'annotations.step_index contains an index not present on the open trial' }); return }
    if (pkg.failure_report && !validateStepIndices(pkg.failure_report.implicated_steps, trial)) { setError('review_json', { message: 'failure_report.implicated_steps contains an index not present on the open trial' }); return }
    importReview(pkg); setChrome({ importOpen: false, notice: 'Review package imported.' })
  }
  return <Dialog.Root open={open} onOpenChange={(value) => setChrome({ importOpen: value })}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" /><Dialog.Content onCloseAutoFocus={(event) => restoreDialogOpener(event, 'import')} className="dialog-enter fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink-600 bg-ink-900 p-5 shadow-2xl"><div className="flex items-start justify-between"><div><Dialog.Title className="text-lg font-semibold text-white">Import review package</Dialog.Title><Dialog.Description className="mt-1 text-sm text-mist-500">Paste Review JSON for the currently open trial.</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" className="px-2" aria-label="Close import panel"><X size={15} /></Button></Dialog.Close></div><form className="mt-5" onSubmit={handleSubmit(submit)}><Label htmlFor="review-json">Review JSON</Label><Textarea id="review-json" autoFocus rows={14} className="scrollbar font-mono text-xs" placeholder={'{\n  "schemaVersion": "trajectory-viewer.review-package.v1"\n}'} aria-describedby={errors.review_json ? 'import-error' : undefined} {...register('review_json')} /><FieldError id="import-error">{errors.review_json && `review_json: ${errors.review_json.message}`}</FieldError><div className="mt-4 flex justify-end gap-2"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="submit"><UploadSimple size={14} /> Import review package</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function CommandPalette() {
  const open = useAppStore((state) => state.chrome.paletteOpen)
  const trial = trialById(useAppStore((state) => state.activeTrialId))
  const undoCount = useAppStore((state) => state.undoStack.length)
  const redoCount = useAppStore((state) => state.redoStack.length)
  const setChrome = useAppStore((state) => state.setChrome)
  const setActive = useAppStore((state) => state.setActiveStep)
  const openExport = useAppStore((state) => state.openExport)
  const openImport = useAppStore((state) => state.openImport)
  const undo = useAppStore((state) => state.undo)
  const redo = useAppStore((state) => state.redo)
  const [query, setQuery] = useState('')
  useEffect(() => { if (open) setQuery('') }, [open])
  const results = trial.steps.filter((step) => step.summary.toLowerCase().includes(query.toLowerCase()))
  const closeThen = (handler) => { setChrome({ paletteOpen: false }); handler() }
  return <Dialog.Root open={open} onOpenChange={(value) => setChrome({ paletteOpen: value })}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" /><Dialog.Content onCloseAutoFocus={(event) => restoreDialogOpener(event, 'palette')} className="dialog-enter fixed left-1/2 top-[12vh] z-[60] flex max-h-[76vh] w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-900 shadow-2xl"><Dialog.Title className="sr-only">Command palette</Dialog.Title><Dialog.Description className="sr-only">Search trial steps and reviewer actions.</Dialog.Description><div className="flex items-center gap-3 border-b border-ink-700 px-4"><MagnifyingGlass size={18} className="text-mist-500" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search steps or choose an action…" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-mist-500" /><span className="rounded border border-ink-600 px-1.5 py-1 font-mono text-[9px] text-mist-500">ESC</span></div><div className="scrollbar min-h-0 overflow-y-auto p-2"><div className="px-2 py-2 text-[9px] font-semibold uppercase tracking-[.14em] text-mist-500">Actions</div><div className="grid grid-cols-2 gap-1"><button onClick={() => closeThen(openExport)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs text-mist-300 hover:bg-ink-800"><ClipboardText size={14} /> Export panel</button><button onClick={() => closeThen(openImport)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs text-mist-300 hover:bg-ink-800"><UploadSimple size={14} /> Import review package</button><button disabled={!undoCount} onClick={() => closeThen(undo)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs text-mist-300 hover:bg-ink-800 disabled:opacity-35"><ArrowCounterClockwise size={14} /> Undo</button><button disabled={!redoCount} onClick={() => closeThen(redo)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-xs text-mist-300 hover:bg-ink-800 disabled:opacity-35"><ArrowClockwise size={14} /> Redo</button></div><div className="mt-2 border-t border-ink-700 px-2 py-3 text-[9px] font-semibold uppercase tracking-[.14em] text-mist-500">Steps · {results.length}</div>{results.map((step) => { const Icon = typeMeta[step.type].icon; return <button key={step.index} onClick={() => closeThen(() => setActive(step.index))} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-ink-800 focus:bg-ink-800"><span className="grid h-7 w-7 place-items-center rounded border border-ink-700 font-mono text-[9px] text-violet-400">{step.index}</span><span className="min-w-0 flex-1 truncate text-xs text-mist-100">{step.summary}</span><Icon size={14} className="text-mist-500" /></button>})}{!results.length && <div className="px-4 py-10 text-center text-xs text-mist-500">No step summary matches “{query}”.</div>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
}

export function TrialViewer() {
  const notice = useAppStore((state) => state.chrome.notice)
  const setChrome = useAppStore((state) => state.setChrome)
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setChrome({ notice: '' }), 3000)
    return () => window.clearTimeout(timer)
  }, [notice, setChrome])
  return <div className="flex h-screen min-h-[620px] flex-col overflow-hidden bg-ink-950"><h1 className="sr-only">Trial Viewer</h1><Header /><MobileTabs /><div className="flex min-h-0 flex-1"><TimelinePane /><WorkspacePane /><DetailPane /></div><NoteDialog /><ExportDialog /><ImportDialog /><CommandPalette /><div role="status" aria-live="polite" aria-atomic="true" className={`fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-lg border border-mint-500/30 bg-ink-900 px-4 py-2 text-sm text-mint-500 shadow-xl ${notice ? 'block' : 'sr-only'}`}>{notice}</div></div>
}
