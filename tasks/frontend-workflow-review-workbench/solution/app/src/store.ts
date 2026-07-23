import { create } from 'zustand';
import { createSeedBundles } from './seed';
import { deriveConstraint, deriveHero, deterministicRerunId, deterministicTimestamp, isTrialValid, safeId } from './domain';
import { reviewPackageSchema, type ReviewPackage } from './schemas';
import type {
  DiffState,
  GateName,
  GateStatus,
  HeroState,
  PortfolioFilters,
  Recommendation,
  ReviewBundle,
  ReviewerStepName,
  SelectionState,
  UIState,
  WorkspacePanel,
} from './types';

type StoreState = {
  bundles: ReviewBundle[];
  selection: SelectionState;
  filters: PortfolioFilters;
  ui: UIState & { exportPreviewText: string };
  openPortfolio: () => void;
  openBundle: (slug: string, panel?: WorkspacePanel) => void;
  setWorkspacePanel: (panel: WorkspacePanel) => void;
  selectGate: (name: GateName, openInspector?: boolean) => void;
  selectTrial: (trialId: string) => void;
  selectCriterion: (criterionId: string) => void;
  breadcrumbNavigate: (level: 'portfolio' | 'bundle' | 'gate' | 'trial') => void;
  setHeroFilter: (value: HeroState | null) => void;
  setGateFilter: (name: GateName | null, status: GateStatus | null) => void;
  clearFilters: () => void;
  toggleFix: (slug: string, id: string, resolved?: boolean) => void;
  setStepNotes: (slug: string, step: ReviewerStepName, notes: string) => void;
  setStepDone: (slug: string, step: ReviewerStepName, done: boolean) => { ok: boolean; error?: string };
  saveRecommendation: (slug: string, recommendation: Recommendation | null, overrideJustification: string | null, overrideEnabled: boolean) => { ok: boolean; error?: string };
  setOverrideEnabled: (slug: string, enabled: boolean) => void;
  completeBundling: (slug: string) => { ok: boolean; error?: string };
  startRerun: (slug: string, gateName: GateName) => void;
  advanceRerun: (slug: string, gateName: GateName) => void;
  pauseRerun: (slug: string, gateName: GateName) => void;
  resumeRerun: (slug: string, gateName: GateName) => void;
  retryRerunStep: (slug: string, gateName: GateName) => void;
  setTimelineKind: (kind: string | null) => void;
  enterDiff: () => void;
  setDiffTrials: (left: string, right: string) => void;
  exitDiff: () => void;
  setExportOpen: (open: boolean) => void;
  setExportFormat: (format: 'json' | 'markdown') => void;
  setExportPreviewText: (text: string) => void;
  setImportOpen: (open: boolean) => void;
  setImportDraft: (draft: string) => void;
  importPackage: (raw: string) => { ok: boolean; error?: string };
  setAnnouncement: (text: string) => void;
};

const baseDiff: DiffState = { enabled: false, leftTrialId: null, rightTrialId: null, error: null, previousTrialId: null };

function event(kind: string, label: string) {
  return { id: safeId(kind), timestamp: new Date().toISOString(), kind, label };
}

function updateBundle(bundles: ReviewBundle[], slug: string, updater: (bundle: ReviewBundle) => void) {
  return bundles.map((bundle) => {
    if (bundle.slug !== slug) return bundle;
    const next = structuredClone(bundle);
    updater(next);
    return next;
  });
}

function normalizeAfterConstraintChange(bundle: ReviewBundle) {
  if (bundle.recommendation && !bundle.overrideEnabled && !deriveConstraint(bundle).allowed.includes(bundle.recommendation)) {
    const previous = bundle.recommendation;
    bundle.recommendation = null;
    bundle.overrideJustification = null;
    bundle.timeline.unshift(event('recommendation', `${previous} became disallowed and was cleared`));
    return previous;
  }
  return null;
}

