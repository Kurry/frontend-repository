import { z } from 'zod';

export const STATUSES = ['candidate', 'scored', 'selected', 'rejected', 'pinned', 'queued'];
export const LICENSES = ['permissive', 'weak-copyleft', 'strong-copyleft', 'unlicensed'];
export const REASONS = ['license-blocked', 'gui-heavy', 'network-dependent', 'duplicate-cluster', 'too-large'];
export const LANGUAGES = ['Python', 'TypeScript', 'Rust', 'Go', 'Kotlin', 'Elixir'];
export const BANDS = ['easy', 'medium', 'hard'];
export const TIMELINE_TYPES = ['score', 'select', 'reject', 'pin', 'queue', 'import'];

export const rejectionSchema = z.object({ reason: z.enum(REASONS, { error: 'Reason field: choose one of the listed reasons.' }) });
export const pinSchema = z.object({ notes: z.string().max(200, 'Notes field: use 200 characters or fewer.') });

const candidateSchema = z.object({
  name: z.string().regex(/^[^/]+\/[^/]+$/, 'Candidate name field must use org/repo.'),
  language: z.string(), stars: z.number().int().nonnegative(),
  difficulty: z.number().min(0).max(10), category: z.string(), clusterId: z.string(),
  license: z.enum(LICENSES, { errorMap: () => ({ message: 'Invalid license' }) }), status: z.enum(STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  rejectionReason: z.enum(REASONS).optional(),
  commit: z.string().regex(/^[0-9a-f]{12}$/, 'Candidate commit field must be 12 lowercase hex characters.').optional(),
  notes: z.string().max(200, 'Candidate notes field must be at most 200 characters.').optional(),
  queuePosition: z.number().int().positive().optional()
}).superRefine((candidate, context) => {
  if (candidate.status === 'rejected' && !candidate.rejectionReason) context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'Candidate rejectionReason field is required for rejected status.' });
  if (['pinned', 'queued'].includes(candidate.status) && !candidate.commit) context.addIssue({ code: 'custom', path: ['commit'], message: 'Candidate commit field is required for pinned or queued status.' });
  if (candidate.status === 'queued' && !candidate.queuePosition) context.addIssue({ code: 'custom', path: ['queuePosition'], message: 'Candidate queuePosition field is required for queued status.' });
});

const queueEntrySchema = z.object({
  position: z.number().int().positive(), name: z.string(), difficulty: z.number().min(0).max(10),
  clusterId: z.string(), commit: z.string().regex(/^[0-9a-f]{12}$/, 'Queue commit field must be 12 lowercase hex characters.')
}).strict();
const quotaEntrySchema = z.object({ language: z.string(), band: z.enum(BANDS), achieved: z.number().int().nonnegative(), target: z.number().int().positive() }).strict();
const timelineEntrySchema = z.object({ at: z.iso.datetime(), name: z.string(), fromStatus: z.string(), toStatus: z.string(), rejectionReason: z.enum(REASONS).optional() }).strict();
export const packSchema = z.object({
  schemaVersion: z.literal('sourcing-pack/v1', { error: 'schemaVersion field must be sourcing-pack/v1.' }),
  generatedAt: z.iso.datetime({ error: 'generatedAt field must be an ISO-8601 timestamp.' }),
  quotaFillPercent: z.number().int().min(0).max(100), queue: z.array(queueEntrySchema),
  candidates: z.array(candidateSchema), quota: z.array(quotaEntrySchema), timeline: z.array(timelineEntrySchema)
}).strict();

