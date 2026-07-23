import { z } from 'zod';

export const TECHNIQUES = [
  'Few-shot',
  'Chain-of-thought',
  'Role prompting',
  'Constraint-based',
  'Critique & revise',
  'Structured output',
];

export const techniqueSchema = z.enum(TECHNIQUES, { error: 'Technique tag is required.' });

export const promptRequestSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(60, 'Title must be 60 characters or fewer.'),
  body: z.string().refine((value) => value.trim().length > 0, 'Prompt body is required.').max(8000, 'Prompt body must be 8,000 characters or fewer.'),
  technique: techniqueSchema,
  description: z.string().max(280, 'Description must be 280 characters or fewer.').optional().default(''),
});

export const promptEditSchema = (existingTitle) => promptRequestSchema.extend({
  title: z.string().trim().min(1, 'Title is required.')
    .max(Math.max(60, existingTitle.length), 'Title must be 60 characters or fewer.')
    .refine(
      (title) => title.length <= 60 || title === existingTitle,
      'Title must be 60 characters or fewer.',
    ),
});

export const extendFormSchema = promptRequestSchema.extend({
  extensionText: z.string().trim().min(1, 'Extension text is required.').max(4000, 'Extension text must be 4,000 characters or fewer.'),
}).superRefine((data, ctx) => {
  if (`${data.body}\n\n${data.extensionText}`.length > 8000) {
    ctx.addIssue({
      code: 'custom',
      path: ['extensionText'],
      message: 'Extension text makes the prompt body longer than 8,000 characters.',
    });
  }
});

export const combineFormSchema = promptRequestSchema.extend({
  combinedBody: z.string().refine((value) => value.trim().length > 0, 'Combined body is required.').max(8000, 'Combined body must be 8,000 characters or fewer.'),
});

export const exportedPromptSchema = promptRequestSchema.extend({
  // Preserve legacy seeded display fixtures during export/import round-trips;
  // newly created or changed request bodies remain capped at 60 characters.
  title: z.string().trim().min(1).max(150),
  id: z.string().min(1),
  created: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  sources: z.array(z.string()),
  attachments: z.array(z.string()),
});

export const librarySchema = z.object({
  schemaVersion: z.literal(1),
  product: z.literal('Prompt Library'),
  prompts: z.array(exportedPromptSchema),
  generatedAt: z.string().refine(
    (value) => value.endsWith('Z') && !Number.isNaN(Date.parse(value)),
    'generatedAt must be an ISO-8601 UTC datetime ending in Z.',
  ),
});

export const importFormSchema = z.object({
  payload: z.string().min(1, 'Library JSON is required.').superRefine((value, ctx) => {
    try {
      librarySchema.parse(JSON.parse(value));
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof SyntaxError ? 'Library JSON is malformed.' : 'Library JSON does not match the Prompt Library schema.',
      });
    }
  }),
});

export const ATTACHMENT_CATALOG = [
  {
    id: 'att-brand-grid',
    filename: 'brand-grid.svg',
    type: 'SVG image',
    kind: 'image',
    src: '/assets/brand-grid.svg',
    detail: '640 × 360 · 1.8 KB',
  },
  {
    id: 'att-research-notes',
    filename: 'research-notes.txt',
    type: 'Plain text',
    kind: 'document',
    src: '/assets/research-notes.txt',
    detail: 'UTF-8 · 0.6 KB',
  },
  {
    id: 'att-response-schema',
    filename: 'response-schema.json',
    type: 'JSON document',
    kind: 'document',
    src: '/assets/response-schema.json',
    detail: 'JSON · 0.4 KB',
  },
  {
    id: 'att-interview-audio',
    filename: 'interview-clip.mp3',
    type: 'Audio reference',
    kind: 'media',
    src: '/assets/interview-clip.mp3',
    detail: 'MP3 audio · 0:24',
  },
  {
    id: 'att-tone-guide',
    filename: 'tone-guide.md',
    type: 'Markdown document',
    kind: 'document',
    src: '/assets/tone-guide.md',
    detail: 'Markdown · 1.1 KB',
  },
];

const attachment = (id) => ATTACHMENT_CATALOG.find((item) => item.id === id);

