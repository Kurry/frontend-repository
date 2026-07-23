import { deriveHero, isBundled } from './domain';
import { reviewPackageSchema } from './schemas';
import type { ReviewBundle } from './types';

export function portfolioRollup(bundles: ReviewBundle[]) {
  const totalSable = bundles.reduce((sum, bundle) => sum + (bundle.gates.find((gate) => gate.name === 'Difficulty — Sable-4')?.totalTrials ?? 0), 0);
  const validSable = bundles.reduce((sum, bundle) => sum + (bundle.gates.find((gate) => gate.name === 'Difficulty — Sable-4')?.validTrials ?? 0), 0);
  return {
    totalBundles: bundles.length,
    readyCount: bundles.filter((bundle) => deriveHero(bundle) === 'READY FOR THE BENCHMARK').length,
    notReadyCount: bundles.filter((bundle) => deriveHero(bundle) === 'NOT READY — BUT FIXABLE').length,
    atRiskCount: bundles.filter((bundle) => deriveHero(bundle) === 'AT RISK — MAY NEED A RESTART').length,
    stopEarlyCount: bundles.filter((bundle) => bundle.stopEarlyFlags.length > 0).length,
    sable4ValidityPercent: totalSable ? Math.round((validSable / totalSable) * 10000) / 100 : 0,
  };
}

export function buildReviewPackage(bundles: ReviewBundle[], exportedAt: string) {
  const document = {
    schemaVersion: 'review-certification/v1' as const,
    exportedAt,
    portfolioSummary: portfolioRollup(bundles),
    bundles: bundles.map((bundle) => ({
      slug: bundle.slug,
      heroState: deriveHero(bundle),
      recommendation: bundle.recommendation,
      overrideJustification: bundle.overrideJustification,
      bundled: isBundled(bundle),
      stopEarlyFlags: bundle.stopEarlyFlags,
      gates: bundle.gates.map((gate) => ({
        name: gate.name,
        status: gate.status,
        summary: gate.summary,
        score: gate.score,
        validTrials: gate.validTrials,
        totalTrials: gate.totalTrials,
      })),
      fixItems: bundle.fixItems.map((item, index) => ({
        position: index + 1,
        category: item.category,
        title: item.title,
        detail: item.detail,
        remediation: item.remediation,
        resolved: item.resolved,
      })),
      reviewerSteps: bundle.reviewerSteps.map((step) => ({ name: step.name, done: step.done, notes: step.notes })),
      timeline: bundle.timeline.map((event) => ({ ...event })),
    })),
  };
  return reviewPackageSchema.parse(document);
}

export function reviewPackageJson(bundles: ReviewBundle[], exportedAt: string) {
  return JSON.stringify(buildReviewPackage(bundles, exportedAt), null, 2);
}

export function bundleSummaryMarkdown(bundle: ReviewBundle) {
  const lines = [
    `# Review summary: ${bundle.slug}`,
    '',
    `**Verdict hero:** ${deriveHero(bundle)}`,
    `**Recommendation:** ${bundle.recommendation ?? 'UNSET'}`,
  ];
  if (bundle.overrideJustification) lines.push(`**Override justification:** ${bundle.overrideJustification}`);
  lines.push('', '## Gates', '', '| Gate | Status | Score | Valid trials |', '| --- | --- | ---: | ---: |');
  for (const gate of bundle.gates) lines.push(`| ${gate.name} | ${gate.status} | ${gate.score ?? '—'} | ${gate.validTrials}/${gate.totalTrials} |`);
  lines.push('', '## Ordered fix list', '');
  if (!bundle.fixItems.length) lines.push('No fixes are required.');
  bundle.fixItems.forEach((item, index) => lines.push(`${index + 1}. [${item.resolved ? 'x' : ' '}] **${item.category} — ${item.title}** — ${item.remediation}`));
  lines.push('', '## Reviewer notes', '');
  bundle.reviewerSteps.forEach((step) => lines.push(`- [${step.done ? 'x' : ' '}] **${step.name}:** ${step.notes || 'No notes.'}`));
  return lines.join('\n');
}

export function portfolioSummaryMarkdown(bundles: ReviewBundle[], exportedAt: string) {
  const rollup = portfolioRollup(bundles);
  const lines = [
    '# Review certification portfolio',
    '',
    `Exported: ${exportedAt}`,
    '',
    `- Total bundles: ${rollup.totalBundles}`,
    `- Ready: ${rollup.readyCount}`,
    `- Not ready but fixable: ${rollup.notReadyCount}`,
    `- At risk: ${rollup.atRiskCount}`,
    `- Stop-early flags: ${rollup.stopEarlyCount}`,
    `- Sable-4 validity: ${rollup.sable4ValidityPercent}%`,
    '',
  ];
  for (const bundle of bundles) lines.push(bundleSummaryMarkdown(bundle), '', '---', '');
  return lines.join('\n');
}
