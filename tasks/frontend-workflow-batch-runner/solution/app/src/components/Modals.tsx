import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  ComposedModal,
  InlineNotification,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  TextArea,
  TextInput,
} from '@carbon/react'
import { Calendar, Checkmark, Copy, DocumentDownload, Renew, TrashCan } from '@carbon/icons-react'
import { scheduleSchema } from '../contracts'
import {
  compileCalendar,
  compileRunCsv,
  compileRunReport,
  deriveRollups,
  selectedEntities,
  useBatchStore,
} from '../store'
import { returnFocusToOpener } from '../modalFocus'
import { StatusBadge } from './StatusBadge'

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value)
}

const localValue = (iso?: string) => iso ? new Date(iso).toISOString().slice(0, 16) : ''

const scheduleFormSchema = z.object({
  windowStart: z.string().min(1, 'Schedule windowStart is required'),
  windowEnd: z.string().min(1, 'Schedule windowEnd is required'),
}).superRefine((value, context) => {
  if (value.windowStart && value.windowEnd && Date.parse(value.windowEnd) <= Date.parse(value.windowStart)) {
    context.addIssue({ code: 'custom', path: ['windowEnd'], message: 'Schedule windowEnd must be after windowStart' })
  }
})

export function ScheduleModal() {
  const open = useBatchStore((state) => state.ui.scheduleOpen)
  const job = useBatchStore((state) => state.jobs.find((entry) => entry.id === state.selectedJobId))
  const setUi = useBatchStore((state) => state.setUi)
  const setSchedule = useBatchStore((state) => state.setSchedule)
  const { register, reset, handleSubmit, formState: { errors } } = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema), mode: 'onChange', defaultValues: { windowStart: '', windowEnd: '' },
  })

  useEffect(() => {
    if (open) reset({ windowStart: localValue(job?.schedule?.windowStart), windowEnd: localValue(job?.schedule?.windowEnd) })
  }, [open, job?.schedule?.windowStart, job?.schedule?.windowEnd, reset])

  const close = () => {
    setUi({ scheduleOpen: false })
    returnFocusToOpener('schedule')
  }
  const submit = handleSubmit((values) => {
    if (!job) return
    const parsed = scheduleSchema.parse({ windowStart: new Date(values.windowStart).toISOString(), windowEnd: new Date(values.windowEnd).toISOString() })
    setSchedule(job.id, parsed)
  })

  return (
    <ComposedModal open={open} onClose={close} size="sm" preventCloseOnClickOutside aria-label="Schedule launch window">
      <ModalHeader label="Off-hours scheduling" title={`Schedule ${job?.name ?? 'job'}`} closeModal={close} />
      <ModalBody>
        <form id="schedule-form" onSubmit={submit} className="grid gap-4" noValidate>
          <p className="text-sm text-subtle">Both times are required. The job launches when you simulate the window start.</p>
          <TextInput id="standalone-window-start" type="datetime-local" labelText="Schedule windowStart" invalid={Boolean(errors.windowStart)} invalidText={errors.windowStart?.message} {...register('windowStart')} />
          <TextInput id="standalone-window-end" type="datetime-local" labelText="Schedule windowEnd" invalid={Boolean(errors.windowEnd)} invalidText={errors.windowEnd?.message} {...register('windowEnd')} />
          {job?.schedule && <Button type="button" kind="danger--tertiary" size="sm" renderIcon={TrashCan} onClick={() => setSchedule(job.id, null)}>Remove schedule</Button>}
        </form>
      </ModalBody>
      <ModalFooter><Button kind="secondary" onClick={close}>Cancel</Button><Button type="submit" form="schedule-form">Save schedule</Button></ModalFooter>
    </ComposedModal>
  )
}

