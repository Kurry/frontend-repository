import { CHECK_NAMES, GATE_NAMES, MODELS, REVIEWER_STEPS } from './types';
import type { CheckOutcome, Criterion, FixCategory, GateName, GateResult, GateStatus, ModelName, ReviewBundle, Trial } from './types';
import { deriveDifficultyStatus, isTrialValid } from './domain';

const PROFILES = [
  { slug: 'juniper-lint-fixer', title: 'Juniper lint fixer', subject: 'an incremental linter repair that preserves generated-file exclusions', state: 'ready' },
  { slug: 'cobalt-cache-pruner', title: 'Cobalt cache pruner', subject: 'a cache pruning task with deterministic expiry boundaries', state: 'ready' },
  { slug: 'willow-schema-aligner', title: 'Willow schema aligner', subject: 'a schema alignment patch across nested event payloads', state: 'ready-fixes' },
  { slug: 'fern-api-stitcher', title: 'Fern interface stitcher', subject: 'an interface stitching task for paginated response fragments', state: 'ready' },
  { slug: 'ember-relay-router', title: 'Ember relay router', subject: 'a relay routing repair across fallback and retry branches', state: 'ember' },
  { slug: 'drift-ledger-repair', title: 'Drift ledger repair', subject: 'a ledger reconciliation repair for duplicated journal edges', state: 'fixable-oracle' },
  { slug: 'spruce-query-normalizer', title: 'Spruce query normalizer', subject: 'a query normalization task around escaped grouping tokens', state: 'fixable-difficulty' },
  { slug: 'harbor-state-reducer', title: 'Harbor state reducer', subject: 'a state reducer correction for out-of-order acknowledgements', state: 'fixable-analysis' },
  { slug: 'linen-timeout-guard', title: 'Linen timeout guard', subject: 'a timeout guard that separates cancellation from transport failure', state: 'fixable-noop' },
  { slug: 'basalt-runtime-audit', title: 'Basalt runtime audit', subject: 'a runtime audit task for deferred worker cleanup', state: 'risk-runtime' },
  { slug: 'orchid-oracle-bridge', title: 'Orchid oracle bridge', subject: 'an oracle bridge task with competing precedence rules', state: 'risk-oracle' },
  { slug: 'moss-graph-redesign', title: 'Moss graph redesign', subject: 'a graph repair task whose current contract hides cycle ownership', state: 'risk-redesign' },
] as const;

const criterionBlueprints = [
  ['C1', 'Targeted behavior repaired', 0.24, false],
  ['C2', 'Regression coverage is specific', 0.2, false],
  ['C3', 'Runtime evidence supports the claim', 0.18, false],
  ['C4', 'No unrelated surface changes', 0.14, true],
  ['C5', 'Boundary behavior remains deterministic', 0.14, false],
  ['C6', 'Failure handling is explicit', 0.1, false],
] as const;

function makeCriteria(slug: string): Criterion[] {
  return criterionBlueprints.map(([id, name, weight, negated]) => ({
    id: `${slug}-${id}`,
    name,
    weight,
    negated,
  }));
}

const checkDetails: Record<string, string> = {
  'answer-determinacy': 'The conclusion can be scored without guessing at the claimed outcome.',
  'runtime-evidence-used': 'The answer cites an observed command or trace rather than intention alone.',
  'grounded-in-trajectory': 'The explanation follows the actions present in the trial trajectory.',
  'comprehensiveness-near-miss': 'The response addresses the nearest plausible missed boundary.',
  'difficulty-crux': 'The trial reaches the task’s actual reasoning bottleneck.',
  'honest-uncertainty': 'Any incomplete evidence is labeled instead of overstated.',
  refusals: 'The agent attempted the task without an unsupported refusal.',
  'low-timeout': 'The trial had enough execution time for a meaningful result.',
};