const seedDefinitions = [
  ['p-001', 'Executive summary from research that is extremely long and will definitely exceed the sixty character limit in the table view', 'You are a senior research analyst. Summarize the material into five concise findings, then state the single most important implication for an executive audience.', 'Role prompting', 'Turns dense research into a decisive leadership brief.', ['att-research-notes']],
  ['p-002', 'Support reply with examples', 'Write a helpful support response. Follow these examples for tone:\n\nExample 1: “Thanks for flagging this — I can help.”\nExample 2: “Here is the quickest path forward.”\n\nNow respond to the customer message supplied in the ticket.', 'Few-shot', 'A warm and direct customer-support response.', []],
  ['p-003', 'Reason through a pricing decision', 'Evaluate the pricing decision step by step. Identify assumptions, compare three options, test the strongest counterargument, and conclude with a recommendation.', 'Chain-of-thought', 'A structured internal decision analysis.', []],
  ['p-004', 'JSON issue classifier', 'Classify the issue and return only JSON matching: {"category":"billing|technical|account|other","urgency":"low|medium|high","summary":"string"}.', 'Structured output', 'Produces machine-readable issue routing.', ['att-response-schema']],
  ['p-005', 'Landing page under strict limits', 'Write landing-page copy with one headline under 55 characters, one subhead under 120 characters, and exactly three benefit bullets. Do not use exclamation marks.', 'Constraint-based', 'Compact launch copy with hard editorial limits.', ['att-brand-grid', 'att-tone-guide']],
  ['p-006', 'Critique and improve product copy', 'Critique the draft for clarity, specificity, evidence, and tone. List the three highest-impact issues, then provide a revised version that addresses them.', 'Critique & revise', 'A two-pass editorial improvement prompt.', []],
  ['p-007', 'Tutoring study partner', 'Act as a patient guided tutor. Ask one question at a time, adapt to the learner’s last answer, and avoid revealing the final solution until they have attempted it.', 'Role prompting', 'Guides learning through progressive questions.', []],
  ['p-008', 'Extract meeting actions', 'From the meeting transcript, return a JSON array of action items. Each item must include owner, action, dueDate, and confidence. Use null when the transcript does not specify a value.', 'Structured output', 'Reliable action extraction for workflow automation.', ['att-interview-audio']],
  ['p-009', 'Campaign concept variations', 'Create three campaign concepts using the pattern in these examples: concept name, audience tension, central idea, and sample line. Keep each concept distinct and practical.', 'Few-shot', 'Generates consistently framed campaign options.', []],
  ['p-010', 'Debug a failing API call', 'Analyze the failing API call step by step. Separate observed facts from hypotheses, rank likely causes, and propose the smallest diagnostic test for each cause.', 'Chain-of-thought', 'A disciplined debugging sequence.', []],
  ['p-011', 'Accessible image description', 'Describe the image in 120 characters or fewer. State the essential subject and action first. Do not infer identity, emotion, or intent.', 'Constraint-based', 'Creates concise, neutral alt text.', ['att-brand-grid']],
  ['p-012', 'Red-team a launch plan', 'Review the launch plan as a skeptical operations lead. Identify hidden dependencies, ambiguous ownership, and failure modes. Then revise the plan with explicit mitigations.', 'Critique & revise', 'Finds operational gaps before launch.', []],
  ['p-013', 'Interview insight analyst', 'You are a qualitative researcher. Cluster the interview notes into themes, cite supporting phrases, flag contradictory evidence, and distinguish observation from interpretation.', 'Role prompting', 'Synthesizes interviews without overclaiming.', ['att-research-notes', 'att-interview-audio']],
  ['p-014', 'Product comparison matrix', 'Return a Markdown table comparing the products across audience, core job, strengths, limitations, pricing signal, and evidence quality. Add a three-sentence conclusion below the table.', 'Structured output', 'Creates a consistent competitive comparison.', []],
  ['p-015', 'Rewrite for plain language', 'Rewrite the text at an eighth-grade reading level. Keep all factual claims, use sentences under 20 words, remove jargon, and preserve the original meaning.', 'Constraint-based', 'Makes complex writing easier to understand.', []],
  ['p-016', 'Evaluate then rewrite an announcement', 'First score the announcement from 1–5 for clarity, relevance, and credibility. Explain each score in one sentence. Then rewrite only the areas scoring below 4.', 'Critique & revise', 'Targets revisions using a lightweight rubric.', []],
];

const seedDates = [
  '2026-07-18T14:32:00.000Z', '2026-07-18T10:04:00.000Z', '2026-07-17T16:20:00.000Z',
  '2026-07-17T09:45:00.000Z', '2026-07-16T15:12:00.000Z', '2026-07-16T11:08:00.000Z',
  '2026-07-15T13:30:00.000Z', '2026-07-15T08:18:00.000Z', '2026-07-14T17:02:00.000Z',
  '2026-07-14T12:44:00.000Z', '2026-07-13T16:15:00.000Z', '2026-07-13T09:20:00.000Z',
  '2026-07-12T14:50:00.000Z', '2026-07-12T10:10:00.000Z', '2026-07-11T15:40:00.000Z',
  '2026-07-11T09:05:00.000Z',
];

export function createSeedPrompts() {
  return seedDefinitions.map(([id, title, body, technique, description, attachmentIds], index) => {
    const created = seedDates[index];
    const data = { title, body, technique, description };
    return {
      id,
      ...data,
      created,
      version: 1,
      sources: [],
      attachments: attachmentIds.map(attachment).filter(Boolean),
      versions: [{ id: `${id}-v1`, version: 1, timestamp: created, summary: 'Initial version', data }],
    };
  });
}

export function truncateTitle(title, max = 60) {
  const trimmed = title.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

export function requestFromPrompt(prompt) {
  return {
    title: prompt.title,
    body: prompt.body,
    technique: prompt.technique,
    description: prompt.description || '',
  };
}

export function summarizeChanges(previous, next) {
  const changes = [];
  if (previous.title !== next.title) changes.push('Title changed');
  if (previous.technique !== next.technique) changes.push('Technique changed');
  if ((previous.description || '') !== (next.description || '')) changes.push('Description changed');
  if (previous.body !== next.body) {
    const delta = next.body.length - previous.body.length;
    changes.push(delta === 0 ? 'Body revised' : `Body ${delta > 0 ? '+' : ''}${delta} characters`);
  }
  return changes.length ? changes.join(' · ') : 'Saved without content changes';
}

export const TECHNIQUE_COLORS = {
  'Few-shot': 'purple',
  'Chain-of-thought': 'cyan',
  'Role prompting': 'blue',
  'Constraint-based': 'teal',
  'Critique & revise': 'magenta',
  'Structured output': 'green',
};
