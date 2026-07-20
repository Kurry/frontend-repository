import { z } from 'zod'

export const CHECKS = ['package-shape','task-config','rubric-wiring','file-modes','harvest','container-parity','dependency-pinning','foils','scoring-contract']
export const CRITERIA = ['runtime-crux-load-bearing','premise-truthful','question-non-leaking','rubric-scope-alignment','positive-criteria-grade-meaning','negative-criteria-grounded','golden-answer-faithful','foils-discriminating','difficulty-substantive','trial-evidence-valid']
export const REVIEWERS = ['Dana Whitfield','Marcus Okafor','Elena Vasquez','Priya Nair','Jonas Keller','Ruth Alvarez','Samir Haddad','Ingrid Larsen','Felix Moreau']
export const FEEDBACK_VERDICTS = ['Approve','Approve with caveats','Needs edit','Reject']
export const STAGES = ['pending','checked','held','admitted','escalated','re-audited','resolved']
export const ESCALATION_CATEGORIES = ['Spec conflict','Tooling gap','Dataset defect','Scoring disagreement']
export const REPOSITORIES = ['meridian/copperbeam','quartzlab/hollybush','silverpine/driftnet','bluegate/ironvale','cedarworks/lanternfish','foxglove/marrowgrid','oakhaven/pebblecourt']

const trimmed = (min, field) => z.string().trim().min(min, `${field} must be at least ${min} characters`)
export const FeedbackEntrySchema = z.object({
  reviewer: z.enum(REVIEWERS, { error: 'reviewer must be one of the seeded reviewers' }),
  verdict: z.enum(FEEDBACK_VERDICTS, { error: 'feedback-verdict must be a supported verdict' }),
  findings: trimmed(20, 'findings')
}).strict()
export const CriterionFailVerdictSchema = z.object({
  criterion: z.enum(CRITERIA, { error: 'criterion must be a supported admission criterion' }),
  verdict: z.literal('fail', { error: 'verdict must be fail' }),
  rationale: trimmed(15, 'rationale')
}).strict()
export const EscalationSchema = z.object({
  category: z.enum(ESCALATION_CATEGORIES, { error: 'category must be a supported escalation category' }),
  summary: trimmed(20, 'summary')
}).strict()
export const ResolutionSchema = z.object({ note: trimmed(15, 'note') }).strict()

const isoZ = z.string().refine(v => !Number.isNaN(Date.parse(v)) && v.endsWith('Z'), 'exportedAt must be an ISO-8601 timestamp ending in Z')
const checkOutcome = z.object({ check: z.enum(CHECKS), status: z.enum(['pass','fail','not-run']) }).strict()
const taskPackage = z.object({
  slug: z.string().min(1, 'slug is required'),
  stage: z.enum(STAGES, { error: 'stage must be a supported lifecycle stage' }),
  checks: z.array(checkOutcome).length(9, 'checks must contain exactly nine entries').refine(a => CHECKS.every((c,i) => a[i]?.check === c), 'checks must follow the nine-check order'),
  failedCriteria: z.array(CriterionFailVerdictSchema),
  feedback: z.array(FeedbackEntrySchema),
  escalation: EscalationSchema.nullable().optional(),
  resolution: ResolutionSchema.nullable().optional()
}).strict()
const checkRate = z.object({ check: z.enum(CHECKS), passes: z.number().int().nonnegative(), fails: z.number().int().nonnegative(), passRate: z.number().min(0).max(100) }).strict()
const criterionRank = z.object({ criterion: z.enum(CRITERIA), failures: z.number().int().nonnegative() }).strict()
const verdictMix = z.object(Object.fromEntries(FEEDBACK_VERDICTS.map(v => [v,z.number().int().nonnegative()]))).strict()
const reviewerActivity = z.object({ reviewer: z.enum(REVIEWERS), entryCount: z.number().int().nonnegative(), verdictMix }).strict()
const datasetSummary = z.object(Object.fromEntries(['admitted','held','escalated','resolved','total'].map(k => [k,z.number().int().nonnegative()]))).strict()
const exportHistory = z.object({ exportedAt: isoZ, format: z.enum(['json','markdown']) }).strict()

export const AuditPackageSchema = z.object({
  schemaVersion: z.literal('quality-audit-package-v1', { error: 'schemaVersion must be exactly quality-audit-package-v1' }),
  exportedAt: isoZ,
  datasetSummary,
  checkPassRates: z.array(checkRate).length(9, 'checkPassRates must contain exactly nine entries').refine(a => CHECKS.every((c,i) => a[i]?.check === c), 'checkPassRates must follow the nine-check order'),
  criterionFailureRanking: z.array(criterionRank).length(10, 'criterionFailureRanking must contain exactly ten entries'),
  reviewerActivity: z.array(reviewerActivity).length(9, 'reviewerActivity must contain all nine reviewers'),
  tasks: z.array(taskPackage),
  exportHistory: z.array(exportHistory)
}).strict()

export const GUIDANCE = {
  'runtime-crux-load-bearing':'The task must require the target runtime behavior; a static shortcut cannot earn full credit.',
  'premise-truthful':'Every factual premise in the prompt must match the repository and executable environment.',
  'question-non-leaking':'The prompt must not reveal the implementation or exact assertion needed to pass.',
  'rubric-scope-alignment':'Rubric items must assess only work requested by the task and observable in scope.',
  'positive-criteria-grade-meaning':'Positive criteria should separate complete, meaningful work from superficial changes.',
  'negative-criteria-grounded':'Negative criteria must describe concrete, observable failure modes rather than style preferences.',
  'golden-answer-faithful':'The reference solution must satisfy the prompt without relying on hidden or unrelated changes.',
  'foils-discriminating':'Foils should exercise plausible mistakes and be rejected for the intended reason.',
  'difficulty-substantive':'The task should require non-trivial reasoning while remaining bounded and reproducible.',
  'trial-evidence-valid':'Trial results must come from the declared environment and support the stated conclusion.'
}

export function firstZodError(error) {
  const issue = error?.issues?.[0]
  if (!issue) return 'Audit Package JSON is invalid'
  const field = issue.path?.length ? issue.path.join('.') : 'Audit Package JSON'
  return `${field}: ${issue.message}`
}