function makeChecks(valid: boolean, trialNumber: number) {
  return CHECK_NAMES.map((name, index) => {
    let outcome: CheckOutcome = 'pass';
    if (!valid && name === (trialNumber % 2 ? 'answer-determinacy' : 'low-timeout')) outcome = 'fail';
    if (valid && index === 3 && trialNumber % 3 === 0) outcome = 'not-applicable';
    if (name === 'runtime-evidence-used' && trialNumber === 4) outcome = 'fail';
    return { name, outcome, detail: checkDetails[name] };
  });
}

function makeTrial(
  slug: string,
  subject: string,
  criteria: Criterion[],
  model: ModelName,
  number: number,
  valid: boolean,
): Trial {
  const short = slug.split('-')[0];
  const outcomeFor = (index: number): CheckOutcome => (index === 3 && number % 2 === 0 ? 'fail' : index === 5 && number === 3 ? 'not-applicable' : 'pass');
  return {
    id: `${slug}-${model === 'Sable-4' ? 'sable' : 'quartz'}-${number}`,
    model,
    number,
    checks: makeChecks(valid, number),
    reasoning: criteria.map((criterion, index) => ({
      criterionId: criterion.id,
      outcome: outcomeFor(index),
      text:
        index === 0
          ? `The ${model} scorer traces the submitted change through ${subject}; trial ${number} reaches the named branch and demonstrates the intended state transition.`
          : index === 1
            ? `The new ${short} examples isolate the regression boundary and distinguish the repaired case from the adjacent control case.`
            : index === 2
              ? `The reported command output and focused trace ${valid ? 'provide' : 'do not fully provide'} runtime support for this criterion.`
              : index === 3
                ? `No unrelated public behavior should move; the cited passage ${outcomeFor(index) === 'fail' ? 'claims a broader cleanup that exceeds the task' : 'keeps the patch constrained'}.`
                : index === 4
                  ? `The answer explains how the boundary behaves on both the primary and fallback paths for trial ${number}.`
                  : `Failure propagation is described with an observable return state instead of a silent catch.`,
      citedPassageIds: [`${slug}-${model}-${number}-p${(index % 3) + 1}`],
    })),
    answerPassages: [
      {
        id: `${slug}-${model}-${number}-p1`,
        text: `I followed the failing ${short} path into the precise branch described by the task and changed the smallest conditional that controls it.`,
        criterionIds: [criteria[0].id, criteria[3].id],
      },
      {
        id: `${slug}-${model}-${number}-p2`,
        text: `The focused verification for trial ${number} exercises the regression and its neighboring control; both now produce distinct, expected states.`,
        criterionIds: [criteria[1].id, criteria[4].id],
      },
      {
        id: `${slug}-${model}-${number}-p3`,
        text: valid
          ? `I ran the targeted check and observed a clean result with the fallback path still covered; remaining uncertainty is limited to unrelated integration suites.`
          : `I could not retain a complete runtime trace before the trial ended, so the behavioral conclusion is provisional despite the code inspection.`,
        criterionIds: [criteria[2].id, criteria[5].id],
      },
    ],
  };
}

function baseGate(name: GateName): GateResult {
  const data: Record<GateName, [string, string[], number | null]> = {
    Admission: ['Task assets are complete and the requested change is operationally scoped.', ['The task description names a reproducible behavior.', 'The repository boundary is explicit.'], null],
    'No-op': ['The proposed evaluation distinguishes a meaningful repair from an unchanged submission.', ['Baseline behavior reproduces the defect.', 'A no-op does not satisfy the focused assertion.'], null],
    Oracle: ['Oracle checks cover the primary behavior and adjacent regression boundary.', ['The positive path is asserted.', 'The nearest negative control is asserted.'], 0.94],
    'Difficulty — Sable-4': ['Sable-4 trials meet the difficulty threshold with sufficient valid evidence.', ['At least three trials are valid.', 'The aggregate difficulty score is at or above 0.80.'], 0.86],
    'Difficulty — Quartz-Mini': ['Quartz-Mini trials meet the difficulty threshold with sufficient valid evidence.', ['At least three trials are valid.', 'The aggregate difficulty score is at or above 0.80.'], 0.83],
    Analysis: ['The analysis identifies the causal edit and checks realistic failure boundaries.', ['The explanation follows the observed trajectory.', 'Uncertainty is stated where evidence ends.'], null],
  };
  return { name, status: 'pass', summary: data[name][0], reasons: data[name][1], score: data[name][2], validTrials: name.startsWith('Difficulty') ? 3 : 0, totalTrials: name.startsWith('Difficulty') ? 4 : 0, evidenceId: `evidence-${name.toLowerCase().replaceAll(' ', '-')}` };
}