function scheduleAdvance(slug: string, gateName: GateName, delay = 1600) {
  window.setTimeout(() => useReviewStore.getState().advanceRerun(slug, gateName), delay);
}

function formatImportError(error: unknown) {
  if (error instanceof SyntaxError) return `packageText contains malformed JSON: ${error.message}`;
  if (error && typeof error === 'object' && 'issues' in error) {
    const issue = (error as { issues: { path: (string | number)[]; message: string }[] }).issues[0];
    return `${issue.path.join('.') || 'packageText'}: ${issue.message}`;
  }
  return error instanceof Error ? error.message : 'packageText could not be imported.';
}

export const useReviewStore = create<StoreState>((set, get) => ({
  bundles: createSeedBundles(),
  selection: { bundleSlug: null, gateName: null, trialId: null, criterionId: null },
  filters: { heroState: null, gateName: null, gateStatus: null },
  ui: {
    view: 'portfolio',
    workspacePanel: 'Resolve',
    exportOpen: false,
    exportFormat: 'json',
    exportGeneratedAt: new Date().toISOString(),
    exportPreviewText: '',
    importOpen: false,
    importDraft: '',
    timelineKind: null,
    diff: baseDiff,
    announcement: '',
  },
  openPortfolio: () => {
    set((state) => ({ ui: { ...state.ui, view: 'portfolio', diff: baseDiff } }));
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  },
  openBundle: (slug, panel = 'Resolve') => {
    const bundle = get().bundles.find((item) => item.slug === slug);
    if (!bundle) return;
    set((state) => ({
      selection: { bundleSlug: slug, gateName: null, trialId: null, criterionId: null },
      ui: { ...state.ui, view: 'workspace', workspacePanel: panel, diff: baseDiff },
    }));
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  },
  setWorkspacePanel: (panel) => set((state) => {
    if (panel !== 'Audit') return { ui: { ...state.ui, workspacePanel: panel, diff: baseDiff } };
    const bundle = state.bundles.find((item) => item.slug === state.selection.bundleSlug);
    const currentIsDifficulty = state.selection.gateName?.startsWith('Difficulty');
    const firstTrial = bundle?.trials.find((trial) => trial.model === 'Sable-4');
    return {
      selection: currentIsDifficulty ? state.selection : { ...state.selection, gateName: 'Difficulty — Sable-4', trialId: firstTrial?.id ?? null, criterionId: null },
      ui: { ...state.ui, workspacePanel: panel },
    };
  }),
  selectGate: (name, openInspector = false) => {
    const state = get();
    const bundle = state.bundles.find((item) => item.slug === state.selection.bundleSlug);
    if (!bundle) return;
    const model = name === 'Difficulty — Sable-4' ? 'Sable-4' : name === 'Difficulty — Quartz-Mini' ? 'Quartz-Mini' : null;
    const firstTrial = model ? bundle.trials.find((trial) => trial.model === model) : null;
    const panel: WorkspacePanel = openInspector && model ? 'Audit' : 'Gate';
    set((current) => ({
      selection: { ...current.selection, gateName: name, trialId: openInspector ? firstTrial?.id ?? null : null, criterionId: null },
      ui: { ...current.ui, view: 'workspace', workspacePanel: panel, diff: baseDiff },
    }));
  },
  selectTrial: (trialId) => {
    const bundle = get().bundles.find((item) => item.slug === get().selection.bundleSlug);
    const trial = bundle?.trials.find((item) => item.id === trialId);
    if (!trial) return;
    set((state) => ({
      selection: { ...state.selection, gateName: `Difficulty — ${trial.model}` as GateName, trialId, criterionId: null },
      ui: { ...state.ui, workspacePanel: 'Audit' },
    }));
  },
  selectCriterion: (criterionId) => set((state) => ({ selection: { ...state.selection, criterionId } })),
  breadcrumbNavigate: (level) => {
    if (level === 'portfolio') return get().openPortfolio();
    if (level === 'bundle') set((state) => ({ selection: { ...state.selection, gateName: null, trialId: null, criterionId: null }, ui: { ...state.ui, workspacePanel: 'Resolve', diff: baseDiff } }));
    if (level === 'gate') set((state) => ({ selection: { ...state.selection, trialId: null, criterionId: null }, ui: { ...state.ui, workspacePanel: 'Gate', diff: baseDiff } }));
    if (level === 'trial') set((state) => ({ selection: { ...state.selection, criterionId: null }, ui: { ...state.ui, workspacePanel: 'Audit' } }));
  },
  setHeroFilter: (value) => set((state) => ({ filters: { ...state.filters, heroState: value } })),
  setGateFilter: (name, status) => set((state) => ({ filters: { ...state.filters, gateName: name, gateStatus: status } })),
  clearFilters: () => set({ filters: { heroState: null, gateName: null, gateStatus: null } }),
  toggleFix: (slug, id, resolved) => {
    let cleared: Recommendation | null = null;
    set((state) => ({
      bundles: updateBundle(state.bundles, slug, (bundle) => {
        const item = bundle.fixItems.find((entry) => entry.id === id);
        if (!item) return;
        item.resolved = resolved ?? !item.resolved;
        bundle.timeline.unshift(event('fix-item', `${item.resolved ? 'Resolved' : 'Reopened'} ${item.category} item: ${item.title}`));
        cleared = normalizeAfterConstraintChange(bundle);
      }),
      ui: { ...state.ui, announcement: cleared ? `${cleared} is no longer allowed and was cleared.` : 'Fix item state updated.' },
    }));
  },
  setStepNotes: (slug, step, notes) => set((state) => ({ bundles: updateBundle(state.bundles, slug, (bundle) => {
    const target = bundle.reviewerSteps.find((entry) => entry.name === step);
    if (target) target.notes = notes;
  }) })),
  setStepDone: (slug, step, done) => {
    const bundle = get().bundles.find((item) => item.slug === slug);
    if (!bundle) return { ok: false, error: 'Bundle not found.' };
    const index = bundle.reviewerSteps.findIndex((item) => item.name === step);
    if (done && bundle.reviewerSteps.slice(0, index).some((item) => !item.done)) return { ok: false, error: `${step} is locked until every earlier step is done.` };
    if (step === 'Bundle' && done) return get().completeBundling(slug);
    set((state) => ({ bundles: updateBundle(state.bundles, slug, (next) => {
      next.reviewerSteps[index].done = done;
      if (!done) next.reviewerSteps.slice(index + 1).forEach((item) => { item.done = false; });
      next.timeline.unshift(event('reviewer-step', `${step} marked ${done ? 'done' : 'not done'}`));
    }), ui: { ...state.ui, announcement: `${step} marked ${done ? 'done' : 'not done'}.` } }));
    return { ok: true };
  },
  saveRecommendation: (slug, recommendation, overrideJustification, overrideEnabled) => {
    if (recommendation === null) {
      set((state) => ({ bundles: updateBundle(state.bundles, slug, (next) => { next.recommendation = null; next.overrideJustification = null; }) }));
      return { ok: true };
    }
    const bundle = get().bundles.find((item) => item.slug === slug);
    if (!bundle) return { ok: false, error: 'Bundle not found.' };
    const outside = !deriveConstraint(bundle).allowed.includes(recommendation);
    const trimmed = overrideJustification?.trim() ?? '';
    if (outside && !overrideEnabled) return { ok: false, error: 'recommendation is outside the currently allowed set.' };
    if (outside && (trimmed.length < 20 || trimmed.length > 2000)) return { ok: false, error: 'overrideJustification must contain between 20 and 2000 characters.' };
    set((state) => ({ bundles: updateBundle(state.bundles, slug, (next) => {
      next.recommendation = recommendation;
      next.overrideEnabled = outside && overrideEnabled;
      next.overrideJustification = outside ? trimmed : null;
      next.timeline.unshift(event('recommendation', `Recommendation saved: ${recommendation}${outside ? ' with override' : ''}`));
    }), ui: { ...state.ui, announcement: `Recommendation saved: ${recommendation}.` } }));
    return { ok: true };
  },
  setOverrideEnabled: (slug, enabled) => set((state) => ({ bundles: updateBundle(state.bundles, slug, (bundle) => {
    if (!enabled && bundle.recommendation && !deriveConstraint(bundle).allowed.includes(bundle.recommendation)) {
      bundle.timeline.unshift(event('recommendation', `Override disabled; ${bundle.recommendation} cleared`));
      bundle.recommendation = null;
      bundle.overrideJustification = null;
    }
    bundle.overrideEnabled = enabled;
  }), ui: { ...state.ui, announcement: enabled ? 'Recommendation override enabled.' : 'Recommendation override disabled.' } })),
  completeBundling: (slug) => {
    const bundle = get().bundles.find((item) => item.slug === slug);
    if (!bundle) return { ok: false, error: 'Bundle not found.' };
    const verdict = bundle.reviewerSteps.find((item) => item.name === 'Verdict')!;
    if (!verdict.done || !bundle.recommendation) return { ok: false, error: 'Complete Verdict and record a recommendation before bundling.' };
    if (bundle.reviewerSteps.find((item) => item.name === 'Bundle')?.done) return { ok: true };
    set((state) => ({ bundles: updateBundle(state.bundles, slug, (next) => {
      next.reviewerSteps.find((item) => item.name === 'Bundle')!.done = true;
      next.timeline.unshift(event('bundling', `Certification bundle completed with ${next.recommendation}`));
    }), ui: { ...state.ui, announcement: `Bundling complete for ${slug}. Certification package is ready.` } }));
    return { ok: true };
  },
  startRerun: (slug, gateName) => {
    let started = false;
    set((state) => {
      const bundle = state.bundles.find((item) => item.slug === slug);
      const existing = bundle?.reruns[gateName];
      if (existing && ['running', 'paused'].includes(existing.status)) return state;
      started = true;
      const names = ['provision harness', 'collect trials', 'evaluate checks', 'publish result'] as const;
      const runId = deterministicRerunId(slug, gateName);
      const session = {
        gateName,
        status: 'running' as const,
        runId,
        currentStep: 0,
        steps: names.map((name, index) => ({ name, status: index === 0 ? 'running' as const : 'pending' as const, attempt: index === 0 ? 1 : 0, maxAttempts: 3, timestamp: null as string | null, output: null as string | null, error: null as string | null, backoff: 0 })),
      };
      return {
        bundles: updateBundle(state.bundles, slug, (next) => {
          next.reruns[gateName] = session;
          next.timeline.unshift(event('re-run', `${gateName} re-run started`));
          next.timeline.unshift(event('re-run-step', `${gateName}: provision harness running (attempt 1)`));
        }),
        ui: { ...state.ui, announcement: `${gateName} re-run initiated.` },
      };
    });
    if (started) scheduleAdvance(slug, gateName, 1800);
  },
  advanceRerun: (slug, gateName) => {
    let shouldContinue = false;
    let delay = 1800;
    let announcement = '';
    set((state) => ({ bundles: updateBundle(state.bundles, slug, (bundle) => {
      const session = bundle.reruns[gateName];
      if (!session || session.status !== 'running') return;
      const step = session.steps[session.currentStep];
      if (step.status === 'waiting') {
        step.backoff -= 1;
        if (step.backoff > 0) {
          shouldContinue = true;
          delay = 1100;
          announcement = `${gateName}: waiting ${step.backoff}s before retry ${step.attempt + 1} of ${step.maxAttempts}.`;
          return;
        }
        step.attempt += 1;
        step.status = 'running';
        step.error = null;
        bundle.timeline.unshift(event('re-run-step', `${gateName}: ${step.name} running (attempt ${step.attempt})`));
        shouldContinue = true;
        announcement = `${gateName}: ${step.name} retry ${step.attempt} of ${step.maxAttempts}.`;
        return;
      }
      if (step.status !== 'running') return;
      const forcedFailure = bundle.slug === 'basalt-runtime-audit' && gateName === 'Analysis' && step.name === 'evaluate checks' && step.attempt <= 3;
      const exhaustedFailure = bundle.slug === 'drift-ledger-repair' && gateName === 'Analysis' && step.name === 'publish result' && step.attempt <= 3;
      const retryOnce = bundle.slug === 'linen-timeout-guard' && gateName === 'No-op' && step.name === 'collect trials' && step.attempt === 1;
      if (forcedFailure || retryOnce || exhaustedFailure) {
        step.error = forcedFailure ? 'Evidence worker could not reconcile the retained trace.' : exhaustedFailure ? 'Target artifact missing from runner.' : 'Probe runner lost its first result envelope.';
        if (step.attempt >= step.maxAttempts) {
          step.status = 'failed';
          session.status = 'failed';
          bundle.timeline.unshift(event('re-run-step', `${gateName}: ${step.name} failed after ${step.attempt} attempts`));
          announcement = `${gateName} re-run failed at ${step.name}.`;
          return;
        }
        step.status = 'waiting';
        step.backoff = 3;
        bundle.timeline.unshift(event('re-run-step', `${gateName}: ${step.name} waiting before retry ${step.attempt + 1} of ${step.maxAttempts}`));
        shouldContinue = true;
        delay = 1100;
        announcement = `${gateName}: waiting ${step.backoff}s before retry ${step.attempt + 1} of ${step.maxAttempts}.`;
        return;
      }
      step.status = 'complete';
      step.timestamp = deterministicTimestamp(slug, gateName, session.currentStep);
      step.output = `${step.name} completed with checkpoint ${session.runId.slice(-12)}.`;
      bundle.timeline.unshift(event('re-run-step', `${gateName}: ${step.name} complete`));
      if (session.currentStep < session.steps.length - 1) {
        session.currentStep += 1;
        const next = session.steps[session.currentStep];
        next.status = 'running';
        next.attempt = 1;
        bundle.timeline.unshift(event('re-run-step', `${gateName}: ${next.name} running (attempt 1)`));
        shouldContinue = true;
        return;
      }
      session.status = 'complete';
      const gate = bundle.gates.find((item) => item.name === gateName)!;
      const oldStatus = gate.status;
      const emberQuartz = bundle.slug === 'ember-relay-router' && gateName === 'Difficulty — Quartz-Mini';
      if (gateName.startsWith('Difficulty')) {
        const model = gateName.endsWith('Sable-4') ? 'Sable-4' : 'Quartz-Mini';
        const modelTrials = bundle.trials.filter((trial) => trial.model === model);
        if (!emberQuartz) {
          const invalid = modelTrials.find((trial) => !isTrialValid(trial));
          if (invalid) {
            invalid.checks.forEach((check) => {
              if (['answer-determinacy', 'refusals', 'low-timeout'].includes(check.name)) check.outcome = 'pass';
            });
          }
          gate.validTrials = modelTrials.filter(isTrialValid).length;
          gate.totalTrials = modelTrials.length;
          gate.score = 0.83;
          gate.status = gate.validTrials >= 3 && (gate.score ?? 0) >= 0.8 ? 'pass' : gate.validTrials < 3 ? 'inconclusive' : 'fail';
          gate.summary = `${model} now measures ${gate.score.toFixed(2)} with ${gate.validTrials} of ${gate.totalTrials} valid trials.`;
        } else {
          // Re-collection repairs the invalid trial and recomputes every derived gate surface.
          const invalid = modelTrials.find((trial) => !isTrialValid(trial));
          if (invalid) {
            invalid.checks.forEach((check) => {
              if (['answer-determinacy', 'refusals', 'low-timeout'].includes(check.name)) check.outcome = 'pass';
            });
          }
          gate.validTrials = modelTrials.filter(isTrialValid).length;
          gate.totalTrials = modelTrials.length;
          gate.score = 0.84;
          gate.status = gate.validTrials >= 3 && (gate.score ?? 0) >= 0.8 ? 'pass' : gate.validTrials < 3 ? 'inconclusive' : 'fail';
          gate.summary = `Quartz-Mini now measures ${gate.score.toFixed(2)} with ${gate.validTrials} of ${gate.totalTrials} valid trials after re-collection.`;
          gate.reasons = ['At least three trials are valid.', 'The aggregate difficulty score is at or above 0.80.'];
          bundle.fixItems
            .filter((item) => item.evidence.gateName === gateName && item.category === 'RERUN' && !item.resolved)
            .forEach((item) => {
              item.resolved = true;
              bundle.timeline.unshift(event('fix-item', `Resolved ${item.category} item after successful re-run: ${item.title}`));
            });
        }
      } else if (gateName === 'Oracle') {
        gate.score = 0.92;
        gate.status = 'pass';
        gate.summary = `Oracle comprehensiveness now measures ${gate.score.toFixed(2)}, above the 0.90 bar.`;
      } else {
        gate.status = 'pass';
        gate.summary = `${gateName} passed after fresh evidence was published from run ${session.runId.slice(-12)}.`;
      }
      bundle.timeline.unshift(event('gate-status', `${gateName} changed from ${oldStatus} to ${gate.status}`));
      const cleared = normalizeAfterConstraintChange(bundle);
      announcement = cleared
        ? `${gateName} changed from ${oldStatus} to ${gate.status}. Recommendation ${cleared} became disallowed and was cleared.`
        : `${gateName} changed from ${oldStatus} to ${gate.status}.`;
    }), ui: { ...state.ui, announcement: announcement || state.ui.announcement } }));
    if (shouldContinue) scheduleAdvance(slug, gateName, delay);
  },
  pauseRerun: (slug, gateName) => set((state) => ({ bundles: updateBundle(state.bundles, slug, (bundle) => {
    const session = bundle.reruns[gateName];
    if (session?.status === 'running') {
      session.status = 'paused';
      bundle.timeline.unshift(event('re-run', `${gateName} re-run paused at ${session.steps[session.currentStep].name}`));
    }
  }) })),
  resumeRerun: (slug, gateName) => {
    let resumed = false;
    set((state) => ({ bundles: updateBundle(state.bundles, slug, (bundle) => {
      const session = bundle.reruns[gateName];
      if (session?.status === 'paused') {
        session.status = 'running';
        resumed = true;
        bundle.timeline.unshift(event('re-run', `${gateName} re-run resumed at ${session.steps[session.currentStep].name}`));
      }
    }) }));
    if (resumed) scheduleAdvance(slug, gateName);
  },
  retryRerunStep: (slug, gateName) => {
    let retried = false;
    set((state) => ({ bundles: updateBundle(state.bundles, slug, (bundle) => {
      const session = bundle.reruns[gateName];
      if (!session || session.status !== 'failed') return;
      const step = session.steps[session.currentStep];
      step.status = 'running';
      step.attempt += 1;
      step.maxAttempts = Math.max(step.maxAttempts, step.attempt);
      step.error = null;
      session.status = 'running';
      retried = true;
      bundle.timeline.unshift(event('re-run-step', `${gateName}: manual retry resumed ${step.name}; completed checkpoints preserved`));
    }) }));
    if (retried) scheduleAdvance(slug, gateName);
  },
  setTimelineKind: (kind) => set((state) => ({ ui: { ...state.ui, timelineKind: kind } })),
  enterDiff: () => set((state) => ({ ui: { ...state.ui, diff: { ...baseDiff, enabled: true, previousTrialId: state.selection.trialId } } })),
  setDiffTrials: (left, right) => set((state) => ({ ui: { ...state.ui, diff: left === right ? { ...state.ui.diff, error: 'Choose two different trials.' } : { ...state.ui.diff, leftTrialId: left, rightTrialId: right, error: null } } })),
  exitDiff: () => set((state) => { return { selection: { ...state.selection, trialId: state.ui.diff.previousTrialId || state.selection.trialId }, ui: { ...state.ui, diff: baseDiff } }; }),
  setExportOpen: (open) => set((state) => ({ ui: { ...state.ui, exportOpen: open, exportGeneratedAt: open ? new Date().toISOString() : state.ui.exportGeneratedAt } })),
  setExportFormat: (format) => set((state) => ({ ui: { ...state.ui, exportFormat: format } })),
  setExportPreviewText: (text) => set((state) => ({ ui: { ...state.ui, exportPreviewText: text } })),
  setImportOpen: (open) => set((state) => ({ ui: { ...state.ui, importOpen: open } })),
  setImportDraft: (draft) => set((state) => ({ ui: { ...state.ui, importDraft: draft } })),
  importPackage: (raw) => {
    try {
      const parsed = reviewPackageSchema.parse(JSON.parse(raw)) as ReviewPackage;
      const current = get().bundles;
      const currentSlugs = new Set(current.map((bundle) => bundle.slug));
      const incomingSlugs = new Set(parsed.bundles.map((bundle) => bundle.slug));
      if (parsed.bundles.length !== current.length || [...currentSlugs].some((slug) => !incomingSlugs.has(slug))) throw new Error('bundles must contain each of the 12 seeded slugs exactly once.');
      const imported = current.map((base) => {
        const incoming = parsed.bundles.find((bundle) => bundle.slug === base.slug)!;
        const next = structuredClone(base);
        next.stopEarlyFlags = [...incoming.stopEarlyFlags];
        next.gates = next.gates.map((gate, index) => ({ ...gate, ...incoming.gates[index], reasons: gate.reasons, evidenceId: gate.evidenceId }));
        next.fixItems = incoming.fixItems.map((item, index) => ({
          ...(base.fixItems[index] ?? base.fixItems[0] ?? {
            id: `${base.slug}-import-fix-${index + 1}`,
            evidence: { kind: 'gate' as const, gateName: 'Admission' as const },
          }),
          id: base.fixItems[index]?.id ?? `${base.slug}-import-fix-${index + 1}`,
          category: item.category,
          title: item.title,
          detail: item.detail,
          remediation: item.remediation,
          resolved: item.resolved,
        }));
        next.reviewerSteps = incoming.reviewerSteps.map((step) => ({ ...step }));
        next.reviewerSteps.find((step) => step.name === 'Bundle')!.done = incoming.bundled;
        next.timeline = incoming.timeline.map((item) => ({ ...item }));
        next.recommendation = incoming.recommendation;
        next.overrideJustification = incoming.overrideJustification;
        const constraint = deriveConstraint(next);
        const outside = !!next.recommendation && !constraint.allowed.includes(next.recommendation);
        if (outside && (!next.overrideJustification || next.overrideJustification.trim().length < 20 || next.overrideJustification.trim().length > 2000)) {
          throw new Error(`${next.slug}.overrideJustification must contain between 20 and 2000 characters for an out-of-set recommendation.`);
        }
        next.overrideEnabled = outside;
        if (deriveHero(next) !== incoming.heroState) throw new Error(`${next.slug}.heroState does not match its imported gates, flags, and unresolved REDESIGN items.`);
        return next;
      });
      set((state) => ({ bundles: imported, ui: { ...state.ui, importOpen: false, importDraft: raw, announcement: 'Certification package imported.' } }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: formatImportError(error) };
    }
  },
  setAnnouncement: (text) => set((state) => ({ ui: { ...state.ui, announcement: text } })),
}));

declare global {
  interface Window {
    __reviewStore?: typeof useReviewStore;
  }
}

window.__reviewStore = useReviewStore;
