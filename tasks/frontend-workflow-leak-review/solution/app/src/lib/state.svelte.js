import { seedCanaryTasks, seedMutationSuites, seedSubmissions, reviewStateLabels } from './data.js';
import { decisionSchema, formatSchemaError, reportSchema } from './schemas.js';

const isoNow = () => new Date().toISOString();
const roundThreshold = (value) => Math.round(Number(value) * 100) / 100;

class ReviewConsoleState {
  submissions = $state(seedSubmissions());
  _threshold = $state(0.75);
  get threshold() { return this._threshold; }
  set threshold(val) {
    const next = roundThreshold(val);
    if (next < 0.5 || next > 0.95 || Number.isNaN(next)) return;
    this._threshold = next;
    const confirmedIds = new Set(this.decisions.map((decision) => decision.submissionId));
    this.submissions = this.submissions.map((submission) => {
      if (!confirmedIds.has(submission.id)) {
        return { ...submission, reviewState: submission.similarity >= next ? 'review-triggered' : 'unreviewed' };
      }
      return { ...submission };
    });
    this.bumpExportTimestamp();
  }

  activeView = $state('queue');
  reviewFilter = $state('all');
  auditFilter = $state('all');
  searchQuery = $state('');
  selectedSubmissionId = $state(null);
  evidenceFocusIndex = $state(0);
  decisions = $state([]);
  canaryTasks = $state(seedCanaryTasks());
  mutationSuites = $state(seedMutationSuites());
  mobileNavOpen = $state(false);
  exportOpen = $state(false);
  exportFormat = $state('review-report-json');
  importError = $state('');
  toast = $state(null);
  lastChangedSubmissionId = $state(null);
  leavingSubmissionId = $state(null);
  newestAuditSubmissionId = $state(null);
  exportTimestamp = $state(isoNow());
  submitting = $state(false);
  decisionDraft = $state({ submissionId: null, verdict: '', rationale: '' });
  theme = $state('light');
  locale = $state('en-US');

  get sortedSubmissions() {
    return [...this.submissions].sort((a, b) => b.similarity - a.similarity);
  }

  get visibleSubmissions() {
    const query = this.searchQuery.trim().toLowerCase();
    return this.sortedSubmissions.filter((submission) => {
      if (this.reviewFilter !== 'all') {
        const matchesState = submission.reviewState === this.reviewFilter;
        const leavingFromTriggered =
          this.reviewFilter === 'review-triggered' &&
          this.leavingSubmissionId === submission.id &&
          (submission.reviewState === 'confirmed-clean' || submission.reviewState === 'confirmed-leak');
        if (!matchesState && !leavingFromTriggered) return false;
      }
      const matchesSearch = !query || `${submission.task} ${submission.submitter} ${submission.id}`.toLowerCase().includes(query);
      return matchesSearch;
    });
  }

  get selectedSubmission() {
    return this.submissions.find((submission) => submission.id === this.selectedSubmissionId) || null;
  }

  get rollup() {
    return {
      reviewTriggered: this.submissions.filter((item) => item.reviewState === 'review-triggered').length,
      confirmedClean: this.submissions.filter((item) => item.reviewState === 'confirmed-clean').length,
      confirmedLeak: this.submissions.filter((item) => item.reviewState === 'confirmed-leak').length,
      meanSimilarity: Number((this.submissions.reduce((sum, item) => sum + item.similarity, 0) / this.submissions.length).toFixed(2))
    };
  }

  get auditEntries() {
    return [...this.decisions]
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
      .filter((entry) => this.auditFilter === 'all' || entry.requestBody.verdict === this.auditFilter);
  }

