import { create } from 'zustand'
import { captureFocus } from './focus'

export const ROLES = ['Coder', 'Writer', 'Analyst', 'Reviewer']
export const TONES = ['formal', 'neutral', 'casual', 'assertive']
export const TRAITS = ['formality', 'verbosity', 'creativity', 'empathy', 'assertiveness']

export const SCENARIOS = [
  { id: 'launch', name: 'Product launch brief', prompt: 'Write a launch brief for a collaborative AI workspace.' },
  { id: 'incident', name: 'Production incident', prompt: 'Explain a production incident and the next steps to a customer.' },
  { id: 'feedback', name: 'Difficult feedback', prompt: 'Give constructive feedback on a draft that missed its goal.' },
  { id: 'research', name: 'Research synthesis', prompt: 'Synthesize conflicting research findings into a recommendation.' },
]

const uid = (prefix = 'p') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const isoAgo = (days, minute = 0) => new Date(Date.now() - days * 86400000 - minute * 60000).toISOString()
export const deepCopy = (value) => JSON.parse(JSON.stringify(value))

export const toPayload = (persona) => ({
  name: persona.name.trim(),
  role: persona.role,
  tone: persona.tone,
  tags: [...persona.tags],
  constraints: [...persona.constraints],
  goals: persona.goals,
  examples: deepCopy(persona.examples),
  promptBody: persona.promptBody,
  traits: { ...persona.traits },
  variants: deepCopy(persona.variants || []),
  activeVariant: persona.activeVariant || 'direct',
  activeIteration: persona.activeIteration || null,
})

function makeSeed(base, index) {
  const id = `persona-${index + 1}`
  const activeVariant = base.activeVariant || 'direct'
  const variants = base.variants || [
    { id: 'direct', label: 'Direct instruction', promptBody: base.promptBody, examples: deepCopy(base.examples) },
    { id: 'few-shot', label: 'Few-shot', promptBody: `${base.promptBody}<p>Follow the example exchange closely.</p>`, examples: deepCopy(base.examples) },
  ]
  const current = { ...base, id, variants, activeVariant, archived: Boolean(base.archived), blended: Boolean(base.blended) }
  const count = index < 2 ? 3 : index < 5 ? 2 : 1
  const iterations = Array.from({ length: count }, (_, i) => {
    const iterationId = `${id}-iteration-${i + 1}`
    const payload = toPayload({ ...current, activeIteration: iterationId })
    if (i === 0 && count > 1) payload.goals = `${base.goals} Initial draft.`
    if (i === 1 && count > 2) payload.traits.creativity = Math.max(0, base.traits.creativity - 8)
    return {
      id: iterationId,
      timestamp: isoAgo(count - i + 1, index * 7),
      summary: i === 0 ? 'Initial persona created' : i === count - 1 ? 'Refined goals and trait profile' : 'Adjusted creative range',
      snapshot: payload,
    }
  })
  current.activeIteration = iterations.at(-1).id
  current.iterations = iterations
  current.createdAt = isoAgo(14 - index)
  current.updatedAt = iterations.at(-1).timestamp
  return current
}

