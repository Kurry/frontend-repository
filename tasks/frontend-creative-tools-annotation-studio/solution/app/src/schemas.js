import { z } from 'zod';

export const PALETTE = ['#0F62FE', '#8A3FFC', '#198038', '#DA1E28', '#FF832B', '#007D79', '#A56EFF', '#6F6F6F'];
export const SCORE_KEYS = ['Accuracy', 'Clarity', 'Relevance'];
export const REVIEW_STATES = ['unlabeled', 'labeled', 'reviewed', 'disputed'];

const trimmed = (max, field) => z.string().trim().min(1, `${field} is required`).max(max, `${field} must be ${max} characters or fewer`);

export const AttributeSchema = z.object({
  name: trimmed(40, 'Attribute name'),
  kind: z.enum(['select', 'text'], { error: 'Attribute kind must be select or text' }),
  options: z.array(z.string().trim().min(1, 'Attribute options cannot be empty')),
}).superRefine((value, ctx) => {
  if (value.kind === 'select' && value.options.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: `Attribute options for ${value.name || 'this attribute'} require at least one option` });
  }
  if (value.kind === 'text' && value.options.length > 0) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'Attribute options must be empty for a text attribute' });
  }
});

export const TaxonomyClassCreateSchema = z.object({
  name: trimmed(60, 'Name'),
  color: z.string().refine((v) => PALETTE.includes(v), 'Color must be chosen from the fixed palette'),
  icon: trimmed(50, 'Icon'),
  shortcut: z.string().regex(/^[1-9]$/, 'Shortcut must be exactly one digit from 1 through 9'),
  attributes: z.array(AttributeSchema),
});

export const createTaxonomyFormSchema = (classes, editingId) => TaxonomyClassCreateSchema.superRefine((value, ctx) => {
  const nameConflict = classes.find((c) => c.id !== editingId && c.name.toLowerCase() === value.name.toLowerCase());
  if (nameConflict) ctx.addIssue({ code: 'custom', path: ['name'], message: `Name conflicts with ${nameConflict.name}` });
  const shortcutConflict = classes.find((c) => c.id !== editingId && c.shortcut === value.shortcut);
  if (shortcutConflict) ctx.addIssue({ code: 'custom', path: ['shortcut'], message: `Shortcut ${value.shortcut} is already used by ${shortcutConflict.name}` });
});

export const MetadataFieldCreateSchema = z.object({
  name: trimmed(40, 'Name'),
  kind: z.enum(['text', 'number', 'select', 'checkbox'], { error: 'Kind must be text, number, select, or checkbox' }),
  options: z.array(z.string().trim().min(1, 'Options cannot include an empty value')),
}).superRefine((value, ctx) => {
  if (value.kind === 'select' && value.options.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'Options require at least one non-empty value for a select field' });
  }
  if (value.kind !== 'select' && value.options.length > 0) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: `Options must be empty when kind is ${value.kind}` });
  }
});

export const createMetadataFormSchema = (fields, editingId) => MetadataFieldCreateSchema.superRefine((value, ctx) => {
  const conflict = fields.find((f) => f.id !== editingId && f.name.toLowerCase() === value.name.toLowerCase());
  if (conflict) ctx.addIssue({ code: 'custom', path: ['name'], message: `Name conflicts with ${conflict.name}` });
});

export const RegionCreateSchema = z.object({
  classId: trimmed(100, 'classId'),
  x: z.number({ error: 'x must be a number' }).min(0, 'x must be at least 0'),
  y: z.number({ error: 'y must be a number' }).min(0, 'y must be at least 0'),
  w: z.number({ error: 'w must be a number' }).min(8, 'w must be at least 8 image pixels'),
  h: z.number({ error: 'h must be a number' }).min(8, 'h must be at least 8 image pixels'),
  attributeValues: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
}).superRefine((value, ctx) => {
  if (value.x + value.w > 640) ctx.addIssue({ code: 'custom', path: ['w'], message: 'x plus w must stay within image width 640' });
  if (value.y + value.h > 360) ctx.addIssue({ code: 'custom', path: ['h'], message: 'y plus h must stay within image height 360' });
});

export const AnnotationCreateSchema = z.object({
  rating: z.enum(['up', 'down'], { error: 'Rating must be up or down' }),
  scores: z.object({
    Accuracy: z.number({ error: 'Accuracy score is required' }).int('Accuracy score must be an integer').min(1).max(5),
    Clarity: z.number({ error: 'Clarity score is required' }).int('Clarity score must be an integer').min(1).max(5),
    Relevance: z.number({ error: 'Relevance score is required' }).int('Relevance score must be an integer').min(1).max(5),
  }),
  comment: z.string().max(500, 'Comment must be 500 characters or fewer'),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  regions: z.array(RegionCreateSchema),
});

