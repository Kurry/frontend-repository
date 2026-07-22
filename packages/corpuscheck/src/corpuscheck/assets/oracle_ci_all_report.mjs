// Reporting helpers for the manually dispatched full-corpus Playwright sweep.
// Kept importable and side-effect free so workflow behavior can be unit tested.

const APP_STATUS = new Set(['pass', 'fail', 'skip']);
const APP_PHASE = new Set([
  'checkout', 'setup', 'install', 'build', 'start', 'test', 'complete', 'report',
]);

function count(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function diagnosticsForSuite(result) {
  return [result?.message, result?.warning, result?.detail]
    .filter(Boolean)
    .join('; ');
}

/** Turn Actions step outcomes plus runE2eSuite output into one stable app record. */
export function createAppResult({ slug, stepOutcomes = {}, suiteResult = null }) {
  const phases = [
    ['checkout', 'checkout', 'checkout'],
    ['node', 'setup', 'Node setup'],
    ['dependencies', 'install', 'dependency install'],
    ['browser', 'install', 'Playwright browser install'],
    ['build', 'build', 'build'],
    ['start', 'start', 'app startup'],
  ];
  const failedSetup = phases.find(([key]) => stepOutcomes[key] !== 'success');
  if (failedSetup) {
    const [key, phase, label] = failedSetup;
    const outcome = stepOutcomes[key] || 'not run';
    return {
      schemaVersion: 1,
      slug,
      status: 'fail',
      phase,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      taskSpecificTests: 0,
      rubricMatchedTests: 0,
      rubricCriteria: 0,
      failingTests: [],
      diagnostics: `${label} step ${outcome}`,
    };
  }

  if (!suiteResult) {
    return {
      schemaVersion: 1,
      slug,
      status: 'fail',
      phase: 'test',
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      taskSpecificTests: 0,
      rubricMatchedTests: 0,
      rubricCriteria: 0,
      failingTests: [],
      diagnostics: `Playwright step ${stepOutcomes.tests || 'did not produce a result'}`,
    };
  }

  const status = suiteResult.status === 'skip' ? 'skip' : suiteResult.status;
  const testsOutcome = stepOutcomes.tests;
  const effectiveStatus = status === 'pass' && testsOutcome !== 'success' ? 'fail' : status;
  const diagnostics = diagnosticsForSuite(suiteResult) ||
    (effectiveStatus === 'skip' ? 'No Playwright suite was discovered' : '');
  return {
    schemaVersion: 1,
    slug,
    status: APP_STATUS.has(effectiveStatus) ? effectiveStatus : 'fail',
    phase: effectiveStatus === 'pass' ? 'complete' : 'test',
    passed: count(suiteResult.passed),
    failed: count(suiteResult.failed),
    skipped: count(suiteResult.skipped),
    flaky: count(suiteResult.flaky),
    taskSpecificTests: count(suiteResult.taskSpecificTests),
    rubricMatchedTests: count(suiteResult.rubricMatchedTests),
    rubricCriteria: count(suiteResult.rubricCriteria),
    failingTests: Array.isArray(suiteResult.failingTests) ? suiteResult.failingTests : [],
    diagnostics:
      effectiveStatus === 'fail' && status === 'pass'
        ? `Playwright step ${testsOutcome}; ${diagnostics}`.replace(/; $/, '')
        : diagnostics,
  };
}

function missingResult(slug) {
  return {
    schemaVersion: 1,
    slug,
    status: 'fail',
    phase: 'report',
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    taskSpecificTests: 0,
    rubricMatchedTests: 0,
    rubricCriteria: 0,
    failingTests: [],
    diagnostics: 'No per-app result artifact was produced',
    missing: true,
  };
}

function invalidResult(slug, diagnostics) {
  return {
    ...missingResult(slug),
    diagnostics,
    missing: false,
  };
}

function normalizeResult(result, fallbackSlug) {
  if (!result || typeof result !== 'object') {
    return invalidResult(fallbackSlug, 'Per-app result is not a JSON object');
  }
  const slug = typeof result.slug === 'string' && result.slug ? result.slug : fallbackSlug;
  if (result.schemaVersion !== 1) {
    return invalidResult(slug, `Per-app result has invalid schemaVersion: ${String(result.schemaVersion)}`);
  }
  if (!APP_STATUS.has(result.status)) {
    return invalidResult(slug, `Per-app result has invalid status: ${String(result.status)}`);
  }
  if (!APP_PHASE.has(result.phase)) {
    return invalidResult(slug, `Per-app result has invalid phase: ${String(result.phase)}`);
  }
  const countFields = [
    'passed', 'failed', 'skipped', 'flaky',
    'taskSpecificTests', 'rubricMatchedTests', 'rubricCriteria',
  ];
  const invalidCount = countFields.find(
    (field) => !Number.isInteger(result[field]) || result[field] < 0,
  );
  if (invalidCount) {
    return invalidResult(slug, `Per-app result has invalid ${invalidCount}: ${String(result[invalidCount])}`);
  }
  if (!Array.isArray(result.failingTests) || result.failingTests.some((item) => typeof item !== 'string')) {
    return invalidResult(slug, 'Per-app result has invalid failingTests');
  }
  if (typeof result.diagnostics !== 'string') {
    return invalidResult(slug, 'Per-app result has invalid diagnostics');
  }
  return {
    schemaVersion: 1,
    slug,
    status: result.status,
    phase: result.phase,
    passed: result.passed,
    failed: result.failed,
    skipped: result.skipped,
    flaky: result.flaky,
    taskSpecificTests: result.taskSpecificTests,
    rubricMatchedTests: result.rubricMatchedTests,
    rubricCriteria: result.rubricCriteria,
    failingTests: result.failingTests,
    diagnostics: result.diagnostics,
  };
}

/** Aggregate expected app slugs and per-app records, failing closed on gaps. */
export function aggregateAppResults({
  expectedSlugs,
  results,
  discoveryOutcome = 'success',
  matrixOutcome = 'success',
  metadata = {},
}) {
  const expected = [...new Set(expectedSlugs)].sort();
  const resultMap = new Map();
  const duplicates = new Set();
  const malformed = [];
  for (const [index, candidate] of results.entries()) {
    const slug = candidate?.slug;
    if (typeof slug !== 'string' || !slug) {
      malformed.push(invalidResult(
        `malformed result ${index + 1}`,
        typeof candidate?.artifactError === 'string'
          ? candidate.artifactError
          : 'Per-app result has no non-empty slug',
      ));
      continue;
    }
    if (resultMap.has(slug)) duplicates.add(slug);
    resultMap.set(slug, normalizeResult(candidate, slug));
  }

  const rows = expected.map((slug) => resultMap.get(slug) || missingResult(slug));
  rows.push(...malformed);
  const expectedSet = new Set(expected);
  for (const slug of [...resultMap.keys()].filter((item) => !expectedSet.has(item)).sort()) {
    rows.push(invalidResult(slug, 'Result artifact was not present in the discovered app matrix'));
  }
  for (const slug of [...duplicates].sort()) {
    rows.push(invalidResult(`${slug} (duplicate)`, 'Multiple result records were produced for one app'));
  }
  if (discoveryOutcome !== 'success' || expected.length === 0) {
    rows.push(invalidResult(
      'workflow discovery',
      discoveryOutcome !== 'success'
        ? `Discovery job ${discoveryOutcome}`
        : 'Discovery returned no solution apps',
    ));
  }

  const missingApps = rows.filter((result) => result.missing).length;
  const passedApps = rows.filter((result) => result.status === 'pass').length;
  const failedApps = rows.filter((result) => result.status === 'fail').length;
  const skippedApps = rows.filter((result) => result.status === 'skip').length;
  const matrixUnexplainedFailure =
    matrixOutcome !== 'success' && failedApps === 0 && missingApps === 0;
  if (matrixUnexplainedFailure) {
    rows.push(invalidResult('workflow matrix', `Playwright matrix job ${matrixOutcome}`));
  }

  const finalFailedApps = rows.filter((result) => result.status === 'fail').length;
  const summary = {
    expectedApps: expected.length,
    reportedApps: expected.length - missingApps,
    passedApps,
    failedApps: finalFailedApps,
    skippedApps,
    missingApps,
    passedTests: rows.reduce((total, result) => total + result.passed, 0),
    failedTests: rows.reduce((total, result) => total + result.failed, 0),
    skippedTests: rows.reduce((total, result) => total + result.skipped, 0),
    flakyTests: rows.reduce((total, result) => total + result.flaky, 0),
    taskSpecificTests: rows.reduce((total, result) => total + result.taskSpecificTests, 0),
    rubricMatchedTests: rows.reduce((total, result) => total + result.rubricMatchedTests, 0),
    rubricCriteria: rows.reduce((total, result) => total + result.rubricCriteria, 0),
  };
  return {
    schemaVersion: 1,
    metadata,
    summary,
    failed: finalFailedApps > 0 || skippedApps > 0,
    results: rows,
  };
}

function markdownCell(value, maxLength = 300) {
  const compact = String(value || '').replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

/** Render a compact Actions job summary and downloadable Markdown report. */
export function renderMarkdownReport(report) {
  const { summary } = report;
  const status = report.failed ? 'FAILED' : 'PASSED';
  const lines = [
    '# Full-corpus Playwright results',
    '',
    `**${status}** · apps: ${summary.expectedApps} expected, ${summary.passedApps} passed, ` +
      `${summary.failedApps} failed, ${summary.skippedApps} skipped, ${summary.missingApps} missing`,
    '',
    `Tests: ${summary.passedTests} passed, ${summary.failedTests} failed, ` +
      `${summary.skippedTests} skipped, ${summary.flakyTests} flaky`,
    '',
    `Task coverage: ${summary.taskSpecificTests} task-specific tests, ` +
      `${summary.rubricMatchedTests} rubric-matched across ${summary.rubricCriteria} criteria`,
  ];
  if (report.metadata?.runUrl) {
    lines.push('', `[Workflow run](${report.metadata.runUrl})`);
  }
  lines.push(
    '',
    '| App | Status | Phase | Passed | Failed | Skipped | Flaky | Task tests | Rubric matched | Criteria | Diagnostics |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  );
  for (const result of report.results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'skip' ? '⚪' : '❌';
    const diagnostics = [
      result.diagnostics,
      result.failingTests.length ? `Failing tests: ${result.failingTests.join('; ')}` : '',
    ].filter(Boolean).join('; ');
    lines.push(
      `| \`${markdownCell(result.slug, 120)}\` | ${icon} ${result.status} | ` +
      `${markdownCell(result.phase, 40)} | ${result.passed} | ${result.failed} | ` +
      `${result.skipped} | ${result.flaky} | ${result.taskSpecificTests} | ` +
      `${result.rubricMatchedTests} | ${result.rubricCriteria} | ${markdownCell(diagnostics)} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}