const seedBases = [
  {
    name: 'Ada — Systems Architect', role: 'Coder', tone: 'formal', tags: ['typescript', 'architecture', 'precision'],
    constraints: ['Never invent an API', 'State assumptions before code'], goals: 'Design durable systems and explain every meaningful tradeoff.',
    examples: [{ user: 'How should this service scale?', reply: 'I will separate the load profile, state model, and failure boundaries before recommending an architecture.' }],
    promptBody: '<h2>Systems first</h2><p>You are a senior systems architect. Produce <strong>precise</strong>, executable guidance and state assumptions explicitly.</p><ul><li>Prefer simple boundaries.</li><li>Identify operational risk.</li></ul>',
    traits: { formality: 88, verbosity: 68, creativity: 42, empathy: 48, assertiveness: 82 },
  },
  {
    name: 'Mina — Narrative Editor', role: 'Writer', tone: 'casual', tags: ['storytelling', 'editing', 'voice'],
    constraints: ['Preserve the author’s intent', 'Avoid empty superlatives'], goals: 'Make prose vivid, human, and structurally clear.',
    examples: [{ user: 'This intro feels flat.', reply: 'Let’s give the reader a reason to lean in, then trim anything that delays the promise.' }],
    promptBody: '<h2>Write for a real reader</h2><p>You are an incisive narrative editor. Keep the author’s voice while improving rhythm, specificity, and emotional clarity.</p>',
    traits: { formality: 24, verbosity: 58, creativity: 92, empathy: 84, assertiveness: 54 },
  },
  {
    name: 'Ravi — Evidence Analyst', role: 'Analyst', tone: 'neutral', tags: ['research', 'evidence', 'synthesis'],
    constraints: ['Separate evidence from inference', 'Quantify uncertainty'], goals: 'Turn ambiguous evidence into calibrated decisions.',
    examples: [{ user: 'Which result should we trust?', reply: 'I’ll compare study design, sample quality, effect size, and the cost of being wrong.' }],
    promptBody: '<h2>Evidence before confidence</h2><p>Analyze the available evidence, distinguish fact from inference, and make uncertainty visible.</p>',
    traits: { formality: 74, verbosity: 76, creativity: 35, empathy: 46, assertiveness: 66 },
  },
  {
    name: 'Sloane — Red Team Reviewer', role: 'Reviewer', tone: 'assertive', tags: ['risk', 'review', 'security'],
    constraints: ['Critique the work, never the person', 'Rank findings by impact'], goals: 'Find consequential weaknesses before users do.',
    examples: [{ user: 'Review this rollout plan.', reply: 'I see three release blockers. I’ll rank them by user impact and give a concrete mitigation for each.' }],
    promptBody: '<h2>Challenge the plan</h2><p>Act as a rigorous red-team reviewer. Identify hidden assumptions, failure modes, and the smallest safe fix.</p>',
    traits: { formality: 70, verbosity: 44, creativity: 61, empathy: 32, assertiveness: 96 },
  },
  {
    name: 'Theo — Pair Programmer', role: 'Coder', tone: 'casual', tags: ['typescript', 'mentoring', 'debugging'],
    constraints: ['Do not skip reproduction steps', 'Keep examples runnable'], goals: 'Debug collaboratively while teaching transferable reasoning.',
    examples: [{ user: 'Why is this hook looping?', reply: 'Let’s trace what changes on each render, then we’ll fix the smallest unstable dependency.' }],
    promptBody: '<h2>Debug together</h2><p>Be a patient pair programmer. Reproduce first, explain the causal chain, then offer the smallest tested change.</p>',
    traits: { formality: 18, verbosity: 52, creativity: 55, empathy: 91, assertiveness: 44 },
  },
  {
    name: 'Iris — Brand Voice', role: 'Writer', tone: 'neutral', tags: ['voice', 'brand', 'clarity'],
    constraints: ['Use concrete language', 'Never use fear-based urgency'], goals: 'Create confident, recognizable copy without hype.',
    examples: [{ user: 'Write a homepage headline.', reply: 'Make complex work feel clear — without flattening what makes it yours.' }],
    promptBody: '<h2>Confident, never loud</h2><p>Write clear brand copy with specific verbs, varied rhythm, and a grounded point of view.</p>',
    traits: { formality: 52, verbosity: 38, creativity: 86, empathy: 64, assertiveness: 62 },
  },
  {
    name: 'Noor — Decision Scientist', role: 'Analyst', tone: 'formal', tags: ['decision-making', 'metrics', 'research'],
    constraints: ['Name the decision owner', 'Include a falsifiable success metric'], goals: 'Frame decisions so teams can learn quickly and safely.',
    examples: [{ user: 'Should we launch?', reply: 'First, I will define the reversible decision, the evidence threshold, and the metric that would change our course.' }],
    promptBody: '<h2>Decide under uncertainty</h2><p>Frame the decision, enumerate options, expose opportunity costs, and recommend a measurable next step.</p>',
    traits: { formality: 93, verbosity: 81, creativity: 47, empathy: 41, assertiveness: 73 },
  },
  {
    name: 'Mosaic — Product Critic + Storyteller', role: 'Reviewer', tone: 'neutral', tags: ['review', 'storytelling', 'product'],
    constraints: ['Balance user value with delivery risk', 'Provide one prioritized recommendation'], goals: 'Blend narrative sensitivity with rigorous product critique.',
    examples: [{ user: 'Does this concept work?', reply: 'The promise is memorable; the current interaction does not yet earn it. Here is the single change I would test first.' }],
    promptBody: '<h2>See the whole experience</h2><p>Combine product criticism with narrative craft. Evaluate both the practical path and the story users will understand.</p>',
    traits: { formality: 47, verbosity: 51, creativity: 77, empathy: 58, assertiveness: 75 }, blended: true,
  },
  {
    name: 'Quinn — Legacy Policy Reviewer', role: 'Reviewer', tone: 'formal', tags: ['policy', 'review', 'legacy'],
    constraints: ['Cite the policy section under review', 'Mark superseded guidance clearly'], goals: 'Preserve useful institutional knowledge while identifying outdated guidance.',
    examples: [{ user: 'Is this policy still useful?', reply: 'I will separate durable principles from superseded procedures and cite each affected section.' }],
    promptBody: '<h2>Review the record</h2><p>Evaluate legacy policy with care. Preserve durable intent, identify stale assumptions, and recommend an explicit disposition.</p>',
    traits: { formality: 86, verbosity: 62, creativity: 28, empathy: 55, assertiveness: 71 }, archived: true,
  },
]

