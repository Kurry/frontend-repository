import {
  DatasetStudioPackageSchema,
  FoilUpsertSchema,
  HarvestPendingJustificationSchema,
  NegativeCriterionSchema,
  PackageManifestSchema,
  PositiveCriterionSchema,
  RejectSeedSchema,
  deferenceProfiles,
  failureModes,
  negativeClasses,
  rejectClasses,
  repositories,
  type DatasetSnapshot,
  type DatasetStudioPackage,
  type FoilUpsert,
  type NegativeCriterion,
  type PackageManifest,
  type PositiveCriterion,
  type RejectSeed
} from './schemas';

export type Status = 'draft' | 'authored' | 'rejected' | 'harvest-pending';
export type EventType = 'transition' | 'save' | 'harvest' | 'export' | 'triage';

export interface TimelineEvent {
  id: string;
  type: EventType;
  label: string;
  timestamp: string;
}

export interface HarvestStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  attempt: number;
  backoff: number;
  completedAt?: string;
  error?: string;
}

export interface AuthoringPackage {
  questionText: string;
  checklist: boolean[];
  positiveCriteria: PositiveCriterion[];
  negativeCriteria: NegativeCriterion[];
  foils: FoilUpsert[];
  golden: { status: 'none' | 'present' | 'harvest-pending'; value: string };
  harvest: {
    running: boolean;
    paused: boolean;
    startedAt?: number;
    steps: HarvestStep[];
  };
}

export interface Seed {
  id: string;
  repository: (typeof repositories)[number];
  language: string;
  kind: 'issue' | 'pr';
  title: string;
  status: Status;
  difficulty: 'hard' | 'unset';
  deferenceProfile: (typeof deferenceProfiles)[number];
  failureModel: (typeof failureModes)[number];
  rejectClass?: (typeof rejectClasses)[number];
  pinnedCommit: string;
  authoring: AuthoringPackage;
  timeline: TimelineEvent[];
  timelineFilter: 'all' | EventType;
}

export interface QueueFilters {
  status: string;
  language: string;
  repository: string;
  difficulty: string;
}

const repoLanguages: Record<string, string> = {
  'quartz-orm': 'TypeScript',
  copperline: 'Go',
  'lattice-db': 'Rust',
  brineworks: 'Python',
  fernwheel: 'Ruby',
  ashgrid: 'Java'
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const titleBank = [
  'Connection pool exhausts when nested transactions roll back',
  'Cancellation leaves the retry coordinator holding a stale lease',
  'Schema cache returns fields from the previous migration epoch',
  'Replica handoff skips tombstones at the segment boundary',
  'Async validation masks the original constraint failure',
  'Prepared statement eviction races with connection checkout',
  'Incremental compaction replays one page out of order',
  'Unicode identifiers corrupt the generated query alias',
  'Read-only transactions still allocate a writer permit',
  'Deadline propagation stops at the batching adapter',
  'Recovery scan accepts a partially written checkpoint'
];

const statusFor = (index: number): Status => {
  if (index < 26) return 'draft';
  if (index < 43) return 'authored';
  if (index < 56) return 'rejected';
  return 'harvest-pending';
};

const event = (type: EventType, label: string, offset = 0): TimelineEvent => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  label,
  timestamp: new Date(Date.now() + offset).toISOString()
});

const makePositive = (repo: string): PositiveCriterion[] => [
  { id: '1.1', name: 'Locate the failure boundary', weight: 2, description: `Identifies the ${repo} subsystem where the observed state first diverges.` },
  { id: '1.2', name: 'Trace the control flow', weight: 2.5, description: 'Explains the call sequence and state transitions that reproduce the failure.' },
  { id: '1.3', name: 'State the violated invariant', weight: 2, description: 'Names the invariant that the implementation breaks under the reported conditions.' },
  { id: '1.4', name: 'Runtime evidence at pinned commit', weight: 4, description: 'Cites evidence captured by executing the code at the pinned commit.' },
  { id: '1.5', name: 'Bound the regression', weight: 1.5, description: 'Distinguishes the failing path from adjacent behavior that remains correct.' }
];