function setGate(gates: GateResult[], name: GateName, status: GateStatus, summary: string, score?: number | null, validTrials?: number) {
  const gate = gates.find((item) => item.name === name)!;
  gate.status = status;
  gate.summary = summary;
  if (score !== undefined) gate.score = score;
  if (validTrials !== undefined) gate.validTrials = validTrials;
  gate.reasons = [summary, `The ${name} evidence requires reviewer attention before certification.`];
}

function fix(slug: string, index: number, category: FixCategory, title: string, detail: string, gateName: GateName): ReviewBundle['fixItems'][number] {
  return {
    id: `${slug}-fix-${index}`,
    category,
    title,
    detail,
    remediation: category === 'RERUN'
      ? `Re-run ${gateName} after collecting a complete, stable evidence set.`
      : category === 'REDESIGN'
        ? 'Rewrite the task contract so the disputed ownership and expected behavior are unambiguous.'
        : category === 'TALK-TO-LEAD'
          ? 'Bring the conflicting evidence and the narrowest safe decision to the benchmark lead.'
          : `Tighten the task assets and add a focused assertion that closes this ${gateName} gap.`,
    resolved: false,
    evidence: { kind: gateName.startsWith('Difficulty') ? 'trial' : 'gate', gateName },
  };
}

function standardFixes(slug: string, subject: string, primaryGate: GateName, includeRedesign = false, includeTalk = false) {
  const items = [] as ReviewBundle['fixItems'];
  let i = 1;
  if (includeRedesign) items.push(fix(slug, i++, 'REDESIGN', `Clarify ownership boundaries for ${subject}`, 'The current statement permits two incompatible but locally plausible implementations.', primaryGate));
  items.push(fix(slug, i++, 'FIX', `Close the uncovered ${primaryGate} boundary`, `Evidence for ${subject} misses the closest adversarial branch.`, primaryGate));
  if (includeTalk) items.push(fix(slug, i++, 'TALK-TO-LEAD', 'Resolve the oracle precedence dispute with the benchmark lead', 'The task prose and oracle encode different winners for the same boundary.', 'Oracle'));
  items.push(fix(slug, i++, 'RERUN', `Collect stable ${primaryGate} evidence`, `The current evidence set for ${subject} is too narrow to certify.`, primaryGate));
  items.push(fix(slug, i++, 'RERUN', 'Repeat the neighboring-control trial', 'The control run ended before its full observation window.', primaryGate));
  return items;
}