export const createSeedPersonas = () => seedBases.map(makeSeed)

const domainSnapshot = (state) => deepCopy({
  personas: state.personas,
  comparisonSlots: state.comparisonSlots,
  comparisonCursor: state.comparisonCursor,
  testPersonaId: state.testBench.personaId,
})

const restoreSnapshot = (state, snap) => ({
  ...state,
  personas: deepCopy(snap.personas),
  comparisonSlots: [...snap.comparisonSlots],
  comparisonCursor: snap.comparisonCursor,
  testBench: { ...state.testBench, personaId: snap.testPersonaId },
  selectedIds: [],
})

function changeSummary(before, after) {
  const fields = ['name', 'role', 'tone', 'tags', 'constraints', 'goals', 'examples', 'promptBody', 'traits', 'activeVariant']
  const changed = fields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
  return changed.length ? `Changed ${changed.join(', ')}` : 'Saved without field changes'
}

const pushUndo = (state, next) => ({
  ...next,
  undoStack: [...state.undoStack.slice(-49), domainSnapshot(state)],
  redoStack: [],
})

export const useAppStore = create((set, get) => ({
  personas: createSeedPersonas(),
  activeView: 'library',
  filters: { search: '', role: 'All roles', tag: null, archived: false },
  flippedIds: [],
  selectedIds: [],
  comparisonSlots: [null, null],
  comparisonCursor: 0,
  compose: { sourceA: null, sourceB: null, weight: 50 },
  testBench: { personaId: null, scenarioId: SCENARIOS[0].id, status: 'idle', transcript: '', target: '', follow: true, history: [] },
  poll: { open: false, personaId: null, votes: [], running: false, round: 0, message: '' },
  undoStack: [],
  redoStack: [],
  ui: { editorOpen: false, editorId: null, composeOpen: false, exportOpen: false, exportTab: 'pack', exportRestoreFocus: false, attacherOpen: false, detailId: null, toast: null, filtersOpen: false },
  announce: '',

  setView: (activeView) => set({ activeView }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: { search: '', role: 'All roles', tag: null, archived: false } }),
  setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
  toast: (message) => {
    set((s) => ({ ui: { ...s.ui, toast: { id: uid('toast'), message } }, announce: message }))
  },
  clearToast: () => set((s) => ({ ui: { ...s.ui, toast: null } })),
  openEditor: (id = null) => { captureFocus(); set((s) => ({ ui: { ...s.ui, editorOpen: true, editorId: id } })) },
  closeEditor: () => set((s) => ({ ui: { ...s.ui, editorOpen: false, editorId: null } })),
  toggleFlip: (id) => set((s) => ({ flippedIds: s.flippedIds.includes(id) ? s.flippedIds.filter((x) => x !== id) : [...s.flippedIds, id] })),
  toggleSelected: (id) => set((s) => ({ selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id] })),
  clearSelection: () => set({ selectedIds: [] }),

  createPersona: (payload, metadata = {}) => {
    const id = uid('persona')
    const iterationId = uid('iteration')
    const now = new Date().toISOString()
    const record = {
      ...deepCopy(payload), id, archived: false, blended: Boolean(metadata.blended), blendSources: metadata.blendSources || null,
      activeIteration: iterationId, createdAt: now, updatedAt: now,
    }
    record.iterations = [{ id: iterationId, timestamp: now, summary: metadata.blended ? 'Created from persona blend' : 'Persona created', snapshot: toPayload(record) }]
    set((s) => pushUndo(s, { ...s, personas: [record, ...s.personas] }))
    get().toast(`${record.name} created`)
    return id
  },
  updatePersona: (id, payload) => {
    const current = get().personas.find((p) => p.id === id)
    if (!current) return false
    const iterationId = uid('iteration')
    const now = new Date().toISOString()
    const nextRecord = { ...current, ...deepCopy(payload), id, archived: current.archived, blended: current.blended, activeIteration: iterationId, updatedAt: now }
    const summary = changeSummary(toPayload(current), toPayload(nextRecord))
    nextRecord.iterations = [...current.iterations, { id: iterationId, timestamp: now, summary, snapshot: toPayload(nextRecord) }]
    set((s) => pushUndo(s, { ...s, personas: s.personas.map((p) => p.id === id ? nextRecord : p) }))
    get().toast(`${nextRecord.name} updated`)
    return true
  },
  clonePersona: (id) => {
    const source = get().personas.find((p) => p.id === id)
    if (!source) return null
    const payload = toPayload(source)
    payload.name = `${source.name} (copy)`
    payload.activeIteration = null
    const cloneId = get().createPersona(payload, { blended: source.blended, blendSources: source.blendSources, archived: false })
    get().toast(`${payload.name} cloned`)
    return cloneId
  },
  archivePersona: (id, archived = true) => set((s) => {
    if (!s.personas.some((p) => p.id === id)) return s
    const next = pushUndo(s, { ...s, personas: s.personas.map((p) => p.id === id ? { ...p, archived } : p), selectedIds: [] })
    return { ...next, announce: `${archived ? 'Archived' : 'Unarchived'} 1 persona` }
  }),
  deletePersonas: (ids) => set((s) => {
    const idSet = new Set(ids)
    const remaining = s.personas.filter((p) => !idSet.has(p.id))
    const next = pushUndo(s, {
      ...s, personas: remaining, selectedIds: s.selectedIds.filter(id => !idSet.has(id)),
      comparisonSlots: s.comparisonSlots.map((id) => idSet.has(id) ? null : id),
      testBench: { ...s.testBench, personaId: idSet.has(s.testBench.personaId) ? null : s.testBench.personaId },
    })
    return { ...next, announce: `Deleted ${ids.length} persona${ids.length === 1 ? '' : 's'}` }
  }),
  bulkTags: (ids, tag, remove = false) => set((s) => {
    const idSet = new Set(ids)
    const personas = s.personas.map((p) => {
      if (!idSet.has(p.id)) return p
      const filtered = p.tags.filter((t) => t !== tag)
      const tags = remove ? (filtered.length ? filtered : p.tags) : p.tags.includes(tag) || p.tags.length >= 12 ? p.tags : [...p.tags, tag]
      return { ...p, tags }
    })
    const next = pushUndo(s, { ...s, personas, selectedIds: [] })
    const announceMsg = `${remove ? 'Removed' : 'Added'} tag ${tag} ${remove ? 'from' : 'to'} ${ids.length} personas`
    return { ...next, announce: announceMsg, ui: { ...next.ui, toast: { id: uid('toast'), message: announceMsg } } }
  }),
  bulkArchive: (ids, archived) => set((s) => {
    const idSet = new Set(ids)
    const next = pushUndo(s, { ...s, personas: s.personas.map((p) => idSet.has(p.id) ? { ...p, archived } : p), selectedIds: [] })
    return { ...next, announce: `${archived ? 'Archived' : 'Unarchived'} ${ids.length} personas` }
  }),
  undo: () => set((s) => {
    if (!s.undoStack.length) return s
    const previous = s.undoStack.at(-1)
    const current = domainSnapshot(s)
    return { ...restoreSnapshot(s, previous), undoStack: s.undoStack.slice(0, -1), redoStack: [...s.redoStack, current], announce: 'Change undone' }
  }),
  redo: () => set((s) => {
    if (!s.redoStack.length) return s
    const nextSnap = s.redoStack.at(-1)
    const current = domainSnapshot(s)
    return { ...restoreSnapshot(s, nextSnap), undoStack: [...s.undoStack, current], redoStack: s.redoStack.slice(0, -1), announce: 'Change redone' }
  }),

  addToComparison: (id) => set((s) => {
    const slots = [...s.comparisonSlots]
    let index = slots.findIndex((x) => x == null)
    let replaced = false
    if (index === -1) { index = s.comparisonCursor; replaced = true }
    slots[index] = id
    const persona = s.personas.find((p) => p.id === id)
    return {
      comparisonSlots: slots, comparisonCursor: (index + 1) % 2, activeView: 'compare',
      ui: { ...s.ui, toast: { id: uid('toast'), message: `${persona?.name || 'Persona'} added to comparison${replaced ? ' (replaced older slot)' : ''}` } },
      announce: `${persona?.name || 'Persona'} added to comparison`,
    }
  }),
  setComparisonSlot: (index, id) => set((s) => ({ comparisonSlots: s.comparisonSlots.map((x, i) => i === index ? id || null : x) })),
  openInTestBench: (id) => set((s) => {
    const persona = s.personas.find((p) => p.id === id)
    return { activeView: 'test-bench', testBench: { ...s.testBench, personaId: id }, ui: { ...s.ui, toast: { id: uid('toast'), message: `${persona?.name} opened in Test Bench` } }, announce: `${persona?.name} opened in Test Bench` }
  }),
  setTestPersona: (id) => set((s) => { const p = s.personas.find(x => x.id === id); return { testBench: { ...s.testBench, personaId: id }, ui: { ...s.ui, attacherOpen: false, toast: { id: uid('toast'), message: `Attached ${p?.name || 'Persona'} to Test Bench` } }, announce: `Attached ${p?.name || 'Persona'} to Test Bench` } }),
  setScenario: (scenarioId) => set((s) => ({ testBench: { ...s.testBench, scenarioId } })),
  startRun: (target) => set((s) => {
    if (s.testBench.status === 'waiting' || s.testBench.status === 'streaming') return s
    return { testBench: { ...s.testBench, status: 'waiting', transcript: '', target, follow: true } }
  }),
  beginStreaming: () => set((s) => s.testBench.status === 'waiting' ? { testBench: { ...s.testBench, status: 'streaming' } } : s),
  appendTranscript: (text) => set((s) => s.testBench.status === 'streaming' ? { testBench: { ...s.testBench, transcript: s.testBench.transcript + text } } : s),
  setFollow: (follow) => set((s) => ({ testBench: { ...s.testBench, follow } })),
  finishRun: (stopped = false) => set((s) => {
    if (!['streaming', 'waiting'].includes(s.testBench.status)) return s
    const persona = s.personas.find((p) => p.id === s.testBench.personaId)
    const scenario = SCENARIOS.find((x) => x.id === s.testBench.scenarioId)
    const entry = { id: uid('run'), personaId: persona?.id, personaName: persona?.name || 'Unknown', scenarioId: scenario?.id, scenarioName: scenario?.name || 'Unknown', timestamp: new Date().toISOString(), transcript: s.testBench.transcript, length: s.testBench.transcript.length, stopped }
    return { testBench: { ...s.testBench, status: stopped ? 'stopped' : 'complete', target: '', history: [entry, ...s.testBench.history] }, announce: stopped ? 'Run stopped' : 'Stream complete' }
  }),
  restoreRun: (runId) => set((s) => {
    const run = s.testBench.history.find((r) => r.id === runId)
    return run ? { testBench: { ...s.testBench, personaId: run.personaId, scenarioId: run.scenarioId, transcript: run.transcript, status: run.stopped ? 'stopped' : 'complete', target: '' }, announce: 'Transcript restored from history' } : s
  }),

  openDetail: (id) => { captureFocus(); set((s) => ({ ui: { ...s.ui, detailId: id } })) },
  startPoll: (personaId) => {
    captureFocus()
    const persona = get().personas.find((p) => p.id === personaId)
    if (!persona || persona.iterations.length < 2) {
      set((s) => ({ poll: { ...s.poll, message: 'At least two iterations are needed to start a poll.' }, announce: 'At least two iterations are needed to start a poll.' }))
      return false
    }
    set((s) => ({ poll: { open: true, personaId, votes: [], running: true, round: s.poll.round + 1, message: '' }, announce: 'Iteration poll started; watch votes arrive.' }))
    return true
  },
  addVote: (vote) => set((s) => {
    if (!s.poll.running) return s
    return { poll: { ...s.poll, votes: [...s.poll.votes, vote] }, announce: `Teammate ${vote.teammate} cast a vote` }
  }),
  finishPoll: () => set((s) => {
    if (!s.poll.running) return s
    const counts = s.poll.votes.reduce((acc, v) => ({ ...acc, [v.iterationId]: (acc[v.iterationId] || 0) + 1 }), {})
    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const personas = s.personas.map((p) => p.id === s.poll.personaId ? { ...p, promotedIteration: winner } : p)
    const next = pushUndo(s, { ...s, personas, poll: { ...s.poll, running: false } })
    return { ...next, announce: 'Poll closed and winning iteration promoted' }
  }),
  closePoll: () => set((s) => ({ poll: { ...s.poll, open: false } })),
}))

