// Domain logic for Schema Forge: field contracts, draft-07 compilation,
// example generation, format instructions, version diffing, example
// inference, and payload validation (Ajv). Pure functions — no React.
import Ajv from 'ajv';
import { z } from 'zod';

export const FIELD_TYPES = ['string', 'number', 'boolean', 'object', 'array'];
export const TYPE_COLORS = {
  string: 'var(--type-string)',
  number: 'var(--type-number)',
  boolean: 'var(--type-boolean)',
  object: 'var(--type-object)',
  array: 'var(--type-array)',
};

export const KEY_PATTERN = /^[A-Za-z0-9_]+$/;
export const KEY_RULE = 'letters, digits, and underscores only (no spaces or punctuation)';

export function jsonParseError(text, error, context = 'Invalid JSON') {
  const message = error instanceof Error ? error.message : String(error);
  if (/position\s+\d+/i.test(message)) return `${context} — ${message}`;
  const position = /unexpected end/i.test(message) ? text.length : 0;
  const before = text.slice(0, position);
  const line = before.split('\n').length;
  const lastBreak = before.lastIndexOf('\n');
  const column = position - lastBreak;
  return `${context} at position ${position} (line ${line}, column ${column}) — ${message}`;
}

let uidCounter = 0;
export function uid(prefix = 'n') {
  uidCounter += 1;
  return `${prefix}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- Zod contracts (form-level, friendly messages) ---------- */

export const keyMessage = `Key must be 1 to 40 characters matching the allowed pattern — ${KEY_RULE}`;

export const fieldFormSchema = z
  .object({
    key: z
      .string()
      .min(1, keyMessage)
      .max(40, keyMessage)
      .regex(KEY_PATTERN, keyMessage),
    type: z.enum(FIELD_TYPES, { message: 'Type must be exactly one of string, number, boolean, object, array' }),
    required: z.boolean(),
    description: z.string(),
    enumText: z.string(), // newline/comma separated enum entries (string type only)
    minimum: z.string(), // numeric text (number type only)
    maximum: z.string(),
    pattern: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'string') {
      if (v.enumText.trim()) {
        const entries = splitEnumText(v.enumText);
        if (entries.some((e) => e === '')) {
          ctx.addIssue({
            code: 'custom',
            path: ['enumText'],
            message: 'Enum values reject empty entries — remove the blank entry',
          });
        }
      }
      if (v.pattern.trim()) {
        try {
          new RegExp(v.pattern);
        } catch {
          ctx.addIssue({
            code: 'custom',
            path: ['pattern'],
            message: 'Pattern must be a valid regular expression (for example ^[a-z]+$)',
          });
        }
      }
    }
    if (v.type === 'number') {
      const min = numOrUndef(v.minimum);
      const max = numOrUndef(v.maximum);
      if (v.minimum.trim() !== '' && min === undefined) {
        ctx.addIssue({ code: 'custom', path: ['minimum'], message: 'Minimum must be a number' });
      }
      if (v.maximum.trim() !== '' && max === undefined) {
        ctx.addIssue({ code: 'custom', path: ['maximum'], message: 'Maximum must be a number' });
      }
      if (min !== undefined && max !== undefined && min > max) {
        ctx.addIssue({
          code: 'custom',
          path: ['minimum'],
          message: `Minimum must not exceed maximum (minimum ${min} > maximum ${max})`,
        });
      }
    }
  });

export function splitEnumText(text) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim());
}
export function numOrUndef(s) {
  if (typeof s !== 'string' || s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export const versionNameSchema = z
  .string()
  .min(1, 'Version name is required — enter 1 to 80 characters')
  .max(80, 'Version name must be 1 to 80 characters');

export const metadataFieldSchema = z
  .object({
    label: z
      .string()
      .min(1, 'Label is required — enter 1 to 40 characters')
      .max(40, 'Label must be 1 to 40 characters'),
    type: z.enum(['text', 'number', 'date', 'dropdown'], {
      message: 'Type must be exactly one of text, number, date, dropdown',
    }),
    optionsText: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'dropdown') {
      const opts = splitEnumText(v.optionsText).filter((o) => o !== '');
      if (opts.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['optionsText'],
          message: 'Options are required for a dropdown — list at least one non-empty option',
        });
      } else if (splitEnumText(v.optionsText).some((o) => o === '')) {
        ctx.addIssue({ code: 'custom', path: ['optionsText'], message: 'Options reject empty entries' });
      }
    }
  });

/* -------- Plain FieldDefinition contract checks (package import) -------- */

export function fieldContractErrors(def, path = 'fields[i]') {
  const errs = [];
  if (!def || typeof def !== 'object') return [`${path} must be an object`];
  if (typeof def.key !== 'string' || def.key.length < 1 || def.key.length > 40 || !KEY_PATTERN.test(def.key)) {
    errs.push(`${path}.key must be 1 to 40 characters matching the allowed pattern — ${KEY_RULE}`);
  }
  if (!FIELD_TYPES.includes(def.type)) {
    errs.push(`${path}.type must be exactly one of string, number, boolean, object, array (got ${JSON.stringify(def.type)})`);
  }
  if (typeof def.required !== 'boolean') errs.push(`${path}.required must be a boolean`);
  if (def.description !== undefined && typeof def.description !== 'string') {
    errs.push(`${path}.description must be a string when present`);
  }
  if (def.enumValues !== undefined) {
    if (!Array.isArray(def.enumValues) || def.enumValues.length === 0) {
      errs.push(`${path}.enumValues must be a non-empty array of strings when present`);
    } else if (def.enumValues.some((e) => typeof e !== 'string' || e === '')) {
      errs.push(`${path}.enumValues rejects empty or non-string entries`);
    }
    if (def.type !== 'string') errs.push(`${path}.enumValues only applies when type is string`);
  }
  if (def.minimum !== undefined && typeof def.minimum !== 'number') errs.push(`${path}.minimum must be a number when present`);
  if (def.maximum !== undefined && typeof def.maximum !== 'number') errs.push(`${path}.maximum must be a number when present`);
  if ((def.minimum !== undefined || def.maximum !== undefined) && def.type !== 'number') {
    errs.push(`${path}.minimum and maximum only apply when type is number`);
  }
  if (typeof def.minimum === 'number' && typeof def.maximum === 'number' && def.minimum > def.maximum) {
    errs.push(`${path}.minimum must not exceed maximum (minimum ${def.minimum} > maximum ${def.maximum})`);
  }
  if (def.pattern !== undefined) {
    if (typeof def.pattern !== 'string') errs.push(`${path}.pattern must be a string when present`);
    else {
      try {
        new RegExp(def.pattern);
      } catch {
        errs.push(`${path}.pattern must be a valid regular expression`);
      }
    }
    if (def.type !== 'string') errs.push(`${path}.pattern only applies when type is string`);
  }
  if (['object', 'array'].includes(def.type) && !Array.isArray(def.children)) {
    errs.push(`${path}.children must be an array when type is ${def.type}`);
  }
  if (!['object', 'array'].includes(def.type) && Array.isArray(def.children) && def.children.length) {
    errs.push(`${path}.children must be omitted or empty when type is ${def.type}`);
  }
  if (Array.isArray(def.children)) {
    const seen = new Set();
    def.children.forEach((c, i) => {
      errs.push(...fieldContractErrors(c, `${path}.children[${i}]`));
      if (c && typeof c.key === 'string') {
        if (seen.has(c.key)) errs.push(`${path}.children has a sibling-duplicate key "${c.key}"`);
        seen.add(c.key);
      }
    });
  }
  return errs;
}

export const SCHEMA_PACKAGE_KEYS = [
  'schemaVersion',
  'name',
  'jsonSchema',
  'fields',
  'metadata',
  'examplePayload',
  'formatInstruction',
];

export function validateSchemaPackage(text) {
  let pkg;
  try {
    pkg = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: jsonParseError(text, e, 'Import package: invalid JSON') };
  }
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    return { ok: false, error: 'Import package: the root value must be a JSON object' };
  }
  for (const k of SCHEMA_PACKAGE_KEYS) {
    if (!(k in pkg)) {
      return {
        ok: false,
        error: `Import package: missing required key "${k}" — the SchemaPackage contract requires schemaVersion, name, jsonSchema, fields, metadata, examplePayload, and formatInstruction`,
      };
    }
  }
  if (pkg.schemaVersion !== 'schema-package-v1') {
    return {
      ok: false,
      error: `Import package: schemaVersion must be exactly "schema-package-v1" (got ${JSON.stringify(pkg.schemaVersion)})`,
    };
  }
  if (typeof pkg.name !== 'string' || pkg.name === '') {
    return { ok: false, error: 'Import package: name must be a non-empty string' };
  }
  if (!pkg.jsonSchema || typeof pkg.jsonSchema !== 'object' || Array.isArray(pkg.jsonSchema)) {
    return { ok: false, error: 'Import package: jsonSchema must be a parseable object' };
  }
  if (!Array.isArray(pkg.fields)) {
    return { ok: false, error: 'Import package: fields must be an array of FieldDefinition records' };
  }
  if (!pkg.metadata || typeof pkg.metadata !== 'object' || Array.isArray(pkg.metadata)) {
    return { ok: false, error: 'Import package: metadata must be an object' };
  }
  if (Object.values(pkg.metadata).some((value) => typeof value !== 'string')) {
    return { ok: false, error: 'Import package: metadata must map every label to a string value' };
  }
  if (!pkg.examplePayload || typeof pkg.examplePayload !== 'object' || Array.isArray(pkg.examplePayload)) {
    return { ok: false, error: 'Import package: examplePayload must be an object' };
  }
  if (typeof pkg.formatInstruction !== 'string') {
    return { ok: false, error: 'Import package: formatInstruction must be a string' };
  }
  const seen = new Set();
  for (let i = 0; i < pkg.fields.length; i += 1) {
    const errs = fieldContractErrors(pkg.fields[i], `fields[${i}]`);
    if (errs.length) return { ok: false, error: `Import package: ${errs[0]}` };
    const k = pkg.fields[i].key;
    if (seen.has(k)) return { ok: false, error: `Import package: fields has a sibling-duplicate key "${k}"` };
    seen.add(k);
  }
  return { ok: true, pkg };
}

/* ----------------------------- Tree helpers ----------------------------- */

/* -------------------------- Constraint templates ------------------------- */

export const CONSTRAINT_TEMPLATES = [
  { name: 'Email pattern', type: 'string', hint: 'pattern matching an email address', apply: { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' } },
  { name: 'Percentage 0 to 100', type: 'number', hint: 'minimum 0, maximum 100', apply: { minimum: 0, maximum: 100 } },
  { name: 'ISO date pattern', type: 'string', hint: 'pattern matching YYYY-MM-DD', apply: { pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
  { name: 'Non-empty string', type: 'string', hint: 'pattern requiring at least one character', apply: { pattern: '.+' } },
  { name: 'Status enum', type: 'string', hint: 'enumValues active, inactive, pending', apply: { enumValues: ['active', 'inactive', 'pending'] } },
];

// Changing type clears constraint inputs that do not apply to the new type.
export function retypeNode(n, newType) {
  const next = { ...n, type: newType };
  if (newType !== 'string') {
    delete next.enumValues;
    delete next.pattern;
  }
  if (newType !== 'number') {
    delete next.minimum;
    delete next.maximum;
  }
  if (newType === 'object' || newType === 'array') {
    next.children = next.children || [];
  } else {
    delete next.children;
  }
  return next;
}

export function makeNode(partial) {
  return { id: uid(), key: 'new_field', type: 'string', required: false, ...partial };
}
export function rootNode(children = []) {
  return { id: uid('root'), key: 'root', type: 'object', required: true, children };
}

export function findNode(node, id) {
  if (node.id === id) return node;
  for (const c of node.children || []) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return null;
}
export function findParent(node, id) {
  for (const c of node.children || []) {
    if (c.id === id) return node;
    const hit = findParent(c, id);
    if (hit) return hit;
  }
  return null;
}
export function updateNode(root, id, fn) {
  function rec(n) {
    if (n.id === id) return fn({ ...n });
    if (n.children) return { ...n, children: n.children.map(rec) };
    return n;
  }
  return rec(root);
}
export function removeNode(root, id) {
  function rec(n) {
    if (!n.children) return n;
    return { ...n, children: n.children.filter((c) => c.id !== id).map(rec) };
  }
  return rec(root);
}
export function insertChild(root, parentId, node, at = -1) {
  return updateNode(root, parentId, (n) => {
    const children = [...(n.children || [])];
    if (at < 0 || at >= children.length) children.push(node);
    else children.splice(at, 0, node);
    return { ...n, children };
  });
}
export function reorderChildren(root, parentId, fromIdx, toIdx) {
  return updateNode(root, parentId, (n) => {
    const children = [...(n.children || [])];
    const [moved] = children.splice(fromIdx, 1);
    children.splice(toIdx, 0, moved);
    return { ...n, children };
  });
}
export function countFields(node) {
  let count = 0;
  function rec(n) {
    for (const c of n.children || []) {
      count += 1;
      rec(c);
    }
  }
  rec(node);
  return count;
}
export function uniqueKey(parent, base = 'new_field') {
  const taken = new Set((parent.children || []).map((c) => c.key));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}
export function uniqueSchemaName(schemas, base) {
  const taken = new Set(schemas.map((s) => s.name));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base} ${i}`)) i += 1;
  return `${base} ${i}`;
}

