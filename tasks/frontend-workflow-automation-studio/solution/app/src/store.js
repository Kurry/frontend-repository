import { create } from 'zustand'
import { makeId, seededHtml, seededScripts } from './data'
import { emptyParams, paramSchemas, validateStep } from './schemas'

const clone = value => structuredClone(value)
const snapshot = state => ({ scripts: clone(state.scripts), selectedScriptId: state.selectedScriptId })
let engineToken = 0

const isoNow = () => new Date().toISOString()
const renumber = steps => steps.map((step, index) => ({ ...step, order: index + 1 }))
const statusLabel = status => ({ pass: 'Pass', fail: 'Fail', skipped: 'Skipped', running: 'Running', retrying: 'Retrying', paused: 'Paused', pending: 'Pending' }[status] || status)

function applyCommit(set, get, label, recipe) {
  const before = snapshot(get())
  const draft = clone(before)
  recipe(draft)
  const after = clone(draft)
  const actions = get().editActions.slice(0, get().historyCursor)
  const action = { id: makeId('action'), label, timestamp: isoNow(), before, after }
  set({ ...after, editActions: [...actions, action].slice(-40), historyCursor: Math.min(actions.length + 1, 40), selectedSteps: [], selectedScripts: [] })
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function runDelay(get, token, ms) {
  let remaining = ms
  while (remaining > 0) {
    if (token !== engineToken) return false
    while (get().liveRun?.status === 'paused') {
      await wait(80)
      if (token !== engineToken) return false
    }
    const slice = Math.min(remaining, 80)
    await wait(slice)
    remaining -= slice
  }
  return token === engineToken
}

function addConsole(set, get, level, text, stepId, extra = {}) {
  const line = { id: makeId('line'), timestamp: isoNow(), level, text, stepId, ...extra }
  set({ consoleLines: [...get().consoleLines, line].slice(-500) })
}

function addEvent(set, get, step, status, label) {
  const live = get().liveRun
  if (!live) return
  const event = { id: makeId('event'), stepId: step?.id || null, step: step?.order || 0, status, timestamp: isoNow(), label }
  set({ liveRun: { ...live, timeline: [...live.timeline, event] } })
}

function finishRun(set, get, runStatus = 'pass') {
  const state = get()
  const live = state.liveRun
  const script = state.scripts.find(s => s.id === live?.scriptId)
  if (!live || !script) return
  const results = script.steps.map(step => live.stepResults[step.id]).filter(Boolean)
  const totals = {
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    retries: live.retryCount,
  }
  const duration = Math.max(1, Date.now() - Date.parse(live.start_time))
  const record = {
    id: live.id, number: script.runs.length + (script.runs.some(r => r.id === live.id) ? 0 : 1), trigger: live.trigger,
    start_time: live.start_time, duration, status: runStatus, totals, steps: results,
    extractedValues: results.filter(r => r.extracted_name).map(r => ({ variable: r.extracted_name, value: r.extracted_value, step: r.order })),
    timeline: live.timeline,
  }
  const scripts = clone(state.scripts)
  const target = scripts.find(s => s.id === script.id)
  const existing = target.runs.findIndex(r => r.id === record.id)
  if (existing >= 0) target.runs[existing] = record
  else target.runs.push(record)
  target.lastRunStatus = runStatus
  target.lastRunAt = isoNow()
  set({
    scripts,
    liveRun: { ...live, status: runStatus === 'fail' ? 'failed' : 'complete', finishedAt: isoNow(), totals },
    announcement: runStatus === 'fail' ? 'Run failed. Retry is available.' : `Run complete. ${totals.passed} of ${script.steps.length} steps passed.`,
  })
  if (runStatus === 'pass' && totals.failed === 0 && totals.passed > 0) {
    get().toastMessage(`All ${totals.passed} steps passed — great run!`)
  }
}

async function executeRun(set, get, token, startIndex = 0, forceCurrentPass = false) {
  const initial = get().liveRun
  const script = get().scripts.find(s => s.id === initial?.scriptId)
  if (!initial || !script) return
  for (let index = startIndex; index < script.steps.length; index++) {
    if (token !== engineToken) return
    const step = script.steps[index]
    if (step.disabled) {
      const result = { stepId: step.id, order: step.order, type: step.type, label: step.label, status: 'skipped', attempts: 0, timestamp: isoNow() }
      const live = get().liveRun
      set({ liveRun: { ...live, currentIndex: index, currentStepId: step.id, stepResults: { ...live.stepResults, [step.id]: result } } })
      addEvent(set, get, step, 'skipped', `${step.label}: Skipped`)
      addConsole(set, get, 'skipped', `[${step.type}] ${step.label} — Skipped`, step.id)
      continue
    }

    let passed = false
    let lastError = ''
    for (let attempt = 1; attempt <= 3; attempt++) {
      const live = get().liveRun
      set({ liveRun: { ...live, status: 'running', currentIndex: index, currentStepId: step.id, attempt, countdown: null,
        stepResults: { ...live.stepResults, [step.id]: { stepId: step.id, order: step.order, type: step.type, label: step.label, status: 'running', attempts: attempt, timestamp: isoNow() } } } })
      addEvent(set, get, step, 'running', `${step.label}: Running (attempt ${attempt})`)
      addConsole(set, get, 'running', `[${step.type}] ${step.label} — attempt ${attempt}`, step.id)
      if (!(await runDelay(get, token, step.type === 'wait' ? Math.min(Number(step.params.ms) || 300, 900) : 240))) return

      const invalid = !paramSchemas[step.type].safeParse(step.params).success
      const forcedFailure = String(step.params.selector || '').includes('missing') || String(step.params.expected_text || '').toLowerCase().includes('force fail')
      const failed = invalid || forcedFailure
      if (!failed) {
        passed = true
        const value = step.type === 'extract' ? `${step.params.variable}_${Math.random().toString(36).slice(2, 8)}` : undefined
        const result = { stepId: step.id, order: step.order, type: step.type, label: step.label, status: 'pass', attempts: attempt, timestamp: isoNow(),
          ...(value ? { extracted_name: step.params.variable, extracted_value: value } : {}) }
        const current = get().liveRun
        set({ liveRun: { ...current, stepResults: { ...current.stepResults, [step.id]: result } } })
        addEvent(set, get, step, 'pass', `${step.label}: Pass`)
        addConsole(set, get, 'pass', `[${step.type}] ${step.label} — Pass${value ? ` · ${step.params.variable}=${value}` : ''}`, step.id, step.type === 'screenshot' ? { screenshot: true, screenshotLabel: step.label } : {})
        break
      }

      const errors = validateStep(step)
      lastError = Object.values(errors)[0] || `Element ${step.params.selector || step.label} did not reach the expected state`
      if (attempt < 3) {
        const current = get().liveRun
        set({ liveRun: { ...current, status: 'retrying', retryCount: current.retryCount + 1, countdown: 2 } })
        addEvent(set, get, step, 'retrying', `${step.label}: Retrying — attempt ${attempt + 1} of 3`)
        addConsole(set, get, 'retrying', `[${step.type}] ${step.label} — Retrying; attempt ${attempt + 1} of 3`, step.id)
        for (let countdown = 2; countdown > 0; countdown--) {
          const retryLive = get().liveRun
          set({ liveRun: { ...retryLive, countdown } })
          if (!(await runDelay(get, token, 300))) return
        }
      }
    }

    if (!passed) {
      const current = get().liveRun
      const result = { stepId: step.id, order: step.order, type: step.type, label: step.label, status: 'fail', attempts: 3, timestamp: isoNow(), error_reason: lastError }
      set({ liveRun: { ...current, status: 'failed', failedIndex: index, countdown: null, stepResults: { ...current.stepResults, [step.id]: result } }, announcement: `Step ${step.order} failed. ${lastError}` })
      addEvent(set, get, step, 'fail', `${step.label}: Fail — ${lastError}`)
      addConsole(set, get, 'fail', `[${step.type}] ${step.label} — Fail · ${lastError}`, step.id)
      finishRun(set, get, 'fail')
      return
    }
  }
  finishRun(set, get, 'pass')
}

export const enabledSteps = script => script?.steps.filter(step => !step.disabled) ?? []

export const useStudio = create((set, get) => ({
  scripts: clone(seededScripts), selectedScriptId: seededScripts[0].id, view: 'step-editor', sidebarOpen: false,
  selectedScripts: [], selectedSteps: [], selectedRuns: [], selectedVersion: null,
  editActions: [], historyCursor: 0, historyOpen: false, creatingScript: false,
  paletteOpen: false, paletteQuery: '', paletteIndex: 0,
  consoleTheme: 'Midnight', consoleFollowing: true, consoleLines: [], liveRun: null,
  timelineFilter: 'all', highlightedStepId: null,
  playgroundHtml: seededHtml, playgroundSelector: '.partner', playgroundMatches: 2, playgroundError: '', playgroundTargetStep: '',
  exportTab: 'definition', copied: false, screenshotModal: null, newScriptModal: false, scheduleOpen: false,
  toast: null, announcement: '',

  selectedScript: () => get().scripts.find(s => s.id === get().selectedScriptId),
  setView: view => set({ view, sidebarOpen: false }),
  selectScript: id => {
    if (!get().scripts.some(s => s.id === id)) return
    set({ selectedScriptId: id, selectedVersion: null, selectedSteps: [], highlightedStepId: null, sidebarOpen: false })
  },
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setUi: values => set(values),
  toastMessage: message => { set({ toast: { id: makeId('toast'), message } }); setTimeout(() => set({ toast: null }), 2600) },

  createScript: payload => {
    if (get().creatingScript) return null
    set({ creatingScript: true })
    const id = makeId('script')
    applyCommit(set, get, `Created script “${payload.name}”`, draft => {
      draft.scripts.push({
        id, name: payload.name.trim(), target_url: payload.target_url, description: payload.description || '',
        steps: [{ id: makeId('step'), order: 1, type: 'click', label: 'New click step', params: { selector: '' }, disabled: false }],
        version: 1, unsaved: true, versions: [], runs: [], schedule: { enabled: false, time: '09:00', interval: 'daily' }, lastRunStatus: null, lastRunAt: null,
      })
      draft.selectedScriptId = id
    })
    set({ creatingScript: false, newScriptModal: false, view: 'step-editor' })
    return id
  },
  toggleScriptSelection: id => set(s => ({ selectedScripts: s.selectedScripts.includes(id) ? s.selectedScripts.filter(x => x !== id) : [...s.selectedScripts, id] })),
  duplicateSelectedScripts: () => {
    const ids = get().selectedScripts
    if (!ids.length) return
    applyCommit(set, get, `Duplicated ${ids.length} script${ids.length === 1 ? '' : 's'}`, draft => {
      ids.forEach(id => {
        const source = draft.scripts.find(s => s.id === id)
        if (!source) return
        const copy = clone(source); copy.id = makeId('script'); copy.name = `${source.name} Copy`; copy.runs = []; copy.schedule = { enabled: false, time: '09:00', interval: 'daily' }; copy.lastRunStatus = null; copy.lastRunAt = null
        copy.steps = copy.steps.map(s => ({ ...s, id: makeId('step') })); copy.versions = []
        draft.scripts.push(copy)
      })
    })
    get().toastMessage(`Duplicated ${ids.length} script${ids.length === 1 ? '' : 's'}`)
  },
  deleteScripts: ids => {
    if (!ids.length) return
    const liveScriptId = get().liveRun?.scriptId
    applyCommit(set, get, `Deleted ${ids.length} script${ids.length === 1 ? '' : 's'}`, draft => {
      draft.scripts = draft.scripts.filter(s => !ids.includes(s.id))
      if (ids.includes(draft.selectedScriptId)) draft.selectedScriptId = draft.scripts[0]?.id ?? null
    })
    const patch = {}
    if (ids.includes(liveScriptId)) {
      engineToken += 1
      patch.liveRun = null
      patch.consoleLines = []
    }
    if (Object.keys(patch).length) set(patch)
    get().toastMessage(`Deleted ${ids.length} script${ids.length === 1 ? '' : 's'} and related run data`)
  },
  updateScriptMeta: (property, value) => {
    const id = get().selectedScriptId
    applyCommit(set, get, `Updated script ${property}`, draft => {
      const script = draft.scripts.find(s => s.id === id); if (script) { script[property] = value; script.unsaved = true }
    })
  },
  addStep: type => {
    const id = get().selectedScriptId; const chosen = type || 'click'
    applyCommit(set, get, `Added ${chosen.replace('_', ' ')} step`, draft => {
      const script = draft.scripts.find(s => s.id === id); if (!script) return
      script.steps.push({ id: makeId('step'), order: script.steps.length + 1, type: chosen, label: `New ${chosen.replace('_', ' ')} step`, params: emptyParams(chosen), disabled: false }); script.unsaved = true
    })
  },
  updateStep: (stepId, property, value) => {
    const id = get().selectedScriptId
    applyCommit(set, get, `Updated step ${property.replace('_', ' ')}`, draft => {
      const script = draft.scripts.find(s => s.id === id); const step = script?.steps.find(s => s.id === stepId); if (!step) return
      if (property === 'type') { step.type = value; step.params = emptyParams(value); step.label = `New ${value.replace('_', ' ')} step` }
      else if (property === 'label' || property === 'disabled') step[property] = value
      else step.params[property] = value
      script.unsaved = true
    })
  },
  reorderSteps: (activeId, overId) => {
    const id = get().selectedScriptId; if (activeId === overId) return
    applyCommit(set, get, 'Reordered steps', draft => {
      const script = draft.scripts.find(s => s.id === id); if (!script) return
      const oldIndex = script.steps.findIndex(s => s.id === activeId); const newIndex = script.steps.findIndex(s => s.id === overId); if (oldIndex < 0 || newIndex < 0) return
      const [moved] = script.steps.splice(oldIndex, 1); script.steps.splice(newIndex, 0, moved); script.steps = renumber(script.steps); script.unsaved = true
    })
  },
  deleteSteps: ids => {
    const scriptId = get().selectedScriptId; if (!ids.length) return
    applyCommit(set, get, `Deleted ${ids.length} step${ids.length === 1 ? '' : 's'}`, draft => {
      const script = draft.scripts.find(s => s.id === scriptId); if (!script) return
      script.steps = renumber(script.steps.filter(s => !ids.includes(s.id))); script.unsaved = true
    })
  },
  duplicateSteps: ids => {
    const scriptId = get().selectedScriptId; if (!ids.length) return
    applyCommit(set, get, `Duplicated ${ids.length} step${ids.length === 1 ? '' : 's'}`, draft => {
      const script = draft.scripts.find(s => s.id === scriptId); if (!script) return
      const copies = script.steps.filter(s => ids.includes(s.id)).map(s => ({ ...clone(s), id: makeId('step'), label: `${s.label} Copy` }))
      script.steps = renumber([...script.steps, ...copies]); script.unsaved = true
    })
  },
  setStepsDisabled: (ids, disabled) => {
    const scriptId = get().selectedScriptId; if (!ids.length) return
    applyCommit(set, get, `${disabled ? 'Disabled' : 'Enabled'} ${ids.length} step${ids.length === 1 ? '' : 's'}`, draft => {
      const script = draft.scripts.find(s => s.id === scriptId); if (!script) return
      script.steps.forEach(s => { if (ids.includes(s.id)) s.disabled = disabled }); script.unsaved = true
    })
  },
  toggleStepSelection: id => set(s => ({ selectedSteps: s.selectedSteps.includes(id) ? s.selectedSteps.filter(x => x !== id) : [...s.selectedSteps, id] })),

  saveVersion: () => {
    const id = get().selectedScriptId
    applyCommit(set, get, 'Saved a new version', draft => {
      const script = draft.scripts.find(s => s.id === id); if (!script) return
      script.version += 1; script.unsaved = false; script.versions.unshift({ number: script.version, timestamp: isoNow(), steps: clone(script.steps) })
    })
    get().toastMessage('Version saved')
  },
  previewVersion: number => set({ selectedVersion: number }),
  restoreVersion: number => {
    const id = get().selectedScriptId
    applyCommit(set, get, `Restored version ${number}`, draft => {
      const script = draft.scripts.find(s => s.id === id); const version = script?.versions.find(v => v.number === number); if (!script || !version) return
      script.steps = clone(version.steps); script.version += 1; script.unsaved = false; script.versions.unshift({ number: script.version, timestamp: isoNow(), steps: clone(script.steps) })
    })
    set({ selectedVersion: null }); get().toastMessage(`Version ${number} restored as a new version`)
  },
  updateSchedule: schedule => {
    const id = get().selectedScriptId
    applyCommit(set, get, schedule.enabled ? 'Enabled schedule' : 'Disabled schedule', draft => {
      const script = draft.scripts.find(s => s.id === id); if (script) script.schedule = clone(schedule)
    })
    set({ scheduleOpen: false }); get().toastMessage(schedule.enabled ? 'Schedule enabled' : 'Schedule disabled')
  },

  undo: () => {
    const cursor = get().historyCursor; if (!cursor) return
    const action = get().editActions[cursor - 1]; set({ ...clone(action.before), historyCursor: cursor - 1, selectedSteps: [], selectedScripts: [] })
  },
  redo: () => {
    const cursor = get().historyCursor; const actions = get().editActions; if (cursor >= actions.length) return
    set({ ...clone(actions[cursor].after), historyCursor: cursor + 1, selectedSteps: [], selectedScripts: [] })
  },
  rollbackTo: index => {
    const actions = get().editActions; if (index < 0 || index >= actions.length) return
    set({ ...clone(actions[index].after), historyCursor: index + 1, selectedSteps: [], selectedScripts: [] })
  },

  startRun: (scriptId = get().selectedScriptId, trigger = 'manual') => {
    const active = get().liveRun
    if (active && ['running', 'paused', 'retrying'].includes(active.status)) return false
    const script = get().scripts.find(s => s.id === scriptId)
    if (!script || !script.steps.length) return false
    engineToken += 1
    const token = engineToken
    const id = makeId('run')
    set({
      selectedScriptId: scriptId,
      view: 'step-editor',
      selectedVersion: null,
      consoleLines: [],
      consoleFollowing: true,
      timelineFilter: 'all',
      liveRun: {
        id, scriptId, trigger, start_time: isoNow(), status: 'running', currentIndex: 0, currentStepId: null,
        attempt: 0, retryCount: 0, stepResults: {}, timeline: [], totals: { passed: 0, failed: 0, skipped: 0, retries: 0 },
      },
      announcement: `Run started for ${script.name}`,
    })
    addConsole(set, get, 'system', `Run ${id} started · ${trigger} trigger`, null)
    void executeRun(set, get, token)
    return true
  },
  pauseRun: () => {
    const live = get().liveRun; if (!live || !['running', 'retrying'].includes(live.status)) return
    set({ liveRun: { ...live, status: 'paused', pausedFrom: live.status }, announcement: 'Run paused' })
    const script = get().scripts.find(s => s.id === live.scriptId); const step = script?.steps[live.currentIndex]
    addEvent(set, get, step, 'paused', 'Run paused')
    addConsole(set, get, 'paused', `Run paused at step ${live.currentIndex + 1}`, step?.id)
  },
  resumeRun: () => {
    const live = get().liveRun; if (!live || live.status !== 'paused') return
    set({ liveRun: { ...live, status: live.pausedFrom || 'running' }, announcement: 'Run resumed' })
    const script = get().scripts.find(s => s.id === live.scriptId); const step = script?.steps[live.currentIndex]
    addEvent(set, get, step, 'running', 'Run resumed')
    addConsole(set, get, 'system', `Run resumed at step ${live.currentIndex + 1}`, step?.id)
  },
  retryFailed: () => {
    const live = get().liveRun; if (!live || live.status !== 'failed') return
    engineToken += 1; const token = engineToken
    set({ liveRun: { ...live, status: 'running', retryCount: live.retryCount + 1 }, announcement: 'Retry started' })
    const script = get().scripts.find(s => s.id === live.scriptId); const step = script?.steps[live.failedIndex]
    addEvent(set, get, step, 'retrying', 'Manual retry started')
    executeRun(set, get, token, live.failedIndex, true)
  },
  restartRun: () => { const live = get().liveRun; if (live) { engineToken += 1; setTimeout(() => get().startRun(live.scriptId, live.trigger), 0) } },

  setTimelineFilter: filter => set({ timelineFilter: filter }),
  highlightStep: id => set({ highlightedStepId: id, selectedVersion: null }),
  setConsoleTheme: theme => set({ consoleTheme: theme }),
  setConsoleFollowing: value => set({ consoleFollowing: value }),
  setPlayground: values => set(values),
  sendSelectorToStep: stepId => {
    const selector = get().playgroundSelector; if (!selector) return
    get().updateStep(stepId, 'selector', selector); set({ view: 'step-editor', highlightedStepId: stepId }); get().toastMessage('Selector sent to step')
  },
  selectRun: id => set({ selectedRuns: get().selectedRuns.includes(id) ? get().selectedRuns.filter(x => x !== id) : [...get().selectedRuns.slice(-1), id] }),
}))

export const getSelectedScript = state => state.scripts.find(s => s.id === state.selectedScriptId)
export const getRunRollup = state => {
  const results = Object.values(state.liveRun?.stepResults || {})
  return { passed: results.filter(r => r.status === 'pass').length, failed: results.filter(r => r.status === 'fail').length, skipped: results.filter(r => r.status === 'skipped').length, retries: state.liveRun?.retryCount || 0 }
}
export { statusLabel }