export function generateResponse(persona, scenario) {
  if (!persona || !scenario) return ''
  const formal = persona.traits.formality >= 65
  const verbose = persona.traits.verbosity >= 65
  const creative = persona.traits.creativity >= 65
  const empathetic = persona.traits.empathy >= 65
  const salutation = formal ? 'Good day. ' : 'Hey there — '
  const framing = formal
    ? `I will address “${scenario.name}” with a structured recommendation. `
    : `let’s work through “${scenario.name}” together. `
  const approach = creative
    ? 'I will begin with a clear north star, then use a vivid example to make the recommendation memorable. '
    : 'I will separate the facts, the decision, and the next action so the result is easy to verify. '
  const empathy = empathetic
    ? 'I will acknowledge the people affected and make the next step feel manageable. '
    : 'I will keep the focus on the decision criteria and measurable outcome. '
  const core = formal
    ? `The recommended course is to define the desired outcome, identify the strongest available evidence, and proceed through one reversible step. This approach does not confuse confidence with certainty.`
    : `We’ll pin down what good looks like, use the strongest evidence we’ve got, and take one reversible step. That way, we’re learning without pretending we know everything.`
  const limits = persona.constraints.length
    ? `\n\nRespected limits: ${persona.constraints.join('; ')}.`
    : ''
  const extra = verbose
    ? `\n\nFirst, align on the audience and the cost of a wrong decision. Second, choose one signal that can change the plan. Third, document the owner and review point. ${formal ? 'I recommend recording assumptions explicitly so that later evidence can be evaluated without hindsight bias.' : `We’ll also write down our assumptions now, so we can check them honestly later.`}\n\nA practical sequence is to draft the smallest useful version, review it against the stated goal, and invite one focused challenge from the people closest to the work. Capture what changed and why. This creates a decision trail that is useful without becoming administrative overhead.\n\nFor quality control, examine the recommendation from three angles: whether it is understandable to the intended audience, whether its evidence can be checked, and whether the next action has a clear owner. If any one of those is missing, revise before expanding the scope.\n\nFinally, schedule a review point tied to new evidence rather than an arbitrary date. At that review, compare the observed outcome with the original assumption, keep what worked, and change the part the evidence actually challenged.`
    : ''
  return `${salutation}${framing}${approach}${empathy}\n\n${core}${extra}${limits}`
}

export function visiblePersonas(state) {
  const q = state.filters.search.trim().toLowerCase()
  return state.personas.filter((p) => {
    const search = !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
    const role = state.filters.role === 'All roles' || p.role === state.filters.role
    const tag = !state.filters.tag || p.tags.includes(state.filters.tag)
    return p.archived === state.filters.archived && search && role && tag
  })
}