function makeBundle(profile: (typeof PROFILES)[number]): ReviewBundle {
  const criteria = makeCriteria(profile.slug);
  const trials: Trial[] = [];
  for (const model of MODELS) {
    for (let number = 1; number <= 4; number += 1) {
      let valid = number !== 4;
      if (profile.state === 'ember' && model === 'Quartz-Mini') valid = number <= 2;
      if (profile.slug === 'spruce-query-normalizer' && model === 'Sable-4') valid = number !== 3;
      trials.push(makeTrial(profile.slug, profile.subject, criteria, model, number, valid));
    }
  }
  const gates = GATE_NAMES.map(baseGate);
  for (const model of MODELS) {
    const modelTrials = trials.filter((trial) => trial.model === model);
    const gate = gates.find((entry) => entry.name === `Difficulty — ${model}`)!;
    gate.validTrials = modelTrials.filter(isTrialValid).length;
    gate.totalTrials = modelTrials.length;
    gate.status = deriveDifficultyStatus(gate.score, gate.validTrials);
  }

  let fixItems: ReviewBundle['fixItems'] = [];
  const stopEarlyFlags: string[] = [];
  switch (profile.state) {
    case 'ready-fixes':
      fixItems = [
        fix(profile.slug, 1, 'FIX', 'Clarify the nested-event fixture label', 'The passing fixture uses a label that is correct but too broad for future reviewers.', 'Oracle'),
        fix(profile.slug, 2, 'RERUN', 'Archive one additional Sable-4 control trial', 'All current trials pass, but one extra control would strengthen the package.', 'Difficulty — Sable-4'),
      ];
      break;
    case 'ember':
      setGate(gates, 'Difficulty — Quartz-Mini', 'inconclusive', 'Only 2 of 4 Quartz-Mini trials are valid; at least 3 are required.', 0.78, 2);
      fixItems = standardFixes(profile.slug, profile.subject, 'Difficulty — Quartz-Mini');
      break;
    case 'fixable-oracle':
      setGate(gates, 'Oracle', 'fail', 'Oracle comprehensiveness is 0.84, below the required 0.90 bar.', 0.84);
      fixItems = standardFixes(profile.slug, profile.subject, 'Oracle');
      break;
    case 'fixable-difficulty':
      setGate(gates, 'Difficulty — Sable-4', 'fail', 'Sable-4 difficulty measures 0.72 with 3 valid trials, below 0.80.', 0.72, 3);
      fixItems = standardFixes(profile.slug, profile.subject, 'Difficulty — Sable-4');
      break;
    case 'fixable-analysis':
      setGate(gates, 'Analysis', 'fail', 'Analysis omits the out-of-order acknowledgement boundary.', null);
      fixItems = standardFixes(profile.slug, profile.subject, 'Analysis');
      break;
    case 'fixable-noop':
      setGate(gates, 'No-op', 'errored', 'The unchanged-submission probe exited before publishing a result.', null);
      fixItems = standardFixes(profile.slug, profile.subject, 'No-op');
      break;
    case 'risk-runtime':
      stopEarlyFlags.push('agent solved without runtime evidence');
      setGate(gates, 'Analysis', 'fail', 'The claimed repair is not supported by retained runtime evidence.', null);
      fixItems = standardFixes(profile.slug, profile.subject, 'Analysis');
      break;
    case 'risk-oracle':
      stopEarlyFlags.push('oracle contradicts the task description');
      setGate(gates, 'Oracle', 'fail', 'Oracle precedence contradicts the task description at the fallback boundary.', 0.76);
      fixItems = standardFixes(profile.slug, profile.subject, 'Oracle', false, true);
      break;
    case 'risk-redesign':
      setGate(gates, 'Admission', 'fail', 'The task does not assign cycle ownership unambiguously.', null);
      fixItems = standardFixes(profile.slug, profile.subject, 'Admission', true);
      break;
  }

  return {
    slug: profile.slug,
    title: profile.title,
    description: profile.subject,
    stopEarlyFlags,
    gates,
    criteria,
    trials,
    fixItems,
    recommendation: null,
    overrideJustification: null,
    overrideEnabled: false,
    reviewerSteps: REVIEWER_STEPS.map((name) => ({ name, done: false, notes: '' })),
    timeline: [
      { id: `${profile.slug}-seed-1`, timestamp: '2026-07-20T09:00:00.000Z', kind: 'evidence', label: 'Seed evidence loaded for review' },
    ],
    reruns: {},
  };
}

export function createSeedBundles() {
  return PROFILES.map(makeBundle);
}
