import * as z from 'zod';

export const STATUSES = ['draft', 'review', 'ready'] as const;
export type Status = (typeof STATUSES)[number];

/**
 * The scene request-body field contract. The record a successful create/edit
 * produces IS this payload; exports and imports share the same shape.
 */
export const scenePayloadSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(80, 'Title must be at most 80 characters'),
  body: z
    .string({ required_error: 'Body is required' })
    .trim()
    .min(8, 'Body must be at least 8 characters')
    .max(2000, 'Body must be at most 2,000 characters'),
  cameraNote: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .max(200, 'Camera note must be at most 200 characters')
      .optional()
  ),
  status: z.enum(STATUSES, {
    errorMap: () => ({ message: 'Status must be one of draft, review, or ready' }),
  }),
});

export type ScenePayload = z.infer<typeof scenePayloadSchema>;

/** Payload used by the create/edit forms (status defaults to draft). */
export const sceneFormSchema = scenePayloadSchema.extend({
  status: z.enum(STATUSES, {
    errorMap: () => ({ message: 'Status must be one of draft, review, or ready' }),
  }).default('draft'),
});

export type SceneFormValues = z.infer<typeof sceneFormSchema>;

export function validateSceneFields(
  fields: Record<string, unknown>
): { valid: true; value: ScenePayload } | { valid: false; errors: Record<string, string> } {
  const result = scenePayloadSchema.safeParse(fields);
  if (result.success) return { valid: true, value: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!errors[key]) errors[key] = issue.message;
  }
  return { valid: false, errors };
}

/** A scene object inside a StoryboardPackage (the create/edit request body + order). */
const packagedSceneSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .trim()
    .min(2, 'title must be at least 2 characters')
    .max(80, 'title must be at most 80 characters'),
  body: z
    .string({ required_error: 'body is required' })
    .trim()
    .min(8, 'body must be at least 8 characters')
    .max(2000, 'body must be at most 2,000 characters'),
  cameraNote: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .trim()
      .max(200, 'cameraNote must be at most 200 characters')
      .optional()
  ),
  status: z.enum(STATUSES, {
    errorMap: () => ({ message: 'status must be one of draft, review, or ready' }),
  }),
  order: z
    .number({ required_error: 'order is required' })
    .int('order must be an integer')
    .min(1, 'order must be at least 1'),
});

export const storyboardPackageSchema = z
  .object({
    schemaVersion: z.literal(1, {
      errorMap: () => ({ message: 'schemaVersion must be exactly 1' }),
    }),
    project: z.literal('Demo Projects', {
      errorMap: () => ({ message: 'project must be exactly "Demo Projects"' }),
    }),
    storyboard: z.literal('1. Getting Started', {
      errorMap: () => ({ message: 'storyboard must be exactly "1. Getting Started"' }),
    }),
    scenes: z
      .array(packagedSceneSchema, {
        required_error: 'scenes is required',
        invalid_type_error: 'scenes must be an array',
      })
      .min(1, 'scenes must contain at least one scene'),
    generatedAt: z.string().optional(),
  })
  .passthrough();

export type StoryboardPackage = {
  schemaVersion: 1;
  project: 'Demo Projects';
  storyboard: '1. Getting Started';
  scenes: {
    title: string;
    body: string;
    cameraNote?: string;
    status: Status;
    order: number;
  }[];
  generatedAt: string;
};

export function parseStoryboardPackage(
  raw: string
): { ok: true; pkg: StoryboardPackage } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON — the package could not be parsed.' };
  }
  const result = storyboardPackageSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first.path.length > 0 ? `${first.path.join('.')}: ` : '';
    return { ok: false, error: `Invalid StoryboardPackage — ${where}${first.message}.` };
  }
  return { ok: true, pkg: result.data as unknown as StoryboardPackage };
}
