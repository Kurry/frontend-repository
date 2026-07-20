import { CONDITIONS, REASONS, divergenceFor, verdictFor } from './types';
import type {
  AuditEvent,
  AuditType,
  Condition,
  Reason,
  RerunSession,
  Run,
  RunCount,
  RunResult,
  Suite,
  Test,
  Toast,
  Verdict,
} from './types';
import { seedSuites } from './seed';
import { reasonUpdateSchema, reportSchema, rerunRequestSchema, type TriageReport } from './schemas';

type VerdictFilter = Verdict | '';
type ReasonFilter = Reason | '';
type TimelineFilter = AuditType | '';
type SortDirection = 'none' | 'desc' | 'asc';

const cloneRuns = (runs: Run[]): Run[] => runs.map((run) => ({ ...run }));

class TriageStore {
  suites = $state<Suite[]>(seedSuites());
  selectedSuiteId = $state('suite-web-runtime');
  selectedTestId = $state('runtime › loads cached user policy');
  filters = $state<{ verdict: VerdictFilter; reason: ReasonFilter; search: string }>({
    verdict: '',
    reason: '',
    search: '',
  });
  sortDirection = $state<SortDirection>('none');
  timelineFilter = $state<TimelineFilter>('');
  theme = $state<'light' | 'dark'>('light');
  reruns = $state<Record<string, RerunSession>>({});
  exportOpen = $state(false);
  exportTab = $state<'quarantine-text' | 'triage-report-json'>('quarantine-text');
  exportTimestamp = $state(new Date().toISOString());
  importOpen = $state(false);
  importDraft = $state('');
  importError = $state('');
  openRerunTestId = $state<string | null>(null);
  toasts = $state<Toast[]>([]);
  liveMessage = $state('');

  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private auditSequence = 0;
  private toastSequence = 0;

  get activeSuite(): Suite {
    return this.suites.find((suite) => suite.id === this.selectedSuiteId) ?? this.suites[0];
  }

  get selectedTest(): Test | undefined {
    return this.activeSuite.tests.find((test) => test.id === this.selectedTestId);
  }

