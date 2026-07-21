import { z } from 'zod'

export const FIELD_TYPES = [
  'text', 'signature', 'initials', 'date', 'number', 'checkbox', 'radio',
  'select', 'image', 'file', 'phone', 'cells', 'stamp',
]

export const fieldSchema = z.object({
  name: z.string({ required_error: 'Name is required.' }).trim()
    .min(1, 'Name is required and cannot be blank.')
    .max(80, 'Name must be 80 characters or fewer.'),
  type: z.enum(FIELD_TYPES, { required_error: 'Type is required.' }),
  required: z.boolean({ required_error: 'Required must be a boolean.' }),
  submitter: z.string({ required_error: 'Submitter is required.' }).trim()
    .min(1, 'Submitter is required.'),
  page: z.number({ required_error: 'Page is required.' }).int('Page must be an integer.')
    .min(0, 'Page must be 0 or greater.'),
  x: z.number({ required_error: 'X is required.' }).finite('X must be a finite number.'),
  y: z.number({ required_error: 'Y is required.' }).finite('Y must be a finite number.'),
  w: z.number({ required_error: 'Width is required.' }).finite('Width must be a finite number.')
    .positive('Width must be greater than 0.'),
  h: z.number({ required_error: 'Height is required.' }).finite('Height must be a finite number.')
    .positive('Height must be greater than 0.'),
})

export const submitterSchema = z.object({
  name: z.string({ required_error: 'Name is required.' }).trim()
    .min(1, 'Name is required and cannot be blank.')
    .max(64, 'Name must be 64 characters or fewer.'),
  color: z.string({ required_error: 'Color is required.' })
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must use the #RRGGBB format.'),
})

export const templateNameSchema = z.object({
  name: z.string({ required_error: 'Name is required.' }).trim()
    .min(1, 'Name is required and cannot be blank.')
    .max(120, 'Name must be 120 characters or fewer.'),
})

export const templateSchema = z.object({
  name: z.string({ required_error: 'Name is required.' }).trim()
    .min(1, 'Name is required and cannot be blank.')
    .max(120, 'Name must be 120 characters or fewer.'),
  status: z.enum(['draft', 'pending', 'completed'], {
    required_error: 'Status is required.',
    invalid_type_error: 'Status must be draft, pending, or completed.',
  }),
  submitters: z.array(submitterSchema, { required_error: 'Submitters are required.' })
    .min(1, 'Submitters must contain at least one submitter.'),
  fields: z.array(fieldSchema, { required_error: 'Fields are required.' }),
}).superRefine((value, ctx) => {
  const names = value.submitters.map((submitter) => submitter.name)
  const unique = new Set(names)
  if (unique.size !== names.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['submitters'], message: 'Submitter names must be unique.' })
  }
  value.fields.forEach((field, index) => {
    if (!unique.has(field.submitter)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fields', index, 'submitter'],
        message: `Submitter must match one of submitters[].name.`,
      })
    }
  })
})

export const importSchema = z.object({
  document: z.string().trim().min(1, 'Template JSON is required.'),
})

export function firstZodError(error) {
  const issue = error?.issues?.[0]
  if (!issue) return 'The document is invalid.'
  const field = issue.path.length ? issue.path.join('.') : 'document'
  return `${field}: ${issue.message}`
}