const seededFoils = (repo: string): FoilUpsert[] => [
  { answerText: `The ${repo} configuration parser drops the pool limit before startup.`, failureMode: 'wrong-answer', expectsFailIds: ['1.1', '2.1'], correctnessCap: 18 },
  { answerText: 'The report is correct because the stack trace resembles a timeout, but no execution evidence is needed.', failureMode: 'no-runtime-evidence', expectsFailIds: ['1.4'], correctnessCap: 24 },
  { answerText: 'Replace the transaction wrapper without investigating the state transition that leaked the lease.', failureMode: 'off-target', expectsFailIds: ['1.2', '1.3'], correctnessCap: 20 }
];

const makeAuthoring = (status: Status, repo: string, title: string): AuthoringPackage => {
  const populated = status === 'authored' || status === 'harvest-pending';
  return {
    questionText: populated ? `At the pinned commit, what interaction in ${repo} causes “${title}”, and what runtime evidence confirms the responsible state transition?` : '',
    checklist: populated ? [true, true, true, true] : [false, false, false, false],
    positiveCriteria: makePositive(repo),
    negativeCriteria: [{ id: '2.1', name: 'Accepts the surface premise', class: 'false-premise-acceptance', description: 'Treats the reported component as the cause without tracing the actual state owner.' }],
    foils: populated ? seededFoils(repo) : [],
    golden: status === 'authored'
      ? { status: 'present', value: `Runtime tracing at the pinned commit shows that the rollback path retains a lifecycle token after the inner scope closes. The next checkout waits on that unreleased state; the captured trace and counter delta identify the owning transition and bound the regression.` }
      : status === 'harvest-pending'
        ? { status: 'harvest-pending', value: 'The reproduction environment requires a deterministic integration fixture before runtime evidence can be captured.' }
        : { status: 'none', value: '' },
    harvest: { running: false, paused: false, steps: [] }
  };
};

const createSeeds = (): Seed[] => Array.from({ length: 66 }, (_, index) => {
  const repository = repositories[index % repositories.length];
  const kind: 'issue' | 'pr' = index % 3 === 1 ? 'pr' : 'issue';
  const number = 142 + index * 7;
  const id = `${repository}-${kind}-${number}`;
  const status = statusFor(index);
  const base = titleBank[index % titleBank.length];
  const title = index === 0 ? titleBank[0] : `${base} in ${repository}`;
  const seed: Seed = {
    id,
    repository,
    language: repoLanguages[repository],
    kind,
    title,
    status,
    difficulty: index > 0 && index % 4 === 0 ? 'hard' : 'unset',
    deferenceProfile: deferenceProfiles[index % deferenceProfiles.length],
    failureModel: failureModes[index % failureModes.length],
    pinnedCommit: (index + 1).toString(16).padStart(40, '0'),
    authoring: makeAuthoring(status, repository, title),
    timeline: [event('transition', `Seed entered ${status}`)],
    timelineFilter: 'all'
  };
  if (status === 'rejected') seed.rejectClass = rejectClasses[index % rejectClasses.length];
  return seed;
});

type TriageSnapshot = { id: string; status: Status; rejectClass?: Seed['rejectClass']; timeline: TimelineEvent[] };

