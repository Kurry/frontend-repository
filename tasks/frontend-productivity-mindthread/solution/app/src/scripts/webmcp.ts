// WebMCP surface for the MindThread oracle.
//
// Contract zto-webmcp-v1. Every tool drives the SAME Pinia store actions the
// visible UI controls use — sparkStore (capture / assign / reflect / status /
// pin / archive / tags / delete) and uiStore (view tabs / thread open / search
// / tag filter). No tool fabricates a success state the UI cannot reach, and no
// tool drives a mechanics-excluded gesture (the merge confirm dialog and the
// virtualized-list scrolling stay Playwright-only). Exposed on window as
// webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.

import { useSparkStore } from '../stores/sparkStore'
import type { ThreadStatus } from '../stores/sparkStore'
import { useUiStore } from '../stores/uiStore'

const CONTRACT_VERSION = 'zto-webmcp-v1'

const MODULES = ['browse-query-v1', 'entity-collection-v1', 'form-workflow-v1', 'artifact-transfer-v1']

type Args = Record<string, unknown>
type Result = Record<string, unknown>

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveThreadId(store: ReturnType<typeof useSparkStore>, raw: string): string | null {
  if (!raw) return null
  const byId = store.getThread(raw)
  if (byId) return byId.id
  const lower = raw.toLowerCase()
  const byTitle = store.threads.find(t => t.title.toLowerCase() === lower)
  return byTitle ? byTitle.id : null
}

// ---- browse-query-v1 -------------------------------------------------------
// destinations: home | today | archived | thread-detail. filters: tag.
// browsable_entity: sparks. Drives uiStore — the same actions the nav tabs,
// thread cards, search field and tag chips call.

const DESTINATIONS = ['home', 'today', 'archived', 'thread-detail'] as const

function browseOpen(args: Args): Result {
  const ui = useUiStore()
  const store = useSparkStore()
  const destination = str(args.destination ?? args.section)
  if (!(DESTINATIONS as readonly string[]).includes(destination)) {
    return { ok: false, error: `unknown destination: ${destination}` }
  }
  if (destination === 'thread-detail') {
    const ref = str(args.thread ?? args.thread_id ?? args.thread_title)
    const threadId = resolveThreadId(store, ref)
    if (!threadId) return { ok: false, error: `unknown thread: ${ref}` }
    ui.openThread(threadId)
    return { ok: true, destination, currentView: ui.currentView, openThreadId: ui.openThreadId }
  }
  ui.closeThread()
  ui.setView(destination)
  return { ok: true, destination, currentView: ui.currentView }
}

function browseSearch(args: Args): Result {
  const ui = useUiStore()
  const store = useSparkStore()
  const query = str(args.query ?? args.q ?? args.text)
  ui.setSearchQuery(query)
  const matches = store.searchAll(query)
  return {
    ok: true,
    query,
    matches: {
      sparks: matches.sparks.length,
      reflections: matches.reflections.length,
      threads: matches.threads.length,
    },
  }
}

function browseApplyFilter(args: Args): Result {
  const ui = useUiStore()
  const filter = str(args.filter ?? 'tag')
  if (filter !== 'tag') return { ok: false, error: `unknown filter: ${filter}` }
  const value = str(args.value ?? args.tag)
  if (!value) return { ok: false, error: 'missing tag value' }
  if (!ui.activeTags.includes(value)) ui.toggleTag(value)
  return { ok: true, filter, activeTags: [...ui.activeTags] }
}

function browseClearFilter(args: Args): Result {
  const ui = useUiStore()
  const value = str(args.value ?? args.tag)
  if (value) {
    if (ui.activeTags.includes(value)) ui.toggleTag(value)
  } else {
    ui.clearFilters()
  }
  return { ok: true, activeTags: [...ui.activeTags] }
}

// ---- entity-collection-v1 --------------------------------------------------
// entity: spark (threads run through the same store actions). operations:
// create | select | update | delete | toggle. Delete requires confirm=true.

