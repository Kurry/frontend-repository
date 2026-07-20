import { z } from 'zod';

export const FIELD_TYPES = ['string', 'number', 'boolean', 'object', 'array'];
export const TYPE_COLORS = {
  string: 'cyan', number: 'purple', boolean: 'magenta', object: 'blue', array: 'teal',
};

const keySchema = z.string()
  .min(1, 'Key is required')
  .max(40, 'Key must contain at most 40 characters')
  .regex(/^[A-Za-z0-9_]+$/, 'Key must use letters, digits, and underscores only');

export const fieldDefinitionSchema = z.lazy(() => z.object({
  id: z.string().optional(),
  key: keySchema,
  type: z.enum(FIELD_TYPES, { error: 'Type must be string, number, boolean, object, or array' }),
  required: z.boolean(),
  description: z.string().optional(),
  enumValues: z.array(z.string().min(1, 'Enum values must not be empty')).min(1, 'Enum values must contain at least one entry').optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  pattern: z.string().optional(),
  children: z.array(fieldDefinitionSchema).optional(),
}).superRefine((field, ctx) => {
  if (field.enumValues && field.type !== 'string') ctx.addIssue({ code: 'custom', path: ['enumValues'], message: 'Enum values only apply to string fields' });
  if (field.pattern !== undefined && field.type !== 'string') ctx.addIssue({ code: 'custom', path: ['pattern'], message: 'Pattern only applies to string fields' });
  if ((field.minimum !== undefined || field.maximum !== undefined) && field.type !== 'number') ctx.addIssue({ code: 'custom', path: ['minimum'], message: 'Minimum and maximum only apply to number fields' });
  if (['object', 'array'].includes(field.type) && !Array.isArray(field.children)) ctx.addIssue({ code: 'custom', path: ['children'], message: 'Children must be an array for object and array fields' });
  if (field.minimum !== undefined && field.maximum !== undefined && field.minimum > field.maximum) ctx.addIssue({ code: 'custom', path: ['minimum'], message: 'Minimum must be less than or equal to maximum' });
  if (field.pattern) {
    try { new RegExp(field.pattern); } catch { ctx.addIssue({ code: 'custom', path: ['pattern'], message: 'Pattern must be a valid regular expression' }); }
  }
}));

export const metadataFieldSchema = z.object({
  label: z.string().min(1, 'Label is required').max(40, 'Label must contain at most 40 characters'),
  type: z.enum(['text', 'number', 'date', 'dropdown']),
  options: z.array(z.string().min(1, 'Options must not be empty')).optional(),
}).superRefine((value, ctx) => {
  if (value.type === 'dropdown' && (!value.options || value.options.length === 0)) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Options are required for dropdown metadata' });
});

export const versionSnapshotSchema = z.object({ name: z.string().min(1, 'Version name is required').max(80, 'Version name must contain at most 80 characters') });

const jsonObject = z.record(z.string(), z.unknown());
export const schemaPackageSchema = z.object({
  schemaVersion: z.literal('schema-package-v1', { error: 'schemaVersion must be exactly schema-package-v1' }),
  name: z.string().min(1, 'Name is required'),
  jsonSchema: jsonObject,
  fields: z.array(fieldDefinitionSchema),
  metadata: z.record(z.string(), z.string()),
  examplePayload: jsonObject,
  formatInstruction: z.string(),
});

export function validateSiblingKeys(fields, path = 'fields') {
  const seen = new Set();
  for (const field of fields) {
    if (seen.has(field.key)) return `${path}.${field.key}: key must be unique among siblings`;
    seen.add(field.key);
    const parsed = fieldDefinitionSchema.safeParse(field);
    if (!parsed.success) return `${path}.${field.key}: ${parsed.error.issues[0]?.message}`;
    if (field.children?.length) {
      const nested = validateSiblingKeys(field.children, `${path}.${field.key}.children`);
      if (nested) return nested;
    }
  }
  return null;
}

export function fieldToJsonSchema(field) {
  const output = { type: field.type };
  if (field.description) output.description = field.description;
  if (field.enumValues?.length) output.enum = field.enumValues;
  if (field.minimum !== undefined) output.minimum = field.minimum;
  if (field.maximum !== undefined) output.maximum = field.maximum;
  if (field.pattern) output.pattern = field.pattern;
  if (field.type === 'object') {
    const children = field.children || [];
    output.properties = Object.fromEntries(children.map((child) => [child.key, fieldToJsonSchema(child)]));
    const required = children.filter((child) => child.required).map((child) => child.key);
    output.required = required;
    output.additionalProperties = false;
  }
  if (field.type === 'array') {
    const children = field.children || [];
    if (children.length) {
      output.items = {
        type: 'object',
        properties: Object.fromEntries(children.map((child) => [child.key, fieldToJsonSchema(child)])),
        additionalProperties: false,
      };
      const required = children.filter((child) => child.required).map((child) => child.key);
      output.items.required = required;
    } else output.items = { type: 'string' };
  }
  return output;
}

export function compileSchema(fields) {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: Object.fromEntries(fields.map((field) => [field.key, fieldToJsonSchema(field)])),
    additionalProperties: false,
  };
  const required = fields.filter((field) => field.required).map((field) => field.key);
  schema.required = required;
  return schema;
}