/* --------------------------- FieldDefinition <-> tree -------------------- */

export function nodeToFieldDef(n) {
  const def = { key: n.key, type: n.type, required: !!n.required };
  if (n.description) def.description = n.description;
  if (n.type === 'string') {
    if (n.enumValues && n.enumValues.length) def.enumValues = [...n.enumValues];
    if (n.pattern) def.pattern = n.pattern;
  }
  if (n.type === 'number') {
    if (n.minimum !== undefined) def.minimum = n.minimum;
    if (n.maximum !== undefined) def.maximum = n.maximum;
  }
  if (n.type === 'object' || n.type === 'array') {
    def.children = (n.children || []).map(nodeToFieldDef);
  }
  return def;
}
export function fieldDefToNode(def) {
  const node = makeNode({
    key: def.key,
    type: def.type,
    required: !!def.required,
    description: def.description,
  });
  if (def.type === 'string') {
    if (Array.isArray(def.enumValues)) node.enumValues = [...def.enumValues];
    if (def.pattern) node.pattern = def.pattern;
  }
  if (def.type === 'number') {
    if (typeof def.minimum === 'number') node.minimum = def.minimum;
    if (typeof def.maximum === 'number') node.maximum = def.maximum;
  }
  if ((def.type === 'object' || def.type === 'array') && Array.isArray(def.children)) {
    node.children = def.children.map(fieldDefToNode);
  } else if (def.type === 'object' || def.type === 'array') {
    node.children = [];
  }
  return node;
}

