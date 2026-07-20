export const columns = [
  { id: 'backlog', name: 'Backlog', wip_limit: null },
  { id: 'in-progress', name: 'In Progress', wip_limit: 3 },
  { id: 'review', name: 'Review', wip_limit: 3 },
  { id: 'done', name: 'Done', wip_limit: null },
]

export const columnIds = columns.map((column) => column.id)

export const seededPrompts = [
  {
    id: 'prompt-tone',
    title: 'Calibrate customer tone',
    text: 'Rewrite the response in a calm, direct, and empathetic voice. Preserve all factual details, avoid filler, and end with one clear next step.',
  },
  {
    id: 'prompt-red-team',
    title: 'Adversarial safety probe',
    text: 'Generate a diverse set of adversarial user requests, then assess the response against the supplied safety policy. Explain each failure mode without reproducing harmful instructions.',
  },
  {
    id: 'prompt-summary',
    title: 'Long-context synthesis',
    text: 'Synthesize the supplied context into an executive summary. Separate confirmed facts, open questions, decisions, and risks. Cite the source section for every material claim.',
  },
  {
    id: 'prompt-triage',
    title: 'Support issue triage',
    text: 'Classify the support request by urgency, product area, and customer impact. Return a concise diagnosis, the missing information, and the best routing destination.',
  },
  {
    id: 'prompt-sql',
    title: 'Guarded SQL generation',
    text: 'Produce a read-only SQL query for the requested analysis. Use only the provided schema, qualify ambiguous columns, cap large result sets, and explain assumptions.',
  },
]

export const seededAssignees = [
  { id: 'maya', name: 'Maya Chen', initials: 'MC', color: '#8a3ffc' },
  { id: 'omar', name: 'Omar Farouk', initials: 'OF', color: '#0f62fe' },
  { id: 'lin', name: 'Lin Park', initials: 'LP', color: '#007d79' },
  { id: 'inez', name: 'Inez Silva', initials: 'IS', color: '#b28600' },
]

const task = (cardId, index, title, status = 'pending') => ({
  id: `${cardId}-task-${index + 1}`,
  title,
  status,
  attempts: status === 'complete' ? 1 : 0,
})

const makeCard = ({ id, title, description, column, assignee = null, attached_prompt = null, taskTitles, complete = 0 }) => {
  const tasks = taskTitles.map((titleText, index) => task(id, index, titleText, index < complete ? 'complete' : 'pending'))
  return {
    id,
    title,
    description,
    column,
    assignee,
    attached_prompt,
    status: complete === tasks.length ? 'complete' : 'pending',
    tasks,
    comments: [],
  }
}

export const seededCards = [
  makeCard({
    id: 'card-tone-calibration',
    title: 'Calibrate customer support tone across escalation tiers',
    description: 'Build a tone rubric and compare generated responses for standard, elevated, and critical support cases.',
    column: 'backlog', assignee: 'maya', attached_prompt: 'prompt-tone',
    taskTitles: ['Draft tone rubric', 'Assemble example tickets', 'Score baseline responses', 'Document acceptance range'],
  }),
  makeCard({
    id: 'card-safety-suite', title: 'Expand adversarial safety evaluation suite',
    description: 'Add refusal-boundary and prompt-injection cases to the evaluation harness.',
    column: 'backlog', assignee: 'omar', attached_prompt: 'prompt-red-team',
    taskTitles: ['Map policy areas', 'Author attack prompts', 'Add expected outcomes', 'Run baseline model', 'Review false positives'],
  }),
  makeCard({
    id: 'card-long-context', title: 'Tune long-context synthesis prompt',
    description: 'Improve factual traceability when source material exceeds 40k tokens.',
    column: 'backlog', assignee: 'lin', attached_prompt: 'prompt-summary',
    taskTitles: ['Select source corpus', 'Define citation format', 'Compare synthesis quality'],
  }),
  makeCard({
    id: 'card-multilingual', title: 'Benchmark multilingual intent classifier',
    description: 'Measure intent accuracy for Spanish, French, German, and Japanese inputs.',
    column: 'backlog', assignee: 'inez',
    taskTitles: ['Prepare translated set', 'Run classification batch', 'Review low-confidence cases', 'Publish scorecard'],
  }),
  makeCard({
    id: 'card-support-triage', title: 'Harden support triage agent against ambiguous requests',
    description: 'Exercise routing behavior when product area and customer impact are unclear. The routing check intentionally retries twice.',
    column: 'in-progress', assignee: 'maya', attached_prompt: 'prompt-triage',
    taskTitles: ['Normalize ticket samples', 'Infer product routing', 'Validate urgency labels', 'Check escalation notes', 'Compile findings'],
  }),
  makeCard({
    id: 'card-sql-eval', title: 'Evaluate guarded SQL generation',
    description: 'Validate schema adherence, read-only safety, and usefulness of generated queries.',
    column: 'in-progress', assignee: 'inez', attached_prompt: 'prompt-sql',
    taskTitles: ['Load schema fixtures', 'Generate query batch', 'Check safety constraints', 'Summarize execution accuracy'],
  }),
  makeCard({
    id: 'card-grounding', title: 'Measure retrieval grounding quality',
    description: 'Quantify citation accuracy and unsupported claims across retrieval conditions.',
    column: 'in-progress', assignee: 'omar', attached_prompt: 'prompt-summary',
    taskTitles: ['Index evaluation corpus', 'Run retrieval matrix', 'Audit claim citations'],
  }),
  makeCard({
    id: 'card-onboarding', title: 'Review onboarding email sequence generator',
    description: 'Review sequence coherence and product-language compliance before release.',
    column: 'review', assignee: 'lin',
    taskTitles: ['Check narrative arc', 'Verify product claims', 'Review calls to action', 'Approve release notes'], complete: 2,
  }),
  makeCard({
    id: 'card-policy-extraction', title: 'Validate policy extraction workflow',
    description: 'Check structured policy fields against a manually annotated reference set.',
    column: 'review', assignee: 'omar', attached_prompt: 'prompt-summary',
    taskTitles: ['Sample policy documents', 'Compare extracted clauses', 'Resolve review notes'], complete: 1,
  }),
  makeCard({
    id: 'card-meeting-miner', title: 'QA meeting action-item miner',
    description: 'Verify owner, due date, and dependency extraction across meeting styles.',
    column: 'review', assignee: 'maya',
    taskTitles: ['Collect transcripts', 'Run extraction set', 'Check owner attribution', 'Check date parsing', 'Triage misses'], complete: 3,
  }),
  makeCard({
    id: 'card-incident-report', title: 'Ship incident report formatter',
    description: 'Released formatter for concise timelines, impact summaries, and follow-up actions.',
    column: 'done', assignee: 'inez',
    taskTitles: ['Define report schema', 'Build prompt', 'Test incident samples', 'Publish template'], complete: 4,
  }),
  makeCard({
    id: 'card-taxonomy', title: 'Complete product taxonomy mapper',
    description: 'Mapped legacy labels to the current product taxonomy with confidence scores.',
    column: 'done', assignee: 'lin',
    taskTitles: ['Load label catalog', 'Generate mappings', 'Review confidence outliers'], complete: 3,
  }),
]

export const seededOrder = columns.reduce((acc, column) => {
  acc[column.id] = seededCards.filter((card) => card.column === column.id).map((card) => card.id)
  return acc
}, {})

export const failurePlans = {
  'card-support-triage': { taskId: 'card-support-triage-task-2', failAttempts: 2, maxAttempts: 2 },
}