export const DisputeCreateSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(200, 'Reason must be 200 characters or fewer').refine((v) => !/[\r\n]/.test(v), 'Reason must be a single line'),
});

export const ResolveCreateSchema = z.object({
  rating: z.enum(['up', 'down'], { error: 'Rating must be up or down' }),
});

export const AnnotationsJsonlLineSchema = z.object({
  prompt: z.string(),
  response: z.string(),
  rating: z.enum(['up', 'down']),
  scores: AnnotationCreateSchema.shape.scores,
  comment: z.string().max(500),
  metadata: AnnotationCreateSchema.shape.metadata,
  regions: z.array(RegionCreateSchema),
});

const TaxonomyRecordSchema = TaxonomyClassCreateSchema.extend({ id: trimmed(100, 'Taxonomy id') });
const MetadataRecordSchema = MetadataFieldCreateSchema.extend({ id: trimmed(100, 'Metadata field id') });

export const LabelsPackageSchema = z.object({
  schemaVersion: z.literal('annotation-studio-labels-v1', { error: 'schemaVersion must be exactly annotation-studio-labels-v1' }),
  taxonomy: z.array(TaxonomyRecordSchema),
  metadataFields: z.array(MetadataRecordSchema),
  items: z.array(z.object({
    id: trimmed(100, 'Item id'),
    suite: trimmed(100, 'Suite'),
    review_state: z.enum(REVIEW_STATES, { error: 'review_state must be unlabeled, labeled, reviewed, or disputed' }),
    annotation: AnnotationCreateSchema.nullable(),
  })),
}).superRefine((value, ctx) => {
  const classIds = new Set(value.taxonomy.map((c) => c.id));
  const metadataNames = new Set(value.metadataFields.map((f) => f.name));
  value.items.forEach((item, itemIndex) => {
    if (item.review_state === 'unlabeled' && item.annotation !== null) {
      ctx.addIssue({ code: 'custom', path: ['items', itemIndex, 'annotation'], message: 'annotation must be null when review_state is unlabeled' });
    }
    if (item.review_state !== 'unlabeled' && item.annotation === null) {
      ctx.addIssue({ code: 'custom', path: ['items', itemIndex, 'annotation'], message: `annotation is required when review_state is ${item.review_state}` });
    }
    item.annotation?.regions.forEach((region, regionIndex) => {
      if (!classIds.has(region.classId)) ctx.addIssue({ code: 'custom', path: ['items', itemIndex, 'annotation', 'regions', regionIndex, 'classId'], message: `classId ${region.classId} is absent from taxonomy` });
    });
    if (item.annotation && value.metadataFields.length > 0) {
      Object.keys(item.annotation.metadata).forEach((key) => {
        if (!metadataNames.has(key)) ctx.addIssue({ code: 'custom', path: ['items', itemIndex, 'annotation', 'metadata', key], message: `metadata key ${key} is absent from metadataFields` });
      });
    }
  });
});

export function validateMetadata(metadata, fields) {
  for (const field of fields) {
    if (!Object.hasOwn(metadata, field.name)) continue;
    const value = metadata[field.name];
    if (field.kind === 'text' && typeof value !== 'string') return `${field.name} must be text`;
    if (field.kind === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) return `${field.name} must be a finite number`;
    if (field.kind === 'select' && !field.options.includes(value)) return `${field.name} must be one of its options`;
    if (field.kind === 'checkbox' && typeof value !== 'boolean') return `${field.name} must be a checkbox value`;
  }
  return null;
}

export function validateRegionAttributes(region, taxonomy) {
  const cls = taxonomy.find((c) => c.id === region.classId);
  if (!cls) return `classId ${region.classId} does not match an existing taxonomy class`;
  for (const attribute of cls.attributes) {
    const value = region.attributeValues[attribute.name];
    if (attribute.kind === 'select' && !attribute.options.includes(value)) return `${attribute.name} must use one of its options`;
    if (attribute.kind === 'text' && (typeof value !== 'string' || value.length > 120)) return `${attribute.name} must be text of at most 120 characters`;
  }
  return null;
}

export function firstZodError(error) {
  const issue = error?.issues?.[0];
  if (!issue) return 'The payload is invalid';
  const field = issue.path?.length ? issue.path.join('.') : 'payload';
  return `${field}: ${issue.message}`;
}
