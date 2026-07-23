import { create } from 'zustand'
import { captureFocus, restoreFocus } from './focus'
import { createRun, seedAgents } from './seed'
import { createAgentSchema, fleetSnapshotSchema, STATUSES } from './schemas'

const nowIso = () => new Date().toISOString()
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const clone = (value) => structuredClone(value)
let pendingRemovalTimer = null

export function getRollup(agents) {
  const rollup = { idle: 0, running: 0, paused: 0, error: 0, offline: 0, total: agents.length }
  agents.forEach((agent) => { if (rollup[agent.status] !== undefined) rollup[agent.status] += 1 })
  return rollup
}

function exportRun(run) {
  if (!run) return null
  return {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt,
    ...(run.endedAt ? { endedAt: run.endedAt } : {}),
    steps: run.steps.map((step) => ({
      id: step.id,
      name: step.name,
      status: step.status,
      attempts: step.attempts,
      ...(step.checkpoint ? { checkpoint: step.checkpoint } : {}),
      ...(step.error ? { error: step.error } : {}),
      ...(step.startedAt ? { startedAt: step.startedAt } : {}),
      ...(step.completedAt ? { completedAt: step.completedAt } : {}),
      ...(step.output ? { output: step.output } : {}),
    })),
    progressComplete: run.progressComplete,
    progressTotal: run.progressTotal,
    ...(Number.isFinite(run.duration) ? { duration: run.duration } : {}),
  }
}

export function compileSnapshot(agents, exportedAt = nowIso()) {
  return {
    version: 'zto-fleet/1.0',
    exportedAt,
    rollup: getRollup(agents),
    agents: agents.map((agent) => ({
      name: agent.name,
      agentType: agent.agentType,
      editorIntegration: agent.editorIntegration,
      accessKey: agent.accessKey,
      status: agent.status,
      lastSeen: agent.lastSeen,
      timeline: agent.timeline,
      run: exportRun(agent.run),
    })),
  }
}

const eventFor = (kind, label, extra = {}) => ({ id: uid('event'), timestamp: nowIso(), kind, label, ...extra })

function withEvent(agent, kind, label, extra = {}) {
  return { ...agent, timeline: [...agent.timeline, eventFor(kind, label, extra)], lastSeen: nowIso() }
}

function transition(agent, nextStatus, label, extra = {}) {
  if (agent.status === nextStatus && !label) return agent
  const previous = agent.status
  return withEvent({ ...agent, status: nextStatus }, extra.kind || 'status', label || `Status changed from ${previous} to ${nextStatus}`, {
    from: previous,
    to: nextStatus,
    ...extra,
  })
}

const STATUS_LABELS = { idle: 'Idle', running: 'Running', paused: 'Paused', error: 'Error', offline: 'Offline' }

function announceStatus(get, agentName, nextStatus, detail = '') {
  const label = STATUS_LABELS[nextStatus] || nextStatus
  const message = detail || `${agentName} status changed to ${label}`
  get().announce(message)
}

function mutationSnapshot(state) {
  return {
    agents: clone(state.agents),
    detailAgentId: state.detailAgentId
  }
}

function mergeAgentsWithCurrentRunState(previousAgents, currentAgents) {
  return previousAgents.map(prev => {
    const current = currentAgents.find(a => a.id === prev.id)
    if (current) {
      return { ...prev, status: current.status, lastSeen: current.lastSeen, timeline: current.timeline, activity: current.activity, run: current.run, runSerial: current.runSerial, failureScenario: current.failureScenario }
    }
    // Agent isn't present in the current state (e.g. it was removed by a
    // later mutation and undo is now restoring it) — the snapshot already
    // carries its full last-known state, so use it as-is instead of
    // dropping down to a bare identity record.
    return prev
  })
}

function restoreImportedRun(agentId, source) {
  if (!source) return null
  const currentStep = Math.max(0, source.steps.findIndex((step) => ['running', 'retrying', 'failed'].includes(step.status)))
  return {
    ...clone(source),
    currentStep,
    serial: 1,
    failureScenario: false,
    steps: source.steps.map((step) => ({ ...step, maxAttempts: 3, ticksRemaining: 2, plannedFailures: 0 })),
  }
}