/* --------------------------- draft-07 compilation ------------------------ */

export function compileNode(n) {
  const s = { type: n.type };
  if (n.description) s.description = n.description;
  if (n.type === 'string') {
    if (n.enumValues && n.enumValues.length) s.enum = [...n.enumValues];
    if (n.pattern) s.pattern = n.pattern;
  }
  if (n.type === 'number') {
    if (n.minimum !== undefined) s.minimum = n.minimum;
    if (n.maximum !== undefined) s.maximum = n.maximum;
  }
  if (n.type === 'object') {
    s.properties = {};
    (n.children || []).forEach((c) => {
      s.properties[c.key] = compileNode(c);
    });
    const req = (n.children || []).filter((c) => c.required).map((c) => c.key);
    if (req.length) s.required = req;
  }
  if (n.type === 'array') {
    const item = (n.children || [])[0];
    s.items = item ? compileNode(item) : { type: 'string' };
  }
  return s;
}

export function compileSchema(tree, name) {
  const s = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: name,
    type: 'object',
    properties: {},
  };
  (tree.children || []).forEach((c) => {
    s.properties[c.key] = compileNode(c);
  });
  const req = (tree.children || []).filter((c) => c.required).map((c) => c.key);
  s.required = req;
  return s;
}

/* ---------------------------- Example payload ---------------------------- */