export class StudioState {
  seeds = $state<Seed[]>(createSeeds());
  activeView = $state<'queue' | 'workbench'>('queue');
  activeSeedId = $state<string | null>(null);
  filters = $state<QueueFilters>({ status: '', language: '', repository: '', difficulty: '' });
  search = $state('');
  sortKey = $state<'id' | 'repository' | 'language' | 'status' | 'title'>('id');
  sortDirection = $state<'asc' | 'desc'>('asc');
  savedFilters = $state<Array<{ id: string; name: string; filters: QueueFilters; search: string }>>([]);
  selectedIds = $state<string[]>([]);
  lastTriage = $state<TriageSnapshot[] | null>(null);
  activePane = $state<'question' | 'positive' | 'negative' | 'foils' | 'golden'>('question');
  highlightedCriterion = $state<string | null>(null);
  toast = $state('');
  ariaMessage = $state('');
  exportOpen = $state(false);
  exportTab = $state<'manifest' | 'snapshot' | 'studio'>('manifest');
  exportGeneratedAt = $state(new Date().toISOString());
  importOpen = $state(false);
  importText = $state('');
  importError = $state('');
  rejectOpen = $state(false);
  rejectMode = $state<'single' | 'batch'>('single');
  rejectTargetIds = $state<string[]>([]);
  foilEditorOpen = $state(false);
  foilEditingIndex = $state<number | null>(null);
  gateWasClear = $state(false);
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  get activeSeed() { return this.seeds.find((seed) => seed.id === this.activeSeedId) ?? null; }
  get languages() { return [...new Set(this.seeds.map((seed) => seed.language))]; }

