import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { z } from 'zod'
import { dayNumber } from '../utils/time'

export type ThreadStatus = 'active' | 'dormant' | 'resolved'

export interface Spark {
  id: string
  text: string
  tags: string[]
  threadId: string | null
  createdAt: number
}

export interface Reflection {
  id: string
  text: string
  sparkId: string
  createdAt: number
}

export interface Thread {
  id: string
  title: string
  status: ThreadStatus
  pinned: boolean
  pinnedAt: number | null
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface ThreadStats {
  sparkCount: number
  reflectionCount: number
  daysActive: number
}

export interface SearchMatches {
  sparks: Spark[]
  reflections: Reflection[]
  threads: Thread[]
}

interface WorkspaceSnapshot {
  sparks: Spark[]
  threads: Thread[]
  reflections: Reflection[]
}

export const SparkUpsertSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Enter a thought to add a spark')
    .max(2000, 'text must be 1 to 2000 characters'),
})

export const ThreadUpsertSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title to create a thread')
    .max(80, 'title must be at most 80 characters'),
})

export const ReflectionUpsertSchema = z.object({
  content: z.string().trim().min(1, 'Enter some text to save the reflection'),
})

export const TagAddSchema = z
  .string()
  .trim()
  .min(1, 'tag must be 1 to 32 characters')
  .max(32, 'tag must be at most 32 characters')
  .regex(/^[^\s\p{P}]+$/u, 'tag must omit spaces and punctuation')

const ExportStatusSchema = z.enum(['Active', 'Dormant', 'Resolved'])

export const WorkspaceJSONSchema = z
  .object({
    schemaVersion: z.literal('mindthread-workspace-v1', {
      errorMap: () => ({ message: 'schemaVersion must be mindthread-workspace-v1' }),
    }),
    exportedAt: z.string().datetime(),
    sparks: z.array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1).max(2000),
        tags: z.array(TagAddSchema),
        threadId: z.string().nullable(),
        createdAt: z.union([z.string().datetime(), z.number()]),
      }),
    ),
    threads: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(80),
        status: ExportStatusSchema,
        pinned: z.boolean(),
        archived: z.boolean(),
        pinnedAt: z.union([z.string().datetime(), z.number(), z.null()]),
        createdAt: z.union([z.string().datetime(), z.number()]),
        updatedAt: z.union([z.string().datetime(), z.number()]),
      }),
    ),
    reflections: z.array(
      z.object({
        id: z.string().min(1),
        sparkId: z.string().min(1),
        content: z.string().min(1),
        createdAt: z.union([z.string().datetime(), z.number()]),
      }),
    ),
  })
  .refine(
    data => {
      const threadIds = new Set(data.threads.map(t => t.id))
      for (const spark of data.sparks) {
        if (spark.threadId && !threadIds.has(spark.threadId)) return false
      }
      return true
    },
    { message: 'unresolved threadId' },
  )
  .refine(
    data => {
      const sparkIds = new Set(data.sparks.map(s => s.id))
      for (const reflection of data.reflections) {
        if (!sparkIds.has(reflection.sparkId)) return false
      }
      return true
    },
    { message: 'unresolved sparkId' },
  )

const STATUSES: ThreadStatus[] = ['active', 'dormant', 'resolved']

let idCounter = 0

function generateId(prefix: string): string {
  idCounter += 1
  const random = Math.random().toString(36).slice(2, 7)
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toTimestamp(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) return Number(value)
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toStatus(value: unknown): ThreadStatus {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase() as ThreadStatus
    if (STATUSES.includes(normalized)) return normalized
  }
  return 'active'
}

function toTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const tags: string[] = []
  for (const entry of value) {
    const tag = toText(entry)
    if (tag && !tags.some(existing => existing.toLowerCase() === tag.toLowerCase())) {
      tags.push(tag)
    }
  }
  return tags
}

function cloneSnapshot(data: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    sparks: data.sparks.map(spark => ({ ...spark, tags: [...spark.tags] })),
    threads: data.threads.map(thread => ({ ...thread })),
    reflections: data.reflections.map(reflection => ({ ...reflection })),
  }
}

