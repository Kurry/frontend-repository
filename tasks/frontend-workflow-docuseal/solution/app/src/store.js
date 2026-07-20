import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { FIELD_TYPES, fieldSchema, firstZodError, submitterSchema, templateNameSchema, templateSchema } from './schemas'

const STORAGE_KEY = 'docuseal-workspace-v1'

const TYPE_LABELS = {
  text: 'Text', signature: 'Signature', initials: 'Initials', date: 'Date',
  number: 'Number', checkbox: 'Checkbox', radio: 'Radio', select: 'Select',
  image: 'Image', file: 'File', phone: 'Phone', cells: 'Cells', stamp: 'Stamp',
}

const TYPE_SIZES = {
  signature: [200, 46], image: [180, 76], file: [180, 44], cells: [210, 42],
  checkbox: [126, 38], radio: [126, 38], stamp: [142, 54], initials: [140, 42],
}

const COLORS = ['#4f46e5', '#e11d48', '#0891b2', '#d97706', '#7c3aed', '#059669', '#db2777', '#2563eb']

function uid(prefix) {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function seedState() {
  return {
    activeTemplateId: 'sales',
    activeSubmitterId: 'first',
    submitters: [
      { id: 'first', name: 'First Party', color: '#4f46e5' },
      { id: 'second', name: 'Second Party', color: '#e11d48' },
    ],
    templates: [
      {
        id: 'sales', name: 'Sales Agreement', subtitle: 'Master services contract', pages: 2,
        status: 'draft', signingIndex: null,
        fields: [
          { id: 'full_name', name: 'Full name', type: 'text', required: true, submitter: 'First Party', page: 0, x: 20, y: 150, w: 200, h: 42 },
          { id: 'signature', name: 'Signature', type: 'signature', required: true, submitter: 'First Party', page: 0, x: 34, y: 300, w: 200, h: 46 },
          { id: 'date_signed', name: 'Date signed', type: 'date', required: false, submitter: 'Second Party', page: 0, x: 295, y: 300, w: 150, h: 40 },
        ],
      },
      {
        id: 'nda', name: 'NDA — Mutual', subtitle: 'Mutual confidentiality agreement', pages: 1,
        status: 'draft', signingIndex: null,
        fields: [
          { id: 'nda_signature', name: 'Recipient signature', type: 'signature', required: true, submitter: 'Second Party', page: 0, x: 265, y: 314, w: 210, h: 46 },
        ],
      },
      {
        id: 'onboarding', name: 'Onboarding Packet', subtitle: 'New partner information', pages: 2,
        status: 'draft', signingIndex: null, fields: [],
      },
    ],
  }
}

function loadState() {
  const fallback = seedState()
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed || !Array.isArray(parsed.templates) || !Array.isArray(parsed.submitters)) return fallback
    if (!parsed.templates.some((template) => template.id === parsed.activeTemplateId)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const initial = loadState()
  const templates = ref(initial.templates)
  const submitters = ref(initial.submitters)
  const activeTemplateId = ref(initial.activeTemplateId)
  const activeSubmitterId = ref(initial.activeSubmitterId || initial.submitters[0]?.id)
  const selectedFieldIds = ref([])
  const mode = ref('build')
  const undoStack = ref([])
  const redoStack = ref([])
  const notice = ref({ id: 0, message: '' })
  const gestureSnapshot = ref(null)
  const editorEpoch = ref(0)

  const activeTemplate = computed(() => templates.value.find((item) => item.id === activeTemplateId.value) || templates.value[0])
  const activeSubmitter = computed(() => submitters.value.find((item) => item.id === activeSubmitterId.value) || submitters.value[0])
  const selectedFields = computed(() => activeTemplate.value?.fields.filter((field) => selectedFieldIds.value.includes(field.id)) || [])
  const selectedField = computed(() => selectedFields.value.length === 1 ? selectedFields.value[0] : null)
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const statusLabel = computed(() => {
    const template = activeTemplate.value
    if (!template || template.status === 'draft') return 'Draft'
    if (template.status === 'completed') return 'Completed'
    const current = submitters.value[template.signingIndex ?? 0]
    return current ? `Awaiting ${current.name}` : 'Pending'
  })

  const fieldCounts = computed(() => Object.fromEntries(
    submitters.value.map((submitter) => [submitter.name, activeTemplate.value?.fields.filter((field) => field.submitter === submitter.name).length || 0]),
  ))

  const templatePayload = computed(() => ({
    name: activeTemplate.value?.name || '',
    status: activeTemplate.value?.status || 'draft',
    submitters: submitters.value.map(({ name, color }) => ({ name, color })),
    fields: (activeTemplate.value?.fields || []).map(({ id, ...field }) => field),
  }))

  const templateJson = computed(() => JSON.stringify(templatePayload.value, null, 2))
  const signingSummary = computed(() => {
    const template = activeTemplate.value
    const lines = [
      `# ${template?.name || 'Untitled template'}`,
      '',
      `Status: ${templatePayload.value.status}`,
      `Pages: ${template?.pages || 0}`,
      '',
      '## Submitters',
      ...submitters.value.map((submitter) => `- ${submitter.name}: ${fieldCounts.value[submitter.name] || 0} field(s)`),
      '',
      '## Fields',
      ...(template?.fields.length
        ? template.fields.map((field) => `- ${TYPE_LABELS[field.type]} — ${field.name}; required: ${field.required ? 'yes' : 'no'}; submitter: ${field.submitter}`)
        : ['- No fields placed']),
    ]
    return lines.join('\n')
  })

  const syncChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('docuseal-workspace-sync')
    : null
  let syncingRemote = false

  function serializePersisted() {
    return {
      templates: templates.value,
      submitters: submitters.value,
      activeTemplateId: activeTemplateId.value,
      activeSubmitterId: activeSubmitterId.value,
    }
  }

  function applyPersisted(payload) {
    if (!payload || !Array.isArray(payload.templates) || !Array.isArray(payload.submitters)) return
    syncingRemote = true
    templates.value = payload.templates
    submitters.value = payload.submitters
    activeTemplateId.value = payload.activeTemplateId
    activeSubmitterId.value = payload.activeSubmitterId
    selectedFieldIds.value = selectedFieldIds.value.filter((id) =>
      (templates.value.find((template) => template.id === activeTemplateId.value)?.fields || [])
        .some((field) => field.id === id),
    )
    editorEpoch.value += 1
    syncingRemote = false
  }

  function persistWorkspace() {
    if (syncingRemote) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializePersisted()))
    syncChannel?.postMessage('sync')
  }

  watch([templates, submitters, activeTemplateId, activeSubmitterId], persistWorkspace, { deep: true })

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try { applyPersisted(JSON.parse(event.newValue)) } catch { /* ignore malformed writes */ }
  })
  syncChannel?.addEventListener('message', () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) applyPersisted(JSON.parse(raw))
    } catch { /* ignore malformed writes */ }
  })

  function notify(message) {
    notice.value = { id: notice.value.id + 1, message }
  }

  function makeSnapshot() {
    return clone({
      templates: templates.value,
      submitters: submitters.value,
      activeTemplateId: activeTemplateId.value,
      activeSubmitterId: activeSubmitterId.value,
      selectedFieldIds: selectedFieldIds.value,
    })
  }

  function applySnapshot(snapshot) {
    templates.value = snapshot.templates
    submitters.value = snapshot.submitters
    activeTemplateId.value = snapshot.activeTemplateId
    activeSubmitterId.value = snapshot.activeSubmitterId
    selectedFieldIds.value = snapshot.selectedFieldIds
  }

  function record(snapshot = makeSnapshot()) {
    undoStack.value.push(snapshot)
    if (undoStack.value.length > 100) undoStack.value.shift()
    redoStack.value = []
  }

  function undo() {
    if (!canUndo.value) return
    redoStack.value.push(makeSnapshot())
    applySnapshot(undoStack.value.pop())
    editorEpoch.value += 1
    notify('Change undone')
  }

  function redo() {
    if (!canRedo.value) return
    undoStack.value.push(makeSnapshot())
    applySnapshot(redoStack.value.pop())
    editorEpoch.value += 1
    notify('Change restored')
  }

  function openTemplate(id) {
    if (!templates.value.some((template) => template.id === id)) return
    activeTemplateId.value = id
    selectedFieldIds.value = []
    notify(`${activeTemplate.value.name} opened`)
  }

  function setMode(nextMode) {
    if (!['build', 'preview'].includes(nextMode)) return false
    mode.value = nextMode
    selectedFieldIds.value = []
    notify(nextMode === 'preview' ? 'Signing preview opened' : 'Build mode opened')
    return true
  }

  function selectSubmitter(id) {
    if (!submitters.value.some((submitter) => submitter.id === id)) return false
    activeSubmitterId.value = id
    return true
  }

  function selectField(id, additive = false) {
    if (!activeTemplate.value.fields.some((field) => field.id === id)) return false
    if (additive) {
      selectedFieldIds.value = selectedFieldIds.value.includes(id)
        ? selectedFieldIds.value.filter((fieldId) => fieldId !== id)
        : [...selectedFieldIds.value, id]
    } else {
      selectedFieldIds.value = [id]
    }
    return true
  }

  function clearSelection() {
    selectedFieldIds.value = []
  }

  function nextPlacement(size) {
    const index = activeTemplate.value.fields.length
    const [w, h] = size
    return {
      page: Math.min(activeTemplate.value.pages - 1, Math.floor(index / 6)),
      x: 28 + (index % 3) * 212,
      y: 150 + (Math.floor(index / 3) % 3) * 78,
      w, h,
    }
  }

  function addField(type) {
    if (!FIELD_TYPES.includes(type) || !activeSubmitter.value) return null
    record()
    const [w, h] = TYPE_SIZES[type] || [160, 40]
    const field = {
      id: uid('field'),
      name: TYPE_LABELS[type],
      type,
      required: ['signature', 'initials'].includes(type),
      submitter: activeSubmitter.value.name,
      ...nextPlacement([w, h]),
    }
    activeTemplate.value.fields.push(field)
    selectedFieldIds.value = [field.id]
    notify(`${TYPE_LABELS[type]} field added for ${field.submitter}`)
    return field
  }

  function updateField(id, property, value) {
    if (!['name', 'required', 'submitter'].includes(property)) return { ok: false, error: 'Property is not editable.' }
    const field = activeTemplate.value.fields.find((item) => item.id === id)
    if (!field) return { ok: false, error: 'Field was not found.' }
    const candidate = { ...field, [property]: value }
    const parsed = fieldSchema.safeParse(candidate)
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    if (property === 'submitter' && !submitters.value.some((item) => item.name === value)) {
      return { ok: false, error: 'submitter: Submitter must match one of submitters[].name.' }
    }
    if (field[property] === parsed.data[property]) return { ok: true }
    record()
    field[property] = parsed.data[property]
    notify(property === 'submitter' ? `Field assigned to ${value}` : 'Field updated')
    return { ok: true }
  }

  function duplicateField(id = selectedField.value?.id) {
    const source = activeTemplate.value.fields.find((field) => field.id === id)
    if (!source) return null
    record()
    const suffix = ' copy'
    const copy = {
      ...clone(source),
      id: uid('field'),
      name: `${source.name.slice(0, 80 - suffix.length)}${suffix}`,
      x: Math.min(720 - source.w, source.x + 18),
      y: Math.min(560 - source.h, source.y + 18),
    }
    activeTemplate.value.fields.push(copy)
    selectedFieldIds.value = [copy.id]
    notify('Field duplicated')
    return copy
  }

  function deleteFields(ids = selectedFieldIds.value) {
    const targets = new Set(ids)
    if (!targets.size || !activeTemplate.value.fields.some((field) => targets.has(field.id))) return false
    record()
    activeTemplate.value.fields = activeTemplate.value.fields.filter((field) => !targets.has(field.id))
    selectedFieldIds.value = []
    notify(targets.size > 1 ? `${targets.size} fields deleted` : 'Field deleted')
    return true
  }

  function batchReassign(submitterName) {
    if (selectedFieldIds.value.length < 2 || !submitters.value.some((item) => item.name === submitterName)) return false
    const targets = activeTemplate.value.fields.filter((field) => selectedFieldIds.value.includes(field.id))
    if (targets.every((field) => field.submitter === submitterName)) return true
    record()
    targets.forEach((field) => { field.submitter = submitterName })
    notify(`${targets.length} fields assigned to ${submitterName}`)
    return true
  }

  function beginFieldMove() {
    gestureSnapshot.value = makeSnapshot()
  }

  function moveField(id, x, y) {
    const field = activeTemplate.value.fields.find((item) => item.id === id)
    if (!field) return
    field.x = Math.max(0, Math.min(720 - field.w, Number(x.toFixed(2))))
    field.y = Math.max(0, Math.min(560 - field.h, Number(y.toFixed(2))))
  }

  function finishFieldMove() {
    if (!gestureSnapshot.value) return
    const before = gestureSnapshot.value
    gestureSnapshot.value = null
    if (JSON.stringify(before.templates) !== JSON.stringify(templates.value)) {
      record(before)
      notify('Field position updated')
    }
  }

  function renameTemplate(name) {
    const parsed = templateNameSchema.safeParse({ name })
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    if (activeTemplate.value.name === parsed.data.name) return { ok: true }
    record()
    activeTemplate.value.name = parsed.data.name
    notify('Template name updated')
    return { ok: true }
  }

  function addSubmitter(payload) {
    const parsed = submitterSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    if (submitters.value.some((submitter) => submitter.name.toLowerCase() === parsed.data.name.toLowerCase())) {
      return { ok: false, error: 'name: Submitter name must be unique.' }
    }
    record()
    const submitter = { id: uid('submitter'), ...parsed.data }
    submitters.value.push(submitter)
    activeSubmitterId.value = submitter.id
    notify(`${submitter.name} added`)
    return { ok: true, submitter }
  }

  function updateSubmitter(id, payload) {
    const submitter = submitters.value.find((item) => item.id === id)
    if (!submitter) return { ok: false, error: 'submitter: Submitter was not found.' }
    const parsed = submitterSchema.safeParse({ ...submitter, ...payload })
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    if (submitters.value.some((item) => item.id !== id && item.name.toLowerCase() === parsed.data.name.toLowerCase())) {
      return { ok: false, error: 'name: Submitter name must be unique.' }
    }
    record()
    const oldName = submitter.name
    submitter.name = parsed.data.name
    submitter.color = parsed.data.color
    templates.value.forEach((template) => template.fields.forEach((field) => {
      if (field.submitter === oldName) field.submitter = submitter.name
    }))
    notify('Submitter updated')
    return { ok: true }
  }

  function deleteSubmitter(id, confirm = false) {
    if (!confirm) return { ok: false, error: 'confirm: Deletion requires confirm=true.' }
    if (submitters.value.length <= 1) return { ok: false, error: 'submitter: At least one submitter is required.' }
    const submitter = submitters.value.find((item) => item.id === id)
    if (!submitter) return { ok: false, error: 'submitter: Submitter was not found.' }
    if (templates.value.some((template) => template.fields.some((field) => field.submitter === submitter.name))) {
      return { ok: false, error: 'submitter: Reassign this submitter’s fields before deleting.' }
    }
    record()
    submitters.value = submitters.value.filter((item) => item.id !== id)
    if (activeSubmitterId.value === id) activeSubmitterId.value = submitters.value[0].id
    notify('Submitter deleted')
    return { ok: true }
  }

  function validateTemplate({ forSigning = false } = {}) {
    const parsed = templateSchema.safeParse(templatePayload.value)
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    if (forSigning && parsed.data.fields.length === 0) return { ok: false, error: 'fields: Add at least one field before sending for signing.' }
    return { ok: true, data: parsed.data }
  }

  function sendForSigning() {
    const validation = validateTemplate({ forSigning: true })
    if (!validation.ok) return validation
    for (const field of activeTemplate.value.fields) {
      const parsed = fieldSchema.safeParse(field)
      if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    }
    record()
    activeTemplate.value.status = 'pending'
    activeTemplate.value.signingIndex = 0
    notify(`Awaiting ${submitters.value[0].name}`)
    return { ok: true }
  }

  function advanceSigning() {
    const template = activeTemplate.value
    if (template.status !== 'pending') return { ok: false, error: 'status: Template is not awaiting signatures.' }
    record()
    const next = (template.signingIndex ?? 0) + 1
    if (next >= submitters.value.length) {
      template.status = 'completed'
      template.signingIndex = null
      notify('Signing completed')
    } else {
      template.signingIndex = next
      notify(`Awaiting ${submitters.value[next].name}`)
    }
    persistWorkspace()
    return { ok: true }
  }

  function importTemplate(text) {
    let raw
    try {
      raw = JSON.parse(text)
    } catch {
      return { ok: false, error: 'document: Template JSON is malformed. Check the JSON syntax.' }
    }
    const parsed = templateSchema.safeParse(raw)
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) }
    record()
    submitters.value = parsed.data.submitters.map((submitter) => ({ id: uid('submitter'), ...submitter }))
    activeSubmitterId.value = submitters.value[0].id
    activeTemplate.value.name = parsed.data.name
    activeTemplate.value.status = parsed.data.status
    activeTemplate.value.signingIndex = parsed.data.status === 'pending' ? 0 : null
    activeTemplate.value.pages = Math.max(1, ...parsed.data.fields.map((field) => field.page + 1))
    activeTemplate.value.fields = parsed.data.fields.map((field) => ({ id: uid('field'), ...field }))
    selectedFieldIds.value = []
    editorEpoch.value += 1
    notify('Template JSON imported')
    return { ok: true }
  }

  return {
    templates, submitters, activeTemplateId, activeSubmitterId, selectedFieldIds, mode,
    undoStack, redoStack, notice, editorEpoch, activeTemplate, activeSubmitter, selectedFields, selectedField,
    canUndo, canRedo, statusLabel, fieldCounts, templatePayload, templateJson, signingSummary,
    notify, undo, redo, openTemplate, setMode, selectSubmitter, selectField, clearSelection,
    addField, updateField, duplicateField, deleteFields, batchReassign,
    beginFieldMove, moveField, finishFieldMove, renameTemplate,
    addSubmitter, updateSubmitter, deleteSubmitter, validateTemplate, sendForSigning,
    advanceSigning, importTemplate,
  }
})

export { COLORS, FIELD_TYPES, TYPE_LABELS }
