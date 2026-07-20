import { z } from 'zod'

export const TECHNIQUES = [
  { id: 'zero-shot', name: 'Zero-Shot', short: 'ZS', description: 'Direct instructions without examples.' },
  { id: 'one-shot', name: 'One-Shot', short: 'OS', description: 'Guide the response with one ideal example.' },
  { id: 'few-shot', name: 'Few-Shot', short: 'FS', description: 'Establish a pattern using multiple examples.' },
  { id: 'chain-of-thought', name: 'Chain-of-Thought', short: 'CT', description: 'Structure a deliberate reasoning path.' },
  { id: 'outcome-based', name: 'Outcome-Based', short: 'OB', description: 'Define success before the response begins.' },
  { id: 'role-based', name: 'Role-Based', short: 'RB', description: 'Shape the answer through expertise and audience.' },
  { id: 'constraint-based', name: 'Constraint-Based', short: 'CB', description: 'Set explicit boundaries for the response.' },
]

export const techniqueIds = TECHNIQUES.map((item) => item.id)
export const techniqueEnum = z.enum(techniqueIds)
export const techniqueById = Object.fromEntries(TECHNIQUES.map((item) => [item.id, item]))

export const REFERENCE_ASSETS = [
  { name: 'brand-voice-guide.pdf', type: 'PDF', detail: 'Tone, terminology, and editorial principles' },
  { name: 'product-brief.docx', type: 'DOCX', detail: 'Positioning, features, and customer needs' },
  { name: 'research-notes.md', type: 'Markdown', detail: 'Interview findings and source notes' },
  { name: 'support-faq.txt', type: 'Text', detail: 'Approved support answers and escalation paths' },
  { name: 'campaign-data.csv', type: 'CSV', detail: 'Campaign performance and channel benchmarks' },
  { name: 'api-reference.json', type: 'JSON', detail: 'Endpoints, payloads, and response objects' },
]

const requiredText = (label) => z.string().trim().min(1, `${label} is required. Enter ${label.toLowerCase()}.`)
const exampleSchema = z.object({
  input: requiredText('Example input'),
  output: requiredText('Expected output'),
})
const optionalStepSchema = z.object({ step: z.string() })
const criterionSchema = z.object({ text: requiredText('Success criterion') })
const constraintSchema = z.object({
  type: z.enum(['length', 'format', 'content', 'style', 'other']),
  text: requiredText('Constraint text'),
})

export const fieldSchemas = {
  'zero-shot': z.object({
    taskDescription: requiredText('Task description'),
    outputFormat: z.enum(['paragraph', 'bullets', 'table', 'json']),
    tone: z.enum(['clear', 'professional', 'friendly', 'persuasive']),
  }),
  'one-shot': z.object({
    taskDescription: requiredText('Task description'),
    exampleInput: requiredText('Example input'),
    expectedOutput: requiredText('Expected output'),
  }),
  'few-shot': z.object({
    taskDescription: requiredText('Task description'),
    examples: z.array(exampleSchema).min(1, 'At least one example is required.'),
  }),
  'chain-of-thought': z.object({
    goal: requiredText('Goal'),
    reasoningSteps: z.array(optionalStepSchema),
    scratchpad: z.boolean(),
  }),
  'outcome-based': z.object({
    goal: requiredText('Goal'),
    successCriteria: z.array(criterionSchema).min(1, 'At least one success criterion is required.'),
    measurement: z.enum(['qualitative', 'score', 'percentage', 'pass-fail']),
  }),
  'role-based': z.object({
    role: requiredText('Role or persona'),
    audience: z.string(),
    taskDescription: requiredText('Task description'),
  }),
  'constraint-based': z.object({
    taskDescription: requiredText('Task description'),
    constraints: z.array(constraintSchema).min(1, 'At least one constraint is required.'),
  }),
}

const attachmentsSchema = z.array(z.enum(REFERENCE_ASSETS.map((asset) => asset.name))).default([])

export const formSchemas = Object.fromEntries(
  techniqueIds.map((id) => [
    id,
    (id === 'few-shot' || id === 'role-based')
      ? fieldSchemas[id].extend({ attachments: attachmentsSchema })
      : fieldSchemas[id],
  ]),
)

export const defaultDrafts = {
  'zero-shot': { fields: { taskDescription: '', outputFormat: 'paragraph', tone: 'clear' }, attachments: [] },
  'one-shot': { fields: { taskDescription: '', exampleInput: '', expectedOutput: '' }, attachments: [] },
  'few-shot': { fields: { taskDescription: '', examples: [{ input: '', output: '' }] }, attachments: [] },
  'chain-of-thought': { fields: { goal: '', reasoningSteps: [{ step: '' }], scratchpad: false }, attachments: [] },
  'outcome-based': { fields: { goal: '', successCriteria: [{ text: '' }], measurement: 'qualitative' }, attachments: [] },
  'role-based': { fields: { role: '', audience: '', taskDescription: '' }, attachments: [] },
  'constraint-based': { fields: { taskDescription: '', constraints: [{ type: 'length', text: '' }] }, attachments: [] },
}