const seedRows = [
  ['emberforge/ash-parser','Python',8420,6.4,'Parsing','cl-aurora','permissive','selected'],
  ['northloom/thread-cache','Rust',6200,7.6,'Storage','cl-aurora','weak-copyleft','scored'],
  ['emberforge/cinder-cli','Go',3910,3.2,'CLI','cl-cinder','permissive','candidate'],
  ['emberforge/flint-schema','TypeScript',7120,5.8,'Validation','cl-flint','strong-copyleft','scored'],
  ['quietmesa/dune-index','Elixir',4860,5.4,'Indexing','cl-dune','permissive','pinned',undefined,'a3f29b7c14de'],
  ['silversprig/moss-router','Elixir',3375,4.8,'Routing','cl-moss','permissive','queued',undefined,'5c7e1f90b3a2'],
  ['hollowpeak/ridge-worker','Python',9840,2.8,'Workers','cl-ridge','weak-copyleft','queued',undefined,'9d804e2b61af'],
  ['tidefoundry/brine-map','Python',5230,3.6,'Data','cl-brine','unlicensed','selected'],
  ['opalharbor/keel-test','Python',2900,1.7,'Testing','cl-keel','permissive','selected'],
  ['copperfield/wren-query','Kotlin',11800,8.3,'Query','cl-wren','strong-copyleft','scored'],
  ['lanternvale/glow-jobs','TypeScript',4430,4.2,'Scheduling','cl-glow','permissive','candidate'],
  ['velvetorbit/comet-lint','Rust',15600,6.9,'Tooling','cl-crater','unlicensed','rejected','too-large'],
  ['mirthworks/jolly-log','Go',2860,2.1,'Logging','cl-jolly','permissive','scored'],
  ['bluequartz/prism-diff','TypeScript',7600,7.2,'Developer tools','cl-prism','weak-copyleft','candidate'],
  ['willowgrid/sedge-graph','Kotlin',3300,5.1,'Graph','cl-sedge','permissive','candidate'],
  ['frostcabin/sleet-http','Go',9050,7.9,'Networking','cl-sleet','strong-copyleft','scored'],
  ['papercrane/fold-config','Python',6700,4.9,'Configuration','cl-fold','permissive','candidate'],
  ['moonledger/crater-db','Rust',12600,9.1,'Database','cl-crater','weak-copyleft','candidate'],
  ['juniperbay/reed-events','Elixir',2470,3.7,'Events','cl-reed','unlicensed','scored'],
  ['goldenrill/pebble-core','Kotlin',5890,6.1,'Runtime','cl-pebble','permissive','candidate'],
  ['cloudthimble/mist-template','TypeScript',8340,2.9,'Templates','cl-mist','permissive','candidate'],
  ['sablegarden/fern-metrics','Go',4750,5.6,'Observability','cl-fern','weak-copyleft','rejected','network-dependent'],
  ['amberkiln/glaze-codec','Rust',9990,3.4,'Encoding','cl-glaze','permissive','scored'],
  ['seabirdlab/gull-stream','Elixir',6100,7.4,'Streaming','cl-gull','strong-copyleft','candidate'],
  ['violetmill/iris-queue','Kotlin',7230,8.8,'Queueing','cl-iris','unlicensed','candidate'],
  ['redmaple/acorn-plan','Python',3540,6.7,'Planning','cl-acorn','permissive','scored'],
  ['ivorydelta/tusk-format','TypeScript',2980,1.3,'Formatting','cl-tusk','weak-copyleft','candidate'],
  ['starlingyard/nest-build','Go',10800,4.6,'Build','cl-nest','permissive','candidate'],
  ['glassbadger/burrow-sync','Rust',4310,8.1,'Synchronization','cl-burrow','strong-copyleft','scored'],
  ['plumgrove/pit-auth','Kotlin',5610,3.8,'Authorization','cl-pit','permissive','candidate'],
  ['emberforge/slag-mirror','Go',5140,5.2,'Mirrors','cl-slag','weak-copyleft','scored']
];

function makeCandidate(row) {
  const [name, language, stars, difficulty, category, clusterId, license, status, rejectionReason, commit] = row;
  return { id: fnvHex(name), name, language, stars, difficulty, category, clusterId, license, status, rejectionReason, commit: commit ?? '', notes: '', guardMessage: '', fresh: false };
}

// Seeded build-queue order (fixed, so every reload restores the identical
// baseline): both entries are seeded 'queued' rows with frozen commits, giving
// the queue panel two reorderable entries out of the box.
const SEED_QUEUE_NAMES = ['hollowpeak/ridge-worker', 'silversprig/moss-router'];

export const QUOTA_TARGETS = Object.fromEntries(LANGUAGES.flatMap((language) => BANDS.map((band) => [`${language}:${band}`, band === 'hard' ? 1 : 2])));
QUOTA_TARGETS['Python:easy'] = 1;
QUOTA_TARGETS['Elixir:medium'] = 1;

