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

function patternForAttempt(attempt: number, previous: Verdict): RunResult[] {
  // Force a verdict change on each completed re-run so quarantine membership moves.
  const cycle = attempt % 3;
  if (previous === 'flaky') {
    if (cycle === 1) return ['pass', 'pass', 'pass', 'pass', 'pass'];
    if (cycle === 2) return ['fail', 'fail', 'fail', 'fail', 'fail'];
    return ['pass', 'fail', 'pass', 'fail', 'pass'];
  }
  if (previous === 'keep') {
    if (cycle === 1) return ['pass', 'pass', 'fail', 'pass', 'pass'];
    if (cycle === 2) return ['fail', 'fail', 'fail', 'fail', 'fail'];
    return ['pass', 'fail', 'pass', 'fail', 'pass'];
  }
  if (cycle === 1) return ['pass', 'pass', 'pass', 'pass', 'pass'];
  if (cycle === 2) return ['pass', 'fail', 'pass', 'pass', 'pass'];
  return ['fail', 'pass', 'fail', 'fail', 'fail'];
}

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
  exportTab = $state<'quarantine-text' | 'triage-report-json' | 'print-summary'>('quarantine-text');
  exportTimestamp = $state(new Date().toISOString());
  importOpen = $state(false);
  importDraft = $state('');
  importError = $state('');
  openRerunTestId = $state<string | null>(null);
  rerunReturnFocus = $state<HTMLElement | null>(null);
  exportReturnFocus = $state<HTMLElement | null>(null);
  importReturnFocus = $state<HTMLElement | null>(null);
  toasts = $state<Toast[]>([]);
  liveMessage = $state('');
  coachOpen = $state(true);
  coachStep = $state(0);

  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private auditSequence = 0;
  private toastSequence = 0;
  private plannedResults = new Map<string, RunResult[]>();

  activeSuite = $derived.by(() => this.suites.find((suite) => suite.id === this.selectedSuiteId) ?? this.suites[0]);

  selectedTest = $derived.by(() => this.activeSuite.tests.find((test) => test.id === this.selectedTestId));

  visibleTests = $derived.by(() => {
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
      if (delta !== 0) return delta * factor;
      // Stable secondary key that also reverses so equal-divergence rows flip visibly.
      return a.id.localeCompare(b.id) * factor;
    });
  });

  allFailTests = $derived.by(() => this.activeSuite.tests.filter((test) => verdictFor(test.runs) === 'fail'));

  flakyTests = $derived.by(() => this.activeSuite.tests.filter((test) => verdictFor(test.runs) === 'flaky'));

  keepCount = $derived.by(() => this.activeSuite.tests.filter((test) => verdictFor(test.runs) === 'keep').length);

  visibleAudit = $derived.by(() => {
    const events = this.timelineFilter
      ? this.activeSuite.audit.filter((event) => event.type === this.timelineFilter)
      : this.activeSuite.audit;
    return [...events].reverse();
  });

  quarantineText = $derived.by(() => {
    const allFail = this.allFailTests.map((test) => test.id);
    const flaky = this.flakyTests.map((test) => test.id);
    return ['ALL-FAIL', ...allFail, '', 'FLAKY', ...flaky].join('\n');
  });

  printSummary = $derived.by(() => {
    return [
      'FLAKEWORK PRINTABLE QUARANTINE SUMMARY',
      `Suite: ${this.activeSuite.name}`,
      `All-fail count: ${this.allFailTests.length}`,
      `Flaky count: ${this.flakyTests.length}`,
      '',
      'ALL-FAIL',
      ...this.allFailTests.map((test) => `- ${test.id}`),
      '',
      'FLAKY',
      ...this.flakyTests.map((test) => `- ${test.id}`),
    ].join('\n');
  });

  report = $derived.by((): TriageReport => ({
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
  }));

  reportText = $derived.by(() => JSON.stringify(this.report, null, 2));

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
    this.filters = { ...this.filters, verdict: value as VerdictFilter };
    return true;
  }

  setReasonFilter(value: string): boolean {
    if (value !== '' && !REASONS.includes(value as Reason)) return false;
    this.filters = { ...this.filters, reason: value as ReasonFilter };
    return true;
  }

  setSearch(value: string): boolean {
    if (typeof value !== 'string' || value.length > 120) return false;
    this.filters = { ...this.filters, search: value };
    return true;
  }

  clearFilters(): void {
    this.filters = { verdict: '', reason: '', search: '' };
  }

  clearFilter(filter: 'verdict' | 'reason' | 'suite' | 'timeline-entry-type'): void {
    if (filter === 'verdict') this.filters = { ...this.filters, verdict: '' };
    if (filter === 'reason') this.filters = { ...this.filters, reason: '' };
    if (filter === 'timeline-entry-type') this.timelineFilter = '';
    if (filter === 'suite') this.selectSuite(this.suites[0].id);
  }

  toggleDivergenceSort(direction?: 'asc' | 'desc'): void {
    if (direction) {
      if (this.sortDirection === direction) {
        this.sortDirection = direction === 'desc' ? 'asc' : 'desc';
      } else {
        this.sortDirection = direction;
      }
      return;
    }
    if (this.sortDirection === 'none') {
      this.sortDirection = 'desc';
      return;
    }
    if (this.sortDirection === 'desc') {
      this.sortDirection = 'asc';
      return;
    }
    this.sortDirection = 'desc';
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
    const suite = this.activeSuite;
    const test = suite.tests.find((candidate) => candidate.id === parsed.data.testId);
    if (!test || test.reason === parsed.data.reason) return false;
    const previous = test.reason;
    suite.tests = suite.tests.map((candidate) =>
      candidate.id === parsed.data.testId ? { ...candidate, reason: parsed.data.reason } : candidate,
    );
    this.suites = this.suites.map((entry) => (entry.id === suite.id ? { ...entry, tests: suite.tests } : entry));
    this.addAudit('reason-change', parsed.data.testId, `Reason changed from ${previous} to ${parsed.data.reason}`);
    this.notify(`Reason updated for ${parsed.data.testId}`, 'success');
    return true;
  }

  rerunFor(testId: string): RerunSession | undefined {
    return this.reruns[`${this.activeSuite.id}:${testId}`];
  }

  openRerun(testId: string, opener?: HTMLElement | null): boolean {
    if (!this.selectTest(testId)) return false;
    this.openRerunTestId = testId;
    this.rerunReturnFocus = opener ?? this.rerunReturnFocus;
    return true;
  }

  closeRerun(): void {
    const opener = this.rerunReturnFocus;
    this.openRerunTestId = null;
    if (opener?.isConnected) {
      requestAnimationFrame(() => {
        if (opener.isConnected) opener.focus();
      });
    }
  }

  startRerun(testId: string, request: { runCount: RunCount }): boolean {
    const parsed = rerunRequestSchema.safeParse(request);
    const test = this.activeSuite.tests.find((candidate) => candidate.id === testId);
    if (!parsed.success || !test) return false;
    const key = `${this.activeSuite.id}:${testId}`;
    if (this.reruns[key]?.status === 'running') return false;

    test.rerunAttempt += 1;
    const previousVerdict = verdictFor(test.runs);
    const planned = patternForAttempt(test.rerunAttempt, previousVerdict);
    this.plannedResults.set(key, planned);

    this.reruns = {
      ...this.reruns,
      [key]: {
        suiteId: this.activeSuite.id,
        testId,
        runCount: parsed.data.runCount,
        completed: [],
        status: 'running',
        previousRuns: cloneRuns(test.runs),
        startedAt: new Date().toISOString(),
      },
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
    this.reruns = { ...this.reruns };
    this.plannedResults.delete(key);
    this.addAudit('re-run-stopped', testId, `Re-run stopped after ${session.completed.length} of ${session.runCount} runs`);
    this.liveMessage = `Re-run stopped for ${testId}`;
    this.notify(`Re-run stopped after ${session.completed.length} runs`, 'neutral');
    return true;
  }

  private scheduleTick(key: string, attempt: number): void {
    const timer = setTimeout(() => {
      const session = this.reruns[key];
      if (!session || session.status !== 'running') return;
      const suite = this.suites.find((candidate) => candidate.id === session.suiteId);
      const test = suite?.tests.find((candidate) => candidate.id === session.testId);
      if (!test) return;

      const runNumber = session.completed.length + 1;
      const condition = CONDITIONS[(runNumber + attempt + test.id.length) % CONDITIONS.length] as Condition;
      const planned = this.plannedResults.get(key) ?? patternForAttempt(attempt, verdictFor(session.previousRuns));
      const result = planned[(runNumber - 1) % planned.length];
      const previousVerdict = verdictFor(test.runs);
      session.completed = [...session.completed, { index: runNumber, condition, result }];
      const matrixIndex = (runNumber - 1) % 5;
      const updatedRun = { index: matrixIndex + 1, condition, result };
      suite.tests = suite.tests.map((candidate) => {
        if (candidate.id !== test.id) return candidate;
        const runs = candidate.runs.map((run, index) => (index === matrixIndex ? updatedRun : run));
        return { ...candidate, runs };
      });
      this.suites = this.suites.map((entry) => (entry.id === suite.id ? { ...entry, tests: suite.tests } : entry));
      const updatedTest = suite.tests.find((candidate) => candidate.id === test.id);
      if (!updatedTest) return;
      const nextVerdict = verdictFor(updatedTest.runs);
      if (nextVerdict !== previousVerdict) {
        this.addAuditToSuite(session.suiteId, 'verdict-change', updatedTest.id, `Verdict changed from ${previousVerdict} to ${nextVerdict}`);
      }

      this.reruns = { ...this.reruns };

      if (session.completed.length >= session.runCount) {
        session.status = 'completed';
        this.reruns = { ...this.reruns };
        this.timers.delete(key);
        this.plannedResults.delete(key);
        this.addAuditToSuite(session.suiteId, 're-run-completed', updatedTest.id, `Re-run completed ${session.runCount} of ${session.runCount} runs`);
        this.liveMessage = `Re-run completed for ${updatedTest.id}; verdict is ${nextVerdict}`;
        this.notify(`Re-run completed · ${nextVerdict}`, 'success');
        return;
      }
      this.scheduleTick(key, attempt);
    }, 720);
    this.timers.set(key, timer);
  }

  openExport(format: 'quarantine-text' | 'triage-report-json' | 'print-summary' = 'quarantine-text', opener?: HTMLElement | null): void {
    this.exportTimestamp = new Date().toISOString();
    this.exportTab = format;
    this.exportOpen = true;
    if (opener) this.exportReturnFocus = opener;
  }

  closeExport(): void {
    const opener = this.exportReturnFocus;
    this.exportOpen = false;
    if (opener?.isConnected) {
      requestAnimationFrame(() => {
        if (opener.isConnected) opener.focus();
      });
    }
  }

  openImport(opener?: HTMLElement | null): void {
    this.importError = '';
    this.importOpen = true;
    if (opener) this.importReturnFocus = opener;
  }

  closeImport(): void {
    const opener = this.importReturnFocus;
    this.importOpen = false;
    this.importError = '';
    if (opener?.isConnected) {
      requestAnimationFrame(() => {
        if (opener.isConnected) opener.focus();
      });
    }
  }

  setExportTab(format: 'quarantine-text' | 'triage-report-json' | 'print-summary'): void {
    this.exportTab = format;
  }

  currentExportText(format = this.exportTab): string {
    if (format === 'quarantine-text') return this.quarantineText;
    if (format === 'print-summary') return this.printSummary;
    return this.reportText;
  }

  async copyExport(format = this.exportTab): Promise<boolean> {
    const text = this.currentExportText(format);
    try {
      await navigator.clipboard.writeText(text);
      this.liveMessage = `${format === 'quarantine-text' ? 'Quarantine text' : format === 'print-summary' ? 'Printable summary' : 'Triage report JSON'} copied`;
      this.notify(this.liveMessage, 'success');
      return true;
    } catch {
      this.liveMessage = 'Copy failed; clipboard permission was not granted';
      this.notify(this.liveMessage, 'danger');
      return false;
    }
  }

  downloadExport(format = this.exportTab): void {
    const isText = format !== 'triage-report-json';
    const blob = new Blob([this.currentExportText(format)], { type: isText ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      format === 'quarantine-text'
        ? 'flake-triage-quarantine.txt'
        : format === 'print-summary'
          ? 'flake-triage-print-summary.txt'
          : 'flake-triage-report.json';
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
    suite.tests = importedTests;
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

  dismissCoach(): void {
    this.coachOpen = false;
  }

  nextCoachStep(): void {
    if (this.coachStep >= 2) {
      this.coachOpen = false;
      return;
    }
    this.coachStep += 1;
  }

  private addAudit(type: AuditType, testId: string, message: string): void {
    this.addAuditToSuite(this.activeSuite.id, type, testId, message);
  }

  private addAuditToSuite(suiteId: string, type: AuditType, testId: string, message: string): void {
    this.auditSequence += 1;
    const suite = this.suites.find((candidate) => candidate.id === suiteId);
    if (!suite) return;
    suite.audit = [
      ...suite.audit,
      {
        id: `${suite.id}-${this.auditSequence}`,
        type,
        timestamp: new Date().toISOString(),
        testId,
        message,
      },
    ];
  }

  notify(message: string, tone: Toast['tone']): void {
    this.toastSequence += 1;
    const id = this.toastSequence;
    this.toasts = [...this.toasts, { id, tone, message }];
    this.liveMessage = message;
    setTimeout(() => {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    }, 3200);
  }
}

export const triage = new TriageStore();