const WORDS = ['alpha', 'bravo', 'cedar', 'delta', 'ember', 'frost', 'glide', 'haven'];
const EMAIL_SAMPLE = 'user@example.com';
const ISO_SAMPLE = () => {
  const d = new Date(2026, 0, 1 + Math.floor(Math.random() * 180));
  return d.toISOString().slice(0, 10);
};
export const EMAIL_PATTERN = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';
export const ISO_DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$';

function sampleForPattern(pattern) {
  if (pattern === EMAIL_PATTERN) return EMAIL_SAMPLE;
  if (pattern === ISO_DATE_PATTERN) return ISO_SAMPLE();
  if (pattern.includes('\\d')) return '12345';
  return 'sample-value';
}

export function exampleValue(n, rng = Math.random) {
  switch (n.type) {
    case 'string': {
      if (n.enumValues && n.enumValues.length) {
        return n.enumValues[Math.floor(rng() * n.enumValues.length)];
      }
      if (n.pattern) return sampleForPattern(n.pattern);
      return `${WORDS[Math.floor(rng() * WORDS.length)]}-${100 + Math.floor(rng() * 900)}`;
    }
    case 'number': {
      const lo = n.minimum !== undefined ? n.minimum : 0;
      const hi = n.maximum !== undefined ? n.maximum : lo + 100;
      const v = lo + rng() * (hi - lo);
      return Math.round(v * 100) / 100;
    }
    case 'boolean':
      return rng() < 0.5;
    case 'object': {
      const o = {};
      (n.children || []).forEach((c) => {
        o[c.key] = exampleValue(c, rng);
      });
      return o;
    }
    case 'array': {
      const item = (n.children || [])[0];
      if (!item) return [];
      const count = 1 + Math.floor(rng() * 2);
      return Array.from({ length: count }, () => exampleValue(item, rng));
    }
    default:
      return null;
  }
}