export const useFleetStore = create((set, get) => ({
  agents: seedAgents(),
  selectedIds: [],
  statusFilters: [],
  timelineFilter: 'all',
  detailAgentId: null,
  detailTab: 0,
  highlightedStepId: null,
  expandedSummaries: {},
  exitingAgentId: null,
  registerLock: false,
  modal: null,
  exportOpen: false,
  exportPreviewText: '',
  exportBaselineSignature: '',
  exportChangeHint: 'First snapshot in this session',
  importOpen: false,
  importDraft: '',
  importError: '',
  paletteOpen: false,
  paletteQuery: '',
  undoStack: [],
  redoStack: [],
  toasts: [],
  announcement: 'Fleet console ready',
  sortDirection: 'asc',
  locale: 'en',
  theme: 'dark',

  addToast: (title, kind = 'success') => {
    const id = uid('toast')
    set((state) => ({ toasts: [...state.toasts, { id, title, kind }] }))
    
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  announce: (announcement) => set({ announcement }),

  openRegister: () => { captureFocus(); set({ modal: { mode: 'register', agentId: null }, paletteOpen: false, exportOpen: false, importOpen: false }) },
  openEdit: (agentId) => { captureFocus(); set({ modal: { mode: 'edit', agentId }, paletteOpen: false, exportOpen: false, importOpen: false }) },
  openRemove: (agentId) => { captureFocus(); set({ modal: { mode: 'remove', agentId }, paletteOpen: false }) },
  closeModal: () => { set({ modal: null }); restoreFocus() },
  selectAgent: (agentId, tab = 0) => set({ detailAgentId: agentId, detailTab: tab, highlightedStepId: null, paletteOpen: false }),
  closeDetail: () => set({ detailAgentId: null, highlightedStepId: null }),
  setDetailTab: (detailTab) => set({ detailTab }),
  highlightStep: (stepId) => set({ highlightedStepId: stepId, detailTab: 2 }),

  registerAgent: (rawPayload) => {
    if (get().registerLock) return { ok: false, error: 'Registration is already in progress' }
    set({ registerLock: true })
    const parsed = createAgentSchema.safeParse(rawPayload)
    if (!parsed.success) { set({ registerLock: false }); return { ok: false, error: parsed.error.issues[0].message } }
    const normalized = parsed.data.name.toLocaleLowerCase()
    if (get().agents.some((agent) => agent.name.toLocaleLowerCase() === normalized)) { set({ registerLock: false }); return { ok: false, error: 'Name must be unique (ignoring letter case)' } }
    const before = mutationSnapshot(get())
    const id = uid('agent')
    const agent = {
      id,
      ...parsed.data,
      status: 'idle',
      lastSeen: nowIso(),
      timeline: [eventFor('status', 'Agent registered as idle', { to: 'idle' })],
      activity: [],
      run: null,
      failureScenario: get().agents.length % 2 === 0,
      runSerial: 0,
      isNew: true,
    }
    set((state) => ({
      agents: [...state.agents.map((item) => ({ ...item, isNew: false })), agent],
      modal: null,
      undoStack: [...state.undoStack, before],
      redoStack: [],
      announcement: `${agent.name} registered with Idle status`,
    }))
    get().addToast(`${agent.name} registered`)
    restoreFocus()
    set({ registerLock: false })
    return { ok: true, agent }
  },

  updateAgent: (agentId, rawPayload) => {
    const current = get().agents.find((agent) => agent.id === agentId)
    if (!current) return { ok: false, error: 'Agent not found' }
    const parsed = createAgentSchema.safeParse(rawPayload)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
    const normalized = parsed.data.name.toLocaleLowerCase()
    if (get().agents.some((agent) => agent.id !== agentId && agent.name.toLocaleLowerCase() === normalized)) return { ok: false, error: 'Name must be unique (ignoring letter case)' }
    const before = mutationSnapshot(get())
    set((state) => ({
      agents: state.agents.map((agent) => agent.id === agentId ? withEvent({ ...agent, ...parsed.data }, 'manual', 'Configuration updated') : agent),
      modal: null,
      undoStack: [...state.undoStack, before],
      redoStack: [],
      announcement: `${parsed.data.name} configuration updated`,
    }))
    get().addToast(`${parsed.data.name} updated`)
    restoreFocus()
    return { ok: true }
  },

  removeAgent: (agentId) => {
    const state = get()
    const target = state.agents.find((agent) => agent.id === agentId)
    if (!target) return false
    if (state.exitingAgentId || pendingRemovalTimer !== null) {
      set({ announcement: 'Another agent removal is already in progress' })
      get().addToast('Another agent removal is already in progress', 'error')
      return false
    }
    set((current) => ({
      agents: current.agents.map((agent) => agent.id === agentId ? { ...agent, isNew: false } : agent),
      exitingAgentId: agentId,
      announcement: `Removing ${target.name}`,
    }))
    pendingRemovalTimer = window.setTimeout(() => {
      pendingRemovalTimer = null
      const current = get()
      const currentTarget = current.agents.find((agent) => agent.id === agentId)
      if (current.exitingAgentId !== agentId || !currentTarget) {
        if (current.exitingAgentId === agentId) set({ exitingAgentId: null })
        return
      }
      const before = mutationSnapshot(current)
      set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== agentId),
        selectedIds: state.selectedIds.filter((id) => id !== agentId),
        detailAgentId: state.detailAgentId === agentId ? null : state.detailAgentId,
        undoStack: [...state.undoStack, before],
        redoStack: [],
        exitingAgentId: null,
        announcement: `${target.name} removed`,
      }))
      get().addToast(`${target.name} removed`)
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 210)
    return true
  },

  undo: () => {
    const state = get()
    if (state.exitingAgentId) {
      if (pendingRemovalTimer !== null) window.clearTimeout(pendingRemovalTimer)
      pendingRemovalTimer = null
      const target = state.agents.find((agent) => agent.id === state.exitingAgentId)
      set({ exitingAgentId: null, announcement: target ? `Removal of ${target.name} canceled` : 'Removal canceled' })
      get().addToast(target ? `Removal of ${target.name} canceled` : 'Removal canceled', 'info')
      return true
    }
    if (!state.undoStack.length) return false
    const previous = state.undoStack.at(-1)
    set({
      agents: mergeAgentsWithCurrentRunState(previous.agents, state.agents),
      detailAgentId: previous.detailAgentId,
      selectedIds: state.selectedIds.filter((id) => previous.agents.some((agent) => agent.id === id)),
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, mutationSnapshot(state)],
      announcement: 'Registry mutation undone',
    })
    get().addToast('Registry mutation undone', 'info')
    return true
  },
  redo: () => {
    const state = get()
    if (state.exitingAgentId) {
      get().addToast('Wait for the current removal to finish', 'info')
      return false
    }
    if (!state.redoStack.length) return false
    const next = state.redoStack.at(-1)
    set({
      agents: mergeAgentsWithCurrentRunState(next.agents, state.agents),
      detailAgentId: next.detailAgentId,
      selectedIds: state.selectedIds.filter((id) => next.agents.some((agent) => agent.id === id)),
      undoStack: [...state.undoStack, mutationSnapshot(state)],
      redoStack: state.redoStack.slice(0, -1),
      announcement: 'Registry mutation redone',
    })
    get().addToast('Registry mutation redone', 'info')
    return true
  },

  toggleSelection: (agentId, checked) => set((state) => ({ selectedIds: checked ? [...new Set([...state.selectedIds, agentId])] : state.selectedIds.filter((id) => id !== agentId) })),
  toggleAllVisible: (ids, checked) => set((state) => ({ selectedIds: checked ? [...new Set([...state.selectedIds, ...ids])] : state.selectedIds.filter((id) => !ids.includes(id)) })),
  setFilters: (statusFilters) => set({ statusFilters }),
  clearFilters: () => set({ statusFilters: [] }),
  setTimelineFilter: (timelineFilter) => set({ timelineFilter }),
  toggleSummary: (agentId, forced) => set((state) => ({ expandedSummaries: { ...state.expandedSummaries, [agentId]: forced ?? !state.expandedSummaries[agentId] } })),
  toggleSort: () => set((state) => ({ sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' })),

  retryAgent: (agentId) => {
    const target = get().agents.find((agent) => agent.id === agentId)
    if (!target || target.status !== 'error') return false
    set((state) => ({
      agents: state.agents.map((agent) => agent.id === agentId && agent.status === 'error' ? transition(agent, 'idle', 'Manual retry cleared the error') : agent),
    }))
    announceStatus(get, target.name, 'idle', `${target.name} error cleared and returned to Idle`)
    get().addToast('Agent returned to idle')
    return true
  },

  startRun: (agentId, forcedFailure = false) => {
    const target = get().agents.find((agent) => agent.id === agentId)
    if (!target || target.status !== 'idle') return false
    const serial = target.runSerial + 1
    const shouldFail = forcedFailure || (target.failureScenario && serial % 2 === 1)
    const run = createRun(agentId, serial, shouldFail, false)
    const activity = { id: uid('activity'), timestamp: nowIso(), label: shouldFail ? 'Execute guarded verification run' : `Execute workspace run ${serial}` }
    set((state) => ({
      agents: state.agents.map((agent) => agent.id === agentId ? transition({ ...agent, run, runSerial: serial, activity: [activity, ...agent.activity] }, 'running', `Run ${serial} started`, { kind: 'run' }) : agent),
      detailAgentId: agentId,
      detailTab: 2,
    }))
    announceStatus(get, target.name, 'running', `${target.name} run started`)
    get().addToast(`${target.name} run started`, 'info')
    return true
  },

  pauseAgent: (agentId, bulk = false) => {
    const target = get().agents.find((agent) => agent.id === agentId)
    if (!target || target.status !== 'running' || !target.run) return false
    const index = target.run.currentStep
    const checkpoint = `Checkpoint saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    set((state) => ({
      agents: state.agents.map((agent) => {
        if (agent.id !== agentId) return agent
        const steps = agent.run.steps.map((step, stepIndex) => stepIndex === index ? { ...step, checkpoint } : step)
        return transition({ ...agent, run: { ...agent.run, status: 'paused', steps } }, 'paused', bulk ? 'Paused by Pause All' : 'Manual pause checkpoint saved', { kind: 'checkpoint', stepId: steps[index]?.id })
      }),
    }))
    announceStatus(get, target.name, 'paused', `${target.name} paused`)
    return true
  },
  resumeAgent: (agentId, bulk = false) => {
    const target = get().agents.find((agent) => agent.id === agentId)
    if (!target || target.status !== 'paused' || !target.run) return false
    set((state) => ({
      agents: state.agents.map((agent) => agent.id === agentId ? transition({ ...agent, run: { ...agent.run, status: 'running' } }, 'running', bulk ? 'Resumed by Resume All' : 'Resumed from checkpoint', { kind: 'checkpoint', stepId: agent.run.steps[agent.run.currentStep]?.id }) : agent),
    }))
    announceStatus(get, target.name, 'running', `${target.name} resumed`)
    return true
  },
  pauseSelected: () => {
    const ids = get().selectedIds.filter((id) => get().agents.find((agent) => agent.id === id)?.status === 'running')
    ids.forEach((id) => get().pauseAgent(id, true))
    if (ids.length) get().addToast(`${ids.length} agent${ids.length === 1 ? '' : 's'} paused`)
  },
  resumeSelected: () => {
    const ids = get().selectedIds.filter((id) => get().agents.find((agent) => agent.id === id)?.status === 'paused')
    ids.forEach((id) => get().resumeAgent(id, true))
    if (ids.length) get().addToast(`${ids.length} agent${ids.length === 1 ? '' : 's'} resumed`)
  },

  manualRetryStep: (agentId) => {
    const target = get().agents.find((agent) => agent.id === agentId)
    if (!target?.run) return false
    const failedIndex = target.run.steps.findIndex((step) => step.status === 'failed')
    if (failedIndex < 0) return false
    set((state) => ({
      agents: state.agents.map((agent) => {
        if (agent.id !== agentId) return agent
        const failed = agent.run.steps[failedIndex]
        const steps = agent.run.steps.map((step, index) => index === failedIndex ? { ...step, status: 'running', attempts: step.attempts + 1, error: undefined, checkpoint: 'Resumed by manual retry', plannedFailures: 0, ticksRemaining: 2, startedAt: nowIso() } : step)
        const updated = { ...agent, run: { ...agent.run, status: 'running', currentStep: failedIndex, steps, endedAt: undefined, duration: undefined } }
        return transition(updated, 'running', `Manual retry started for ${failed.name}`, { kind: 'retry', stepId: failed.id })
      }),
      detailTab: 2,
      highlightedStepId: target.run.steps[failedIndex].id,
      announcement: `Manual retry started for ${target.run.steps[failedIndex].name}`,
    }))
    return true
  },

  tickRuns: () => {
    set((state) => {
      let announcement = state.announcement
      let changed = false
      const agents = state.agents.map((agent) => {
        if (agent.status !== 'running' || !agent.run || agent.run.status !== 'running') return agent
        const run = agent.run
        const index = run.currentStep
        const current = run.steps[index]
        if (!current) return agent
        changed = true
        let steps = run.steps.map((step) => ({ ...step }))
        let updatedAgent = agent
        if (current.status === 'pending') {
          steps[index] = { ...current, status: 'running', attempts: Math.max(1, current.attempts), startedAt: nowIso() }
          updatedAgent = withEvent(agent, 'step', `${current.name} started`, { stepId: current.id })
        } else if (current.status === 'retrying') {
          const remaining = Math.max(0, (current.backoffRemaining || 0) - 1)
          if (remaining === 0) {
            steps[index] = { ...current, status: 'running', attempts: current.attempts + 1, backoffRemaining: undefined, ticksRemaining: 2, startedAt: nowIso() }
            updatedAgent = withEvent(agent, 'retry', `Retry attempt ${current.attempts + 1} of ${current.maxAttempts} started`, { stepId: current.id })
          } else {
            steps[index] = { ...current, backoffRemaining: remaining }
          }
        } else if (current.status === 'running' && current.ticksRemaining > 0) {
          steps[index] = { ...current, ticksRemaining: current.ticksRemaining - 1 }
        } else if (current.status === 'running' && current.plannedFailures > 0) {
          if (current.attempts < current.maxAttempts) {
            const backoff = 3 + ((run.serial + index + current.attempts) % 3)
            steps[index] = { ...current, status: 'retrying', plannedFailures: current.plannedFailures - 1, error: 'Verification command returned exit code 1', backoffRemaining: backoff }
            updatedAgent = withEvent(agent, 'retry', `${current.name} failed; waiting ${backoff}s before retry ${current.attempts + 1} of ${current.maxAttempts}`, { stepId: current.id })
          } else {
            steps[index] = { ...current, status: 'failed', plannedFailures: current.plannedFailures - 1, error: 'Verification failed after 3 automatic attempts' }
            const failedRun = { ...run, status: 'failed', steps }
            updatedAgent = transition(withEvent({ ...agent, run: failedRun }, 'step', `${current.name} exhausted automatic retries`, { stepId: current.id }), 'error', 'Run stopped after retry exhaustion', { kind: 'error', stepId: current.id })
            announcement = `${agent.name} run requires a manual retry`
            return updatedAgent
          }
        } else if (current.status === 'running') {
          const completedAt = nowIso()
          steps[index] = { ...current, status: 'complete', completedAt, output: `${current.name} completed successfully`, error: undefined, checkpoint: current.checkpoint }
          const progressComplete = run.progressComplete + 1
          updatedAgent = withEvent(agent, 'step', `${current.name} completed`, { stepId: current.id })
          if (progressComplete === run.progressTotal) {
            const duration = Math.max(1, Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000))
            const completedRun = { ...run, status: 'complete', steps, progressComplete, endedAt: completedAt, duration }
            updatedAgent = transition({ ...updatedAgent, run: completedRun }, 'idle', `Run completed in ${duration}s`, { kind: 'run', stepId: current.id })
            announcement = `${agent.name} run completed in ${duration}s`
            return updatedAgent
          }
          const nextIndex = index + 1
          steps[nextIndex] = { ...steps[nextIndex], status: 'running', attempts: 1, startedAt: nowIso() }
          updatedAgent = withEvent(updatedAgent, 'step', `${steps[nextIndex].name} started`, { stepId: steps[nextIndex].id })
          return { ...updatedAgent, run: { ...run, steps, currentStep: nextIndex, progressComplete } }
        }
        return { ...updatedAgent, run: { ...run, steps } }
      })
      return changed ? { agents, announcement } : {}
    })
  },

  openExport: () => {
    captureFocus()
    const text = JSON.stringify(compileSnapshot(get().agents), null, 2)
    const signature = JSON.stringify(compileSnapshot(get().agents, 'session-baseline'))
    const previous = get().exportBaselineSignature
    set({
      exportOpen: true,
      exportPreviewText: text,
      exportBaselineSignature: signature,
      exportChangeHint: previous ? (previous === signature ? 'No registry changes since the last export' : 'Registry changes detected since the last export') : 'First snapshot in this session',
      paletteOpen: false,
      importOpen: false,
      modal: null,
    })
  },
  closeExport: () => { set({ exportOpen: false }); restoreFocus() },
  refreshExport: () => {
    if (get().exportOpen) {
      const signature = JSON.stringify(compileSnapshot(get().agents, 'session-baseline'))
      set({
        exportPreviewText: JSON.stringify(compileSnapshot(get().agents), null, 2),
        exportChangeHint: signature === get().exportBaselineSignature ? get().exportChangeHint : 'Live preview updated after registry changes',
      })
    }
  },
  copyExport: async (visibleText) => {
    const text = visibleText || get().exportPreviewText || JSON.stringify(compileSnapshot(get().agents), null, 2)
    try {
      await navigator.clipboard.writeText(text)
      get().addToast('Fleet JSON copied')
      set({ announcement: 'Fleet JSON copied to clipboard' })
      return true
    } catch {
      get().addToast('Clipboard access was unavailable', 'error')
      return false
    }
  },
  downloadExport: (visibleText) => {
    const text = visibleText || get().exportPreviewText || JSON.stringify(compileSnapshot(get().agents), null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `fleet-snapshot-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
  openImport: () => { captureFocus(); set({ importOpen: true, importError: '', paletteOpen: false, exportOpen: false, modal: null }) },
  closeImport: () => { set({ importOpen: false, importError: '' }); restoreFocus() },
  setImportDraft: (importDraft) => set({ importDraft }),
  importFleet: (snapshot) => {
    const parsed = fleetSnapshotSchema.safeParse(snapshot)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      set({ importError: `${issue.path.join('.') || 'Import'}: ${issue.message}` })
      return { ok: false }
    }
    const before = mutationSnapshot(get())
    const imported = parsed.data.agents.map((agent, index) => {
      const id = uid(`imported-${index}`)
      return {
        id,
        name: agent.name,
        agentType: agent.agentType,
        editorIntegration: agent.editorIntegration,
        accessKey: agent.accessKey,
        status: agent.status,
        lastSeen: agent.lastSeen,
        timeline: clone(agent.timeline),
        activity: [],
        run: restoreImportedRun(id, agent.run),
        failureScenario: false,
        runSerial: agent.run ? 1 : 0,
        isNew: false,
      }
    })
    set((state) => ({
      agents: imported,
      selectedIds: [],
      detailAgentId: null,
      importOpen: false,
      importDraft: '',
      importError: '',
      undoStack: [...state.undoStack, before],
      redoStack: [],
      announcement: `${imported.length} agents imported`,
    }))
    get().addToast(`${imported.length} agents imported`)
    restoreFocus()
    return { ok: true }
  },

  openPalette: () => { captureFocus(); set({ paletteOpen: true, paletteQuery: '', modal: null, exportOpen: false, importOpen: false }) },
  dismissPalette: () => set({ paletteOpen: false, paletteQuery: '' }),
  closePalette: () => { set({ paletteOpen: false, paletteQuery: '' }); restoreFocus() },
  setPaletteQuery: (paletteQuery) => set({ paletteQuery }),
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
}))

export function agentByNameOrId(value) {
  const agents = useFleetStore.getState().agents
  return agents.find((agent) => agent.id === value || agent.name.toLocaleLowerCase() === String(value).toLocaleLowerCase())
}

export { STATUSES }
