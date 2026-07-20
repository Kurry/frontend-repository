import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Papa from 'papaparse'
import {
  Button,
  Checkbox,
  ComposedModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
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
import { CheckmarkFilled, DataTable, ErrorFilled, Upload } from '@carbon/icons-react'
import {
  DATASET_SLICES,
  MODELS,
  MODEL_IDS,
  PROMPT_IDS,
  PROMPT_TEMPLATES,
  createJobSchema,
  datasetRowSchema,
  type CreateJobPayload,
  type DatasetRow,
} from '../contracts'
import { useBatchStore } from '../store'

const composerSchema = z.object({
  name: z.string().trim().min(1, 'Job name is required').max(80, 'Job name must be 80 characters or fewer'),
  promptTemplate: z.enum(PROMPT_IDS, { message: 'Prompt template is required and must use a seeded template' }),
  model: z.enum(MODEL_IDS, { message: 'Model is required and must use a supported model' }),
  concurrency: z.number().int('Concurrency must be an integer').min(1, 'Concurrency must be at least 1').max(5, 'Concurrency must be at most 5'),
  dataset: z.array(datasetRowSchema).min(1, 'Dataset must contain at least one detected row'),
  datasetSlice: z.string(),
  datasetPaste: z.string(),
  scheduleEnabled: z.boolean(),
  windowStart: z.string(),
  windowEnd: z.string(),
}).superRefine((value, context) => {
  if (!value.scheduleEnabled) return
  if (!value.windowStart) context.addIssue({ code: 'custom', path: ['windowStart'], message: 'Schedule windowStart is required' })
  if (!value.windowEnd) context.addIssue({ code: 'custom', path: ['windowEnd'], message: 'Schedule windowEnd is required' })
  if (value.windowStart && value.windowEnd && Date.parse(value.windowEnd) <= Date.parse(value.windowStart)) {
    context.addIssue({ code: 'custom', path: ['windowEnd'], message: 'Schedule windowEnd must be after windowStart' })
  }
})

type ComposerValues = z.infer<typeof composerSchema>

const toLocalDateTime = (iso?: string) => iso ? new Date(iso).toISOString().slice(0, 16) : ''

function normalizeRows(value: unknown): { rows: DatasetRow[]; errors: string[] } {
  if (!Array.isArray(value)) return { rows: [], errors: ['Dataset must be a JSON array or CSV table'] }
  const errors: string[] = []
  const rows = value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`Dataset row ${index + 1}: input field is required`)
      return { input: '' }
    }
    const record = entry as Record<string, unknown>
    const input = record.input
    if (typeof input !== 'string' || !input.trim()) errors.push(`Dataset row ${index + 1}: input field is required`)
    const normalized: DatasetRow = { ...record, input: typeof input === 'string' ? input.trim() : '' }
    if (record.expected !== undefined && typeof record.expected !== 'string') normalized.expected = String(record.expected)
    return normalized
  })
  return { rows, errors }
}

function parseDatasetPaste(text: string): { rows: DatasetRow[]; errors: string[] } {
  if (!text.trim()) return { rows: [], errors: ['Dataset paste is empty; paste a JSON array or CSV table'] }
  const trimmed = text.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return normalizeRows(JSON.parse(trimmed))
    } catch (error) {
      return { rows: [], errors: [`Dataset JSON parse error: ${error instanceof Error ? error.message : 'Malformed JSON'}`] }
    }
  }
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim() })
  if (parsed.errors.length) return { rows: [], errors: parsed.errors.map((error) => `Dataset CSV parse error: ${error.message}`) }
  const fields = parsed.meta.fields ?? []
  if (!fields.includes('input')) return { rows: [], errors: ['Dataset CSV parse error: header must include an input field'] }
  return normalizeRows(parsed.data)
}