export function ExportModal() {
  const open = useBatchStore((state) => state.ui.exportOpen)
  const selectedJobId = useBatchStore((state) => state.selectedJobId)
  const selectedRunId = useBatchStore((state) => state.selectedRunId)
  const jobs = useBatchStore((state) => state.jobs)
  const setUi = useBatchStore((state) => state.setUi)
  const showToast = useBatchStore((state) => state.showToast)
  const sharedPreview = useBatchStore((state) => state.ui.exportPreviewText)
  const [copied, setCopied] = useState(false)
  const job = jobs.find((entry) => entry.id === selectedJobId)
  const run = job?.runs.find((entry) => entry.id === selectedRunId) ?? job?.runs.at(-1)
  const compiledText = useMemo(() => job && run ? JSON.stringify(compileRunReport(job, run), null, 2) : '', [job, run])
  const text = compiledText
  const csv = useMemo(() => run ? compileRunCsv(run) : '', [run])

  useEffect(() => { if (open) setCopied(false) }, [open])
  useEffect(() => {
    if (open && sharedPreview !== compiledText) setUi({ exportPreviewText: compiledText })
  }, [open, sharedPreview, compiledText, setUi])
  const close = () => {
    setUi({ exportOpen: false })
    returnFocusToOpener('export')
  }
  const safeName = (job?.name ?? 'run-report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const copy = async () => {
    await copyText(text)
    setCopied(true)
    showToast('success', 'Run report copied', 'The exact visible JSON preview is on the clipboard.')
  }

  return (
    <ComposedModal open={open} onClose={close} size="lg" preventCloseOnClickOutside aria-label="Export run report">
      <ModalHeader label="Live session artifact" title="Export run" closeModal={close} />
      <ModalBody hasScrollingContent>
        {!run ? <InlineNotification kind="warning" lowContrast title="No run selected" subtitle="Launch a job or select a run history entry before exporting." hideCloseButton /> : (
          <div>
            <div className="code-toolbar"><span>Run Report JSON · batch-run-v1 · {run.items.length} items</span>{copied && <span className="code-copy-confirm"><Checkmark size={14} />Copied exactly</span>}</div>
            <pre className="code-preview" aria-label="Run Report JSON preview" tabIndex={0}>{text}</pre>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={close}>Close</Button>
        <Button kind="tertiary" renderIcon={Copy} disabled={!run} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
        <Button kind="tertiary" renderIcon={DocumentDownload} disabled={!run} onClick={() => { downloadText(`${safeName}.csv`, csv, 'text/csv;charset=utf-8'); showToast('success', 'CSV downloaded', 'The selected run was exported as tabular text.') }}>Download CSV</Button>
        <Button renderIcon={DocumentDownload} disabled={!run} onClick={() => { downloadText(`${safeName}.json`, text, 'application/json;charset=utf-8'); showToast('success', 'JSON downloaded', 'The downloaded file matches the visible preview.') }}>Download JSON</Button>
      </ModalFooter>
    </ComposedModal>
  )
}

const importFormSchema = z.object({ reportText: z.string().min(1, 'Run Report JSON text is required') })

export function ImportModal() {
  const open = useBatchStore((state) => state.ui.importOpen)
  const setUi = useBatchStore((state) => state.setUi)
  const importReport = useBatchStore((state) => state.importReport)
  const importDraft = useBatchStore((state) => state.ui.importDraft)
  const { register, handleSubmit, reset, setError, formState: { errors, isValid } } = useForm<z.infer<typeof importFormSchema>>({
    resolver: zodResolver(importFormSchema), mode: 'onChange', defaultValues: { reportText: importDraft },
  })
  useEffect(() => { if (open) reset({ reportText: useBatchStore.getState().ui.importDraft }) }, [open, reset])
  const close = () => {
    setUi({ importOpen: false })
    returnFocusToOpener('import')
  }
  const submit = handleSubmit((values) => {
    let value: unknown
    try { value = JSON.parse(values.reportText) }
    catch (error) {
      setError('reportText', { type: 'validate', message: `Run Report JSON parse error: ${error instanceof Error ? error.message : 'Malformed JSON'}` })
      return
    }
    const result = importReport(value)
    if (!result.ok) setError('reportText', { type: 'validate', message: `Import contract error — ${result.error}` })
  })
  return (
    <ComposedModal open={open} onClose={close} size="lg" preventCloseOnClickOutside aria-label="Import run report">
      <ModalHeader label="Restore from portable state" title="Import run" closeModal={close} />
      <ModalBody>
        <form id="import-form" onSubmit={submit} noValidate>
          <TextArea id="run-report-text" labelText="Run Report JSON text" rows={16} placeholder='{"schemaVersion":"batch-run-v1", ...}' invalid={Boolean(errors.reportText)} invalidText={errors.reportText?.message} {...register('reportText', { onChange: (event) => setUi({ importDraft: event.target.value }) })} />
          <p className="field-note">Validation checks the schema version, model and status enums, bounds, costs, attempts, rollups, timeline, and job payload before any state changes.</p>
        </form>
      </ModalBody>
      <ModalFooter><Button kind="secondary" onClick={close}>Cancel</Button><Button form="import-form" type="submit" disabled={!isValid}>Import run report</Button></ModalFooter>
    </ComposedModal>
  )
}

export function CalendarModal() {
  const open = useBatchStore((state) => state.ui.calendarOpen)
  const jobs = useBatchStore((state) => state.jobs)
  const setUi = useBatchStore((state) => state.setUi)
  const showToast = useBatchStore((state) => state.showToast)
  const simulateWindowStart = useBatchStore((state) => state.simulateWindowStart)
  const [copied, setCopied] = useState(false)
  const text = useMemo(() => compileCalendar(jobs), [jobs])
  const count = jobs.filter((job) => job.schedule).length
  useEffect(() => { if (open) setCopied(false) }, [open])
  const close = () => {
    setUi({ calendarOpen: false })
    returnFocusToOpener('calendar')
  }
  const copy = async () => {
    await copyText(text)
    setCopied(true)
    showToast('success', 'Calendar text copied', 'The exact ICS block is on the clipboard.')
  }
  return (
    <ComposedModal open={open} onClose={close} size="lg" preventCloseOnClickOutside aria-label="Schedule calendar text">
      <ModalHeader label="ICS calendar artifact" title="Copy schedule as calendar text" closeModal={close} />
      <ModalBody>
        <div className="code-toolbar"><span>{count} scheduled {count === 1 ? 'job' : 'jobs'} · one VEVENT each</span>{copied && <span className="code-copy-confirm"><Checkmark size={14} />Copied exactly</span>}</div>
        <pre className="code-preview" aria-label="ICS calendar text" tabIndex={0}>{text}</pre>
      </ModalBody>
      <ModalFooter><Button kind="secondary" onClick={close}>Close</Button><Button kind="tertiary" renderIcon={Calendar} disabled={!count} onClick={() => simulateWindowStart()}>Simulate window start</Button><Button renderIcon={Copy} onClick={copy}>{copied ? 'Copied' : 'Copy calendar text'}</Button></ModalFooter>
    </ComposedModal>
  )
}

export function CompareModal() {
  const open = useBatchStore((state) => state.ui.compareOpen)
  const selectedJobId = useBatchStore((state) => state.selectedJobId)
  const jobs = useBatchStore((state) => state.jobs)
  const compareA = useBatchStore((state) => state.ui.compareA)
  const compareB = useBatchStore((state) => state.ui.compareB)
  const setUi = useBatchStore((state) => state.setUi)
  const job = jobs.find((entry) => entry.id === selectedJobId)
  const runA = job?.runs.find((run) => run.id === compareA)
  const runB = job?.runs.find((run) => run.id === compareB)
  const rows = useMemo(() => {
    if (!runA || !runB) return []
    const total = Math.max(runA.items.length, runB.items.length)
    return Array.from({ length: total }, (_, index) => ({ index, a: runA.items[index], b: runB.items[index], flip: runA.items[index]?.status !== runB.items[index]?.status }))
  }, [runA, runB])
  const flips = rows.filter((row) => row.flip).length
  const close = () => setUi({ compareOpen: false })
  return (
    <ComposedModal open={open} onClose={close} size="lg" preventCloseOnClickOutside aria-label="Compare runs">
      <ModalHeader label={job?.name ?? 'Selected job'} title="Compare runs" closeModal={close} />
      <ModalBody hasScrollingContent>
        <div className="compare-controls">
          <Select id="compare-run-a" labelText="Run A" value={compareA ?? ''} onChange={(event) => setUi({ compareA: event.target.value })}>
            <SelectItem value="" text="Choose run A" />
            {job?.runs.map((run, index) => <SelectItem key={run.id} value={run.id} text={`Run ${index + 1} · ${new Date(run.startedAt).toLocaleString()}`} />)}
          </Select>
          <Select id="compare-run-b" labelText="Run B" value={compareB ?? ''} onChange={(event) => setUi({ compareB: event.target.value })}>
            <SelectItem value="" text="Choose run B" />
            {job?.runs.map((run, index) => <SelectItem key={run.id} value={run.id} text={`Run ${index + 1} · ${new Date(run.startedAt).toLocaleString()}`} />)}
          </Select>
        </div>
        {runA && runB ? (
          <>
            <div className="compare-summary"><strong>{flips} outcome {flips === 1 ? 'flip' : 'flips'}</strong> across {rows.length} aligned items. A flip means the underlying status differs.</div>
            <div className="comparison-scroll">
              <Table size="sm" useZebraStyles>
                <TableHead><TableRow><TableHeader>Item</TableHeader><TableHeader>Input</TableHeader><TableHeader>Run A</TableHeader><TableHeader>Run B</TableHeader><TableHeader>Difference</TableHeader></TableRow></TableHead>
                <TableBody>{rows.map((row) => <TableRow key={row.index}><TableCell>{row.index + 1}</TableCell><TableCell title={row.a?.input ?? row.b?.input}>{(row.a?.input ?? row.b?.input ?? '').slice(0, 44)}</TableCell><TableCell>{row.a ? <StatusBadge status={row.a.status} /> : '—'}</TableCell><TableCell>{row.b ? <StatusBadge status={row.b.status} /> : '—'}</TableCell><TableCell>{row.flip ? <span className="flip-marker"><Renew size={14} />Flip</span> : <span className="text-subtle">Same</span>}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          </>
        ) : <div className="panel-empty">Choose two runs from this job to compare per-item outcomes.</div>}
      </ModalBody>
      <ModalFooter><Button onClick={close}>Done</Button></ModalFooter>
    </ComposedModal>
  )
}

export function DeleteModal() {
  const deleteJobId = useBatchStore((state) => state.ui.deleteJobId)
  const job = useBatchStore((state) => state.jobs.find((entry) => entry.id === deleteJobId))
  const requestDelete = useBatchStore((state) => state.requestDelete)
  const deleteJob = useBatchStore((state) => state.deleteJob)
  return (
    <Modal
      open={Boolean(deleteJobId)}
      danger
      preventCloseOnClickOutside
      modalHeading="Delete job and run history?"
      modalLabel="Destructive action"
      primaryButtonText="Delete job"
      secondaryButtonText="Cancel"
      onRequestClose={() => { requestDelete(null); returnFocusToOpener('delete') }}
      onSecondarySubmit={() => { requestDelete(null); returnFocusToOpener('delete') }}
      onRequestSubmit={() => { if (job) deleteJob(job.id) }}
    >
      <p><strong>{job?.name}</strong> and {job?.runs.length ?? 0} run history {(job?.runs.length ?? 0) === 1 ? 'entry' : 'entries'} will be removed. Undo can restore them during this session.</p>
    </Modal>
  )
}

export function OpenExportButton({ kind = 'tertiary', size = 'md' }: { kind?: 'tertiary' | 'ghost'; size?: 'sm' | 'md' }) {
  const hasRun = useBatchStore((state) => Boolean(selectedEntities(state).run))
  const setUi = useBatchStore((state) => state.setUi)
  return <Button kind={kind} size={size} renderIcon={DocumentDownload} data-modal-opener="export" disabled={!hasRun} onClick={() => setUi({ exportOpen: true })}>Export run</Button>
}

export { copyText, downloadText }