function entityCreate(args: Args): Result {
  const store = useSparkStore()
  const entity = str(args.entity) || 'spark'
  if (entity === 'thread') {
    const title = str(args.title ?? args.text)
    const thread = store.addThread(title)
    if (!thread) return { ok: false, error: 'thread title is required' }
    return { ok: true, entity, id: thread.id, title: thread.title }
  }
  if (entity === 'spark') {
    const text = str(args.text ?? args.title)
    const spark = store.addSpark(text)
    if (!spark) return { ok: false, error: 'spark text is required' }
    return { ok: true, entity, id: spark.id, text: spark.text }
  }
  return { ok: false, error: `unknown entity: ${entity}` }
}

function entitySelect(args: Args): Result {
  // "Assign to Thread" selector: pick which thread a spark belongs to.
  const store = useSparkStore()
  const sparkId = str(args.spark_id ?? args.id)
  const spark = store.getSpark(sparkId)
  if (!spark) return { ok: false, error: `unknown spark: ${sparkId}` }
  const target = str(args.thread ?? args.thread_id ?? args.value)
  if (target === '__new__' || target.toLowerCase() === 'new') {
    const title = spark.text.length > 40 ? `${spark.text.slice(0, 40).trimEnd()}…` : spark.text
    const thread = store.addThread(title)
    if (!thread) return { ok: false, error: 'could not create new thread' }
    store.assignSparkToThread(sparkId, thread.id)
    return { ok: true, sparkId, threadId: thread.id, threadTitle: thread.title, created: true }
  }
  const threadId = resolveThreadId(store, target)
  if (!threadId) return { ok: false, error: `unknown thread: ${target}` }
  store.assignSparkToThread(sparkId, threadId)
  return { ok: true, sparkId, threadId }
}

function entityUpdate(args: Args): Result {
  const store = useSparkStore()
  const field = str(args.field)
  const id = str(args.id)
  if (field === 'text') {
    const ok = store.updateSparkText(id, str(args.value ?? args.text))
    return ok ? { ok: true, id, field } : { ok: false, error: 'spark text is required' }
  }
  if (field === 'tags') {
    const spark = store.getSpark(id)
    if (!spark) return { ok: false, error: `unknown spark: ${id}` }
    const tag = str(args.value ?? args.tag)
    const action = str(args.tag_action ?? args.action) || 'add'
    if (action === 'remove') {
      store.removeTagFromSpark(id, tag)
      return { ok: true, id, field, action, tags: [...spark.tags] }
    }
    const result = store.addTagToSpark(id, tag)
    return { ok: result !== 'invalid', id, field, action, result, tags: [...spark.tags] }
  }
  if (field === 'status' || field === 'thread') {
    // thread-level fields: status (segmented control) or thread membership
    if (field === 'status') {
      const threadId = resolveThreadId(store, id)
      if (!threadId) return { ok: false, error: `unknown thread: ${id}` }
      const status = str(args.value ?? args.status).toLowerCase() as ThreadStatus
      if (!['active', 'dormant', 'resolved'].includes(status)) {
        return { ok: false, error: `unknown status: ${status}` }
      }
      store.setThreadStatus(threadId, status)
      return { ok: true, id: threadId, field, value: status }
    }
    // field === 'thread': re-assign a spark's thread membership
    const spark = store.getSpark(id)
    if (!spark) return { ok: false, error: `unknown spark: ${id}` }
    const threadId = resolveThreadId(store, str(args.value ?? args.thread))
    if (!threadId) return { ok: false, error: 'unknown target thread' }
    store.assignSparkToThread(id, threadId)
    return { ok: true, id, field, threadId }
  }
  return { ok: false, error: `unknown field: ${field}` }
}

function entityDelete(args: Args): Result {
  const store = useSparkStore()
  if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' }
  const id = str(args.id)
  const spark = store.getSpark(id)
  if (!spark) return { ok: false, error: `unknown spark: ${id}` }
  store.deleteSpark(id)
  return { ok: true, id, deleted: true }
}

