import { z } from 'zod'
import { ROLES, TONES, TRAITS, deepCopy, toPayload } from './store'

const requiredText = (label, max = 2000) => z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`)
const traitShape = Object.fromEntries(TRAITS.map((trait) => [
  trait,
  z.preprocess(
    (value) => value === '' || value === null || value === undefined ? Number.NaN : Number(value),
    z.number({ error: `${trait} must be numeric` }).int(`${trait} must be a whole number`).min(0, `${trait} must be between 0 and 100`).max(100, `${trait} must be between 0 and 100`),
  ),
]))

export const exampleSchema = z.object({
  user: requiredText('Example user message'),
  reply: requiredText('Example persona reply'),
})

export const variantSchema = z.object({
  id: z.string(),
  label: z.string(),
  promptBody: z.string().refine((html) => html.replace(/<[^>]*>/g, '').trim().length > 0, 'Prompt body is required'),
  examples: z.array(exampleSchema).min(1, 'Examples require at least one exchange'),
})

export const personaSchema = z.object({
  name: z.string().trim().min(2, 'Name must be between 2 and 80 characters').max(80, 'Name must be between 2 and 80 characters'),
  role: z.enum(ROLES, { error: 'Role is required' }),
  tone: z.enum(TONES, { error: 'Tone is required' }),
  tags: z.array(z.string().trim().min(1, 'Tag cannot be empty')).min(1, 'Tags require at least one tag').max(12, 'Tags allow at most 12 tags'),
  constraints: z.array(requiredText('Constraint')).min(1, 'Constraints require at least one item'),
  goals: requiredText('Goals'),
  examples: z.array(exampleSchema).min(1, 'Examples require at least one exchange'),
  promptBody: z.string().refine((html) => html.replace(/<[^>]*>/g, '').trim().length > 0, 'Prompt body is required'),
  traits: z.object(traitShape).strict(),
  variants: z.array(variantSchema).min(2, 'At least two prompt techniques are required'),
  activeVariant: z.string(),
  activeIteration: z.string().nullable().optional(),
})

export const blankPersona = () => ({
  name: '', role: 'Writer', tone: 'neutral', tags: ['general'], constraints: ['Do not fabricate facts'],
  goals: 'Provide a clear, useful response for the intended reader.',
  examples: [{ user: 'Help me with this task.', reply: 'I will clarify the goal and provide a practical next step.' }],
  promptBody: '<p>Describe how this persona should think, write, and respond.</p>',
  traits: { formality: 50, verbosity: 50, creativity: 50, empathy: 50, assertiveness: 50 },
  variants: [
    { id: 'direct', label: 'Direct instruction', promptBody: '<p>Describe how this persona should think, write, and respond.</p>', examples: [{ user: 'Help me with this task.', reply: 'I will clarify the goal and provide a practical next step.' }] },
    { id: 'few-shot', label: 'Few-shot', promptBody: '<p>Follow the demonstrated style and reasoning pattern.</p>', examples: [{ user: 'Show me the approach.', reply: 'Here is a concise example followed by the reusable pattern.' }] },
  ],
  activeVariant: 'direct', activeIteration: null,
})

export function editorDefaults(persona) {
  if (!persona) return blankPersona()
  return deepCopy(toPayload(persona))
}

export const composeSchema = z.object({
  sourceA: z.string().min(1, 'First persona is required'),
  sourceB: z.string().min(1, 'Second persona is required'),
  weight: z.coerce.number().min(0, 'Blend weight must be between 0 and 100').max(100, 'Blend weight must be between 0 and 100'),
  name: z.string().trim().min(2, 'Blend name is required').max(80, 'Blend name must be 80 characters or fewer'),
}).refine((value) => value.sourceA !== value.sourceB, { message: 'Choose two different personas', path: ['sourceB'] })

export const bulkTagSchema = z.object({ tag: z.string().trim().min(1, 'Tag is required').max(30, 'Tag must be 30 characters or fewer') })
