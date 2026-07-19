import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
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

const STORAGE_KEY = 'mindthread_data'
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

function normalizeThreads(value: unknown): Thread[] {
  if (!Array.isArray(value)) return []
  const threads: Thread[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const title = toText(raw.title)
    if (!title) continue
    const createdAt = toTimestamp(raw.createdAt, Date.now())
    threads.push({
      id: toText(raw.id) || generateId('thread'),
      title,
      status: toStatus(raw.status),
      pinned: raw.pinned === true,
      pinnedAt: raw.pinned === true ? toTimestamp(raw.pinnedAt, createdAt) : null,
      archived: raw.archived === true,
      createdAt,
      updatedAt: toTimestamp(raw.updatedAt, createdAt),
    })
  }
  return threads
}

function normalizeSparks(value: unknown, threadIds: Set<string>): Spark[] {
  if (!Array.isArray(value)) return []
  const sparks: Spark[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const text = toText(raw.text)
    if (!text) continue
    const threadId = toText(raw.threadId)
    sparks.push({
      id: toText(raw.id) || generateId('spark'),
      text,
      tags: toTags(raw.tags),
      threadId: threadId && threadIds.has(threadId) ? threadId : null,
      createdAt: toTimestamp(raw.createdAt, Date.now()),
    })
  }
  return sparks
}

function normalizeReflections(value: unknown, sparkIds: Set<string>): Reflection[] {
  if (!Array.isArray(value)) return []
  const reflections: Reflection[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const text = toText(raw.text)
    const sparkId = toText(raw.sparkId)
    if (!text || !sparkId || !sparkIds.has(sparkId)) continue
    reflections.push({
      id: toText(raw.id) || generateId('reflection'),
      text,
      sparkId,
      createdAt: toTimestamp(raw.createdAt, Date.now()),
    })
  }
  return reflections
}

export const useSparkStore = defineStore('mindthread', () => {
  const sparks = ref<Spark[]>([])
  const threads = ref<Thread[]>([])
  const reflections = ref<Reflection[]>([])

  function loadState() {
    let data: unknown = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) data = JSON.parse(raw)
    } catch {
      data = null
    }
    if (data && typeof data === 'object') {
      const parsed = data as Record<string, unknown>
      const loadedThreads = normalizeThreads(parsed.threads)
      const threadIds = new Set(loadedThreads.map(thread => thread.id))
      const loadedSparks = normalizeSparks(parsed.sparks, threadIds)
      const sparkIds = new Set(loadedSparks.map(spark => spark.id))
      threads.value = loadedThreads
      sparks.value = loadedSparks
      reflections.value = normalizeReflections(parsed.reflections, sparkIds)
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sparks: sparks.value,
          threads: threads.value,
          reflections: reflections.value,
        }),
      )
    } catch {
      // Persistence is best effort; the in-memory state stays authoritative.
    }
  }

  loadState()

  watch([sparks, threads, reflections], saveState, { deep: true })

  // --- Sparks ---

  function addSpark(text: string): Spark | null {
    const trimmed = text.trim()
    if (!trimmed) return null
    const spark: Spark = {
      id: generateId('spark'),
      text: trimmed,
      tags: [],
      threadId: null,
      createdAt: Date.now(),
    }
    sparks.value.push(spark)
    return spark
  }

  function getSpark(id: string): Spark | undefined {
    return sparks.value.find(spark => spark.id === id)
  }

  function updateSparkText(id: string, text: string): boolean {
    const trimmed = text.trim()
    const spark = getSpark(id)
    if (!spark || !trimmed) return false
    spark.text = trimmed
    return true
  }

  function deleteSpark(id: string) {
    const index = sparks.value.findIndex(spark => spark.id === id)
    if (index > -1) sparks.value.splice(index, 1)
    reflections.value = reflections.value.filter(reflection => reflection.sparkId !== id)
  }

  function addTagToSpark(sparkId: string, tag: string): 'added' | 'duplicate' | 'invalid' {
    const trimmed = tag.trim()
    const spark = getSpark(sparkId)
    if (!spark || !trimmed) return 'invalid'
    if (spark.tags.some(existing => existing.toLowerCase() === trimmed.toLowerCase())) {
      return 'duplicate'
    }
    spark.tags.push(trimmed)
    return 'added'
  }

  function removeTagFromSpark(sparkId: string, tag: string) {
    const spark = getSpark(sparkId)
    if (!spark) return
    spark.tags = spark.tags.filter(existing => existing !== tag)
  }

  function assignSparkToThread(sparkId: string, threadId: string): boolean {
    const spark = getSpark(sparkId)
    const thread = getThread(threadId)
    if (!spark || !thread) return false
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

  // --- Threads ---

  function addThread(title: string): Thread | null {
    const trimmed = title.trim()
    if (!trimmed) return null
    const timestamp = Date.now()
    const thread: Thread = {
      id: generateId('thread'),
      title: trimmed,
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
    thread.status = status
    thread.updatedAt = Date.now()
  }

  function togglePin(threadId: string) {
    const thread = getThread(threadId)
    if (!thread) return
    thread.pinned = !thread.pinned
    thread.pinnedAt = thread.pinned ? Date.now() : null
  }

  function setArchived(threadId: string, archived: boolean) {
    const thread = getThread(threadId)
    if (!thread) return
    thread.archived = archived
  }

  function mergeThreads(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return false
    const source = getThread(sourceId)
    const target = getThread(targetId)
    if (!source || !target) return false
    for (const spark of sparks.value) {
      if (spark.threadId === sourceId) spark.threadId = targetId
    }
    const index = threads.value.findIndex(thread => thread.id === sourceId)
    if (index > -1) threads.value.splice(index, 1)
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
      .sort((a, b) => b.createdAt - a.createdAt),
  )

  const archivedThreads = computed(() =>
    threads.value
      .filter(thread => thread.archived)
      .sort((a, b) => b.createdAt - a.createdAt),
  )

  // --- Reflections ---

  function addReflection(sparkId: string, text: string): Reflection | null {
    const trimmed = text.trim()
    const spark = getSpark(sparkId)
    if (!spark || !trimmed) return null
    const reflection: Reflection = {
      id: generateId('reflection'),
      text: trimmed,
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

  // --- Derived data ---

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
        .sort((a, b) => b.createdAt - a.createdAt),
    }
  }

  return {
    sparks,
    threads,
    reflections,
    addSpark,
    getSpark,
    updateSparkText,
    deleteSpark,
    addTagToSpark,
    removeTagFromSpark,
    assignSparkToThread,
    unthreadedSparks,
    sparksInThread,
    addThread,
    getThread,
    setThreadStatus,
    togglePin,
    setArchived,
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
  }
})