function entityToggle(args: Args): Result {
  const store = useSparkStore()
  const id = str(args.id)
  const thread = store.getThread(id) ? id : resolveThreadId(store, id)
  if (!thread) return { ok: false, error: `unknown thread: ${id}` }
  const field = str(args.field) || 'pinned'
  const current = store.getThread(thread)!
  if (field === 'pinned') {
    const desired = typeof args.value === 'boolean' ? (args.value as boolean) : !current.pinned
    if (desired !== current.pinned) store.togglePin(thread)
    return { ok: true, id: thread, field, value: store.getThread(thread)!.pinned }
  }
  if (field === 'archived') {
    const desired = typeof args.value === 'boolean' ? (args.value as boolean) : !current.archived
    store.setArchived(thread, desired)
    return { ok: true, id: thread, field, value: desired }
  }
  return { ok: false, error: `unknown toggle field: ${field}` }
}

// ---- form-workflow-v1 ------------------------------------------------------
// form_fields: spark-text | thread-title. operations: validate | submit |
// cancel. Same non-empty validation and store commit the capture bar and the
// New Thread form use.

const FORM_FIELDS = ['spark-text', 'thread-title'] as const

function formValidate(args: Args): Result {
  const field = str(args.field)
  if (!(FORM_FIELDS as readonly string[]).includes(field)) {
    return { ok: false, error: `unknown field: ${field}` }
  }
  const value = str(args.value ?? args.text)
  const valid = value.length > 0
  const error =
    field === 'spark-text' ? 'Enter a thought to add a spark' : 'Enter a title to create a thread'
  return { ok: true, field, valid, error: valid ? null : error }
}

function formSubmit(args: Args): Result {
  const store = useSparkStore()
  const field = str(args.field)
  const value = str(args.value ?? args.text)
  if (field === 'spark-text') {
    const spark = store.addSpark(value)
    if (!spark) return { ok: false, field, valid: false, error: 'Enter a thought to add a spark' }
    return { ok: true, field, id: spark.id, text: spark.text }
  }
  if (field === 'thread-title') {
    const thread = store.addThread(value)
    if (!thread) return { ok: false, field, valid: false, error: 'Enter a title to create a thread' }
    return { ok: true, field, id: thread.id, title: thread.title }
  }
  return { ok: false, error: `unknown field: ${field}` }
}

function formCancel(args: Args): Result {
  const field = str(args.field)
  if (!(FORM_FIELDS as readonly string[]).includes(field)) {
    return { ok: false, error: `unknown field: ${field}` }
  }
  // Cancel discards the pending draft; nothing is committed (same as the
  // visible Cancel / clear-field affordance).
  return { ok: true, field, cancelled: true }
}

// ---- registry --------------------------------------------------------------

interface Tool {
  name: string
  description: string
  input_schema: Result
  handler: (args: Args) => unknown
}