export function assemblePrompt(technique, fields, attachments = []) {
  const references = attachments.length
    ? `\n\nReference documents:\n${attachments.map((name) => `- ${name}`).join('\n')}`
    : ''

  switch (technique) {
    case 'zero-shot':
      return `Task:\n${fields.taskDescription}\n\nOutput format: ${formatLabel(fields.outputFormat)}\nTone: ${formatLabel(fields.tone)}`
    case 'one-shot':
      return `Task:\n${fields.taskDescription}\n\nExample:\nInput: ${fields.exampleInput}\nExpected output: ${fields.expectedOutput}\n\nNow complete the task following the example.`
    case 'few-shot':
      return `Task:\n${fields.taskDescription}\n\nExamples:\n${fields.examples.map((example, index) => `${index + 1}. Input: ${example.input}\n   Expected output: ${example.output}`).join('\n\n')}\n\nFollow the demonstrated pattern to complete the task.${references}`
    case 'chain-of-thought': {
      const steps = fields.reasoningSteps.filter((item) => item.step.trim())
      const outline = steps.length
        ? `\n\nReasoning outline:\n${steps.map((item, index) => `${index + 1}. ${item.step.trim()}`).join('\n')}`
        : ''
      const scratchpad = fields.scratchpad ? '\n\nThink step by step before providing the final answer.' : ''
      return `Goal:\n${fields.goal}${outline}${scratchpad}`
    }
    case 'outcome-based':
      return `Goal:\n${fields.goal}\n\nSuccess criteria:\n${fields.successCriteria.map((item, index) => `${index + 1}. ${item.text}`).join('\n')}\n\nMeasurement method: ${formatLabel(fields.measurement)}`
    case 'role-based':
      return `You are ${fields.role}.\n\n${fields.audience.trim() ? `Audience: ${fields.audience}\n\n` : ''}Task:\n${fields.taskDescription}${references}`
    case 'constraint-based':
      return `Task:\n${fields.taskDescription}\n\nConstraints:\n${fields.constraints.map((item, index) => `${index + 1}. [${formatLabel(item.type)}] ${item.text}`).join('\n')}\n\nComplete the task while satisfying every constraint.`
    default:
      return ''
  }
}

export function formatLabel(value) {
  return String(value).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export const titleSchema = z.string().trim().min(2, 'Title must be at least 2 characters.').max(80, 'Title must be 80 characters or fewer.')

export const savePayloadSchema = z.object({
  title: titleSchema,
  technique: techniqueEnum,
  fields: z.record(z.string(), z.unknown()),
  promptText: z.string().min(1, 'Prompt text is required.'),
  attachments: attachmentsSchema.optional(),
}).superRefine((record, context) => {
  const parsed = fieldSchemas[record.technique].safeParse(record.fields)
  if (!parsed.success) {
    context.addIssue({ code: 'custom', path: ['fields'], message: `Fields do not match the ${techniqueById[record.technique].name} schema.` })
  }
})

export const libraryDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  product: z.literal('Template Forms'),
  entries: z.array(savePayloadSchema),
  generatedAt: z.string().datetime({ offset: false }),
})

function makeSeed(title, technique, fields, attachments = []) {
  return savePayloadSchema.parse({
    title,
    technique,
    fields,
    promptText: assemblePrompt(technique, fields, attachments),
    ...(attachments.length ? { attachments } : {}),
  })
}

export const SEEDED_LIBRARY = [
  makeSeed('Executive brief distiller', 'zero-shot', {
    taskDescription: 'Summarize the supplied executive brief into decisions, risks, and immediate next actions.',
    outputFormat: 'bullets',
    tone: 'professional',
  }),
  makeSeed('Support reply exemplar', 'one-shot', {
    taskDescription: 'Write a concise reply to a customer whose shipment is delayed.',
    exampleInput: 'My order was expected yesterday and has not arrived.',
    expectedOutput: 'I’m sorry your order is late. I’ll check its status now and share the next available delivery update.',
  }),
  makeSeed('Launch message patterns', 'few-shot', {
    taskDescription: 'Write a product-launch headline and supporting line for a collaborative workspace.',
    examples: [
      { input: 'Audience: design teams', output: 'Ideas move faster together — one canvas, every collaborator.' },
      { input: 'Audience: operations teams', output: 'Turn scattered work into one clear operating rhythm.' },
    ],
  }, ['brand-voice-guide.pdf']),
  makeSeed('Research synthesis path', 'chain-of-thought', {
    goal: 'Synthesize interview notes into three defensible product insights.',
    reasoningSteps: [{ step: 'Group recurring observations' }, { step: 'Separate evidence from interpretation' }, { step: 'Rank insights by impact' }],
    scratchpad: true,
  }),
  makeSeed('Product strategist review', 'role-based', {
    role: 'a senior product strategist',
    audience: 'product and engineering leads',
    taskDescription: 'Review the product brief and surface the three assumptions most in need of validation.',
  }, ['product-brief.docx']),
]

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function makeLibraryDocument(entries) {
  return libraryDocumentSchema.parse({
    schemaVersion: 1,
    product: 'Template Forms',
    entries: clone(entries),
    generatedAt: new Date().toISOString(),
  })
}

export function markdownForPrompt(technique, promptText) {
  void technique
  return promptText
}