export function ComposerModal() {
  const open = useBatchStore((state) => state.ui.composerOpen)
  const editingJobId = useBatchStore((state) => state.ui.editingJobId)
  const job = useBatchStore((state) => state.jobs.find((entry) => entry.id === editingJobId))
  const createJob = useBatchStore((state) => state.createJob)
  const updateJob = useBatchStore((state) => state.updateJob)
  const setUi = useBatchStore((state) => state.setUi)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const submitting = useRef(false)

  const defaults = useMemo<ComposerValues>(() => ({
    name: job?.name ?? '',
    promptTemplate: job?.promptTemplate ?? ('' as ComposerValues['promptTemplate']),
    model: job?.model ?? ('' as ComposerValues['model']),
    concurrency: job?.concurrency ?? 3,
    dataset: job?.dataset ?? [],
    datasetSlice: '',
    datasetPaste: '',
    scheduleEnabled: Boolean(job?.schedule),
    windowStart: toLocalDateTime(job?.schedule?.windowStart),
    windowEnd: toLocalDateTime(job?.schedule?.windowEnd),
  }), [job])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isValid, isSubmitting } } = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema),
    mode: 'all',
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset(defaults)
      setParseErrors([])
      submitting.current = false
    }
  }, [open, defaults, reset])

  const dataset = watch('dataset') ?? []
  const paste = watch('datasetPaste') ?? ''
  const scheduleEnabled = watch('scheduleEnabled')
  const fields = useMemo(() => {
    const keys = new Set<string>(['input'])
    dataset.slice(0, 20).forEach((row) => Object.keys(row).forEach((key) => keys.add(key)))
    return [...keys].filter((key) => key !== 'input' || keys.has('input')).slice(0, 5)
  }, [dataset])
  const expectedDetected = dataset.some((row) => typeof row.expected === 'string')

  const close = () => setUi({ composerOpen: false, editingJobId: null })

  const chooseSlice = (id: string) => {
    setValue('datasetSlice', id, { shouldValidate: true, shouldDirty: true })
    if (!id) return
    const slice = DATASET_SLICES.find((entry) => entry.id === id)
    if (slice) {
      setValue('dataset', structuredClone(slice.rows), { shouldValidate: true, shouldDirty: true })
      setParseErrors([])
    }
  }

  const applyPaste = () => {
    const result = parseDatasetPaste(paste)
    setParseErrors(result.errors)
    if (result.errors.length) return
    setValue('dataset', result.rows, { shouldValidate: true, shouldDirty: true })
    setValue('datasetSlice', '', { shouldValidate: false })
  }

  const submit = handleSubmit((values) => {
    if (submitting.current) return
    submitting.current = true
    try {
      const payload: CreateJobPayload = createJobSchema.parse({
        name: values.name,
        promptTemplate: values.promptTemplate,
        model: values.model,
        concurrency: values.concurrency,
        dataset: values.dataset,
        schedule: values.scheduleEnabled ? {
          windowStart: new Date(values.windowStart).toISOString(),
          windowEnd: new Date(values.windowEnd).toISOString(),
        } : null,
      })
      if (job) updateJob(job.id, payload)
      else createJob(payload)
    } finally {
      window.setTimeout(() => { submitting.current = false }, 250)
    }
  })

  return (
    <ComposedModal open={open} onClose={close} size="lg" preventCloseOnClickOutside aria-label={job ? 'Edit job' : 'New job'}>
      <ModalHeader title={job ? 'Edit job' : 'Compose a new job'} label="API-shaped create payload" closeModal={close} />
      <ModalBody hasScrollingContent>
        <form id="job-composer" onSubmit={submit} noValidate>
          <div className="modal-grid">
            <TextInput
              id="job-name"
              labelText="Job name"
              placeholder="Example: Overnight claim classifier"
              maxLength={120}
              invalid={Boolean(errors.name)}
              invalidText={errors.name?.message}
              helperText={`${watch('name')?.length ?? 0} of 80 characters`}
              {...register('name')}
            />
            <NumberInput
              id="concurrency"
              label="Concurrency"
              min={1}
              max={5}
              value={watch('concurrency')}
              invalid={Boolean(errors.concurrency)}
              invalidText={errors.concurrency?.message}
              helperText="Integer from 1 through 5"
              onChange={(_event, state) => setValue('concurrency', Number(state.value), { shouldValidate: true, shouldDirty: true })}
            />
            <Select id="prompt-template" labelText="Prompt template" invalid={Boolean(errors.promptTemplate)} invalidText={errors.promptTemplate?.message} {...register('promptTemplate')}>
              <SelectItem value="" text="Choose a prompt template" />
              {PROMPT_TEMPLATES.map((template) => <SelectItem key={template.id} value={template.id} text={template.name} />)}
            </Select>
            <Select id="model" labelText="Model and rate" invalid={Boolean(errors.model)} invalidText={errors.model?.message} {...register('model')}>
              <SelectItem value="" text="Choose a model" />
              {MODELS.map((model) => <SelectItem key={model.id} value={model.id} text={`${model.label} · $${model.rate.toFixed(3)} / 1K tokens`} />)}
            </Select>

            <div className="section-box modal-span">
              <div className="section-title">
                <span>Dataset</span>
                <Tag type={dataset.length ? 'blue' : 'gray'} size="sm">{dataset.length} {dataset.length === 1 ? 'row' : 'rows'}</Tag>
              </div>
              <div className="modal-grid">
                <Select
                  id="dataset-slice"
                  labelText="Seeded dataset slice"
                  value={watch('datasetSlice')}
                  onChange={(event) => chooseSlice(event.target.value)}
                >
                  <SelectItem value="" text="Choose a seeded slice" />
                  {DATASET_SLICES.map((slice) => <SelectItem key={slice.id} value={slice.id} text={slice.name} />)}
                </Select>
                <div className="field-note self-end">Choose a curated slice, or paste JSON/CSV below. Paste commits only after it parses and every row has an input field.</div>
                <div className="modal-span">
                  <TextArea
                    id="dataset-paste"
                    labelText="Paste JSON array or CSV"
                    placeholder={'input,expected\n"Classify this request","billing"'}
                    rows={4}
                    {...register('datasetPaste')}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button kind="tertiary" size="sm" renderIcon={Upload} type="button" onClick={applyPaste}>Detect pasted rows</Button>
                  </div>
                </div>
              </div>
              {parseErrors.map((error) => <div className="form-error" role="alert" key={error}><ErrorFilled size={14} />{error}</div>)}
              {errors.dataset?.message && <div className="form-error" role="alert"><ErrorFilled size={14} />{errors.dataset.message}</div>}
              {dataset.length > 0 && (
                <>
                  <div className="preview-note">
                    {expectedDetected ? <CheckmarkFilled size={14} /> : <DataTable size={14} />}
                    {expectedDetected ? 'Expected outputs detected — comparison will be available in the inspector.' : 'No expected output field detected; the run will proceed without comparison.'}
                  </div>
                  <div className="dataset-preview" aria-label="Dataset preview">
                    <Table size="sm" useZebraStyles>
                      <TableHead><TableRow>{fields.map((field) => <TableHeader key={field}>{field}</TableHeader>)}</TableRow></TableHead>
                      <TableBody>
                        {dataset.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>{fields.map((field) => <TableCell key={field}>{String(row[field] ?? '—')}</TableCell>)}</TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {dataset.length > 5 && <div className="panel-empty">Previewing 5 of {dataset.length} detected input rows</div>}
                  </div>
                </>
              )}
            </div>

            <div className="section-box modal-span">
              <div className="schedule-toggle">
                <div><div className="section-title mb-0">Off-hours schedule <Tag type="gray" size="sm">Optional</Tag></div><p className="field-note">Store a launch window on this job payload.</p></div>
                <Checkbox id="schedule-enabled" labelText="Enable schedule" checked={scheduleEnabled} onChange={(_event, detail) => setValue('scheduleEnabled', detail.checked, { shouldValidate: true, shouldDirty: true })} />
              </div>
              {scheduleEnabled && (
                <div className="modal-grid">
                  <TextInput id="schedule-window-start" type="datetime-local" labelText="Schedule windowStart" invalid={Boolean(errors.windowStart)} invalidText={errors.windowStart?.message} {...register('windowStart')} />
                  <TextInput id="schedule-window-end" type="datetime-local" labelText="Schedule windowEnd" invalid={Boolean(errors.windowEnd)} invalidText={errors.windowEnd?.message} {...register('windowEnd')} />
                </div>
              )}
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" type="button" onClick={close}>Cancel</Button>
        <Button type="submit" form="job-composer" disabled={!isValid || isSubmitting || parseErrors.length > 0} onClick={submit}>{job ? 'Save job' : 'Create ready job'}</Button>
      </ModalFooter>
    </ComposedModal>
  )
}

export { parseDatasetPaste }