const TOOLS: Tool[] = [
  {
    name: 'browse-open',
    description:
      'Switch the visible destination via the real nav controls. destination is one of home | today | archived | thread-detail; thread-detail also needs thread (id or title).',
    input_schema: {
      type: 'object',
      properties: {
        destination: { type: 'string', enum: [...DESTINATIONS] },
        thread: { type: 'string' },
      },
      required: ['destination'],
    },
    handler: browseOpen,
  },
  {
    name: 'browse-search',
    description:
      'Set the search query. Filters across spark text, reflection text, and thread titles, the same field the on-screen Search box drives.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: browseSearch,
  },
  {
    name: 'browse-apply-filter',
    description:
      'Apply a tag filter. filter is "tag"; value is a tag currently in use. Toggles the same tag chip the filter panel exposes.',
    input_schema: {
      type: 'object',
      properties: { filter: { type: 'string', enum: ['tag'] }, value: { type: 'string' } },
      required: ['value'],
    },
    handler: browseApplyFilter,
  },
  {
    name: 'browse-clear-filter',
    description:
      'Clear tag filters. With value, remove that one tag; without value, clear all (the Clear Filters control).',
    input_schema: {
      type: 'object',
      properties: { value: { type: 'string' } },
    },
    handler: browseClearFilter,
  },
  {
    name: 'entity-create',
    description:
      'Create a spark (entity="spark", text) or a thread (entity="thread", title). Empty text/title is rejected, same as the capture bar and New Thread form.',
    input_schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['spark', 'thread'] },
        text: { type: 'string' },
        title: { type: 'string' },
      },
      required: ['entity'],
    },
    handler: entityCreate,
  },
  {
    name: 'entity-select',
    description:
      'Assign a spark to a thread via the "Assign to Thread" selector. spark_id plus thread (id/title, or "__new__" to spin up a new thread from the spark text).',
    input_schema: {
      type: 'object',
      properties: { spark_id: { type: 'string' }, thread: { type: 'string' } },
      required: ['spark_id', 'thread'],
    },
    handler: entitySelect,
  },
  {
    name: 'entity-update',
    description:
      'Update a field: field="text" (spark text), field="tags" (add/remove a tag via tag_action), field="thread" (re-assign a spark), or field="status" (set a thread to active|dormant|resolved).',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        field: { type: 'string', enum: ['text', 'tags', 'thread', 'status'] },
        value: { type: 'string' },
        tag_action: { type: 'string', enum: ['add', 'remove'] },
      },
      required: ['id', 'field'],
    },
    handler: entityUpdate,
  },
  {
    name: 'entity-delete',
    description:
      'Delete a spark. Requires confirm=true; also removes that spark’s reflections, same as the Delete control.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm'],
    },
    handler: entityDelete,
  },
  {
    name: 'entity-toggle',
    description:
      'Toggle a thread flag: field="pinned" (Pin/Unpin) or field="archived" (Archive/Unarchive). Optional boolean value forces the target state.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        field: { type: 'string', enum: ['pinned', 'archived'] },
        value: { type: 'boolean' },
      },
      required: ['id', 'field'],
    },
    handler: entityToggle,
  },
  {
    name: 'form-validate',
    description:
      'Validate a form field without committing. field is spark-text | thread-title; returns { valid, error } using the same non-empty rule.',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string', enum: [...FORM_FIELDS] },
        value: { type: 'string' },
      },
      required: ['field'],
    },
    handler: formValidate,
  },
  {
    name: 'form-submit',
    description:
      'Submit a form field. spark-text commits a spark; thread-title commits a thread. Empty input is rejected with no record created.',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string', enum: [...FORM_FIELDS] },
        value: { type: 'string' },
      },
      required: ['field', 'value'],
    },
    handler: formSubmit,
  },
  {
    name: 'form-cancel',
    description: 'Cancel a form field; discards the pending draft, commits nothing.',
    input_schema: {
      type: 'object',
      properties: { field: { type: 'string', enum: [...FORM_FIELDS] } },
      required: ['field'],
    },
    handler: formCancel,
  },
]

export function initWebMcp() {
  const w = window as unknown as Record<string, unknown>
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map(t => t.name),
  })
  w.webmcp_list_tools = () =>
    TOOLS.map(t => ({ name: t.name, description: t.description, input_schema: t.input_schema }))
  w.webmcp_invoke_tool = (name: string, args: Args = {}) => {
    const tool = TOOLS.find(t => t.name === name)
    if (!tool) return { ok: false, error: `unknown tool: ${name}` }
    try {
      return tool.handler(args || {})
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  }

  // Optional navigator.modelContext mirror.
  try {
    const nav = navigator as unknown as Record<string, unknown>
    nav.modelContext = {
      contract_version: CONTRACT_VERSION,
      tools: TOOLS.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
      invoke: (name: string, args: Args = {}) =>
        (w.webmcp_invoke_tool as (n: string, a: Args) => unknown)(name, args),
    }
  } catch {
    // navigator.modelContext is optional; ignore if it cannot be assigned.
  }
}