function sampleString(field, nonce) {
  if (field.enumValues?.length) return field.enumValues[nonce % field.enumValues.length];
  if (field.pattern?.includes('\\d{4}-\\d{2}-\\d{2}')) return `2026-0${(nonce % 8) + 1}-${String((nonce % 25) + 1).padStart(2, '0')}`;
  if (field.pattern?.includes('@')) return `analyst${nonce}@example.com`;
  return nonce % 2 ? `${field.key}_sample` : `${field.key}_value`;
}

function sampleField(field, nonce) {
  if (field.type === 'string') return sampleString(field, nonce);
  if (field.type === 'number') {
    const min = field.minimum ?? 0;
    const max = field.maximum ?? min + 100;
    return Math.min(max, min + ((nonce * 17) % Math.max(1, max - min + 1)));
  }
  if (field.type === 'boolean') return nonce % 2 === 0;
  if (field.type === 'object') return generateExample(field.children || [], nonce + 1);
  if (field.type === 'array') return field.children?.length ? [generateExample(field.children, nonce + 2)] : [`${field.key}_item_${nonce}`];
  return null;
}

export function generateExample(fields, nonce = 1) {
  return Object.fromEntries(fields.map((field, index) => [field.key, sampleField(field, nonce + index)]));
}

function walkFormat(fields, prefix = '', depth = 0) {
  const lines = [];
  fields.forEach((field) => {
    const path = prefix ? `${prefix}.${field.key}` : field.key;
    let rules = '';
    if (field.enumValues?.length) rules += `; one of ${field.enumValues.join(', ')}`;
    if (field.minimum !== undefined) rules += `; minimum ${field.minimum}`;
    if (field.maximum !== undefined) rules += `; maximum ${field.maximum}`;
    if (field.pattern) rules += `; pattern ${field.pattern}`;
    lines.push(`${'  '.repeat(depth)}- ${path}: ${field.type}, ${field.required ? 'required' : 'optional'}${rules}`);
    if (field.children?.length) lines.push(...walkFormat(field.children, path, depth + 1));
  });
  return lines;
}

export function formatInstruction(fields) {
  return `Return only a JSON object matching this structure:\n${walkFormat(fields).join('\n') || '- No fields are defined; return an empty object.'}\nDo not include prose or keys that are not defined.`;
}

export function findField(fields, id) {
  for (const field of fields) {
    if (field.id === id) return field;
    const found = findField(field.children || [], id);
    if (found) return found;
  }
  return null;
}

export function findParent(fields, id, parent = null) {
  for (const field of fields) {
    if (field.id === id) return { field, parent, siblings: fields };
    const found = findParent(field.children || [], id, field);
    if (found) return found;
  }
  return null;
}

export function mapField(fields, id, fn) {
  return fields.map((field) => field.id === id ? fn(field) : ({ ...field, children: field.children ? mapField(field.children, id, fn) : undefined }));
}

export function flattenFields(fields, prefix = '') {
  return fields.flatMap((field) => {
    const path = prefix ? `${prefix}.${field.key}` : field.key;
    return [{ ...field, path }, ...flattenFields(field.children || [], path)];
  });
}

export function withIds(fields, makeId) {
  return fields.map((field) => ({ ...field, id: field.id || makeId(), children: field.children ? withIds(field.children, makeId) : undefined }));
}

export function stripIds(fields) {
  return fields.map(({ id, children, ...field }) => ({ ...field, ...(children ? { children: stripIds(children) } : {}) }));
}

export function inferFields(input, makeId) {
  return Object.entries(input).map(([key, value]) => {
    if (Array.isArray(value)) {
      const first = value[0];
      return { id: makeId(), key, type: 'array', required: true, children: first && typeof first === 'object' && !Array.isArray(first) ? inferFields(first, makeId) : [] };
    }
    if (value !== null && typeof value === 'object') return { id: makeId(), key, type: 'object', required: true, children: inferFields(value, makeId) };
    const type = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';
    const field = { id: makeId(), key, type, required: true };
    if (type === 'number') { field.minimum = value; field.maximum = value; }
    if (type === 'string' && value) field.enumValues = [value];
    return field;
  });
}

export function diffFields(before, after) {
  const a = new Map(flattenFields(before).map((f) => [f.path, f]));
  const b = new Map(flattenFields(after).map((f) => [f.path, f]));
  const results = [];
  for (const [path, field] of b) {
    if (!a.has(path)) results.push({ kind: 'added', path, detail: `${field.type} field added` });
    else {
      const old = a.get(path);
      const keys = ['type', 'required', 'minimum', 'maximum', 'pattern'];
      const changed = keys.filter((key) => JSON.stringify(old[key]) !== JSON.stringify(field[key]));
      if (JSON.stringify(old.enumValues) !== JSON.stringify(field.enumValues)) changed.push('enum values');
      if (changed.length) results.push({ kind: 'changed', path, detail: `Changed ${changed.join(', ')}` });
    }
  }
  for (const [path, field] of a) if (!b.has(path)) results.push({ kind: 'removed', path, detail: `${field.type} field removed` });
  return results;
}

export function packageFor(schema, metadataFields, exampleNonce = 1) {
  const fields = stripIds(schema.fields);
  return {
    schemaVersion: 'schema-package-v1',
    name: schema.name,
    jsonSchema: compileSchema(fields),
    fields,
    metadata: Object.fromEntries(metadataFields.map((f) => [f.label, schema.metadata?.[f.label] || ''])),
    examplePayload: generateExample(fields, exampleNonce),
    formatInstruction: formatInstruction(fields),
  };
}