export function generateExample(tree, rng = Math.random) {
  const o = {};
  (tree.children || []).forEach((c) => {
    o[c.key] = exampleValue(c, rng);
  });
  return o;
}

/* --------------------------- Format instruction -------------------------- */

function describeConstraints(n) {
  const bits = [];
  if (n.type === 'string' && n.enumValues && n.enumValues.length) bits.push(`one of ${n.enumValues.join(', ')}`);
  if (n.type === 'string' && n.pattern) bits.push(`pattern ${n.pattern}`);
  if (n.type === 'number' && n.minimum !== undefined) bits.push(`minimum ${n.minimum}`);
  if (n.type === 'number' && n.maximum !== undefined) bits.push(`maximum ${n.maximum}`);
  return bits;
}

export function formatInstruction(tree) {
  const parts = [];
  function walk(n, prefix) {
    (n.children || []).forEach((c) => {
      const path = prefix ? `${prefix}.${c.key}` : c.key;
      const bits = [c.type, c.required ? 'required' : 'optional', ...describeConstraints(c)];
      if (c.description) bits.push(c.description);
      parts.push(`${path} (${bits.join(', ')})`);
      if (c.type === 'object') walk(c, path);
      if (c.type === 'array' && (c.children || [])[0]) {
        const item = c.children[0];
        parts.push(`${path}[] items (${item.type}${item.required ? ', required' : ''}${describeConstraints(item).length ? `, ${describeConstraints(item).join(', ')}` : ''})`);
        if (item.type === 'object') walk(item, `${path}[]`);
      }
    });
  }
  walk(tree, '');
  if (!parts.length) return 'Respond with a single valid JSON object with no fields (an empty object {}). Output JSON only, with no commentary.';
  return `Respond with a single valid JSON object. Fields: ${parts.join('; ')}. Output JSON only, with no commentary.`;
}

/* ------------------------------- Diff ------------------------------------ */

function flattenForDiff(node, prefix, map) {
  (node.children || []).forEach((c) => {
    const path = prefix ? `${prefix}.${c.key}` : c.key;
    map.set(path, c);
    if (c.type === 'object') flattenForDiff(c, path, map);
    if (c.type === 'array' && (c.children || [])[0]) flattenForDiff(c.children[0], `${path}[]`, map);
  });
}

export function diffTrees(baseTree, compareTree) {
  const A = new Map();
  const B = new Map();
  flattenForDiff(baseTree, '', A);
  flattenForDiff(compareTree, '', B);
  const rows = [];
  for (const [path, n] of A) {
    if (!B.has(path)) rows.push({ kind: 'removed', path, label: `removed (was ${n.type}${n.required ? ', required' : ''})` });
  }
  for (const [path, n] of B) {
    if (!A.has(path)) rows.push({ kind: 'added', path, label: `added (${n.type}${n.required ? ', required' : ''})` });
  }
  for (const [path, a] of A) {
    const b = B.get(path);
    if (!b) continue;
    const changes = [];
    if (a.type !== b.type) changes.push(`type ${a.type} → ${b.type}`);
    if (!!a.required !== !!b.required) changes.push(`required ${a.required ? 'yes' : 'no'} → ${b.required ? 'yes' : 'no'}`);
    const ae = (a.enumValues || []).join('|');
    const be = (b.enumValues || []).join('|');
    if (ae !== be) changes.push(`enumValues ${ae || '∅'} → ${be || '∅'}`);
    if (a.minimum !== b.minimum) changes.push(`minimum ${a.minimum ?? '∅'} → ${b.minimum ?? '∅'}`);
    if (a.maximum !== b.maximum) changes.push(`maximum ${a.maximum ?? '∅'} → ${b.maximum ?? '∅'}`);
    if ((a.pattern || '') !== (b.pattern || '')) changes.push(`pattern ${a.pattern || '∅'} → ${b.pattern || '∅'}`);
    if (changes.length) rows.push({ kind: 'changed', path, label: `changed (${changes.join('; ')})` });
  }
  rows.sort((x, y) => x.path.localeCompare(y.path));
  return rows;
}

