import type { GateResult, GateStatus, HeroState, RecommendationConstraint, ReviewBundle, Trial } from './types';

export function isTrialValid(trial: Trial) {
  return ['answer-determinacy', 'refusals', 'low-timeout'].every(
    (name) => trial.checks.find((check) => check.name === name)?.outcome === 'pass',
  );
}

export function deriveDifficultyStatus(score: number | null, validTrials: number): GateStatus {
  if (validTrials < 3) return 'inconclusive';
  if (score === null) return 'missing';
  return score >= 0.8 ? 'pass' : 'fail';
}

export function deriveHero(bundle: ReviewBundle): HeroState {
  const unresolvedRedesign = bundle.fixItems.some((item) => item.category === 'REDESIGN' && !item.resolved);
  if (bundle.stopEarlyFlags.length > 0 || unresolvedRedesign) return 'AT RISK — MAY NEED A RESTART';
  if (bundle.gates.every((gate) => gate.status === 'pass')) return 'READY FOR THE BENCHMARK';
  return 'NOT READY — BUT FIXABLE';
}

export function deriveConstraint(bundle: ReviewBundle): RecommendationConstraint {
  const unresolved = bundle.fixItems.filter((item) => !item.resolved);
  const talkItems = unresolved.filter((item) => item.category === 'TALK-TO-LEAD');
  if (talkItems.length) {
    return {
      allowed: ['REJECT-ESCALATE'],
      rule: 'talk-to-lead',
      explanation: `Only REJECT-ESCALATE is allowed because ${talkItems.map((item) => `“${item.title}”`).join(', ')} still requires a lead decision.`,
    };
  }
  const nonPassing = bundle.gates.filter((gate) => gate.status !== 'pass');
  const redesign = unresolved.filter((item) => item.category === 'REDESIGN');
  if (nonPassing.length || redesign.length) {
    const triggers = [
      ...nonPassing.map((gate) => `${gate.name} is ${gate.status}`),
      ...redesign.map((item) => `REDESIGN item “${item.title}” is unresolved`),
    ];
    return {
      allowed: ['MAJOR CHANGES NEEDED', 'REJECT-ESCALATE'],
      rule: 'non-passing-or-redesign',
      explanation: `Major changes or escalation are required because ${triggers.join('; ')}.`,
    };
  }
  if (unresolved.length) {
    return {
      allowed: ['APPROVE WITH CAVEATS', 'MAJOR CHANGES NEEDED'],
      rule: 'passing-with-fixes',
      explanation: `All gates pass, but approval must carry caveats while ${unresolved.map((item) => `“${item.title}”`).join(', ')} remain unresolved.`,
    };
  }
  return {
    allowed: ['APPROVE', 'APPROVE WITH CAVEATS'],
    rule: 'clear',
    explanation: 'All six gates pass and every fix item is resolved. APPROVE or APPROVE WITH CAVEATS is allowed.',
  };
}

export function getGate(bundle: ReviewBundle, name: GateResult['name']) {
  return bundle.gates.find((gate) => gate.name === name)!;
}

export function completionCount(bundle: ReviewBundle) {
  return bundle.reviewerSteps.filter((step) => step.done).length;
}

export function isBundled(bundle: ReviewBundle) {
  return bundle.reviewerSteps.find((step) => step.name === 'Bundle')?.done ?? false;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function safeId(prefix = 'event') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Deterministic ids for repeated publishes of the same gate (byte-identical re-run output). */
export function deterministicRerunId(slug: string, gateName: string) {
  const token = `${slug}:${gateName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `rerun-${token}-publish`;
}

export function deterministicTimestamp(slug: string, gateName: string, stepIndex: number) {
  const seed = [...`${slug}|${gateName}|${stepIndex}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const seconds = (seed % 50) + 10;
  return `2026-03-15T14:22:${String(seconds).padStart(2, '0')}.000Z`;
}