const initialTimeline = [
  { at: '2026-07-22T00:00:00.000Z', name: 'Seed review', fromStatus: 'candidate', toStatus: 'scored' },
  { at: '2026-07-22T00:04:00.000Z', name: 'quietmesa/dune-index', fromStatus: 'selected', toStatus: 'pinned' },
  { at: '2026-07-22T00:05:00.000Z', name: 'hollowpeak/ridge-worker', fromStatus: 'selected', toStatus: 'pinned' },
  { at: '2026-07-22T00:06:00.000Z', name: 'hollowpeak/ridge-worker', fromStatus: 'pinned', toStatus: 'queued' },
  { at: '2026-07-22T00:07:00.000Z', name: 'silversprig/moss-router', fromStatus: 'selected', toStatus: 'pinned' },
  { at: '2026-07-22T00:08:00.000Z', name: 'silversprig/moss-router', fromStatus: 'pinned', toStatus: 'queued' }
];

// Runes wrap collections in reactive proxies; JSON copying captures the plain
// serializable session contract used by undo/redo without cloning proxy traps.
const deepCopy = (value) => JSON.parse(JSON.stringify(value));
export const titleCase = (value) => value ? value[0].toUpperCase() + value.slice(1).replaceAll('-', ' ') : '';
export function getBand(score) { return score < 4 ? 'easy' : score < 7 ? 'medium' : 'hard'; }
export function randomCommit() { return Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => n.toString(16).padStart(2, '0')).join(''); }
export function fnvHex(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash.toString(16).padStart(8, '0');
}
export function orgHue(name) {
  const org = name.split('/')[0];
  let hash = 0;
  for (let i = 0; i < org.length; i++) hash = (hash * 31 + org.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360} 52% 40%)`;
}

const TRANSITION_TYPES = {
  'candidate>scored': 'score', 'scored>selected': 'select', 'scored>rejected': 'reject',
  'selected>pinned': 'pin', 'pinned>queued': 'queue', 'queued>selected': 'queue'
};

class AppState {
  candidates = $state(seedRows.map(makeCandidate));
  queue = $state(SEED_QUEUE_NAMES.map((name) => fnvHex(name)));
  timeline = $state(deepCopy(initialTimeline));
  filters = $state({ language: '', band: '', license: '', status: '', search: '' });
  sort = $state({ key: 'name', direction: 'asc' });
  selectedIds = $state([]);
  undoStack = $state([]);
  redoStack = $state([]);
  activeView = $state('candidates');
  queueOpen = $state(false);
  mobileMenu = $state(false);
  modal = $state(null);
  panel = $state(null);
  focusedId = $state('');
  toast = $state(null);
  liveMessage = $state('');
  fetchState = $state({ running: false, steps: ['pending','pending','pending'], runs: 0 });
  presets = $state([]);
  timelineFilter = $state('all');
  sessionFlags = $state({ score: false, select: false, pin: false, queue: false, export: false });
  snapshots = $state([]);
  fillHistory = $state([]);

  get visibleCandidates() {
    let rows = this.candidates.filter((candidate) => {
      const f = this.filters;
      return (!f.language || candidate.language === f.language) && (!f.band || getBand(candidate.difficulty) === f.band) &&
        (!f.license || candidate.license === f.license) && (!f.status || candidate.status === f.status) &&
        (!f.search || candidate.name.toLowerCase().includes(f.search.toLowerCase()));
    });
    const { key, direction } = this.sort;
    return [...rows].sort((a,b) => {
      const av = a[key], bv = b[key];
      const comparison = typeof av === 'string' ? av.localeCompare(bv) : (av - bv || a.name.localeCompare(b.name));
      return direction === 'asc' ? comparison : -comparison;
    });
  }
  get rollups() { return Object.fromEntries(STATUSES.map((status) => [status, this.candidates.filter((c) => c.status === status).length])); }
  get achievedCandidates() { return this.candidates.filter((c) => ['selected','pinned','queued'].includes(c.status)); }
  get quota() {
    return LANGUAGES.flatMap((language) => BANDS.map((band) => ({
      language, band, target: QUOTA_TARGETS[`${language}:${band}`],
      achieved: this.achievedCandidates.filter((c) => c.language === language && getBand(c.difficulty) === band).length
    })));
  }
  get quotaFillPercent() {
    const totalTarget = this.quota.reduce((sum, cell) => sum + cell.target, 0);
    const totalAchieved = this.quota.reduce((sum, cell) => sum + cell.achieved, 0);
    return Math.min(100, Math.round(totalAchieved / totalTarget * 100));
  }
  get bandPressure() {
    return BANDS.map((band) => {
      const cells = this.quota.filter((cell) => cell.band === band);
      const achieved = cells.reduce((sum, cell) => sum + cell.achieved, 0);
      const target = cells.reduce((sum, cell) => sum + cell.target, 0);
      return { band, achieved, target, need: Math.max(0, target - achieved) };
    });
  }
  get orgReadout() {
    const map = new Map();
    for (const c of this.candidates) {
      const org = c.name.split('/')[0];
      const slot = map.get(org) || { org, held: 0, candidates: 0 };
      slot.candidates += 1;
      if (['selected','pinned','queued'].includes(c.status)) slot.held += 1;
      map.set(org, slot);
    }
    return [...map.values()].sort((a,b) => b.held - a.held || b.candidates - a.candidates || a.org.localeCompare(b.org));
  }
  get clusterGroups() {
    const map = new Map();
    for (const c of this.candidates) {
      const members = map.get(c.clusterId) || [];
      members.push(c);
      map.set(c.clusterId, members);
    }
    return [...map.entries()].filter(([, members]) => members.length > 1)
      .map(([clusterId, members]) => ({ clusterId, members: [...members].sort((a,b) => a.name.localeCompare(b.name)) }))
      .sort((a,b) => b.members.length - a.members.length || a.clusterId.localeCompare(b.clusterId));
  }
  get selectedCount() { return this.selectedIds.length; }
  get activeFilterLabels() {
    const labels = [];
    if (this.filters.language) labels.push(`language ${this.filters.language}`);
    if (this.filters.band) labels.push(`difficulty ${titleCase(this.filters.band)}`);
    if (this.filters.license) labels.push(`license ${titleCase(this.filters.license)}`);
    if (this.filters.status) labels.push(`status ${titleCase(this.filters.status)}`);
    if (this.filters.search) labels.push(`name contains “${this.filters.search}”`);
    return labels;
  }
  entryType(entry) {
    if (entry.name === 'Sourcing pack import') return 'import';
    if (entry.name.startsWith('Sourcing run')) return 'score';
    return TRANSITION_TYPES[`${entry.fromStatus}>${entry.toStatus}`] ?? 'score';
  }
  get timelineCounts() {
    const counts = Object.fromEntries(TIMELINE_TYPES.map((type) => [type, 0]));
    for (const entry of this.timeline) counts[this.entryType(entry)] += 1;
    return counts;
  }
  get visibleTimeline() {
    return [...this.timeline].reverse().filter((entry) => this.timelineFilter === 'all' || this.entryType(entry) === this.timelineFilter);
  }
  snapshot() { return deepCopy({ candidates: this.candidates, queue: this.queue, timeline: this.timeline }); }
  restore(snapshot) {
    this.candidates = deepCopy(snapshot.candidates); this.queue = [...snapshot.queue]; this.timeline = deepCopy(snapshot.timeline); this.selectedIds = [];
  }
  recordFill() {
    const value = this.quotaFillPercent;
    if (this.fillHistory.at(-1) !== value) this.fillHistory.push(value);
    if (this.fillHistory.length > 24) this.fillHistory.shift();
  }
  transact(change) {
    const before = this.snapshot(); const changed = change();
    if (!changed) return false;
    const after = this.snapshot(); this.undoStack.push({ before, after }); this.redoStack = []; this.recordFill(); return true;
  }
  undo() { const entry = this.undoStack.pop(); if (!entry) return; this.restore(entry.before); this.redoStack.push(entry); this.recordFill(); this.notify('Undid the last action.'); }
  redo() { const entry = this.redoStack.pop(); if (!entry) return; this.restore(entry.after); this.undoStack.push(entry); this.recordFill(); this.notify('Redid the last action.'); }
  notify(message, kind = 'success') {
    const id = Date.now(); this.toast = { message, kind, id }; this.liveMessage = message;
    setTimeout(() => { if (this.toast?.id === id) this.toast = null; }, 4200);
  }
  find(idOrName) { return this.candidates.find((c) => c.id === idOrName || c.name === idOrName); }
  event(candidate, fromStatus, toStatus, rejectionReason) {
    const entry = { at: new Date().toISOString(), name: candidate.name, fromStatus, toStatus };
    if (rejectionReason) entry.rejectionReason = rejectionReason;
    this.timeline.push(entry);
  }
  setSort(key) { this.sort = { key, direction: this.sort.key === key && this.sort.direction === 'asc' ? 'desc' : 'asc' }; }
  clearFilters() { this.filters = { language: '', band: '', license: '', status: '', search: '' }; this.selectedIds = []; }
  drillQuota(language, band) { this.clearFilters(); this.filters.language = language; this.filters.band = band; this.activeView = 'candidates'; }
  setSelection(id, checked) { this.selectedIds = checked ? [...new Set([...this.selectedIds, id])] : this.selectedIds.filter((item) => item !== id); }
  selectAllVisible(checked) { this.selectedIds = checked ? this.visibleCandidates.map((c) => c.id) : []; }
  savePreset(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    this.presets.push({ id: crypto.randomUUID(), name: trimmed, filters: deepCopy(this.filters) });
    return true;
  }
  applyPreset(id) { const preset = this.presets.find((item) => item.id === id); if (!preset) return; this.filters = deepCopy(preset.filters); this.selectedIds = []; this.activeView = 'candidates'; }
  deletePreset(id) { this.presets = this.presets.filter((item) => item.id !== id); }
  guardFor(candidate) {
    const holder = this.achievedCandidates.find((c) => c.id !== candidate.id && c.clusterId === candidate.clusterId);
    if (holder) return `Cluster guard: ${candidate.clusterId} is already held by ${holder.name}.`;
    const org = candidate.name.split('/')[0];
    if (this.achievedCandidates.filter((c) => c.id !== candidate.id && c.name.startsWith(`${org}/`)).length >= 3) return `Org cap of 3: ${org} already has three active candidates.`;
    return '';
  }
  score(ids) {
    return this.transact(() => { let count = 0; for (const id of ids) { const c = this.find(id); if (c?.status === 'candidate') { c.status = 'scored'; c.guardMessage = ''; this.event(c,'candidate','scored'); count++; } } if (count) this.sessionFlags.score = true; return count > 0; });
  }
  lastBlockedCount = 0;
  select(ids, { silent = false } = {}) {
    const blocked = [];
    const changed = this.transact(() => { let count = 0; for (const id of ids) { const c = this.find(id); if (c?.status !== 'scored') continue; const guard = this.guardFor(c); if (guard) { c.guardMessage = guard; blocked.push(c.name); continue; } c.guardMessage = ''; c.status = 'selected'; this.event(c,'scored','selected'); count++; } if (count) this.sessionFlags.select = true; return count > 0; });
    this.lastBlockedCount = blocked.length;
    if (!silent && blocked.length) this.notify(`${blocked.length} candidate${blocked.length > 1 ? 's were' : ' was'} blocked by diversity guards.`, 'warning');
    return changed;
  }
  reject(ids, reason) {
    const parsed = rejectionSchema.safeParse({ reason });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const changed = this.transact(() => { let count = 0; for (const id of ids) { const c = this.find(id); if (c?.status === 'scored') { c.status = 'rejected'; c.rejectionReason = reason; c.guardMessage = ''; this.event(c,'scored','rejected',reason); count++; } } return count > 0; });
    if (changed) this.notify(`${ids.length > 1 ? 'Bulk rejection' : 'Rejection'} applied.`);
    return { ok: changed, error: changed ? '' : 'No Scored candidates were available.' };
  }
  pin(id, notes, commit) {
    const parsed = pinSchema.safeParse({ notes }); if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const changed = this.transact(() => { const c = this.find(id); if (c?.status !== 'selected') return false; c.status = 'pinned'; c.notes = notes; c.commit = commit; this.event(c,'selected','pinned'); return true; });
    if (changed) { this.sessionFlags.pin = true; this.notify(`${this.find(id).name} pinned to ${commit}.`); }
    return { ok: changed, error: changed ? '' : 'Candidate is no longer Selected.' };
  }
  enqueue(id) {
    const changed = this.transact(() => { const c = this.find(id); if (c?.status !== 'pinned' || this.queue.includes(c.id)) return false; c.status = 'queued'; this.queue.push(c.id); this.event(c,'pinned','queued'); return true; });
    if (changed) { this.sessionFlags.queue = true; this.notify(`${this.find(id).name} added to the build queue.`); }
    return changed;
  }
  removeFromQueue(id) {
    const changed = this.transact(() => { const c = this.find(id); if (!c || !this.queue.includes(c.id)) return false; this.queue = this.queue.filter((item) => item !== c.id); c.status = 'selected'; this.event(c,'queued','selected'); return true; });
    if (changed) this.notify(`${this.find(id).name} removed from the queue.`); return changed;
  }
  reorder(id, targetIndex) {
    const changed = this.transact(() => { const from = this.queue.indexOf(id); const to = Math.max(0, Math.min(targetIndex, this.queue.length - 1)); if (from < 0 || from === to) return false; const next = [...this.queue]; next.splice(to,0,next.splice(from,1)[0]); this.queue = next; return true; });
    if (changed) { const c = this.find(id); const message = `${c.name} moved to queue position ${this.queue.indexOf(id)+1}.`; this.liveMessage = message; this.notify(message); } return changed;
  }
  bulk(action, reason = '') {
    const ids = [...this.selectedIds]; let result;
    if (action === 'score') result = { ok: this.score(ids) };
    if (action === 'select') result = { ok: this.select(ids, { silent: true }) };
    if (action === 'reject') result = this.reject(ids, reason);
    if (result) this.selectedIds = [];
    if (action === 'select' && this.lastBlockedCount > 0) {
      const outcome = result.ok ? 'applied' : 'blocked';
      this.notify(`Bulk select ${outcome}; ${this.lastBlockedCount} candidate${this.lastBlockedCount > 1 ? 's were' : ' was'} blocked by diversity guards.`, 'warning');
    } else if (result?.ok) this.notify(`Bulk ${action} completed for the eligible selection.`);
    else if (result && action !== 'reject') this.notify(`Bulk ${action} found no eligible candidates.`, 'warning');
    return result;
  }
  async fetchMore(stepMs = 800) {
    if (this.fetchState.running) return; this.fetchState.running = true; this.fetchState.steps = ['pending','pending','pending'];
    await new Promise((resolve) => setTimeout(resolve, Math.min(stepMs, 350))); // opening beat: all three steps visibly pending
    for (let i = 0; i < 3; i++) { this.fetchState.steps[i] = 'running'; await new Promise((resolve) => setTimeout(resolve, stepMs)); this.fetchState.steps[i] = 'complete'; }
    const run = ++this.fetchState.runs;
    const orgs = ['sunnyanvil','marblefox','cobaltpond','hazelrocket','tinyprairie','lilacbeacon'];
    const repos = ['spark-reader','vein-store','ripple-task','grove-codec','orbit-check','plume-shell'];
    const next = orgs.map((org,i) => makeCandidate([`${org}${run}/${repos[i]}-${run}`, LANGUAGES[(i+run)%LANGUAGES.length], 1200+run*311+i*727, Number((1.2+((i*1.63+run)%8.5)).toFixed(1)), ['Parsing','Storage','Workers','Encoding','Testing','CLI'][i], `cl-run${run}-${i+1}`, LICENSES[(i+run)%4], i%3===0?'scored':'candidate']));
    next.forEach((candidate) => candidate.fresh = true); this.candidates = [...this.candidates, ...next];
    this.timeline.push({ at: new Date().toISOString(), name: `Sourcing run ${run}`, fromStatus: 'candidate', toStatus: 'scored' });
    this.fetchState.running = false; this.recordFill();
    this.notify(`Sourcing run ${run} complete — 6 candidates added.`); setTimeout(() => next.forEach((candidate) => candidate.fresh = false), 900);
  }
  queueEntries() { return this.queue.map((id, index) => ({ candidate: this.find(id), position: index + 1 })).filter((entry) => entry.candidate); }
  exportPack(at) {
    const positions = Object.fromEntries(this.queue.map((id,index) => [id,index+1]));
    const candidates = this.candidates.map((c) => {
      const entry = { name:c.name, language:c.language, stars:c.stars, difficulty:c.difficulty, category:c.category, clusterId:c.clusterId, license:c.license, status:c.status };
      if (c.status === 'rejected') entry.rejectionReason = c.rejectionReason;
      if (['pinned','queued'].includes(c.status)) entry.commit = c.commit;
      if (['pinned','queued'].includes(c.status) && c.notes) entry.notes = c.notes;
      if (c.status === 'queued') entry.queuePosition = positions[c.id]; return entry;
    });
    const queue = this.queueEntries().map(({candidate:c,position}) => ({ position, name:c.name, difficulty:c.difficulty, clusterId:c.clusterId, commit:c.commit }));
    return { schemaVersion:'sourcing-pack/v1', generatedAt: at || new Date().toISOString(), quotaFillPercent:this.quotaFillPercent, queue, candidates, quota:this.quota.map((cell) => ({language:cell.language,band:cell.band,achieved:cell.achieved,target:cell.target})), timeline:this.timeline.map((entry) => ({...entry})) };
  }
  // generatedAt is a volatile timestamp; exclude it so the integrity fingerprint
  // is stable for identical session state instead of churning on every re-render.
  packHash(pack) { const { generatedAt, ...stable } = pack; return fnvHex(JSON.stringify(stable)); }
  packFingerprint() { return this.packHash(this.exportPack('')); }
  takeSnapshot() {
    const pack = deepCopy(this.exportPack(''));
    const fingerprint = this.packHash(pack);
    this.snapshots.push({ id: crypto.randomUUID(), label: `Snapshot ${this.snapshots.length + 1}`, at: new Date().toISOString(), fingerprint, pack });
    if (this.snapshots.length > 4) this.snapshots.shift();
    return fingerprint;
  }
  get snapshotDiff() {
    if (this.snapshots.length < 2) return null;
    const older = this.snapshots.at(-2), newer = this.snapshots.at(-1);
    const lines = [];
    const beforeByName = new Map(older.pack.candidates.map((c) => [c.name, c]));
    const afterByName = new Map(newer.pack.candidates.map((c) => [c.name, c]));
    for (const [name, c] of afterByName) {
      const prev = beforeByName.get(name);
      if (!prev) lines.push(`+ ${name} joins the pack as ${c.status}`);
      else if (prev.status !== c.status) lines.push(`${name}: ${prev.status} → ${c.status}`);
    }
    for (const [name] of beforeByName) if (!afterByName.has(name)) lines.push(`- ${name} leaves the pack`);
    const beforeQueue = older.pack.queue.map((q) => q.name).join(' › ') || 'empty';
    const afterQueue = newer.pack.queue.map((q) => q.name).join(' › ') || 'empty';
    if (beforeQueue !== afterQueue) lines.push(`Queue order: ${beforeQueue} → ${afterQueue}`);
    if (older.pack.quotaFillPercent !== newer.pack.quotaFillPercent) lines.push(`Quota fill: ${older.pack.quotaFillPercent}% → ${newer.pack.quotaFillPercent}%`);
    return { older, newer, lines: lines.length ? lines : ['No differences between the last two snapshots.'] };
  }
  bulkDiff(targetStatus) {
    if (this.selectedIds.length === 0) return null;
    return this.selectedIds.map(id => {
      const c = this.find(id);
      return `${c.name}: ${c.status} → ${targetStatus}`;
    }).join('\n');
  }
  importDiff(raw) {
    let data; try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
    const parsed = packSchema.safeParse(data); if (!parsed.success) return null;
    const incoming = parsed.data;
    const lines = [];
    const currentByName = new Map(this.candidates.map((c) => [c.name, c]));
    const incomingNames = new Set(incoming.candidates.map((c) => c.name));
    for (const item of incoming.candidates) {
      const prev = currentByName.get(item.name);
      if (!prev) lines.push(`+ ${item.name} joins as ${item.status}`);
      else if (prev.status !== item.status) lines.push(`${item.name}: ${prev.status} → ${item.status}`);
    }
    for (const [name] of currentByName) if (!incomingNames.has(name)) lines.push(`- ${name} leaves the pack`);
    const currentPosition = new Map(this.queue.map((id, index) => [this.find(id)?.name, index + 1]));
    for (const q of incoming.queue) {
      const prev = currentPosition.get(q.name);
      if (prev === undefined) lines.push(`Queue: ${q.name} enters at position ${q.position}`);
      else if (prev !== q.position) lines.push(`Queue: ${q.name} moves from position ${prev} to ${q.position}`);
    }
    for (const [name, position] of currentPosition) {
      if (!incoming.queue.some((q) => q.name === name)) lines.push(`Queue: ${name} leaves the queue (was position ${position})`);
    }
    return { changes: lines.slice(0, 9), extra: Math.max(0, lines.length - 9), candidateCount: incoming.candidates.length, queueCount: incoming.queue.length };
  }
  exportText(format, at) {
    if (format === 'queue-json') return JSON.stringify(this.exportPack(at),null,2);
    if (format === 'candidates-csv') {
      const position = Object.fromEntries(this.queue.map((id,index) => [id,index+1])); const quote = (value) => `"${String(value ?? '').replaceAll('"','""')}"`;
      const keys = ['name','language','stars','difficulty','category','clusterId','license','status','rejectionReason','commit','notes','queuePosition'];
      return [keys.join(','), ...this.visibleCandidates.map((c) => keys.map((key) => quote(key === 'queuePosition' ? position[c.id] ?? '' : c[key] ?? '')).join(','))].join('\n');
    }
    const unfilled = this.quota.filter((cell) => cell.achieved < cell.target).map((cell) => `- ${cell.language} / ${titleCase(cell.band)}: ${cell.achieved} of ${cell.target}`).join('\n') || '- All quota cells are filled.';
    const queue = this.queueEntries().map(({candidate,position}) => `${position}. \`${candidate.name}\` — ${candidate.difficulty.toFixed(1)} · ${candidate.clusterId}`).join('\n') || 'No repositories queued.';
    const counts = STATUSES.map((status) => `- ${titleCase(status)}: ${this.rollups[status]}`).join('\n');
    return `# Sourcebench sourcing report\n\nQuota fill: **${this.quotaFillPercent}%**\n\n## Build queue\n\n${queue}\n\n## Status counts\n\n${counts}\n\n## Unfilled quota\n\n${unfilled}`;
  }
  importPack(raw) {
    let data; try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return { ok:false,error:'JSON field: enter a valid JSON document.' }; }
    const parsed = packSchema.safeParse(data); if (!parsed.success) { const issue = parsed.error.issues[0]; const field = issue.path[issue.path.length-1] || 'document'; return { ok:false,error:`${field} field: ${issue.message}` }; }
    const incoming = parsed.data;
    const result = this.transact(() => {
      const existingByName = new Map(this.candidates.map((c) => [c.name,c]));
      const rebuilt = incoming.candidates.map((item) => {
        const existing = existingByName.get(item.name); return { id:existing?.id ?? crypto.randomUUID(), ...item, rejectionReason:item.rejectionReason ?? '', commit:item.commit ?? '', notes:item.notes ?? '', guardMessage:'', fresh:false };
      });
      const byName = new Map(rebuilt.map((c) => [c.name,c]));
      for (const queueEntry of incoming.queue) if (!byName.has(queueEntry.name) || byName.get(queueEntry.name).status !== 'queued') return false;
      this.candidates = rebuilt; this.queue = [...incoming.queue].sort((a,b) => a.position-b.position).map((entry) => byName.get(entry.name).id);
      this.timeline = deepCopy(incoming.timeline); this.timeline.push({ at:new Date().toISOString(), name:'Sourcing pack import', fromStatus:'candidate', toStatus:'scored' }); return true;
    });
    if (!result) return { ok:false,error:'queue field: every queue entry must name a queued candidate.' };
    this.notify(`Import applied: ${incoming.candidates.length} candidates and ${incoming.queue.length} queue entries.`); return { ok:true,error:'' };
  }
}

export const app = new AppState();
app.recordFill();
const SEEDED_SAMPLE_PACK = JSON.stringify(app.exportPack(), null, 2);
export const samplePack = () => SEEDED_SAMPLE_PACK;