  get visibleTests(): Test[] {
    const search = this.filters.search.trim().toLowerCase();
    const filtered = this.activeSuite.tests.filter((test) => {
      return (
        (!this.filters.verdict || verdictFor(test.runs) === this.filters.verdict) &&
        (!this.filters.reason || test.reason === this.filters.reason) &&
        (!search || test.id.toLowerCase().includes(search))
      );
    });
    if (this.sortDirection === 'none') return filtered;
    const factor = this.sortDirection === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const delta = divergenceFor(a.runs) - divergenceFor(b.runs);
      return delta === 0 ? a.id.localeCompare(b.id) : delta * factor;
    });
  }

  get allFailTests(): Test[] {
    return this.activeSuite.tests.filter((test) => verdictFor(test.runs) === 'fail');
  }

  get flakyTests(): Test[] {
    return this.activeSuite.tests.filter((test) => verdictFor(test.runs) === 'flaky');
  }

  get keepCount(): number {
    return this.activeSuite.tests.filter((test) => verdictFor(test.runs) === 'keep').length;
  }

  get visibleAudit(): AuditEvent[] {
    const events = this.timelineFilter
      ? this.activeSuite.audit.filter((event) => event.type === this.timelineFilter)
      : this.activeSuite.audit;
    return [...events].reverse();
  }

  get activeRerun(): RerunSession | undefined {
    if (!this.selectedTestId) return undefined;
    return this.rerunFor(this.selectedTestId);
  }

  get quarantineText(): string {
    const allFail = this.allFailTests.map((test) => test.id);
    const flaky = this.flakyTests.map((test) => test.id);
    return ['ALL-FAIL', ...allFail, '', 'FLAKY', ...flaky].join('\n');
  }

  get report(): TriageReport {
    return {
      schemaVersion: 'flake-triage-report-v1',
      exportedAt: this.exportTimestamp,
      suiteId: this.activeSuite.id,
      suiteName: this.activeSuite.name,
      tests: this.activeSuite.tests.map((test) => ({
        id: test.id,
        verdict: verdictFor(test.runs),
        reason: test.reason,
        runs: test.runs.map((run) => ({ ...run })),
      })),
      quarantine: {
        allFail: this.allFailTests.map((test) => test.id),
        flaky: this.flakyTests.map((test) => test.id),
      },
    };
  }

  get reportText(): string {
    return JSON.stringify(this.report, null, 2);
  }

  selectSuite(suiteId: string): boolean {
    const suite = this.suites.find((candidate) => candidate.id === suiteId);
    if (!suite) return false;
    this.selectedSuiteId = suite.id;
    this.selectedTestId = suite.tests[0]?.id ?? '';
    this.openRerunTestId = null;
    this.timelineFilter = '';
    return true;
  }

  selectTest(testId: string): boolean {
    if (!this.activeSuite.tests.some((test) => test.id === testId)) return false;
    this.selectedTestId = testId;
    return true;
  }

  setVerdictFilter(value: string): boolean {
    if (value !== '' && !['keep', 'flaky', 'fail'].includes(value)) return false;
    this.filters.verdict = value as VerdictFilter;
    return true;
  }

  setReasonFilter(value: string): boolean {
    if (value !== '' && !REASONS.includes(value as Reason)) return false;
    this.filters.reason = value as ReasonFilter;
    return true;
  }

  setSearch(value: string): boolean {
    if (typeof value !== 'string' || value.length > 120) return false;
    this.filters.search = value;
    return true;
  }

  clearFilters(): void {
    this.filters.verdict = '';
    this.filters.reason = '';
    this.filters.search = '';
  }

  clearFilter(filter: 'verdict' | 'reason' | 'suite' | 'timeline-entry-type'): void {
    if (filter === 'verdict') this.filters.verdict = '';
    if (filter === 'reason') this.filters.reason = '';
    if (filter === 'timeline-entry-type') this.timelineFilter = '';
    if (filter === 'suite') this.selectSuite(this.suites[0].id);
  }

  toggleDivergenceSort(direction?: 'asc' | 'desc'): void {
    if (direction) {
      this.sortDirection = direction;
      return;
    }
    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
  }

  setTimelineFilter(value: string): boolean {
    if (value !== '' && !['verdict-change', 'reason-change', 're-run-started', 're-run-stopped', 're-run-completed'].includes(value)) {
      return false;
    }
    this.timelineFilter = value as TimelineFilter;
    return true;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }

  updateReason(payload: { testId: string; reason: Reason }): boolean {
    const parsed = reasonUpdateSchema.safeParse(payload);
    if (!parsed.success) return false;
    const test = this.activeSuite.tests.find((candidate) => candidate.id === parsed.data.testId);
    if (!test || test.reason === parsed.data.reason) return false;
    const previous = test.reason;
    test.reason = parsed.data.reason;
    this.addAudit('reason-change', test.id, `Reason changed from ${previous} to ${test.reason}`);
    this.notify(`Reason updated for ${test.id}`, 'success');
    return true;
  }

  rerunFor(testId: string): RerunSession | undefined {
    return this.reruns[`${this.activeSuite.id}:${testId}`];
  }

  openRerun(testId: string): boolean {
    if (!this.selectTest(testId)) return false;
    this.openRerunTestId = testId;
    return true;
  }

  closeRerun(): void {
    this.openRerunTestId = null;
  }

  startRerun(testId: string, request: { runCount: RunCount }): boolean {
    const parsed = rerunRequestSchema.safeParse(request);
    const test = this.activeSuite.tests.find((candidate) => candidate.id === testId);
    if (!parsed.success || !test) return false;
    const key = `${this.activeSuite.id}:${testId}`;
    if (this.reruns[key]?.status === 'running') return false;

    test.rerunAttempt += 1;
    this.reruns[key] = {
      suiteId: this.activeSuite.id,
      testId,
      runCount: parsed.data.runCount,
      completed: [],
      status: 'running',
      previousRuns: cloneRuns(test.runs),
      startedAt: new Date().toISOString(),
    };
    this.addAudit('re-run-started', testId, `Re-run started with runCount ${parsed.data.runCount}`);
    this.liveMessage = `Re-run started for ${testId}`;
    this.scheduleTick(key, test.rerunAttempt);
    return true;
  }

  stopRerun(testId: string): boolean {
    const key = `${this.activeSuite.id}:${testId}`;
    const session = this.reruns[key];
    if (!session || session.status !== 'running') return false;
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
    session.status = 'stopped';
    this.addAudit('re-run-stopped', testId, `Re-run stopped after ${session.completed.length} of ${session.runCount} runs`);
    this.liveMessage = `Re-run stopped for ${testId}`;
    this.notify(`Re-run stopped after ${session.completed.length} runs`, 'neutral');
    return true;
  }

  private scheduleTick(key: string, attempt: number): void {
    const timer = setTimeout(() => {
      const session = this.reruns[key];
      if (!session || session.status !== 'running') return;
      const test = this.activeSuite.id === session.suiteId
        ? this.activeSuite.tests.find((candidate) => candidate.id === session.testId)
        : this.suites.find((suite) => suite.id === session.suiteId)?.tests.find((candidate) => candidate.id === session.testId);
      if (!test) return;

      const runNumber = session.completed.length + 1;
      const condition = CONDITIONS[(runNumber + attempt + test.id.length) % CONDITIONS.length] as Condition;
      const pattern = attempt % 3;
      const result: RunResult = pattern === 1 ? (runNumber % 5 === 3 ? 'fail' : 'pass') : pattern === 2 ? 'pass' : 'fail';
      const previousVerdict = verdictFor(test.runs);
      session.completed.push({ index: runNumber, condition, result });
      const matrixIndex = (runNumber - 1) % 5;
      test.runs[matrixIndex] = { index: matrixIndex + 1, condition, result };
      const nextVerdict = verdictFor(test.runs);
      if (nextVerdict !== previousVerdict) {
        this.addAuditToSuite(session.suiteId, 'verdict-change', test.id, `Verdict changed from ${previousVerdict} to ${nextVerdict}`);
      }

      if (session.completed.length >= session.runCount) {
        session.status = 'completed';
        this.timers.delete(key);
        this.addAuditToSuite(session.suiteId, 're-run-completed', test.id, `Re-run completed ${session.runCount} of ${session.runCount} runs`);
        this.liveMessage = `Re-run completed for ${test.id}; verdict is ${nextVerdict}`;
        this.notify(`Re-run completed · ${nextVerdict}`, 'success');
        return;
      }
      this.scheduleTick(key, attempt);
    }, 420);
    this.timers.set(key, timer);
  }

  openExport(format: 'quarantine-text' | 'triage-report-json' = 'quarantine-text'): void {
    this.exportTimestamp = new Date().toISOString();
    this.exportTab = format;
    this.exportOpen = true;
  }

  closeExport(): void {
    this.exportOpen = false;
  }

  openImport(): void {
    this.importError = '';
    this.importOpen = true;
  }

  closeImport(): void {
    this.importOpen = false;
    this.importError = '';
  }

  setExportTab(format: 'quarantine-text' | 'triage-report-json'): void {
    this.exportTab = format;
  }

  currentExportText(format = this.exportTab): string {
    return format === 'quarantine-text' ? this.quarantineText : this.reportText;
  }

  async copyExport(format = this.exportTab): Promise<boolean> {
    const text = this.currentExportText(format);
    try {
      await navigator.clipboard.writeText(text);
      this.liveMessage = `${format === 'quarantine-text' ? 'Quarantine text' : 'Triage report JSON'} copied`;
      this.notify(this.liveMessage, 'success');
      return true;
    } catch {
      this.liveMessage = 'Copy failed; clipboard permission was not granted';
      this.notify(this.liveMessage, 'danger');
      return false;
    }
  }

  downloadExport(format = this.exportTab): void {
    const isText = format === 'quarantine-text';
    const blob = new Blob([this.currentExportText(format)], { type: isText ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = isText ? 'flake-triage-quarantine.txt' : 'flake-triage-report.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  importReport(text: string): boolean {
    this.importDraft = text;
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      this.importError = 'Triage report JSON is malformed';
      this.liveMessage = this.importError;
      this.notify(this.importError, 'danger');
      return false;
    }
    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const key = issue.path.length ? `${issue.path.join('.')}: ` : '';
      this.importError = `${key}${issue.message}`;
      this.liveMessage = `Import failed: ${this.importError}`;
      this.notify(this.liveMessage, 'danger');
      return false;
    }
    const suite = this.activeSuite;
    const importedTests = parsed.data.tests.map((test) => ({
      id: test.id,
      reason: test.reason,
      runs: test.runs.map((run) => ({ ...run })),
      rerunAttempt: 0,
    }));
    suite.tests.splice(0, suite.tests.length, ...importedTests);
    suite.name = parsed.data.suiteName;
    this.selectedTestId = suite.tests[0]?.id ?? '';
    this.clearFilters();
    this.openRerunTestId = null;
    this.importError = '';
    this.importOpen = false;
    this.exportTimestamp = parsed.data.exportedAt;
    this.liveMessage = `Imported ${suite.tests.length} tests into ${suite.name}`;
    this.notify(this.liveMessage, 'success');
    return true;
  }

  private addAudit(type: AuditType, testId: string, message: string): void {
    this.addAuditToSuite(this.activeSuite.id, type, testId, message);
  }

  private addAuditToSuite(suiteId: string, type: AuditType, testId: string, message: string): void {
    this.auditSequence += 1;
    const suite = this.suites.find((candidate) => candidate.id === suiteId);
    if (!suite) return;
    suite.audit.push({
      id: `${suite.id}-${this.auditSequence}`,
      type,
      timestamp: new Date().toISOString(),
      testId,
      message,
    });
  }

  notify(message: string, tone: Toast['tone']): void {
    this.toastSequence += 1;
    const id = this.toastSequence;
    this.toasts.push({ id, tone, message });
    setTimeout(() => {
      const index = this.toasts.findIndex((toast) => toast.id === id);
      if (index >= 0) this.toasts.splice(index, 1);
    }, 2800);
  }
}

export const triage = new TriageStore();