/* ------------------------- Import-from-example --------------------------- */

function sanitizeKey(raw) {
  const cleaned = String(raw).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40);
  return cleaned || 'field';
}
function inferType(v) {
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'object' && v !== null) return 'object';
  return 'string';
}

export function inferFields(obj) {
  const used = new Set();
  return Object.entries(obj).map(([rawKey, v]) => {
    let key = sanitizeKey(rawKey);
    while (used.has(key)) key = `${key.slice(0, 38)}_${used.size}`;
    used.add(key);
    const type = inferType(v);
    const field = { id: uid('inf'), key, type, required: true, accepted: true };
    if (type === 'string') {
      if (new RegExp(EMAIL_PATTERN).test(v)) {
        field.pattern = EMAIL_PATTERN;
        field.hint = 'Suggested constraint: Email pattern (matched the example value)';
      } else if (new RegExp(ISO_DATE_PATTERN).test(v)) {
        field.pattern = ISO_DATE_PATTERN;
        field.hint = 'Suggested constraint: ISO date pattern (matched the example value)';
      } else if (v !== '') {
        field.minLengthHint = true;
        field.hint = 'Suggested constraint: Non-empty string (example value was non-empty)';
      }
    }
    if (type === 'number') {
      field.minimum = Math.min(0, v);
      field.maximum = Math.max(100, v);
      field.hint = `Suggested bounds from the example value ${v}: minimum ${field.minimum}, maximum ${field.maximum}`;
    }
    if (type === 'object') field.children = inferFields(v);
    if (type === 'array' && v.length) field.children = [{ ...inferFields({ item: v[0] })[0], key: 'item' }];
    if (type === 'array') field.children = field.children || [];
    return field;
  });
}

export function inferredToNode(f) {
  const node = makeNode({
    key: f.key,
    type: f.type,
    required: !!f.required,
    pattern: f.pattern,
    minimum: f.minimum,
    maximum: f.maximum,
  });
  if (f.type === 'object' || f.type === 'array') node.children = (f.children || []).map(inferredToNode);
  return node;
}

/* ------------------------- Payload validation (Ajv) ---------------------- */

const ajv = new Ajv({ allErrors: true });

function humanizeError(key, err) {
  const where = err.instancePath ? err.instancePath.replace(/^\//, '').replace(/\//g, '.') : key;
  switch (err.keyword) {
    case 'required':
      return `${err.params.missingProperty} is required but missing`;
    case 'maximum':
      return `${where} must be at most ${err.params.limit}`;
    case 'minimum':
      return `${where} must be at least ${err.params.limit}`;
    case 'enum':
      return `${where} must be one of ${err.params.allowedValues.join(', ')}`;
    case 'pattern':
      return `${where} must match the pattern ${err.params.pattern}`;
    case 'type':
      return `${where} must be of type ${err.params.type}`;
    default:
      return `${where} ${err.message}`;
  }
}

export function validateFieldPayload(fieldNode, payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { pass: false, message: `${fieldNode.key}: the payload root must be a JSON object` };
  }
  const sub = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: { [fieldNode.key]: compileNode(fieldNode) },
    required: fieldNode.required ? [fieldNode.key] : [],
  };
  let validate;
  try {
    validate = ajv.compile(sub);
  } catch (e) {
    return { pass: false, message: `${fieldNode.key}: compiled schema error — ${e.message}` };
  }
  const ok = validate(payload);
  if (ok) return { pass: true, message: null };
  const errs = (validate.errors || [])
    .filter((e) => !(e.instancePath === '' && e.keyword !== 'required'))
    .map((e) => humanizeError(fieldNode.key, e));
  return { pass: false, message: errs[0] || `${fieldNode.key} failed validation` };
}

export function parsePosition(message) {
  const m = /position (\d+)/.exec(message || '');
  return m ? Number(m[1]) : null;
}

/* -------------------------- Schema summary line -------------------------- */

export function schemaSummary(tree) {
  let fields = 0;
  let required = 0;
  const types = new Set();
  function rec(n) {
    (n.children || []).forEach((c) => {
      fields += 1;
      if (c.required) required += 1;
      types.add(c.type);
      rec(c);
    });
  }
  rec(tree);
  return `${fields} field${fields === 1 ? '' : 's'} · ${required} required · types: ${[...types].join(', ') || 'none'}`;
}
