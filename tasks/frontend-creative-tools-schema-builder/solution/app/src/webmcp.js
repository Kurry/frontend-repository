// Browser WebMCP surface (zto-webmcp-v1). Every handler invokes the exact
// same store actions the visible UI uses — no parallel state, no stubs.
import { useStore, activeSchema, displayedTree, compiledText, formatText, packageObject, reportObject } from './store.js';
import { findNode, findParent, FIELD_TYPES, KEY_PATTERN, CONSTRAINT_TEMPLATES, splitEnumText, retypeNode, uid } from './lib.js';

const OBJECT_TYPES = ['schema', 'field-node', 'metadata-field', 'version'];
const MODES = ['schema-text', 'example', 'format-prompt', 'diff', 'playground', 'import'];
const FORMATS = ['compiled-schema-json', 'schema-package-json', 'validation-report-text', 'format-instruction-text'];
const DEMOS = ['validation-run', 'regenerate-example', 'apply-import-draft'];
const EDITOR_PROPERTIES = [
  'key-name', 'type', 'required', 'description', 'enum-values', 'minimum', 'maximum', 'pattern',
  'constraint-template', 'nest-level', 'sibling-order', 'schema-name', 'version-name',
  'metadata-field-label', 'metadata-field-type', 'metadata-field-options',
  'playground-payload', 'import-example-json', 'import-field-accept', 'schema-package-json',
];

const SESSION_INFO = {
  contract_version: 'zto-webmcp-v1',
  app: 'Schema Forge',
  modules: [
    { id: 'structured-editor-v1', title: 'Structured editor' },
    { id: 'command-session-v1', title: 'Command / session' },
    { id: 'entity-collection-v1', title: 'Entity collection' },
    { id: 'artifact-transfer-v1', title: 'Artifact transfer' },
  ],
};

function err(message) {
  return { ok: false, error: message };
}
function ok(message, extra) {
  return { ok: true, message, ...extra };
}

function nodeSummary(n) {
  return `${n.key} (${n.type}${n.required ? ', required' : ''})`;
}