  get visibleSeeds() {
    const query = this.search.trim().toLowerCase();
    const filtered = this.seeds.filter((seed) =>
      (!this.filters.status || seed.status === this.filters.status) &&
      (!this.filters.language || seed.language === this.filters.language) &&
      (!this.filters.repository || seed.repository === this.filters.repository) &&
      (!this.filters.difficulty || seed.difficulty === this.filters.difficulty) &&
      (!query || seed.id.toLowerCase().includes(query) || seed.title.toLowerCase().includes(query))
    );
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => String(a[this.sortKey]).localeCompare(String(b[this.sortKey])) * direction);
  }

  get activeFilterParts() {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(this.filters)) if (value) parts.push(`${key}: ${value}`);
    if (this.search.trim()) parts.push(`search: “${this.search.trim()}”`);
    return parts;
  }

  get rollup() {
    const byStatus: Record<Status, number> = { draft: 0, authored: 0, rejected: 0, 'harvest-pending': 0 };
    const byLanguage: Record<string, number> = {};
    const byRepository: Record<string, number> = {};
    const rejectedByClass: Record<string, number> = Object.fromEntries(rejectClasses.map((value) => [value, 0]));
    for (const seed of this.seeds) {
      byStatus[seed.status]++;
      byLanguage[seed.language] = (byLanguage[seed.language] ?? 0) + 1;
      byRepository[seed.repository] = (byRepository[seed.repository] ?? 0) + 1;
      if (seed.status === 'rejected' && seed.rejectClass) rejectedByClass[seed.rejectClass]++;
    }
    return { byStatus, byLanguage, byRepository, rejectedByClass };
  }

  sortBy(key: StudioState['sortKey']) {
    if (this.sortKey === key) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDirection = 'asc'; }
  }

  clearFilters() {
    this.filters = { status: '', language: '', repository: '', difficulty: '' };
    this.search = '';
  }

  applyRollupFilter(key: 'status' | 'language' | 'repository', value: string, status?: string) {
    this.clearFilters();
    this.filters[key] = value;
    if (status) this.filters.status = status;
    this.activeView = 'queue';
  }

  saveCurrentFilter(name?: string) {
    if (!this.activeFilterParts.length) return;
    const label = name?.trim() || this.activeFilterParts.join(' · ');
    this.savedFilters.push({ id: crypto.randomUUID(), name: label, filters: { ...this.filters }, search: this.search });
    this.showToast('Filter saved');
  }

  applySaved(id: string) {
    const saved = this.savedFilters.find((item) => item.id === id);
    if (!saved) return;
    this.filters = { ...saved.filters };
    this.search = saved.search;
  }

  removeSaved(id: string) { this.savedFilters = this.savedFilters.filter((item) => item.id !== id); }
  toggleSelection(id: string) { this.selectedIds = this.selectedIds.includes(id) ? this.selectedIds.filter((value) => value !== id) : [...this.selectedIds, id]; }
  clearSelection() { this.selectedIds = []; }

  openSeed(id: string) {
    this.activeSeedId = id;
    this.activeView = 'workbench';
    this.activePane = 'question';
  }

  private capture(ids: string[]) {
    this.lastTriage = ids.map((id) => {
      const seed = this.seeds.find((item) => item.id === id)!;
      return { id, status: seed.status, rejectClass: seed.rejectClass, timeline: clone(seed.timeline) };
    });
  }

  accept(ids: string[], open = false) {
    const targets = this.seeds.filter((seed) => ids.includes(seed.id) && seed.status === 'draft');
    if (!targets.length) return false;
    this.capture(targets.map((seed) => seed.id));
    for (const seed of targets) {
      seed.status = 'harvest-pending';
      seed.rejectClass = undefined;
      seed.timeline.push(event('triage', 'Accepted for authoring'));
      seed.timeline.push(event('transition', 'Status changed from draft to harvest-pending'));
    }
    this.selectedIds = [];
    this.ariaMessage = `${targets.length} seed${targets.length === 1 ? '' : 's'} accepted for authoring`;
    if (open && targets[0]) this.openSeed(targets[0].id);
    return true;
  }

  reject(ids: string[], payload: RejectSeed) {
    const parsed = RejectSeedSchema.safeParse(payload);
    if (!parsed.success) return parsed.error.issues[0]?.message ?? 'RejectSeed is invalid';
    const targets = this.seeds.filter((seed) => ids.includes(seed.id) && seed.status === 'draft');
    if (!targets.length) return 'Only draft seeds can be rejected';
    this.capture(targets.map((seed) => seed.id));
    for (const seed of targets) {
      seed.status = 'rejected';
      seed.rejectClass = parsed.data.rejectClass;
      seed.timeline.push(event('triage', `Rejected as ${parsed.data.rejectClass}: ${parsed.data.justification}`));
      seed.timeline.push(event('transition', 'Status changed from draft to rejected'));
    }
    this.selectedIds = [];
    this.rejectOpen = false;
    this.ariaMessage = `${targets.length} seed${targets.length === 1 ? '' : 's'} rejected`;
    return null;
  }

  undoTriage() {
    if (!this.lastTriage) return false;
    for (const snapshot of this.lastTriage) {
      const seed = this.seeds.find((item) => item.id === snapshot.id);
      if (!seed) continue;
      seed.status = snapshot.status;
      seed.rejectClass = snapshot.rejectClass;
      seed.timeline = clone(snapshot.timeline);
    }
    this.lastTriage = null;
    this.ariaMessage = 'Last triage action undone';
    this.showToast('Last triage action undone');
    return true;
  }

  gateConditions(seed: Seed) {
    const ids = new Set([...seed.authoring.positiveCriteria, ...seed.authoring.negativeCriteria].map((criterion) => criterion.id));
    const dangling = [...new Set(seed.authoring.foils.flatMap((foil) => foil.expectsFailIds.filter((id) => !ids.has(id))))];
    const conditions: string[] = [];
    if (!seed.authoring.questionText.trim()) conditions.push('Question text present');
    if (seed.authoring.foils.length < 3) conditions.push('At least 3 foils');
    if (dangling.length) conditions.push(`Every foil expects-fail id resolves (${dangling.join(', ')} missing)`);
    if (!(seed.authoring.golden.status === 'present' && seed.authoring.golden.value.trim()) && !(seed.authoring.golden.status === 'harvest-pending' && seed.authoring.golden.value.trim().length >= 20)) conditions.push('Golden answer present or harvest-pending justified');
    return conditions;
  }

  danglingIds(seed: Seed, foil: FoilUpsert) {
    const ids = new Set([...seed.authoring.positiveCriteria, ...seed.authoring.negativeCriteria].map((criterion) => criterion.id));
    return foil.expectsFailIds.filter((id) => !ids.has(id));
  }

  markAuthored(seed: Seed) {
    if (seed.status === 'authored' || this.gateConditions(seed).length) return false;
    const previous = seed.status;
    seed.status = 'authored';
    seed.timeline.push(event('transition', `Status changed from ${previous} to authored`));
    this.ariaMessage = `${seed.id} marked authored`;
    this.showToast('Seed marked authored');
    return true;
  }

  saveAuthoring(seed: Seed) {
    seed.timeline.push(event('save', 'Authoring workbench saved'));
    this.showToast('Authoring changes saved');
  }

  addPositive(seed: Seed) {
    let next = 1;
    const taken = new Set(seed.authoring.positiveCriteria.map((criterion) => criterion.id));
    while (taken.has(`1.${next}`)) next++;
    seed.authoring.positiveCriteria.push({ id: `1.${next}`, name: 'New investigation criterion', weight: 1, description: 'Describe the evidence a strong answer must provide.' });
  }

  deletePositive(seed: Seed, id: string) {
    if (id === '1.4') { this.showToast('Criterion 1.4 is the locked runtime-evidence gate and cannot be deleted'); return false; }
    seed.authoring.positiveCriteria = seed.authoring.positiveCriteria.filter((criterion) => criterion.id !== id);
    return true;
  }

  addNegative(seed: Seed) {
    let next = 1;
    const taken = new Set(seed.authoring.negativeCriteria.map((criterion) => criterion.id));
    while (taken.has(`2.${next}`)) next++;
    seed.authoring.negativeCriteria.push({ id: `2.${next}`, name: 'New failure criterion', class: 'wrong-subsystem', description: 'Describe the answer pattern that must count against correctness.' });
  }

  deleteNegative(seed: Seed, id: string) { seed.authoring.negativeCriteria = seed.authoring.negativeCriteria.filter((criterion) => criterion.id !== id); }

  upsertFoil(seed: Seed, foil: FoilUpsert, index: number | null) {
    const parsed = FoilUpsertSchema.safeParse(foil);
    if (!parsed.success) return parsed.error.issues;
    const validIds = new Set([...seed.authoring.positiveCriteria, ...seed.authoring.negativeCriteria].map((criterion) => criterion.id));
    const invalid = parsed.data.expectsFailIds.find((id) => !validIds.has(id));
    if (invalid) return [{ path: ['expectsFailIds'], message: `expectsFailIds contains unavailable criterion ${invalid}` }];
    if (index === null) seed.authoring.foils.push(parsed.data);
    else seed.authoring.foils[index] = parsed.data;
    this.foilEditorOpen = false;
    return [];
  }

  deleteFoil(seed: Seed, index: number) { seed.authoring.foils.splice(index, 1); }

  setHarvestPending(seed: Seed, justification: string) {
    const parsed = HarvestPendingJustificationSchema.safeParse({ justification });
    if (!parsed.success) return parsed.error.issues[0]?.message ?? 'justification is invalid';
    seed.authoring.golden = { status: 'harvest-pending', value: parsed.data.justification };
    if (seed.status === 'draft') {
      seed.status = 'harvest-pending';
      seed.timeline.push(event('transition', 'Status changed from draft to harvest-pending'));
    }
    this.ariaMessage = 'Golden answer set to harvest-pending';
    return null;
  }

  startHarvest(seed: Seed) {
    if (seed.authoring.harvest.running) return false;
    seed.authoring.harvest = {
      running: true,
      paused: false,
      startedAt: Date.now(),
      steps: ['clone at pinned commit', 'install dependencies', 'reproduce failure', 'capture runtime evidence', 'distill golden answer'].map((name) => ({ name, status: 'pending', attempt: 1, backoff: 0 }))
    };
    seed.timeline.push(event('harvest', 'Harvest started'));
    this.advanceHarvest(seed.id);
    return true;
  }

  private advanceHarvest(seedId: string) {
    const seed = this.seeds.find((item) => item.id === seedId);
    if (!seed || !seed.authoring.harvest.running || seed.authoring.harvest.paused) return;
    const stepIndex = seed.authoring.harvest.steps.findIndex((step) => step.status !== 'complete');
    if (stepIndex === -1) {
      seed.authoring.harvest.running = false;
      seed.authoring.harvest.paused = false;
      const elapsed = ((Date.now() - (seed.authoring.harvest.startedAt ?? Date.now())) / 1000).toFixed(1);
      seed.authoring.golden = { status: 'present', value: `Runtime evidence from the pinned commit shows the failing lifecycle transition retains ownership after rollback. A trace captured during reproduction links the unreleased token to the next blocked checkout; counters before and after the transition confirm the invariant violation. Harvest completed in ${elapsed} seconds.` };
      seed.timeline.push(event('harvest', 'Harvest completed and golden answer drafted'));
      this.ariaMessage = 'Harvest completed; golden answer draft is ready';
      this.showToast('Harvest completed');
      return;
    }
    const step = seed.authoring.harvest.steps[stepIndex];
    if (step.status === 'failed') return;
    step.status = 'running';
    const delay = 480 + Math.floor(Math.random() * 420);
    const timer = setTimeout(() => {
      const currentSeed = this.seeds.find((item) => item.id === seedId);
      if (!currentSeed || !currentSeed.authoring.harvest.running) return;
      if (currentSeed.authoring.harvest.paused) { currentSeed.authoring.harvest.steps[stepIndex].status = 'pending'; return; }
      const current = currentSeed.authoring.harvest.steps[stepIndex];
      const shouldRetry = stepIndex === 2 && Math.random() < 0.38;
      if (shouldRetry) {
        if (current.attempt >= 3) {
          current.status = 'failed';
          current.error = 'The reproduction fixture did not produce a stable failure after 3 attempts.';
          currentSeed.authoring.harvest.running = false;
          currentSeed.timeline.push(event('harvest', 'Harvest failed while reproducing the reported failure'));
          this.ariaMessage = 'Harvest step reproduce failure entered the failed state';
          return;
        }
        current.status = 'pending';
        current.attempt++;
        current.backoff = 2;
        currentSeed.timeline.push(event('harvest', `Reproduce failure step scheduled for automatic retry ${current.attempt} of 3`));
        this.retryCountdown(seedId, stepIndex);
        return;
      }
      current.status = 'complete';
      current.completedAt = new Date().toISOString();
      current.error = undefined;
      this.advanceHarvest(seedId);
    }, delay);
    this.timers.set(seedId, timer);
  }

  private retryCountdown(seedId: string, stepIndex: number) {
    const seed = this.seeds.find((item) => item.id === seedId);
    if (!seed) return;
    const step = seed.authoring.harvest.steps[stepIndex];
    if (seed.authoring.harvest.paused) return;
    if (step.backoff <= 0) { this.advanceHarvest(seedId); return; }
    const timer = setTimeout(() => { step.backoff--; this.retryCountdown(seedId, stepIndex); }, 1000);
    this.timers.set(seedId, timer);
  }

  pauseHarvest(seed: Seed) {
    if (!seed.authoring.harvest.running || seed.authoring.harvest.paused) return false;
    seed.authoring.harvest.paused = true;
    seed.timeline.push(event('harvest', 'Harvest paused'));
    return true;
  }

  resumeHarvest(seed: Seed) {
    if (!seed.authoring.harvest.running || !seed.authoring.harvest.paused) return false;
    seed.authoring.harvest.paused = false;
    seed.timeline.push(event('harvest', 'Harvest resumed'));
    const running = seed.authoring.harvest.steps.find((step) => step.status === 'running');
    if (running) running.status = 'pending';
    this.advanceHarvest(seed.id);
    return true;
  }

  retryHarvest(seed: Seed, index: number) {
    const step = seed.authoring.harvest.steps[index];
    if (!step || step.status !== 'failed') return;
    step.status = 'pending'; step.error = undefined; step.attempt = 1; step.backoff = 0;
    seed.authoring.harvest.running = true;
    this.advanceHarvest(seed.id);
  }

  jumpToCriterion(id: string) {
    this.activePane = id.startsWith('1.') ? 'positive' : 'negative';
    this.highlightedCriterion = id;
    setTimeout(() => { this.highlightedCriterion = null; }, 1600);
    setTimeout(() => document.getElementById(`criterion-${id.replace('.', '-')}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }), 40);
  }

  packageManifest(seed: Seed): PackageManifest {
    const goldenStatus = seed.authoring.golden.status === 'harvest-pending' ? 'harvest-pending' : 'present';
    return {
      schemaVersion: 'seed-package-manifest-v1',
      seedId: seed.id,
      repository: seed.repository,
      pinnedCommit: seed.pinnedCommit,
      language: seed.language,
      kind: seed.kind,
      title: seed.title.trim(),
      difficulty: seed.difficulty,
      deferenceProfile: seed.deferenceProfile,
      failureModel: seed.failureModel,
      questionText: seed.authoring.questionText.trim(),
      positiveCriteria: clone(seed.authoring.positiveCriteria),
      negativeCriteria: clone(seed.authoring.negativeCriteria),
      foils: clone(seed.authoring.foils),
      goldenAnswer: { status: goldenStatus, value: seed.authoring.golden.value }
    };
  }

  snapshot(): DatasetSnapshot {
    const now = this.exportGeneratedAt;
    return {
      schemaVersion: 'dataset-snapshot-v1',
      totalSeeds: this.seeds.length,
      byStatus: { ...this.rollup.byStatus },
      byLanguage: { ...this.rollup.byLanguage },
      byRepository: { ...this.rollup.byRepository },
      rejectedByClass: { ...this.rollup.rejectedByClass } as DatasetSnapshot['rejectedByClass'],
      generatedAt: now
    };
  }

  studioPackage(): DatasetStudioPackage {
    const packages = this.seeds.filter((seed) => seed.status === 'authored').map((seed) => this.packageManifest(seed));
    return { schemaVersion: 'seed-dataset-studio-v1', studio: 'Seed Dataset Studio', packages, snapshot: this.snapshot(), generatedAt: this.exportGeneratedAt };
  }

  preview(tab: 'manifest' | 'snapshot' | 'studio') {
    if (tab === 'manifest') return this.activeSeed ? JSON.stringify(this.packageManifest(this.activeSeed), null, 2) : JSON.stringify({ message: 'Select a seed to preview its package manifest.' }, null, 2);
    if (tab === 'snapshot') return JSON.stringify(this.snapshot(), null, 2);
    return JSON.stringify(this.studioPackage());
  }

  openExport(seedId?: string) {
    if (seedId) { this.activeSeedId = seedId; this.exportTab = 'manifest'; }
    else this.exportTab = 'studio';
    this.exportGeneratedAt = new Date().toISOString();
    this.exportOpen = true;
  }

  stampExport(format: string) {
    if (format === 'manifest' && this.activeSeed) this.activeSeed.timeline.push(event('export', 'Package manifest exported'));
  }

  importPackage(text: string) {
    let raw: unknown;
    try { raw = JSON.parse(text); }
    catch (error) { return `Import JSON parse error: ${(error as Error).message}`; }
    const parsed = DatasetStudioPackageSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return `Import field ${issue.path.join('.') || 'package'}: ${issue.message}`;
    }
    const data = parsed.data;
    if (data.snapshot.totalSeeds !== this.seeds.length) return `Import field snapshot.totalSeeds must equal ${this.seeds.length}`;
    const statusTotal = Object.values(data.snapshot.byStatus).reduce((sum, value) => sum + value, 0);
    if (statusTotal !== this.seeds.length) return 'Import field snapshot.byStatus must sum to totalSeeds';
    for (const [language, count] of Object.entries(data.snapshot.byLanguage)) if (count !== this.seeds.filter((seed) => seed.language === language).length) return `Import field snapshot.byLanguage.${language} does not match the seeded manifest`;
    for (const [repository, count] of Object.entries(data.snapshot.byRepository)) if (count !== this.seeds.filter((seed) => seed.repository === repository).length) return `Import field snapshot.byRepository.${repository} does not match the seeded manifest`;
    if (data.packages.length > data.snapshot.byStatus.authored) return 'Import field snapshot.byStatus.authored is smaller than packages length';
    const seen = new Set<string>();
    for (const manifest of data.packages) {
      if (seen.has(manifest.seedId)) return `Import field packages.seedId contains duplicate ${manifest.seedId}`;
      seen.add(manifest.seedId);
      const seed = this.seeds.find((item) => item.id === manifest.seedId);
      if (!seed) return `Import field packages.seedId names unknown seed ${manifest.seedId}`;
      if (seed.repository !== manifest.repository) return `Import field packages.${manifest.seedId}.repository does not match the seed`;
      const criterionIds = new Set([...manifest.positiveCriteria, ...manifest.negativeCriteria].map((criterion) => criterion.id));
      for (const [foilIndex, foil] of manifest.foils.entries()) {
        const missing = foil.expectsFailIds.find((id) => !criterionIds.has(id));
        if (missing) return `Import field packages.${manifest.seedId}.foils.${foilIndex}.expectsFailIds contains missing criterion ${missing}`;
      }
    }
    const rejectedSum = Object.values(data.snapshot.rejectedByClass).reduce((sum, value) => sum + value, 0);
    if (rejectedSum !== data.snapshot.byStatus.rejected) return 'Import field snapshot.rejectedByClass must sum to rejected status count';

    const packageMap = new Map(data.packages.map((manifest) => [manifest.seedId, manifest]));
    for (const manifest of data.packages) {
      const seed = this.seeds.find((item) => item.id === manifest.seedId)!;
      seed.title = manifest.title;
      seed.difficulty = manifest.difficulty;
      seed.deferenceProfile = manifest.deferenceProfile;
      seed.failureModel = manifest.failureModel;
      seed.authoring.questionText = manifest.questionText;
      seed.authoring.positiveCriteria = clone(manifest.positiveCriteria);
      seed.authoring.negativeCriteria = clone(manifest.negativeCriteria);
      seed.authoring.foils = clone(manifest.foils);
      seed.authoring.golden = { status: manifest.goldenAnswer.status, value: manifest.goldenAnswer.value };
      seed.authoring.harvest = { running: false, paused: false, steps: [] };
      seed.timeline.push(event('transition', 'Authored package restored by import'));
    }

    const remainingTargets: Array<[Status, number]> = [
      ['authored', data.snapshot.byStatus.authored - data.packages.length],
      ['draft', data.snapshot.byStatus.draft],
      ['rejected', data.snapshot.byStatus.rejected],
      ['harvest-pending', data.snapshot.byStatus['harvest-pending']]
    ];
    const remaining = this.seeds.filter((seed) => !packageMap.has(seed.id));
    let cursor = 0;
    for (const seed of this.seeds) if (packageMap.has(seed.id)) { seed.status = 'authored'; seed.rejectClass = undefined; }
    for (const [status, count] of remainingTargets) {
      for (let i = 0; i < count; i++) {
        const seed = remaining[cursor++];
        seed.status = status;
        seed.rejectClass = undefined;
      }
    }
    const rejectedSeeds = this.seeds.filter((seed) => seed.status === 'rejected');
    let rejectCursor = 0;
    for (const rejectClass of rejectClasses) {
      for (let i = 0; i < data.snapshot.rejectedByClass[rejectClass]; i++) rejectedSeeds[rejectCursor++].rejectClass = rejectClass;
    }
    this.exportGeneratedAt = new Date().toISOString();
    this.importOpen = false;
    this.importText = '';
    this.importError = '';
    this.selectedIds = [];
    this.showToast('Dataset studio package imported');
    this.ariaMessage = 'Dataset studio package imported successfully';
    return null;
  }

  validateEditorRecord(kind: 'positive' | 'negative', record: unknown) {
    return (kind === 'positive' ? PositiveCriterionSchema : NegativeCriterionSchema).safeParse(record);
  }

  showToast(message: string) {
    this.toast = message;
    setTimeout(() => { if (this.toast === message) this.toast = ''; }, 2600);
  }
}

export const studio = new StudioState();
