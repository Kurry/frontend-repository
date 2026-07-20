import { computed } from 'vue'
import { defineStore } from 'pinia'

const now = () => new Date().toISOString()
const clone = (value) => JSON.parse(JSON.stringify(value))

const history = (type, timestamp, summary) => ({ type, timestamp, summary })
const finding = (id, tier, category, description, evidence = '', status = 'open', override_justification) => ({
  id, tier, category, description, evidence, status, ...(override_justification ? { override_justification } : {}),
})

export const contributors = [
  { name: 'Mara Voss', role: 'Rubric analyst', initials: 'MV' },
  { name: 'Ilya Brandt', role: 'Evaluation designer', initials: 'IB' },
  { name: 'Tessa Okafor', role: 'Task author', initials: 'TO' },
  { name: 'Ruben Calla', role: 'Environment specialist', initials: 'RC' },
]

const seedSubmissions = () => [
  {
    id: 'sub-1048', title: 'Map constraint ambiguity in routing prompts', contributor_name: 'Mara Voss',
    stage: 'submitted', payout_state: 'pending', updated_at: '2026-07-18T14:32:00Z',
    findings: [],
    history: [history('submitted', '2026-07-18T14:32:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1047', title: 'Score multi-turn evidence reconciliation', contributor_name: 'Ilya Brandt',
    stage: 'in-review', payout_state: 'pending', updated_at: '2026-07-18T12:15:00Z',
    findings: [
      finding('f-211', 'blocker', 'correctness', 'Reference answer contradicts the supplied evidence in the final turn.', 'Trial 07 cites sector C while the source grid identifies sector B.'),
      finding('f-212', 'minor', 'scoring', 'Partial-credit guidance needs a clearer boundary example.', 'Two adjacent score bands use nearly identical wording.'),
    ],
    history: [history('in-review', '2026-07-18T13:01:00Z', 'Moved to in-review.'), history('submitted', '2026-07-18T12:15:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1046', title: 'Calibrate terse response rubric', contributor_name: 'Tessa Okafor',
    stage: 'needs-revision', payout_state: 'held', updated_at: '2026-07-17T19:04:00Z',
    findings: [finding('f-213', 'major', 'rubric-alignment', 'Rubric rewards extra explanation despite the task requiring a terse response.', 'Criteria two and four each add points for rationale.')],
    history: [history('revision-requested', '2026-07-17T19:04:00Z', 'Clarify the response-length requirement and align the rubric.'), history('in-review', '2026-07-17T17:20:00Z', 'Moved to in-review.'), history('submitted', '2026-07-17T15:02:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1045', title: 'Verify sandbox dependency recovery', contributor_name: 'Ruben Calla',
    stage: 'approved', payout_state: 'released', updated_at: '2026-07-17T16:22:00Z',
    findings: [finding('f-214', 'minor', 'environment', 'Package cache note could name the expected fallback directory.', 'Setup succeeds in both seeded environments.', 'overridden', 'The fallback is intentionally implementation-independent.')],
    history: [history('approved', '2026-07-17T16:22:00Z', 'Approved and payout released.'), history('in-review', '2026-07-17T14:40:00Z', 'Moved to in-review.'), history('submitted', '2026-07-17T10:12:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1044', title: 'Audit tool-call recovery sequence', contributor_name: 'Mara Voss',
    stage: 'in-review', payout_state: 'held', updated_at: '2026-07-16T18:31:00Z',
    findings: [finding('f-215', 'major', 'tooling', 'Recovery step omits the required confirmation after a failed tool call.', 'The third seeded transcript resumes without checking state.'), finding('f-216', 'minor', 'instruction-clarity', 'Retry limit is only implied by an example.', '')],
    history: [history('in-review', '2026-07-16T18:31:00Z', 'Moved to in-review.'), history('submitted', '2026-07-16T17:05:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1043', title: 'Normalize regional date instructions', contributor_name: 'Ilya Brandt',
    stage: 'submitted', payout_state: 'pending', updated_at: '2026-07-16T15:48:00Z',
    findings: [finding('f-217', 'minor', 'instruction-clarity', 'One example changes date format without explaining locale precedence.', 'Example four switches from day-first to month-first.')],
    history: [history('submitted', '2026-07-16T15:48:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1042', title: 'Resolve weighted criteria edge cases', contributor_name: 'Tessa Okafor',
    stage: 'in-review', payout_state: 'pending', updated_at: '2026-07-16T11:09:00Z',
    findings: [finding('f-218', 'blocker', 'scoring', 'Zero-weight criteria still change the total score in the worked example.', 'Recalculation changes 7.5 to 6.8.'), finding('f-219', 'major', 'correctness', 'Tie-breaking rule produces two winners for the seeded input.', 'Cases F and H remain tied after all documented steps.')],
    history: [history('in-review', '2026-07-16T11:09:00Z', 'Moved to in-review.'), history('submitted', '2026-07-15T19:46:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1041', title: 'Harden workspace reset protocol', contributor_name: 'Ruben Calla',
    stage: 'needs-revision', payout_state: 'held', updated_at: '2026-07-15T17:35:00Z',
    findings: [finding('f-220', 'blocker', 'environment', 'Reset command can remove the fixture directory required by the next trial.', 'Observed after the second reset in trial 04.')],
    history: [history('revision-requested', '2026-07-15T17:35:00Z', 'Protect seeded fixtures during workspace reset.'), history('in-review', '2026-07-15T15:42:00Z', 'Moved to in-review.'), history('submitted', '2026-07-15T12:08:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1040', title: 'Differentiate abstention from refusal', contributor_name: 'Mara Voss',
    stage: 'approved', payout_state: 'released', updated_at: '2026-07-14T20:14:00Z',
    findings: [],
    history: [history('approved', '2026-07-14T20:14:00Z', 'Approved and payout released.'), history('in-review', '2026-07-14T18:25:00Z', 'Moved to in-review.'), history('submitted', '2026-07-14T13:30:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1039', title: 'Align extraction span boundaries', contributor_name: 'Ilya Brandt',
    stage: 'in-review', payout_state: 'pending', updated_at: '2026-07-14T15:26:00Z',
    findings: [finding('f-221', 'major', 'rubric-alignment', 'Span rubric penalizes punctuation that the instructions explicitly permit.', 'Example B includes an accepted trailing colon.')],
    history: [history('in-review', '2026-07-14T15:26:00Z', 'Moved to in-review.'), history('submitted', '2026-07-14T11:18:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1038', title: 'Stress-test nested instruction priority', contributor_name: 'Tessa Okafor',
    stage: 'submitted', payout_state: 'pending', updated_at: '2026-07-13T16:52:00Z',
    findings: [finding('f-222', 'minor', 'tooling', 'Tool output delimiter example is visually ambiguous.', 'The delimiter and content share the same indentation.')],
    history: [history('submitted', '2026-07-13T16:52:00Z', 'Submission entered the quality queue.')],
  },
  {
    id: 'sub-1037', title: 'Validate offline scoring harness', contributor_name: 'Ruben Calla',
    stage: 'approved', payout_state: 'released', updated_at: '2026-07-12T18:03:00Z',
    findings: [],
    history: [history('approved', '2026-07-12T18:03:00Z', 'Approved and payout released.'), history('in-review', '2026-07-12T16:11:00Z', 'Moved to in-review.'), history('submitted', '2026-07-12T09:44:00Z', 'Submission entered the quality queue.')],
  },
]

export const criteria = [
  { id: 'answer-integrity', name: 'Answer integrity', weight: 4 },
  { id: 'rubric-fit', name: 'Rubric fit', weight: 3 },
  { id: 'instruction-signal', name: 'Instruction signal', weight: 2 },
  { id: 'runtime-stability', name: 'Runtime stability', weight: 2 },
  { id: 'score-consistency', name: 'Score consistency', weight: 1 },
]

const seedTrials = () => [
  { id: 1, date: '2026-07-11', scores: { 'answer-integrity': 2, 'rubric-fit': 1, 'instruction-signal': 4, 'runtime-stability': 3, 'score-consistency': 2 } },
  { id: 2, date: '2026-07-11', scores: { 'answer-integrity': 1, 'rubric-fit': 2, 'instruction-signal': 3, 'runtime-stability': 4, 'score-consistency': 4 } },
  { id: 3, date: '2026-07-12', scores: { 'answer-integrity': 2, 'rubric-fit': 4, 'instruction-signal': 2, 'runtime-stability': 3, 'score-consistency': 3 } },
  { id: 4, date: '2026-07-13', scores: { 'answer-integrity': 4, 'rubric-fit': 2, 'instruction-signal': 2, 'runtime-stability': 5, 'score-consistency': 4 } },
  { id: 5, date: '2026-07-16', scores: { 'answer-integrity': 3, 'rubric-fit': 4, 'instruction-signal': 4, 'runtime-stability': 2, 'score-consistency': 2 } },
  { id: 6, date: '2026-07-16', scores: { 'answer-integrity': 4, 'rubric-fit': 3, 'instruction-signal': 5, 'runtime-stability': 2, 'score-consistency': 3 } },
  { id: 7, date: '2026-07-17', scores: { 'answer-integrity': 5, 'rubric-fit': 4, 'instruction-signal': 3, 'runtime-stability': 1, 'score-consistency': 5 } },
  { id: 8, date: '2026-07-17', scores: { 'answer-integrity': 4, 'rubric-fit': 5, 'instruction-signal': 4, 'runtime-stability': 3, 'score-consistency': 2 } },
  { id: 9, date: '2026-07-18', scores: { 'answer-integrity': 3, 'rubric-fit': 4, 'instruction-signal': 2, 'runtime-stability': 4, 'score-consistency': 3 } },
  { id: 10, date: '2026-07-18', scores: { 'answer-integrity': 5, 'rubric-fit': 5, 'instruction-signal': 4, 'runtime-stability': 4, 'score-consistency': 4 } },
]

export const useQcStore = defineStore('qc', {
  state: () => ({
    submissions: seedSubmissions(),
    trialResults: seedTrials(),
    filters: { stage: null, tier: null, contributor: null },
    sort: 'desc',
    selectedIds: [],
    activeView: 'queue',
    activeSubmissionId: null,
    drawerContributor: null,
    disclosureState: {},
    profileRange: ['2026-07-11', '2026-07-18'],
    recheck: { submissionId: null, running: false, visible: false, progress: 0, completed: false, steps: [] },
    undoStack: [],
    redoStack: [],
    palette: { open: false, query: '', activeIndex: 0 },
    paletteOpener: null,
    toast: { visible: false, message: '', tone: 'success', key: 0 },
    locale: 'en',
    theme: 'dark',
    dialogs: { add: false, revision: false, override: false, approve: false, overrideFindingId: null },
    exportFormat: 'json',
    copyConfirmed: false,
    nextFinding: 300,
    mutationEpoch: 0,
  }),
  getters: {
    activeSubmission: (state) => state.submissions.find((s) => s.id === state.activeSubmissionId) || null,
    contributorNames: () => contributors.map((c) => c.name),
    visibleSubmissions(state) {
      const count = (s) => s.findings.filter((f) => f.status === 'open').length
      return state.submissions
        .filter((s) => !state.filters.stage || s.stage === state.filters.stage)
        .filter((s) => !state.filters.contributor || s.contributor_name === state.filters.contributor)
        .filter((s) => !state.filters.tier || s.findings.some((f) => f.status === 'open' && f.tier === state.filters.tier))
        .slice()
        .sort((a, b) => {
          const ascending = count(a) - count(b) || a.id.localeCompare(b.id)
          return state.sort === 'asc' ? ascending : -ascending
        })
    },
    queueSummary(state) {
      const summary = { total: state.submissions.length, stages: { submitted: 0, 'in-review': 0, 'needs-revision': 0, approved: 0 }, payout_states: { pending: 0, held: 0, released: 0 } }
      state.submissions.forEach((s) => { summary.stages[s.stage]++; summary.payout_states[s.payout_state]++ })
      return summary
    },
    selectedCount: (state) => state.selectedIds.length,
    profileData(state) {
      const [start, end] = state.profileRange
      const trials = state.trialResults.filter((t) => t.date >= start && t.date <= end)
      return criteria.map((criterion) => {
        const scores = trials.map((t) => t.scores[criterion.id])
        const failed = scores.filter((score) => score < 3).length
        return { ...criterion, rate: scores.length ? Math.round((failed / scores.length) * 100) : 0, mean: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—', trials: scores.length }
      }).sort((a, b) => b.rate - a.rate || b.weight - a.weight)
    },
    contributorSubmissions: (state) => (name) => state.submissions.filter((s) => s.contributor_name === name),
    contributorTimeline: (state) => (name) => state.submissions.filter((s) => s.contributor_name === name).flatMap((s) => s.history.map((h) => ({ ...h, submission: s.title }))).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    packageObject(state) {
      void state.mutationEpoch
      const queueSummary = { total: state.submissions.length, stages: { submitted: 0, 'in-review': 0, 'needs-revision': 0, approved: 0 }, payout_states: { pending: 0, held: 0, released: 0 } }
      state.submissions.forEach((s) => { queueSummary.stages[s.stage]++; queueSummary.payout_states[s.payout_state]++ })
      return {
        schemaVersion: 1,
        exported_at: now(),
        queue_summary: queueSummary,
        submissions: state.submissions.map((s) => {
          const counts = { blocker: 0, major: 0, minor: 0 }
          s.findings.filter((f) => f.status === 'open').forEach((f) => counts[f.tier]++)
          return {
            id: s.id, title: s.title, contributor_name: s.contributor_name, stage: s.stage, payout_state: s.payout_state,
            gate_status: counts.blocker ? 'failed' : 'passed', open_finding_counts: counts,
            findings: s.findings.map((f) => ({ id: f.id, tier: f.tier, category: f.category, description: f.description, evidence: f.evidence || '', status: f.status, ...(f.status === 'overridden' ? { override_justification: f.override_justification } : {}) })),
            history: s.history.map((h) => ({ type: h.type, timestamp: h.timestamp, summary: h.summary })),
          }
        }),
      }
    },
    jsonPreview() { return JSON.stringify(this.packageObject, null, 2) },
    markdownPreview(state) {
      const q = this.queueSummary
      const lines = ['# Arcfield quality-control report', '', `Exported: ${now()}`, '', '## Queue summary', '', `- Total submissions: ${q.total}`, `- Stages: submitted ${q.stages.submitted}, in-review ${q.stages['in-review']}, needs-revision ${q.stages['needs-revision']}, approved ${q.stages.approved}`, `- Payouts: pending ${q.payout_states.pending}, held ${q.payout_states.held}, released ${q.payout_states.released}`, '']
      state.submissions.forEach((s) => {
        const counts = { blocker: 0, major: 0, minor: 0 }
        s.findings.filter((f) => f.status === 'open').forEach((f) => counts[f.tier]++)
        lines.push(`## ${s.title}`, '', `**Contributor:** ${s.contributor_name}  `, `**Stage:** ${s.stage}  `, `**Payout:** ${s.payout_state}  `, `**Gate:** ${counts.blocker ? 'failed' : 'passed'}  `, `**Open findings:** blocker ${counts.blocker}, major ${counts.major}, minor ${counts.minor}`, '', '### Findings', '')
        if (!s.findings.length) lines.push('_No findings recorded._', '')
        s.findings.forEach((f) => lines.push(`- **${f.tier} · ${f.category}** — ${f.description}${f.status === 'overridden' ? ` _(overridden: ${f.override_justification})_` : ''}`))
        lines.push('', '### History', '')
        s.history.forEach((h) => lines.push(`- ${h.timestamp} — ${h.summary}`))
        lines.push('')
      })
      return lines.join('\n')
    },
    exportPreview() { return this.exportFormat === 'json' ? this.jsonPreview : this.markdownPreview },
  },
  actions: {
    closeDialogs() { this.dialogs = { add: false, revision: false, override: false, approve: false, overrideFindingId: null } },
    openSubmission(id) { this.activeSubmissionId = id; this.activeView = 'detail'; this.palette.open = false; this.closeDialogs() },
    openView(view) { this.activeView = view; if (view !== 'detail') this.activeSubmissionId = null; this.palette.open = false; this.closeDialogs() },
    openContributor(name) { this.drawerContributor = name; this.palette.open = false },
    clearFilters() { this.filters = { stage: null, tier: null, contributor: null } },
    setFilter(name, value) {
      if (!(name in this.filters)) return
      this.filters = { ...this.filters, [name]: value || null }
    },
    setSort(value) { this.sort = value === 'asc' ? 'asc' : 'desc' },
    setProfileRange(range) { this.profileRange = Array.isArray(range) ? [...range] : range },
    toggleSelected(id) { this.selectedIds = this.selectedIds.includes(id) ? this.selectedIds.filter((x) => x !== id) : [...this.selectedIds, id] },
    selectVisible(ids) { const allSelected = ids.length && ids.every((id) => this.selectedIds.includes(id)); this.selectedIds = allSelected ? this.selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...this.selectedIds, ...ids])] },
    clearSelection() { this.selectedIds = [] },
    bump() { this.mutationEpoch += 1 },
    snapshot(label) { this.undoStack.push({ label, submissions: clone(this.submissions) }); if (this.undoStack.length > 40) this.undoStack.shift(); this.redoStack = [] },
    undo() { if (!this.undoStack.length) return false; const entry = this.undoStack.pop(); this.redoStack.push({ label: entry.label, submissions: clone(this.submissions) }); this.submissions = entry.submissions; this.bump(); this.notify(`Undid ${entry.label}`, 'neutral'); return true },
    redo() { if (!this.redoStack.length) return false; const entry = this.redoStack.pop(); this.undoStack.push({ label: entry.label, submissions: clone(this.submissions) }); this.submissions = entry.submissions; this.bump(); this.notify(`Redid ${entry.label}`, 'neutral'); return true },
    addFinding(submissionId, payload) {
      const sub = this.submissions.find((s) => s.id === submissionId); if (!sub) return false
      this.snapshot('add finding')
      sub.findings.unshift({ id: `f-${this.nextFinding++}`, tier: payload.tier, category: payload.category, description: payload.description.trim(), evidence: (payload.evidence || '').trim(), status: 'open' })
      sub.updated_at = now(); this.bump(); this.dialogs.add = false; this.notify('Finding added to the review record'); return true
    },
    overrideFinding(submissionId, findingId, payload) {
      const sub = this.submissions.find((s) => s.id === submissionId); const item = sub?.findings.find((f) => f.id === findingId); if (!item || item.status !== 'open') return false
      this.snapshot('override finding'); item.status = 'overridden'; item.override_justification = payload.justification.trim(); sub.updated_at = now(); this.bump(); this.dialogs.override = false; this.notify('Finding overridden — gate recalculated'); return true
    },
    retierFinding(submissionId, findingId, tier) {
      if (!['blocker', 'major', 'minor'].includes(tier)) return false
      const sub = this.submissions.find((s) => s.id === submissionId); const item = sub?.findings.find((f) => f.id === findingId)
      if (!item || item.status !== 'open' || item.tier === tier) return false
      this.snapshot('re-tier finding'); item.tier = tier; sub.updated_at = now(); this.bump(); this.notify(`Finding changed to ${tier}`); return true
    },
    removeFinding(submissionId, findingId) {
      const sub = this.submissions.find((s) => s.id === submissionId); const index = sub?.findings.findIndex((f) => f.id === findingId) ?? -1
      if (!sub || index < 0) return false
      this.snapshot('remove finding'); sub.findings.splice(index, 1); sub.updated_at = now(); this.bump(); this.notify('Finding removed'); return true
    },
    requestRevision(submissionId, payload) {
      const sub = this.submissions.find((s) => s.id === submissionId); if (!sub) return false
      this.snapshot('request revision'); sub.stage = 'needs-revision'; sub.payout_state = sub.payout_state === 'released' ? 'released' : 'held'; sub.updated_at = now(); sub.history.unshift(history('revision-requested', sub.updated_at, payload.summary.trim())); this.bump(); this.dialogs.revision = false; this.notify('Revision requested and timeline updated'); return true
    },
    markRevised(submissionId) {
      const sub = this.submissions.find((s) => s.id === submissionId); if (!sub || sub.stage !== 'needs-revision') return false
      this.snapshot('mark revised'); sub.stage = 'in-review'; sub.updated_at = now(); sub.history.unshift(history('in-review', sub.updated_at, 'Contributor revision returned to in-review.')); this.bump(); this.notify('Submission moved back to in-review'); return true
    },
    approve(submissionId) {
      const sub = this.submissions.find((s) => s.id === submissionId); if (!sub || sub.stage !== 'in-review' || sub.findings.some((f) => f.status === 'open' && f.tier === 'blocker')) return false
      this.snapshot('approve submission'); sub.stage = 'approved'; sub.payout_state = 'released'; sub.updated_at = now(); sub.history.unshift(history('approved', sub.updated_at, 'Approved and payout released.')); this.bump(); this.notify('Submission approved — payout released'); return true
    },
    updateSubmission(id, field, value) {
      const sub = this.submissions.find((s) => s.id === id); if (!sub) return false
      if (field === 'stage' && !['submitted', 'in-review', 'needs-revision', 'approved'].includes(value)) return false
      if (field === 'payout-state' && !['pending', 'held', 'released'].includes(value)) return false
      if (field === 'stage' && value === 'approved' && (sub.stage !== 'in-review' || sub.findings.some((f) => f.status === 'open' && f.tier === 'blocker'))) return false
      this.snapshot('update submission'); if (field === 'stage') { sub.stage = value; sub.history.unshift(history(value, now(), `Stage changed to ${value}.`)) } else sub.payout_state = value; sub.updated_at = now(); this.bump(); return true
    },
    bulkMove() {
      const affected = this.submissions.filter((s) => this.selectedIds.includes(s.id) && s.stage === 'submitted'); if (!affected.length) { this.notify('No submitted rows in selection', 'neutral'); return false }
      this.snapshot('bulk move to in-review'); affected.forEach((sub) => { sub.stage = 'in-review'; sub.updated_at = now(); sub.history.unshift(history('in-review', sub.updated_at, 'Moved to in-review by bulk action.')) }); this.bump(); this.notify(`${affected.length} submission${affected.length === 1 ? '' : 's'} moved to in-review`); return true
    },
    bulkHold() {
      const affected = this.submissions.filter((s) => this.selectedIds.includes(s.id) && s.payout_state !== 'released' && s.payout_state !== 'held'); if (!affected.length) { this.notify('Selected payouts already held or released', 'neutral'); return false }
      this.snapshot('bulk hold payout'); affected.forEach((sub) => { sub.payout_state = 'held'; sub.updated_at = now() }); this.bump(); this.notify(`${affected.length} payout${affected.length === 1 ? '' : 's'} placed on hold`); return true
    },
    notify(message, tone = 'success') { this.toast = { visible: true, message, tone, key: this.toast.key + 1 }; const key = this.toast.key; setTimeout(() => { if (this.toast.key === key) this.toast.visible = false }, 2800) },
    toggleDisclosure(id) { this.disclosureState[id] = !this.disclosureState[id] },
    startRecheck(submissionId) {
      const names = ['Validate task contract', 'Replay trial fixtures', 'Compare rubric scores', 'Compile gate result']
      this.recheck = { submissionId, running: true, visible: true, progress: 0, completed: false, steps: names.map((name) => ({ name, status: 'pending' })) }
      names.forEach((_, index) => setTimeout(() => {
        if (this.recheck.submissionId !== submissionId || !this.recheck.running) return
        this.recheck.steps[index] = { ...this.recheck.steps[index], status: 'complete' }
        this.recheck.progress = Math.round(((index + 1) / names.length) * 100)
        if (index === names.length - 1) { this.recheck.running = false; this.recheck.completed = true }
      }, 900 * (index + 1)))
    },
    async copyExport() {
      await navigator.clipboard.writeText(this.exportPreview)
      this.copyConfirmed = true; this.notify('Visible export copied to clipboard')
      setTimeout(() => { this.copyConfirmed = false }, 2200)
      return true
    },
    downloadExport() {
      const isJson = this.exportFormat === 'json'
      const blob = new Blob([this.exportPreview], { type: isJson ? 'application/json' : 'text/markdown' })
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = isJson ? 'arcfield-qc-package.json' : 'arcfield-qc-report.md'; link.click(); URL.revokeObjectURL(link.href)
      this.notify(`${isJson ? 'JSON package' : 'Markdown report'} downloaded`); return true
    },
  },
})

export function openFindingCounts(submission) {
  const counts = { blocker: 0, major: 0, minor: 0 }
  submission?.findings.filter((f) => f.status === 'open').forEach((f) => counts[f.tier]++)
  return counts
}
