import {
  acceptancePackageSchema,
  gateNoteSchema,
  scoreFor,
  STAGE_NAMES,
  suitePasses,
  type AcceptancePackage,
  type GateNote,
  type GateRecord,
  type GateState,
  type NoteCategory,
  type RunRecord,
  type StageName,
  type StageRecord,
  type StageStatus,
  type TimelineEntry,
  type TimelineType
} from './contracts';
import { GATE_REGISTRY, seedRuns } from './seed';
import { SvelteSet } from 'svelte/reactivity';

type ChromeView = 'pipeline' | 'registry';
type ModalName = 'export' | 'import' | 'certificate' | null;
type RerunGateStatus = 'pending' | 'running' | 'pass' | 'fail';

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const now = () => new Date().toISOString();

function makeFingerprint(runId: string, stageName: StageName): string {
  const input = `${runId}:${stageName}:${Date.now()}`;
  let accumulator = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    accumulator ^= input.charCodeAt(index);
    accumulator = Math.imul(accumulator, 16777619);
  }
  const hex = (accumulator >>> 0).toString(16).padStart(8, '0');
  return `sha256:${(hex + 'c4a9e27b18d65f03').repeat(4).slice(0, 64)}`;
}

function issue(id: string, type: TimelineType, summary: string): TimelineEntry {
  return { id: `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, timestamp: now(), summary };
}

export class ConsoleStore {
  runs = $state<RunRecord[]>(seedRuns());
  selectedRunId = $state('RUN-2407-A91');
  selectedStageName = $state<StageName>('Test Generation');
  activeView = $state<ChromeView>('pipeline');
  modal = $state<ModalName>(null);
  certificateStageName = $state<StageName | null>(null);
  theme = $state<'light' | 'dark'>('light');
  severityFilter = $state<'all' | 'S1' | 'S2' | 'S3'>('all');
  timelineFilter = $state<'all' | TimelineType>('all');
  selectedRegistryGateId = $state<string | null>('SRC-101');
  runSearch = $state('');
  runSort = $state<'newest' | 'oldest'>('newest');
  expandedGates = new SvelteSet<string>();
  noteFormGateId = $state<string | null>(null);
  exportTab = $state<'json' | 'markdown'>('json');
  exportedAt = $state(now());
  importDraft = $state('');
  importError = $state('');
  toast = $state<{ id: number; message: string } | null>(null);
  whatIf = $state<{
    active: boolean;
    runId: string | null;
    stageName: StageName | null;
    values: Record<string, GateState>;
  }>({ active: false, runId: null, stageName: null, values: {} });
  rerun = $state<{
    active: boolean;
    runId: string | null;
    stageName: StageName | null;
    progress: number;
    gateStatuses: Record<string, RerunGateStatus>;
  }>({ active: false, runId: null, stageName: null, progress: 0, gateStatuses: {} });

  get selectedRun(): RunRecord {
    return this.runs.find((run) => run.id === this.selectedRunId) ?? this.runs[0];
  }

  get selectedStage(): StageRecord {
    return this.selectedRun.stages.find((stage) => stage.name === this.selectedStageName) ?? this.selectedRun.stages[0];
  }

  get visibleRuns(): RunRecord[] {
    const query = this.runSearch.trim().toLowerCase();
    return this.runs
      .filter((run) => !query || `${run.id} ${run.branch} ${run.commit}`.toLowerCase().includes(query))
      .toSorted((a, b) => this.runSort === 'newest'
        ? b.submittedAt.localeCompare(a.submittedAt)
        : a.submittedAt.localeCompare(b.submittedAt));
  }

  get registryGates() {
    return GATE_REGISTRY.filter((gate) => this.severityFilter === 'all' || gate.severity === this.severityFilter);
  }

  get selectedRegistryGate() {
    return GATE_REGISTRY.find((gate) => gate.id === this.selectedRegistryGateId) ?? null;
  }

  get visibleTimeline(): TimelineEntry[] {
    return this.selectedRun.timeline
      .filter((entry) => this.timelineFilter === 'all' || entry.type === this.timelineFilter)
      .toSorted((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  get displayedGates(): GateRecord[] {
    const stage = this.selectedStage;
    if (!this.whatIf.active || this.whatIf.runId !== this.selectedRun.id || this.whatIf.stageName !== stage.name) {
      return stage.gates;
    }
    return stage.gates.map((gate) => ({ ...gate, state: this.whatIf.values[gate.id] ?? gate.state }));
  }

  get displayedScore(): number {
    return scoreFor(this.displayedGates);
  }

  get displayedSuitePasses(): boolean {
    return suitePasses(this.selectedStage.aggregationMode, this.displayedGates);
  }

  get displayedStageStatus(): StageStatus {
    const simulatingThisStage = this.whatIf.active
      && this.whatIf.runId === this.selectedRun.id
      && this.whatIf.stageName === this.selectedStage.name;
    if (simulatingThisStage) return this.displayedSuitePasses ? 'passed' : 'rejected';
    return this.selectedStage.status;
  }

  get failingHardGates(): GateRecord[] {
    return this.displayedGates.filter((gate) => gate.severity === 'S1' && gate.state === 'fail');
  }

  get acceptancePackage(): AcceptancePackage {
    const run = this.selectedRun;
    return {
      schemaVersion: 'gate-console.acceptance-package.v1',
      exportedAt: this.exportedAt,
      runId: run.id,
      submittedAt: run.submittedAt,
      stages: run.stages.map((stage) => ({
        name: stage.name,
        status: stage.status,
        aggregationMode: stage.aggregationMode,
        scorePercent: stage.aggregationMode === 'weighted-mean' ? scoreFor(stage.gates) : null,
        gates: stage.gates.map((gate) => ({
          id: gate.id,
          name: gate.name,
          severity: gate.severity,
          state: gate.state,
          evidence: gate.evidence,
          notes: gate.notes.map((note) => ({ ...note }))
        })),
        certificate: stage.status === 'passed' ? stage.certificate : null
      })),
      timeline: run.timeline.map(({ type, timestamp, summary }) => ({ type, timestamp, summary }))
    } as AcceptancePackage;
  }

  get jsonPreview(): string {
    return JSON.stringify(this.acceptancePackage, null, 2);
  }

  get markdownPreview(): string {
    const run = this.selectedRun;
    const lines = [
      '# Certificate Chain', '',
      `Run: \`${run.id}\``,
      `Submitted: ${run.submittedAt}`, '',
      '## Pipeline stages', ''
    ];
    for (const stage of run.stages) {
      lines.push(`### ${stage.name} — ${stage.status.toUpperCase()}`, '');
      if (stage.status === 'passed' && stage.certificate) {
        lines.push(`Fingerprint: \`${stage.certificate.fingerprint}\``, `Issued: ${stage.certificate.issuedAt}`, '', 'Gate results:');
        stage.gates.forEach((gate) => lines.push(`- \`${gate.id}\` · ${gate.severity} · ${gate.state}`));
      } else {
        lines.push('Certificate: not issued');
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  selectRun(runId: string) {
    const run = this.runs.find((candidate) => candidate.id === runId);
    if (!run) return false;
    this.selectedRunId = run.id;
    this.selectedStageName = run.stages.find((stage) => stage.status === 'rejected')?.name ?? run.stages[0].name;
    this.activeView = 'pipeline';
    this.resetTransientStageState();
    return true;
  }

  selectStage(stageName: StageName) {
    if (!this.selectedRun.stages.some((stage) => stage.name === stageName)) return false;
    this.selectedStageName = stageName;
    this.activeView = 'pipeline';
    this.resetTransientStageState();
    return true;
  }

  resetTransientStageState() {
    this.revertWhatIf();
    this.expandedGates.clear();
    this.noteFormGateId = null;
  }

  toggleGateExpanded(gateId: string) {
    if (this.expandedGates.has(gateId)) this.expandedGates.delete(gateId);
    else this.expandedGates.add(gateId);
  }

  openNoteForm(gateId: string) {
    this.expandedGates.add(gateId);
    this.noteFormGateId = gateId;
  }

  closeNoteForm() {
    this.noteFormGateId = null;
  }

  enterWhatIf() {
    if (this.rerun.active) return false;
    this.whatIf = {
      active: true,
      runId: this.selectedRun.id,
      stageName: this.selectedStage.name,
      values: {}
    };
    return true;
  }

  revertWhatIf() {
    this.whatIf = { active: false, runId: null, stageName: null, values: {} };
  }

  toggleWhatIf() {
    if (this.whatIf.active) this.revertWhatIf();
    else this.enterWhatIf();
  }

  setSimulatedState(gateId: string, state: GateState) {
    if (!this.whatIf.active || this.whatIf.runId !== this.selectedRun.id || this.whatIf.stageName !== this.selectedStage.name) return false;
    const gate = this.selectedStage.gates.find((candidate) => candidate.id === gateId);
    if (!gate) return false;
    if (gate.state === state) delete this.whatIf.values[gateId];
    else this.whatIf.values[gateId] = state;
    return true;
  }

  flipSimulatedState(gateId: string) {
    const gate = this.displayedGates.find((candidate) => candidate.id === gateId);
    if (!gate) return false;
    return this.setSimulatedState(gateId, gate.state === 'pass' ? 'fail' : 'pass');
  }

  addNote(gateId: string, input: GateNote): boolean {
    const parsed = gateNoteSchema.safeParse(input);
    if (!parsed.success) return false;
    const gate = this.selectedStage.gates.find((candidate) => candidate.id === gateId);
    if (!gate) return false;
    gate.notes.push({ text: parsed.data.text, category: parsed.data.category, createdAt: now() });
    this.selectedRun.timeline.push(issue(this.selectedRun.id, 'note', `Note added to ${gate.id}: ${parsed.data.category}`));
    this.noteFormGateId = null;
    this.touchExport();
    this.showToast(`Note added to ${gate.id}`);
    return true;
  }

  deleteNote(gateId: string, noteIndex: number): boolean {
    const gate = this.selectedStage.gates.find((candidate) => candidate.id === gateId);
    if (!gate || !gate.notes[noteIndex]) return false;
    gate.notes.splice(noteIndex, 1);
    this.touchExport();
    this.showToast(`Note removed from ${gate.id}`);
    return true;
  }

  clearRunNotes() {
    let removed = 0;
    this.selectedRun.stages.forEach((stage) => stage.gates.forEach((gate) => {
      removed += gate.notes.length;
      gate.notes.splice(0, gate.notes.length);
    }));
    this.selectedRun.timeline = this.selectedRun.timeline.filter((entry) => entry.type !== 'note');
    if (removed) {
      this.touchExport();
      this.showToast(`${removed} note${removed === 1 ? '' : 's'} cleared`);
    }
  }

  async startRerun(stageName: StageName = this.selectedStage.name): Promise<boolean> {
    if (this.rerun.active) return false;
    const run = this.selectedRun;
    const stage = run.stages.find((candidate) => candidate.name === stageName);
    if (!stage) return false;
    this.revertWhatIf();
    this.noteFormGateId = null;
    const gateStatuses: Record<string, RerunGateStatus> = {};
    stage.gates.forEach((gate) => { gateStatuses[gate.id] = 'pending'; });
    this.rerun = { active: true, runId: run.id, stageName, progress: 0, gateStatuses };
    stage.status = 'running';
    stage.certificate = null;
    run.timeline.push(issue(run.id, 're-run', `${stageName} re-run started`));
    this.touchExport();

    const finalStates: GateState[] = stage.gates.map((gate) => {
      return gate.state;
    });

    for (let index = 0; index < stage.gates.length; index += 1) {
      const gate = stage.gates[index];
      this.rerun.gateStatuses[gate.id] = 'running';
      await wait(240);
      const state = finalStates[index];
      this.rerun.gateStatuses[gate.id] = state;
      this.rerun.progress = Math.round(((index + 1) / stage.gates.length) * 100);
      if (state === 'fail') {
        run.timeline.push(issue(run.id, 'rejection', `${stageName} re-run gate failed: ${gate.id} ${gate.name}`));
      }
      await wait(95);
    }

    stage.gates.forEach((gate, index) => {
      gate.state = finalStates[index];
      gate.evidence = finalStates[index] === 'pass'
        ? 'Re-run evidence satisfied the active policy snapshot and replaced the prior recorded result.'
        : 'Re-run evidence did not meet the active policy threshold; operator review is required.';
    });
    const passed = suitePasses(stage.aggregationMode, stage.gates);
    stage.status = passed ? 'passed' : 'rejected';
    if (passed) {
      stage.certificate = { fingerprint: makeFingerprint(run.id, stageName), issuedAt: now() };
      run.timeline.push(issue(run.id, 'certificate', `${stageName} re-run passed; certificate issued`));
    } else {
      stage.certificate = null;
      const failures = stage.gates.filter((gate) => gate.state === 'fail').map((gate) => gate.id).join(', ');
      run.timeline.push(issue(run.id, 'rejection', `${stageName} re-run rejected by ${failures}`));
    }
    run.timeline = [...run.timeline];
    this.rerun.active = false;
    this.touchExport();
    this.showToast(passed ? `${stageName} re-run passed` : `${stageName} re-run rejected`);
    return true;
  }

  openExport(format: 'json' | 'markdown' = 'json') {
    this.exportTab = format;
    this.touchExport();
    this.modal = 'export';
  }

  openImport() {
    this.importError = '';
    this.modal = 'import';
  }

  openCertificate(stageName: StageName = this.selectedStage.name) {
    const stage = this.selectedRun.stages.find((candidate) => candidate.name === stageName);
    if (!stage || stage.status !== 'passed' || !stage.certificate) return false;
    this.certificateStageName = stageName;
    this.modal = 'certificate';
    return true;
  }

  closeModal() {
    this.modal = null;
    this.certificateStageName = null;
  }

  importPackageText(text: string): { ok: true } | { ok: false; error: string } {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      this.importError = 'payload: JSON is malformed';
      return { ok: false, error: this.importError };
    }
    const parsed = acceptancePackageSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const field = first.path.length ? first.path.join('.') : 'payload';
      this.importError = `${field}: ${first.message}`;
      return { ok: false, error: this.importError };
    }
    const payload = parsed.data;
    const target = this.selectedRun;
    const newStages = payload.stages.map((stage) => ({
      name: stage.name,
      status: stage.status,
      aggregationMode: stage.aggregationMode,
      gates: stage.gates.map((gate) => ({
        id: gate.id,
        name: gate.name,
        severity: gate.severity,
        state: gate.state,
        evidence: gate.evidence,
        notes: gate.notes.map((note) => ({ text: note.text, category: note.category, createdAt: note.createdAt })),
        description: GATE_REGISTRY.find((definition) => definition.id === gate.id)?.description ?? 'Imported gate evidence record.'
      })),
      certificate: stage.certificate ? { ...stage.certificate } : null
    }));

    const index = this.runs.findIndex((r) => r.id === target.id);
    if (index !== -1) {
      this.runs[index] = {
        ...target,
        id: payload.runId,
        submittedAt: payload.submittedAt,
        stages: newStages,
        timeline: payload.timeline.map((entry, i) => ({ ...entry, id: `import-${i}-${Date.now()}` }))
      };
    }
    this.selectedRunId = payload.runId;
    this.selectedStageName = target.stages[0].name;
    this.importDraft = text;
    this.importError = '';
    this.resetTransientStageState();
    this.touchExport();
    this.closeModal();
    this.showToast(`Acceptance package imported for ${target.id}`);
    return { ok: true };
  }

  setTheme(theme: 'light' | 'dark') {
    this.theme = theme;
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }

  showToast(message: string) {
    const id = Date.now();
    this.toast = { id, message };
    setTimeout(() => {
      if (this.toast?.id === id) this.toast = null;
    }, 2200);
  }

  touchExport() {
    this.exportedAt = now();
  }
}

export const consoleStore = new ConsoleStore();
