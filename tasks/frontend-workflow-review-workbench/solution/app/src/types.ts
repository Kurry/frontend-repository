export const GATE_NAMES = [
  'Admission',
  'No-op',
  'Oracle',
  'Difficulty — Sable-4',
  'Difficulty — Quartz-Mini',
  'Analysis',
] as const;

export const HERO_STATES = [
  'READY FOR THE BENCHMARK',
  'NOT READY — BUT FIXABLE',
  'AT RISK — MAY NEED A RESTART',
] as const;

export const GATE_STATUSES = ['pass', 'fail', 'errored', 'inconclusive', 'missing'] as const;
export const RECOMMENDATIONS = ['APPROVE', 'APPROVE WITH CAVEATS', 'MAJOR CHANGES NEEDED', 'REJECT-ESCALATE'] as const;
export const FIX_CATEGORIES = ['RERUN', 'FIX', 'REDESIGN', 'TALK-TO-LEAD'] as const;
export const REVIEWER_STEPS = ['Resolve', 'Gate', 'Audit', 'Verdict', 'Bundle'] as const;
export const MODELS = ['Sable-4', 'Quartz-Mini'] as const;
export const CHECK_NAMES = [
  'answer-determinacy',
  'runtime-evidence-used',
  'grounded-in-trajectory',
  'comprehensiveness-near-miss',
  'difficulty-crux',
  'honest-uncertainty',
  'refusals',
  'low-timeout',
] as const;

export type GateName = (typeof GATE_NAMES)[number];
export type HeroState = (typeof HERO_STATES)[number];
export type GateStatus = (typeof GATE_STATUSES)[number];
export type Recommendation = (typeof RECOMMENDATIONS)[number];
export type FixCategory = (typeof FIX_CATEGORIES)[number];
export type ReviewerStepName = (typeof REVIEWER_STEPS)[number];
export type ModelName = (typeof MODELS)[number];
export type CheckName = (typeof CHECK_NAMES)[number];
export type CheckOutcome = 'pass' | 'fail' | 'not-applicable';
export type CriterionOutcome = CheckOutcome;

export interface ValidityCheck {
  name: CheckName;
  outcome: CheckOutcome;
  detail: string;
}

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  negated: boolean;
}

export interface CriterionReasoning {
  criterionId: string;
  outcome: CriterionOutcome;
  text: string;
  citedPassageIds: string[];
}

export interface AnswerPassage {
  id: string;
  text: string;
  criterionIds: string[];
}

export interface Trial {
  id: string;
  model: ModelName;
  number: number;
  checks: ValidityCheck[];
  reasoning: CriterionReasoning[];
  answerPassages: AnswerPassage[];
}

export interface GateResult {
  name: GateName;
  status: GateStatus;
  summary: string;
  reasons: string[];
  score: number | null;
  validTrials: number;
  totalTrials: number;
  evidenceId: string;
}

export interface FixItem {
  id: string;
  category: FixCategory;
  title: string;
  detail: string;
  remediation: string;
  resolved: boolean;
  evidence: { kind: 'gate' | 'trial'; gateName: GateName; trialId?: string };
}

export interface ReviewerStep {
  name: ReviewerStepName;
  done: boolean;
  notes: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  kind: string;
  label: string;
}

export type RerunStepStatus = 'pending' | 'running' | 'waiting' | 'complete' | 'failed';

export interface RerunStep {
  name: 'provision harness' | 'collect trials' | 'evaluate checks' | 'publish result';
  status: RerunStepStatus;
  attempt: number;
  maxAttempts: number;
  timestamp: string | null;
  output: string | null;
  error: string | null;
  backoff: number;
}

export interface RerunSession {
  gateName: GateName;
  status: 'idle' | 'running' | 'paused' | 'complete' | 'failed';
  runId: string;
  currentStep: number;
  steps: RerunStep[];
}

export interface ReviewBundle {
  slug: string;
  title: string;
  description: string;
  stopEarlyFlags: string[];
  gates: GateResult[];
  criteria: Criterion[];
  trials: Trial[];
  fixItems: FixItem[];
  recommendation: Recommendation | null;
  overrideJustification: string | null;
  overrideEnabled: boolean;
  reviewerSteps: ReviewerStep[];
  timeline: TimelineEvent[];
  reruns: Partial<Record<GateName, RerunSession>>;
}

export interface SelectionState {
  bundleSlug: string | null;
  gateName: GateName | null;
  trialId: string | null;
  criterionId: string | null;
}

export interface PortfolioFilters {
  heroState: HeroState | null;
  gateName: GateName | null;
  gateStatus: GateStatus | null;
}

export type ActiveView = 'portfolio' | 'workspace';
export type WorkspacePanel = 'Resolve' | 'Gate' | 'Audit' | 'Verdict' | 'Bundle' | 'Timeline';

export interface DiffState {
  enabled: boolean;
  leftTrialId: string | null;
  rightTrialId: string | null;
  error: string | null;
  previousTrialId: string | null;
}

export interface UIState {
  view: ActiveView;
  workspacePanel: WorkspacePanel;
  exportOpen: boolean;
  exportFormat: 'json' | 'markdown';
  exportGeneratedAt: string;
  importOpen: boolean;
  importDraft: string;
  timelineKind: string | null;
  diff: DiffState;
  announcement: string;
}

export interface RecommendationConstraint {
  allowed: Recommendation[];
  rule: 'talk-to-lead' | 'non-passing-or-redesign' | 'passing-with-fixes' | 'clear';
  explanation: string;
}