const tools = [
  /* ------------------------- structured-editor-v1 ------------------------ */
  {
    name: 'editor_select',
    description: 'Select a schema editor object: a library schema, a field node (opens its configuration panel), a metadata field, or a saved version (loads it into the diff compare slot).',
    inputSchema: {
      type: 'object',
      properties: {
        object_type: { type: 'string', enum: OBJECT_TYPES },
        id: { type: 'string', maxLength: 120 },
      },
      required: ['object_type', 'id'],
      additionalProperties: false,
    },
    execute: ({ object_type, id }) => {
      const s = useStore.getState();
      if (object_type === 'schema') {
        const r = s.selectSchema(id);
        if (!r.ok) return err(r.error);
        const sc = useStore.getState().schemas.find((x) => x.id === id);
        return ok(`Selected schema "${sc.name}" — the tree and every derived pane now show it`);
      }
      if (object_type === 'field-node') {
        const tree = displayedTree(useStore.getState());
        const node = tree && findNode(tree, id);
        if (!node) return err(`No field node with id "${id}" in the active schema`);
        s.selectNode(id);
        return ok(`Selected field ${nodeSummary(node)} — its FieldDefinition is open in the configuration panel`);
      }
      if (object_type === 'version') {
        const sc = activeSchema(useStore.getState());
        if (!sc || !sc.versions.some((v) => v.id === id)) return err(`No saved version with id "${id}"`);
        s.setDiffCompare(id);
        s.switchMode('diff');
        return ok('Loaded the version into the diff compare slot and opened the Diff view');
      }
      if (object_type === 'metadata-field') {
        const mf = useStore.getState().metaFields.find((x) => x.id === id);
        if (!mf) return err(`No metadata field with id "${id}"`);
        return ok(`Metadata field "${mf.label}" (${mf.type}) is defined — the metadata builder lives in the library sidebar`);
      }
      return err('Unknown object_type');
    },
  },
  {
    name: 'editor_add',
    description: 'Add an object to the editor: a field-node under a parent (defaults to the root object), a metadata-field, or a version snapshot.',
    inputSchema: {
      type: 'object',
      properties: {
        object_type: { type: 'string', enum: ['field-node', 'metadata-field', 'version'] },
        parent_id: { type: 'string', maxLength: 120 },
        key: { type: 'string', maxLength: 40 },
        type: { type: 'string', enum: FIELD_TYPES },
        name: { type: 'string', maxLength: 80 },
        label: { type: 'string', maxLength: 40 },
        metadata_type: { type: 'string', enum: ['text', 'number', 'date', 'dropdown'] },
        options: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      },
      required: ['object_type'],
      additionalProperties: false,
    },
    execute: (args) => {
      const s = useStore.getState();
      if (args.object_type === 'field-node') {
        const r = s.addField(args.parent_id);
        if (!r.ok) return err(r.error === 'ignored-duplicate' ? 'Duplicate activation ignored — one field was added' : r.error);
        let message = `Added field ${r.key} (string) under ${args.parent_id ? 'the given parent' : 'the root object'}`;
        if (args.type && args.type !== 'string') {
          useStore.getState().applyPanelEdit(r.id, (n) => retypeNode(n, args.type), 'Retype field');
          message = `Added field ${r.key} (${args.type})`;
        }
        if (args.key) {
          const rr = useStore.getState().renameNode(r.id, args.key);
          if (!rr.ok) return err(`${message}, but the rename failed: ${rr.error}`);
          message = `Added field ${args.key} (${args.type || 'string'})`;
        }
        return ok(`${message} — the tree, compiled schema, example payload, and format instruction all include it`, { id: r.id });
      }
      if (args.object_type === 'metadata-field') {
        const label = String(args.label || '').trim();
        const type = args.metadata_type || 'text';
        if (!label || label.length > 40) return err('MetadataField.label is required — 1 to 40 characters');
        if (args.metadata_type && !['text', 'number', 'date', 'dropdown'].includes(args.metadata_type)) {
          return err('MetadataField.type must be exactly one of text, number, date, dropdown');
        }
        if (type === 'dropdown' && !(args.options || []).filter((o) => o !== '').length) {
          return err('MetadataField.options is required for dropdown — provide at least one non-empty option');
        }
        s.addMetadataField({ label, type, options: (args.options || []).filter((o) => o !== '') });
        return ok(`Added metadata field "${label}" (${type}) — it now renders as an editable input on every library entry`);
      }
      if (args.object_type === 'version') {
        const r = s.saveVersion(args.name);
        if (!r.ok) return err(r.error === 'ignored-duplicate' ? 'Duplicate activation ignored — exactly one version was saved' : r.error);
        return ok(`Saved version "${args.name}" — it is listed newest-first with its timestamp`);
      }
      return err('Unknown object_type');
    },
  },
  {
    name: 'editor_delete',
    description: 'Delete a field-node (with all descendants; confirm=true required when it has descendants; the root node cannot be deleted), a saved version, or a metadata field.',
    inputSchema: {
      type: 'object',
      properties: {
        object_type: { type: 'string', enum: ['field-node', 'metadata-field', 'version'] },
        id: { type: 'string', maxLength: 120 },
        confirm: { type: 'boolean' },
      },
      required: ['object_type', 'id'],
      additionalProperties: false,
    },
    execute: ({ object_type, id, confirm }) => {
      const s = useStore.getState();
      if (object_type === 'field-node') {
        const tree = displayedTree(useStore.getState());
        const node = tree && findNode(tree, id);
        if (!node) return err(`No field node with id "${id}"`);
        if (tree.id === id) return err('The root node offers no delete — delete its children instead');
        const descendants = (node.children || []).length ? countAll(node) : 0;
        if (descendants > 0 && confirm !== true) {
          return err(`"${node.key}" has ${descendants} descendant${descendants === 1 ? '' : 's'} — call again with confirm=true to delete them all`);
        }
        s.doDeleteNode(id);
        return ok(`Deleted field "${node.key}"${descendants ? ` and its ${descendants} descendants` : ''} from the tree and every derived pane`);
      }
      if (object_type === 'version') {
        const sc = activeSchema(useStore.getState());
        if (!sc || !sc.versions.some((v) => v.id === id)) return err(`No saved version with id "${id}"`);
        useStore.setState((st) => ({
          schemas: st.schemas.map((x) => (x.id === sc.id ? { ...x, versions: x.versions.filter((v) => v.id !== id) } : x)),
        }));
        return ok('Deleted the saved version');
      }
      if (object_type === 'metadata-field') {
        if (!useStore.getState().metaFields.some((x) => x.id === id)) return err(`No metadata field with id "${id}"`);
        s.removeMetadataField(id);
        return ok('Removed the metadata field');
      }
      return err('Unknown object_type');
    },
  },
  {
    name: 'editor_update_property',
    description: 'Update one property of a field-node, the active schema, or a metadata field using the FieldDefinition / MetadataField contracts. Versions are never edited in place.',
    inputSchema: {
      type: 'object',
      properties: {
        object_type: { type: 'string', enum: OBJECT_TYPES },
        id: { type: 'string', maxLength: 120 },
        property: { type: 'string', enum: EDITOR_PROPERTIES },
        value: {},
      },
      required: ['object_type', 'id', 'property'],
      additionalProperties: false,
    },
    execute: ({ object_type, id, property, value }) => {
      const s = useStore.getState();
      if (object_type === 'schema') {
        if (property !== 'schema-name') return err('The only editable schema property is schema-name');
        const r = s.renameSchema(id, value);
        if (!r.ok) return err(r.error);
        return ok(`Renamed the schema to "${String(value).trim()}" — the compiled title and library entry updated`);
      }
      if (object_type === 'version') {
        if (property === 'version-name') return err('Versions are never edited in place — save a new version instead');
        return err('Version snapshots are immutable');
      }
      if (object_type === 'metadata-field') {
        const mf = useStore.getState().metaFields.find((x) => x.id === id);
        if (!mf) return err(`No metadata field with id "${id}"`);
        const patch = {};
        if (property === 'metadata-field-label') {
          const label = String(value || '').trim();
          if (!label || label.length > 40) return err('MetadataField.label is required — 1 to 40 characters');
          patch.label = label;
        } else if (property === 'metadata-field-type') {
          if (!['text', 'number', 'date', 'dropdown'].includes(value)) return err('MetadataField.type must be exactly one of text, number, date, dropdown');
          patch.type = value;
        } else if (property === 'metadata-field-options') {
          const opts = Array.isArray(value) ? value.map(String) : splitEnumText(String(value || ''));
          if (!opts.filter((o) => o !== '').length) return err('MetadataField.options requires at least one non-empty option');
          patch.options = opts.filter((o) => o !== '');
        } else return err('Metadata fields accept metadata-field-label, metadata-field-type, and metadata-field-options');
        useStore.setState((st) => ({ metaFields: st.metaFields.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        return ok(`Updated metadata field ${property.replace('metadata-field-', '')}`);
      }
      if (object_type === 'field-node') {
        if (property === 'import-field-accept') {
          const draft = useStore.getState().importDraft;
          if (!draft || !draft.fields.some((f) => f.id === id)) return err('No inferred import draft field with that id — run Infer draft first');
          useStore.setState((st) => ({
            importDraft: { fields: st.importDraft.fields.map((f) => (f.id === id ? { ...f, accepted: !!value } : f)) },
          }));
          return ok(`Set the inferred field to ${value ? 'accept' : 'reject'} in the import review`);
        }
        const st = useStore.getState();
        const tree = displayedTree(st);
        const node = tree && findNode(tree, id);
        if (!node) return err(`No field node with id "${id}" in the active schema`);
        if (property === 'key-name') {
          const r = st.renameNode(id, value);
          if (!r.ok) return err(r.error);
          return ok(`Renamed the field to "${String(value).trim()}" everywhere it appears`);
        }
        if (property === 'type') {
          if (!FIELD_TYPES.includes(value)) return err('FieldDefinition.type must be exactly one of string, number, boolean, object, array');
          st.applyPanelEdit(id, (n) => retypeNode(n, value), 'Retype field');
          return ok(`Changed the type to ${value} — constraints that do not apply to ${value} were cleared`);
        }
        if (property === 'required') {
          st.setNodeRequired(id, !!value);
          return ok(`Marked "${node.key}" as ${value ? 'required' : 'optional'}`);
        }
        if (property === 'description') {
          st.applyPanelEdit(id, (n) => ({ ...n, description: String(value || '') }), 'Update field');
          return ok(`Updated the description of "${node.key}"`);
        }
        if (property === 'enum-values') {
          const list = Array.isArray(value) ? value.map(String) : splitEnumText(String(value || ''));
          if (node.type !== 'string') return err('enumValues only applies when type is string');
          if (list.some((e) => e === '')) return err('FieldDefinition.enumValues rejects empty entries');
          if (!list.length) return err('When present, enumValues must contain at least one entry');
          st.applyPanelEdit(id, (n) => ({ ...n, enumValues: list }), 'Update field');
          return ok(`Set enumValues [${list.join(', ')}] on "${node.key}"`);
        }
        if (property === 'minimum' || property === 'maximum') {
          if (node.type !== 'number') return err(`${property} only applies when type is number`);
          const num = Number(value);
          if (!Number.isFinite(num)) return err(`${property} must be a number`);
          const other = property === 'minimum' ? node.maximum : node.minimum;
          if (property === 'minimum' && node.maximum !== undefined && num > node.maximum) {
            return err(`FieldDefinition cross-field rule: minimum must not exceed maximum (minimum ${num} > maximum ${node.maximum})`);
          }
          if (property === 'maximum' && node.minimum !== undefined && node.minimum > num) {
            return err(`FieldDefinition cross-field rule: minimum must not exceed maximum (minimum ${node.minimum} > maximum ${num})`);
          }
          st.applyPanelEdit(id, (n) => ({ ...n, [property]: num }), 'Update field');
          return ok(`Set ${property} ${num} on "${node.key}"`);
        }
        if (property === 'pattern') {
          if (node.type !== 'string') return err('pattern only applies when type is string');
          try {
            new RegExp(String(value));
          } catch {
            return err('FieldDefinition.pattern must be a valid regular expression');
          }
          st.applyPanelEdit(id, (n) => ({ ...n, pattern: String(value) }), 'Update field');
          return ok(`Set pattern ${value} on "${node.key}"`);
        }
        if (property === 'constraint-template') {
          const t = CONSTRAINT_TEMPLATES.find((x) => x.name === value);
          if (!t) return err(`Unknown constraint template — the library offers: ${CONSTRAINT_TEMPLATES.map((x) => x.name).join(', ')}`);
          st.applyPanelEdit(
            id,
            (n) => {
              const base = retypeNode(n, t.type);
              return { ...base, ...t.apply };
            },
            'Apply constraint template',
          );
          return ok(`Applied the "${t.name}" template to "${node.key}" — its constraint inputs now show the template values`);
        }
        if (property === 'nest-level') {
          if (value === 'nest') {
            const r = st.nestNode(id);
            return r.ok ? ok(`Nested "${node.key}" into the preceding object sibling`) : err(r.error);
          }
          if (value === 'unnest') {
            const r = st.unnestNode(id);
            return r.ok ? ok(`Moved "${node.key}" out to its parent's level`) : err(r.error);
          }
          return err('nest-level accepts "nest" or "unnest"');
        }
        if (property === 'sibling-order') {
          const parent = findParent(tree, id);
          if (!parent) return err('The root node cannot be reordered');
          const idx = (parent.children || []).findIndex((c) => c.id === id);
          let target = Number(value);
          if (!Number.isInteger(target)) return err('sibling-order must be an integer index');
          target = Math.max(0, Math.min(parent.children.length - 1, target));
          st.reorderNode(parent.id, idx, target);
          return ok(`Moved "${node.key}" to sibling position ${target}`);
        }
        return err(`Unsupported property for field-node: ${property}`);
      }
      return err('Unknown object_type');
    },
  },
  {
    name: 'editor_set_content',
    description: 'Set the content of a paste-driven surface: playground-payload, import-example-json, or schema-package-json.',
    inputSchema: {
      type: 'object',
      properties: {
        property: { type: 'string', enum: ['playground-payload', 'import-example-json', 'schema-package-json'] },
        value: { type: 'string', maxLength: 200000 },
      },
      required: ['property', 'value'],
      additionalProperties: false,
    },
    execute: ({ property, value }) => {
      const s = useStore.getState();
      if (property === 'playground-payload') {
        s.setPayloadText(value);
        s.switchMode('playground');
        return ok('Playground payload set — press Run validation (or session_start demo=validation-run) to validate it');
      }
      if (property === 'import-example-json') {
        s.setImportExampleText(value);
        s.switchMode('import');
        useStore.getState().setImportTab('example');
        return ok('Import-from-example payload set — run Infer draft to produce the review draft');
      }
      s.setPackageText(value);
      s.switchMode('import');
      useStore.getState().setImportTab('package');
      return ok('SchemaPackage JSON set — run Import package to validate and apply it');
    },
  },
  {
    name: 'editor_switch_mode',
    description: 'Switch the visible editor mode: schema-text, example, format-prompt, diff, playground, or import.',
    inputSchema: {
      type: 'object',
      properties: { mode: { type: 'string', enum: MODES } },
      required: ['mode'],
      additionalProperties: false,
    },
    execute: ({ mode }) => {
      useStore.getState().switchMode(mode);
      return ok(`Switched to the ${mode} view`);
    },
  },
  {
    name: 'editor_preview',
    description: 'Open the Export preview modal, optionally focused on one export format.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: FORMATS } },
      additionalProperties: false,
    },
    execute: ({ format }) => {
      const s = useStore.getState();
      if (format === 'validation-report-text' && (!s.run || s.run.status !== 'done')) {
        return err('The validation report is only available after a completed run — start one with session_start demo=validation-run');
      }
      const tabMap = {
        'compiled-schema-json': 'schema',
        'schema-package-json': 'package',
        'validation-report-text': 'report',
        'format-instruction-text': 'package',
      };
      s.openExport(format ? tabMap[format] : 'schema');
      return ok('Opened the Export modal with the live-compiled previews');
    },
  },

  /* --------------------------- command-session-v1 ------------------------ */
  {
    name: 'session_start',
    description: 'Start a session demo: validation-run (validates the playground payload against the live schema), regenerate-example, or apply-import-draft.',
    inputSchema: {
      type: 'object',
      properties: { demo: { type: 'string', enum: DEMOS } },
      required: ['demo'],
      additionalProperties: false,
    },
    execute: ({ demo }) => {
      const s = useStore.getState();
      if (demo === 'validation-run') {
        s.switchMode('playground');
        const r = s.startRun();
        if (!r.ok) return err(r.error);
        return ok(r.message + ' — watch the step list, rollup, and event timeline advance live');
      }
      if (demo === 'regenerate-example') {
        s.switchMode('example');
        const r = s.regenerateExample();
        return r.ok ? ok('Regenerated the example payload — randomized values that still satisfy the schema') : err(r.error);
      }
      const r = s.applyImportDraft();
      return r.ok ? ok(`Applied the reviewed draft — ${r.count} field${r.count === 1 ? '' : 's'} replaced the working tree`) : err(r.error);
    },
  },
  {
    name: 'session_pause',
    description: 'Pause the running validation at its current step.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => {
      const r = useStore.getState().pauseRun();
      return r.ok ? ok('Paused — the run is frozen at the current step; completed steps keep their outcomes') : err(r.error);
    },
  },
  {
    name: 'session_resume',
    description: 'Resume a paused validation run from exactly the paused step.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => {
      const r = useStore.getState().resumeRun();
      return r.ok ? ok('Resumed from the paused step') : err(r.error);
    },
  },
  {
    name: 'session_advance',
    description: 'Advance the validation session (resumes it when paused).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => {
      const r = useStore.getState().advanceRun();
      return r.ok ? ok(r.message || 'Advanced') : err(r.error);
    },
  },

  /* --------------------------- entity-collection-v1 ---------------------- */
  {
    name: 'entity_create',
    description: 'Create a new schema entity in the library (blank root object) and make it active.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', maxLength: 80 } },
      additionalProperties: false,
    },
    execute: ({ name }) => {
      const r = useStore.getState().newSchema(name);
      return ok(`Created schema "${r.name}" with a blank root object — it is now active in the tree`);
    },
  },
  {
    name: 'entity_select',
    description: 'Select a schema entity from the library; loads it into the tree and every derived pane.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', maxLength: 120 } },
      required: ['id'],
      additionalProperties: false,
    },
    execute: ({ id }) => {
      const r = useStore.getState().selectSchema(id);
      if (!r.ok) return err(r.error);
      const sc = activeSchema(useStore.getState());
      return ok(`Selected "${sc.name}" — the sidebar marks it active and every pane shows it`);
    },
  },
  {
    name: 'entity_update',
    description: 'Update the name of a schema entity.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', maxLength: 120 }, name: { type: 'string', maxLength: 80 } },
      required: ['id', 'name'],
      additionalProperties: false,
    },
    execute: ({ id, name }) => {
      const s = useStore.getState();
      if (!s.schemas.some((x) => x.id === id)) return err(`No schema with id "${id}"`);
      const r = s.renameSchema(id, name);
      return r.ok ? ok(`Renamed the schema to "${String(name).trim()}"`) : err(r.error);
    },
  },
  {
    name: 'entity_delete',
    description: 'Delete a schema entity from the library. Requires confirm=true.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', maxLength: 120 }, confirm: { type: 'boolean' } },
      required: ['id'],
      additionalProperties: false,
    },
    execute: ({ id, confirm }) => {
      const s = useStore.getState();
      const sc = s.schemas.find((x) => x.id === id);
      if (!sc) return err(`No schema with id "${id}"`);
      if (confirm !== true) return err('Deleting a schema requires confirm=true');
      s.doDeleteSchema(id);
      const after = useStore.getState();
      return ok(
        after.schemas.length
          ? `Deleted "${sc.name}" — ${after.activeId === sc.id ? `"${activeSchema(after)?.name}" is now active` : 'the active schema is unchanged'}`
          : `Deleted "${sc.name}" — the library is empty and the app shows its blank-schema state`,
      );
    },
  },

  /* ---------------------------- artifact-transfer-v1 --------------------- */
  {
    name: 'artifact_export',
    description: 'Open the Export modal on a specific live-compiled format: compiled-schema-json, schema-package-json, validation-report-text, or format-instruction-text.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: FORMATS } },
      additionalProperties: false,
    },
    execute: ({ format }) => {
      const s = useStore.getState();
      if (format === 'validation-report-text' && (!s.run || s.run.status !== 'done')) {
        return err('The validation report needs a completed run — start one with session_start demo=validation-run');
      }
      if (format === 'format-instruction-text') {
        s.switchMode('format-prompt');
        return ok('The Format Prompt pane shows the live format instruction with Copy and Insert controls');
      }
      const tabMap = { 'compiled-schema-json': 'schema', 'schema-package-json': 'package', 'validation-report-text': 'report' };
      s.openExport(format ? tabMap[format] || 'schema' : 'schema');
      return ok(`Opened the Export modal on the ${format || 'compiled schema'} preview — Copy and Download are available per format`);
    },
  },
  {
    name: 'artifact_import',
    description: 'Submit the current pasted content through an import flow: example-json runs Infer draft for review; schema-package validates and applies a SchemaPackage.',
    inputSchema: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['example-json', 'schema-package'] } },
      required: ['mode'],
      additionalProperties: false,
    },
    execute: ({ mode }) => {
      const s = useStore.getState();
      if (mode === 'example-json') {
        s.switchMode('import');
        s.setImportTab('example');
        const r = s.inferDraft();
        if (!r.ok) return err(r.error);
        return ok(`Inferred a draft with ${r.count} fields for review — toggle import-field-accept per field, then session_start demo=apply-import-draft`);
      }
      s.switchMode('import');
      s.setImportTab('package');
      const r = s.importPackage();
      if (!r.ok) return err(r.error);
      return ok(`Imported SchemaPackage "${r.name}" — the tree, compiled text, example payload, and format instruction all match it`);
    },
  },
  {
    name: 'artifact_copy',
    description: 'Copy the exact text of an export format to the clipboard (the same action as the Copy button; clipboard contents stay Playwright responsibilities).',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: FORMATS } },
      required: ['format'],
      additionalProperties: false,
    },
    execute: ({ format }) => {
      const s = useStore.getState();
      let text = '';
      let label = '';
      if (format === 'compiled-schema-json') {
        text = compiledText(s);
        label = 'compiled schema';
      } else if (format === 'schema-package-json') {
        text = JSON.stringify(packageObject(s), null, 2);
        label = 'SchemaPackage JSON';
      } else if (format === 'format-instruction-text') {
        text = formatText(s);
        label = 'format instruction';
      } else {
        const rep = reportObject(s);
        if (!rep) return err('The validation report needs a completed run — start one with session_start demo=validation-run');
        text = JSON.stringify(rep, null, 2);
        label = 'validation report';
      }
      s.copyText(text, label);
      return ok(`Copied the ${label} to the clipboard with a visible confirmation toast`);
    },
  },
];

function countAll(node) {
  let c = 0;
  (node.children || []).forEach((k) => {
    c += 1 + countAll(k);
  });
  return c;
}

export function registerWebMCP() {
  const surface = {
    webmcp_session_info: () => ({ ...SESSION_INFO, tools: tools.length }),
    webmcp_list_tools: () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    webmcp_invoke_tool: (name, args = {}) => {
      const tool = tools.find((t) => t.name === name);
      if (!tool) return { ok: false, error: `Unknown tool "${name}" — call webmcp_list_tools` };
      try {
        return tool.execute(args || {});
      } catch (e) {
        return { ok: false, error: `${tool.name} failed: ${e.message}` };
      }
    },
  };
  window.webmcp_session_info = surface.webmcp_session_info;
  window.webmcp_list_tools = surface.webmcp_list_tools;
  window.webmcp_invoke_tool = surface.webmcp_invoke_tool;
  void uid;
  void KEY_PATTERN;
}