function statusToExport(status: ThreadStatus): 'Active' | 'Dormant' | 'Resolved' {
  if (status === 'dormant') return 'Dormant'
  if (status === 'resolved') return 'Resolved'
  return 'Active'
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

export const useSparkStore = defineStore('mindthread', () => {
  const sparks = ref<Spark[]>([])
  const threads = ref<Thread[]>([])
  const reflections = ref<Reflection[]>([])
  const undoStack = ref<WorkspaceSnapshot[]>([])
  const redoStack = ref<WorkspaceSnapshot[]>([])

  function snapshot(): WorkspaceSnapshot {
    return cloneSnapshot({
      sparks: sparks.value,
      threads: threads.value,
      reflections: reflections.value,
    })
  }

  function pushHistory() {
    undoStack.value.push(snapshot())
    redoStack.value = []
    if (undoStack.value.length > 100) undoStack.value.shift()
  }

  function restore(data: WorkspaceSnapshot) {
    sparks.value = cloneSnapshot(data).sparks
    threads.value = cloneSnapshot(data).threads
    reflections.value = cloneSnapshot(data).reflections
  }

  function undo(): boolean {
    if (undoStack.value.length === 0) return false
    redoStack.value.push(snapshot())
    restore(undoStack.value.pop()!)
    return true
  }

  function redo(): boolean {
    if (redoStack.value.length === 0) return false
    undoStack.value.push(snapshot())
    restore(redoStack.value.pop()!)
    return true
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function addSpark(text: string): Spark | null {
    const parsed = SparkUpsertSchema.safeParse({ text })
    if (!parsed.success) return null
    pushHistory()
    const spark: Spark = {
      id: generateId('spark'),
      text: parsed.data.text,
      tags: [],
      threadId: null,
      createdAt: Date.now(),
    }
    sparks.value.unshift(spark)
    return spark
  }

  function getSpark(id: string): Spark | undefined {
    return sparks.value.find(spark => spark.id === id)
  }

  function updateSparkText(id: string, text: string): boolean {
    const parsed = SparkUpsertSchema.safeParse({ text })
    const spark = getSpark(id)
    if (!spark || !parsed.success) return false
    pushHistory()
    spark.text = parsed.data.text
    return true
  }

  function deleteSpark(id: string) {
    const index = sparks.value.findIndex(spark => spark.id === id)
    if (index === -1) return
    pushHistory()
    sparks.value.splice(index, 1)
    reflections.value = reflections.value.filter(reflection => reflection.sparkId !== id)
  }

  function bulkDeleteSparks(ids: string[]) {
    if (ids.length === 0) return
    pushHistory()
    const idSet = new Set(ids)
    sparks.value = sparks.value.filter(spark => !idSet.has(spark.id))
    reflections.value = reflections.value.filter(reflection => !idSet.has(reflection.sparkId))
  }

  function addTagToSpark(sparkId: string, tag: string): 'added' | 'duplicate' | 'invalid' {
    const parsed = TagAddSchema.safeParse(tag)
    if (!parsed.success) return 'invalid'
    const trimmed = parsed.data
    const spark = getSpark(sparkId)
    if (!spark) return 'invalid'
    if (spark.tags.some(existing => existing.toLowerCase() === trimmed.toLowerCase())) {
      return 'duplicate'
    }
    pushHistory()
    spark.tags.push(trimmed)
    return 'added'
  }

  function bulkAddTag(sparkIds: string[], tag: string): 'added' | 'invalid' {
    const parsed = TagAddSchema.safeParse(tag)
    if (!parsed.success) return 'invalid'
    pushHistory()
    for (const sparkId of sparkIds) {
      const spark = getSpark(sparkId)
      if (!spark) continue
      if (!spark.tags.some(existing => existing.toLowerCase() === parsed.data.toLowerCase())) {
        spark.tags.push(parsed.data)
      }
    }
    return 'added'
  }

  function removeTagFromSpark(sparkId: string, tag: string) {
    const spark = getSpark(sparkId)
    if (!spark) return
    pushHistory()
    spark.tags = spark.tags.filter(existing => existing !== tag)
  }

  function assignSparkToThread(sparkId: string, threadId: string): boolean {
    const spark = getSpark(sparkId)
    const thread = getThread(threadId)
    if (!spark || !thread) return false
    pushHistory()
    spark.threadId = threadId
    thread.updatedAt = Date.now()
    return true
  }

  const unthreadedSparks = computed(() =>
    sparks.value
      .filter(spark => spark.threadId === null)
      .sort((a, b) => b.createdAt - a.createdAt),
  )

  function sparksInThread(threadId: string): Spark[] {
    return sparks.value
      .filter(spark => spark.threadId === threadId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  function addThread(title: string): Thread | null {
    const parsed = ThreadUpsertSchema.safeParse({ title })
    if (!parsed.success) return null
    pushHistory()
    const timestamp = Date.now()
    const thread: Thread = {
      id: generateId('thread'),
      title: parsed.data.title,
      status: 'active',
      pinned: false,
      pinnedAt: null,
      archived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    threads.value.push(thread)
    return thread
  }

  function getThread(id: string): Thread | undefined {
    return threads.value.find(thread => thread.id === id)
  }

  function setThreadStatus(threadId: string, status: ThreadStatus) {
    const thread = getThread(threadId)
    if (!thread) return
    pushHistory()
    thread.status = status
    thread.updatedAt = Date.now()
  }

  function togglePin(threadId: string) {
    const thread = getThread(threadId)
    if (!thread) return
    pushHistory()
    thread.pinned = !thread.pinned
    thread.pinnedAt = thread.pinned ? Date.now() : null
    thread.updatedAt = Date.now()
  }

  function setArchived(threadId: string, archived: boolean) {
    const thread = getThread(threadId)
    if (!thread) return
    pushHistory()
    thread.archived = archived
    thread.updatedAt = Date.now()
  }

  function deleteThread(threadId: string): boolean {
    const thread = getThread(threadId)
    if (!thread) return false
    const hasSparks = sparks.value.some(spark => spark.threadId === threadId)
    if (hasSparks) return false
    pushHistory()
    threads.value = threads.value.filter(entry => entry.id !== threadId)
    return true
  }

  function mergeThreads(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return false
    const source = getThread(sourceId)
    const target = getThread(targetId)
    if (!source || !target) return false
    pushHistory()
    for (const spark of sparks.value) {
      if (spark.threadId === sourceId) spark.threadId = targetId
    }
    threads.value = threads.value.filter(thread => thread.id !== sourceId)
    target.updatedAt = Date.now()
    return true
  }

  const activeThreads = computed(() => threads.value.filter(thread => !thread.archived))

  const pinnedThreads = computed(() =>
    activeThreads.value
      .filter(thread => thread.pinned)
      .sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0)),
  )

  const unpinnedThreads = computed(() =>
    activeThreads.value
      .filter(thread => !thread.pinned)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  )

  const archivedThreads = computed(() =>
    threads.value
      .filter(thread => thread.archived)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  )

  function addReflection(sparkId: string, content: string): Reflection | null {
    const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const parsed = ReflectionUpsertSchema.safeParse({ content: plain })
    const spark = getSpark(sparkId)
    if (!spark || !parsed.success) return null
    pushHistory()
    const reflection: Reflection = {
      id: generateId('reflection'),
      text: content,
      sparkId,
      createdAt: Date.now(),
    }
    reflections.value.push(reflection)
    if (spark.threadId) {
      const thread = getThread(spark.threadId)
      if (thread) thread.updatedAt = Date.now()
    }
    return reflection
  }

  function reflectionsForSpark(sparkId: string): Reflection[] {
    return reflections.value
      .filter(reflection => reflection.sparkId === sparkId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  function threadStats(threadId: string): ThreadStats {
    const threadSparks = sparks.value.filter(spark => spark.threadId === threadId)
    const sparkIds = new Set(threadSparks.map(spark => spark.id))
    const reflectionCount = reflections.value.filter(reflection =>
      sparkIds.has(reflection.sparkId),
    ).length
    let daysActive = 0
    if (threadSparks.length > 0) {
      let first = threadSparks[0].createdAt
      let last = threadSparks[0].createdAt
      for (const spark of threadSparks) {
        if (spark.createdAt < first) first = spark.createdAt
        if (spark.createdAt > last) last = spark.createdAt
      }
      daysActive = dayNumber(last) - dayNumber(first) + 1
    }
    return { sparkCount: threadSparks.length, reflectionCount, daysActive }
  }

  function threadLastActivity(threadId: string): number {
    const thread = getThread(threadId)
    let latest = thread ? Math.max(thread.createdAt, thread.updatedAt) : 0
    const sparkIds = new Set<string>()
    for (const spark of sparks.value) {
      if (spark.threadId === threadId) {
        sparkIds.add(spark.id)
        if (spark.createdAt > latest) latest = spark.createdAt
      }
    }
    for (const reflection of reflections.value) {
      if (sparkIds.has(reflection.sparkId) && reflection.createdAt > latest) {
        latest = reflection.createdAt
      }
    }
    return latest
  }

  const allTags = computed(() => {
    const counts = new Map<string, number>()
    for (const spark of sparks.value) {
      for (const tag of spark.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  })

  function searchAll(query: string): SearchMatches {
    const q = query.trim().toLowerCase()
    if (!q) return { sparks: [], reflections: [], threads: [] }
    return {
      sparks: sparks.value
        .filter(spark => spark.text.toLowerCase().includes(q))
        .sort((a, b) => b.createdAt - a.createdAt),
      reflections: reflections.value
        .filter(reflection => reflection.text.toLowerCase().includes(q))
        .sort((a, b) => b.createdAt - a.createdAt),
      threads: threads.value
        .filter(thread => thread.title.toLowerCase().includes(q))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    }
  }

  function buildWorkspaceExport() {
    return {
      schemaVersion: 'mindthread-workspace-v1' as const,
      exportedAt: new Date().toISOString(),
      sparks: sparks.value.map(spark => ({
        id: spark.id,
        text: spark.text,
        tags: [...spark.tags],
        threadId: spark.threadId,
        createdAt: toIso(spark.createdAt),
      })),
      threads: threads.value.map(thread => ({
        id: thread.id,
        title: thread.title,
        status: statusToExport(thread.status),
        pinned: thread.pinned,
        archived: thread.archived,
        pinnedAt: thread.pinnedAt ? toIso(thread.pinnedAt) : null,
        createdAt: toIso(thread.createdAt),
        updatedAt: toIso(thread.updatedAt),
      })),
      reflections: reflections.value.map(reflection => ({
        id: reflection.id,
        sparkId: reflection.sparkId,
        content: reflection.text,
        createdAt: toIso(reflection.createdAt),
      })),
    }
  }

  function setWorkspace(data: z.infer<typeof WorkspaceJSONSchema>) {
    pushHistory()
    threads.value = data.threads.map(thread => ({
      id: thread.id,
      title: thread.title,
      status: toStatus(thread.status),
      pinned: thread.pinned,
      archived: thread.archived,
      pinnedAt: thread.pinnedAt ? toTimestamp(thread.pinnedAt, Date.now()) : null,
      createdAt: toTimestamp(thread.createdAt, Date.now()),
      updatedAt: toTimestamp(thread.updatedAt, Date.now()),
    }))
    const threadIds = new Set(threads.value.map(thread => thread.id))
    sparks.value = data.sparks.map(spark => ({
      id: spark.id,
      text: spark.text,
      tags: toTags(spark.tags),
      threadId: spark.threadId && threadIds.has(spark.threadId) ? spark.threadId : null,
      createdAt: toTimestamp(spark.createdAt, Date.now()),
    }))
    const sparkIds = new Set(sparks.value.map(spark => spark.id))
    reflections.value = data.reflections
      .filter(reflection => sparkIds.has(reflection.sparkId))
      .map(reflection => ({
        id: reflection.id,
        text: reflection.content,
        sparkId: reflection.sparkId,
        createdAt: toTimestamp(reflection.createdAt, Date.now()),
      }))
  }

  function importWorkspace(raw: unknown): { ok: true } | { ok: false; error: string } {
    const parsed = WorkspaceJSONSchema.safeParse(raw)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: issue?.message ?? 'Invalid Workspace JSON' }
    }
    setWorkspace(parsed.data)
    return { ok: true }
  }

  return {
    sparks,
    threads,
    reflections,
    canUndo,
    canRedo,
    addSpark,
    getSpark,
    updateSparkText,
    deleteSpark,
    bulkDeleteSparks,
    addTagToSpark,
    bulkAddTag,
    removeTagFromSpark,
    assignSparkToThread,
    unthreadedSparks,
    sparksInThread,
    addThread,
    getThread,
    setThreadStatus,
    togglePin,
    setArchived,
    deleteThread,
    mergeThreads,
    activeThreads,
    pinnedThreads,
    unpinnedThreads,
    archivedThreads,
    addReflection,
    reflectionsForSpark,
    threadStats,
    threadLastActivity,
    allTags,
    searchAll,
    undo,
    redo,
    buildWorkspaceExport,
    setWorkspace,
    importWorkspace,
  }
})