  get reportDocument() {
    return {
      schemaVersion: 'leak-review.report.v1',
      threshold: this.threshold,
      exportedAt: this.exportTimestamp,
      rollup: this.rollup,
      submissions: this.sortedSubmissions.map(({ id, task, submitter, similarity, reviewState }) => ({
        id, task, submitter, similarity, reviewState
      })),
      decisions: [...this.decisions]
        .sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))
        .map((decision) => ({
          submissionId: decision.submissionId,
          verdict: decision.requestBody.verdict,
          rationale: decision.requestBody.rationale,
          decidedAt: decision.decidedAt,
          task: decision.task,
          submitter: decision.submitter
        })),
      mutationSuites: this.mutationSuites.map((suite) => ({
        task: suite.task,
        tests: suite.tests.map(({ id, name, included }) => ({ id, name, included }))
      }))
    };
  }

  get reportJson() {
    return JSON.stringify(this.reportDocument, null, 2);
  }

  get summaryText() {
    const perTask = new Map();
    for (const submission of this.submissions) {
      if (!perTask.has(submission.task)) perTask.set(submission.task, { clean: 0, leak: 0 });
    }
    for (const decision of this.decisions) {
      const task = perTask.get(decision.task) || { clean: 0, leak: 0 };
      if (decision.requestBody.verdict === 'confirm-clean') task.clean += 1;
      if (decision.requestBody.verdict === 'confirm-leak') task.leak += 1;
      perTask.set(decision.task, task);
    }
    const taskLines = [...perTask.entries()].map(([task, counts]) =>
      `${task}: ${counts.clean} confirm clean, ${counts.leak} confirm leak`
    );
    return [
      'Signal Trace — Review summary',
      `Threshold: ${this.threshold.toFixed(2)}`,
      `Review triggered: ${this.rollup.reviewTriggered}`,
      `Confirmed clean: ${this.rollup.confirmedClean}`,
      `Confirmed leak: ${this.rollup.confirmedLeak}`,
      `Mean similarity: ${this.rollup.meanSimilarity.toFixed(2)}`,
      '',
      'Decisions by task',
      ...taskLines
    ].join('\n');
  }

  get activeExportText() {
    return this.exportFormat === 'review-report-json' ? this.reportJson : this.summaryText;
  }

  bumpExportTimestamp() {
    this.exportTimestamp = isoNow();
  }

  showToast(message, tone = 'success') {
    const id = `${Date.now()}-${Math.random()}`;
    this.toast = { id, message, tone };
    setTimeout(() => {
      if (this.toast?.id === id) this.toast = null;
    }, 3600);
  }

  navigate(destination) {
    const allowed = ['queue', 'evidence-view', 'canary', 'mutation', 'audit'];
    if (!allowed.includes(destination)) return false;
    if (destination === 'evidence-view' && !this.selectedSubmissionId) return false;
    this.activeView = destination;
    this.mobileNavOpen = false;
    return true;
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return false;
    this.theme = theme;
    return true;
  }

  openSubmission(id) {
    const submission = this.submissions.find((item) => item.id === id);
    if (!submission) return false;
    this.selectedSubmissionId = id;
    this.evidenceFocusIndex = 0;
    this.activeView = 'evidence-view';
    this.mobileNavOpen = false;
    return true;
  }

  setThreshold(nextValue) {
    const next = roundThreshold(nextValue);
    if (next < 0.5 || next > 0.95 || Number.isNaN(next)) return false;
    this.threshold = next;
    return true;
  }

  setReviewFilter(value) {
    const allowed = ['all', 'unreviewed', 'review-triggered', 'confirmed-clean', 'confirmed-leak'];
    if (!allowed.includes(value)) return false;
    this.reviewFilter = value;
    return true;
  }

  setAuditFilter(value) {
    const allowed = ['all', 'confirm-clean', 'confirm-leak'];
    if (!allowed.includes(value)) return false;
    this.auditFilter = value;
    return true;
  }

  validateDecision(payload) {
    return decisionSchema.safeParse(payload);
  }

  beginDecisionDraft(submissionId) {
    if (this.decisionDraft.submissionId !== submissionId) {
      this.decisionDraft = { submissionId, verdict: '', rationale: '' };
    }
    return this.decisionDraft;
  }

  updateDecisionDraft(field, value) {
    if (!['verdict', 'rationale'].includes(field)) return false;
    this.decisionDraft = { ...this.decisionDraft, [field]: value };
    return true;
  }

  clearDecisionDraft() {
    this.decisionDraft = { submissionId: null, verdict: '', rationale: '' };
  }

  async submitDecision(payload) {
    if (this.submitting) return { ok: false, error: 'A decision is already being submitted.' };
    const parsed = decisionSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: formatSchemaError(parsed.error) };
    const submission = this.selectedSubmission;
    if (!submission) return { ok: false, error: 'submissionId: Select a submission before deciding.' };
    if (this.decisions.some((entry) => entry.submissionId === submission.id)) {
      return { ok: false, error: 'verdict: This submission already has a confirmed decision.' };
    }

    this.submitting = true;
    const requestBody = { verdict: parsed.data.verdict, rationale: parsed.data.rationale };
    const decidedAt = isoNow();
    const wasFiltered = this.reviewFilter === 'review-triggered';
    if (wasFiltered) this.leavingSubmissionId = submission.id;

    const newState = requestBody.verdict === 'confirm-clean' ? 'confirmed-clean' : 'confirmed-leak';
    submission.reviewState = newState;

    // Explicitly mutate the proxy element so its view updates accurately without proxy tearing
    const idx = this.submissions.findIndex(item => item.id === submission.id);
    if (idx !== -1) {
      this.submissions[idx].reviewState = newState;
    }

    this.decisions.push({
      submissionId: submission.id,
      requestBody,
      decidedAt,
      task: submission.task,
      submitter: submission.submitter
    });
    this.lastChangedSubmissionId = submission.id;
    this.newestAuditSubmissionId = submission.id;
    this.bumpExportTimestamp();
    this.showToast(`${reviewStateLabels[submission.reviewState]} recorded for ${submission.task}.`);
    this.clearDecisionDraft();

    if (wasFiltered) {
      const leavingId = submission.id;
      setTimeout(() => {
        if (this.leavingSubmissionId === leavingId) this.leavingSubmissionId = null;
      }, 430);
    }
    this.submitting = false;
    return { ok: true, requestBody };
  }

  cancelDecision() {
    this.clearDecisionDraft();
    this.activeView = 'queue';
    this.evidenceFocusIndex = 0;
    return true;
  }

  setEvidenceFocus(index) {
    const total = this.selectedSubmission?.matches?.length || 0;
    if (index < 0 || index >= total) return false;
    this.evidenceFocusIndex = index;
    return true;
  }

  toggleCanary(taskName) {
    const task = this.canaryTasks.find((item) => item.task === taskName);
    if (!task) return false;
    task.expanded = !task.expanded;
    return true;
  }

  toggleMutationTest(taskName, testId, included) {
    const suite = this.mutationSuites.find((item) => item.task === taskName);
    const test = suite?.tests.find((item) => item.id === testId);
    if (!test || typeof included !== 'boolean') return false;
    test.included = included;
    this.bumpExportTimestamp();
    return true;
  }

  mutationFlipCount(suite) {
    return suite.tests.filter((test) => test.included && test.original === 'pass' && test.mutant === 'fail').length;
  }

  openExport(format = this.exportFormat) {
    if (format === 'review-report-json' || format === 'summary-text') this.exportFormat = format;
    this.exportOpen = true;
    this.importError = '';
    return true;
  }

  closeExport() {
    this.exportOpen = false;
  }

  validateImport(rawText) {
    let raw;
    try {
      raw = JSON.parse(rawText);
    } catch {
      return { ok: false, error: 'payload: Import payload must be valid JSON.' };
    }
    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: formatSchemaError(parsed.error) };

    const expectedSuites = new Map(this.mutationSuites.map((suite) => [suite.task, new Set(suite.tests.map((test) => test.id))]));
    for (const [suiteIndex, suite] of parsed.data.mutationSuites.entries()) {
      const expectedTests = expectedSuites.get(suite.task);
      if (!expectedTests) return { ok: false, error: `mutationSuites.${suiteIndex}.task: Unknown mutation suite task.` };
      for (const [testIndex, test] of suite.tests.entries()) {
        if (!expectedTests.has(test.id)) return { ok: false, error: `mutationSuites.${suiteIndex}.tests.${testIndex}.id: Unknown mutation test id.` };
      }
    }
    for (const suite of this.mutationSuites) {
      const incoming = parsed.data.mutationSuites.find((item) => item.task === suite.task);
      const incomingIds = new Set(incoming?.tests.map((test) => test.id) || []);
      const hasEveryTest = suite.tests.every((test) => incomingIds.has(test.id));
      if (!incoming || incoming.tests.length !== suite.tests.length || incomingIds.size !== suite.tests.length || !hasEveryTest) {
        return { ok: false, error: `mutationSuites: Every test for ${suite.task} is required.` };
      }
    }
    return { ok: true, data: parsed.data };
  }

  importReport(rawText) {
    const validation = this.validateImport(rawText);
    if (!validation.ok) {
      this.importError = validation.error;
      return validation;
    }

    const report = validation.data;
    const evidenceById = new Map(seedSubmissions().map((item) => [item.id, item.matches]));
    this.threshold = report.threshold;
    this.submissions = report.submissions.map((submission) => ({
      ...submission,
      matches: evidenceById.get(submission.id) || seedSubmissions()[0].matches
    }));
    this.decisions = report.decisions.map((decision) => ({
      submissionId: decision.submissionId,
      requestBody: { verdict: decision.verdict, rationale: decision.rationale },
      decidedAt: decision.decidedAt,
      task: decision.task,
      submitter: decision.submitter
    }));
    for (const suite of this.mutationSuites) {
      const incomingSuite = report.mutationSuites.find((item) => item.task === suite.task);
      for (const test of suite.tests) {
        test.included = incomingSuite.tests.find((item) => item.id === test.id).included;
      }
    }
    this.exportTimestamp = report.exportedAt;
    this.importError = '';
    this.reviewFilter = 'all';
    this.auditFilter = 'all';
    this.showToast('Review report imported. Session state restored.');
    return { ok: true };
  }
}

export const reviewState = new ReviewConsoleState();
