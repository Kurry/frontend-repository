import { useSchemaStore } from './store';

const FIELD_PROPERTIES = ['key-name', 'type', 'required', 'description', 'enum-values', 'minimum', 'maximum', 'pattern', 'constraint-template', 'schema-name', 'version-name', 'playground-payload', 'import-example-json', 'import-field-accept', 'schema-package-json'];
const MODES = ['schema-text', 'example', 'format-prompt', 'diff', 'playground', 'import'];
const FORMATS = ['compiled-schema-json', 'schema-package-json', 'validation-report-text', 'format-instruction-text'];

const specs = [
  {
    name: 'editor_select', description: 'Select a schema editor object.',
    inputSchema: { type: 'object', properties: { objectType: { enum: ['schema', 'field-node', 'metadata-field', 'version'] }, id: { type: 'string', maxLength: 120 } }, required: ['objectType', 'id'], additionalProperties: false },
    execute: ({ objectType, id }) => {
      const s = useSchemaStore.getState();
      if (objectType === 'schema') s.selectSchema(id); else if (objectType === 'field-node') s.selectNode(id); else if (objectType === 'version') s.setDiff('b', id);
      return visible('Selection updated');
    },
  },
  {
    name: 'editor_add', description: 'Add a schema editor object using the visible editor command.',
    inputSchema: { type: 'object', properties: { objectType: { enum: ['field-node', 'metadata-field', 'version'] }, parentId: { type: 'string' }, name: { type: 'string', minLength: 1, maxLength: 80 }, label: { type: 'string', minLength: 1, maxLength: 40 }, metadataType: { enum: ['text', 'number', 'date', 'dropdown'] }, options: { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 30 } }, required: ['objectType'], additionalProperties: false },
    execute: (args) => {
      const s = useSchemaStore.getState();
      if (args.objectType === 'field-node') s.addField(args.parentId || null);
      if (args.objectType === 'version') s.saveVersion({ name: args.name });
      if (args.objectType === 'metadata-field') s.addMetadataField({ label: args.label, type: args.metadataType, ...(args.metadataType === 'dropdown' ? { options: args.options } : {}) });
      return visible(`${args.objectType} added`);
    },
  },
  {
    name: 'editor_delete', description: 'Delete a field node after explicit confirmation.',
    inputSchema: { type: 'object', properties: { objectType: { enum: ['field-node'] }, id: { type: 'string' }, confirm: { const: true } }, required: ['objectType', 'id', 'confirm'], additionalProperties: false },
    execute: ({ id, confirm }) => { if (!confirm) throw new Error('Delete requires confirm=true'); useSchemaStore.getState().deleteField(id); return visible('Field deleted'); },
  },
  {
    name: 'editor_update_property', description: 'Update one bounded schema or field property.',
    inputSchema: { type: 'object', properties: { objectType: { enum: ['schema', 'field-node'] }, id: { type: 'string' }, property: { enum: FIELD_PROPERTIES }, value: {} }, required: ['objectType', 'property', 'value'], additionalProperties: false },
    execute: ({ objectType, id, property, value }) => {
      const s = useSchemaStore.getState();
      if (objectType === 'schema' && property === 'schema-name') s.renameSchema(String(value).slice(0, 80));
      else {
        const map = { 'key-name': 'key', type: 'type', required: 'required', description: 'description', 'enum-values': 'enumValues', minimum: 'minimum', maximum: 'maximum', pattern: 'pattern' };
        if (property === 'constraint-template') applyTemplate(id, value);
        else if (map[property]) {
          const accepted = s.updateField(id, { [map[property]]: value }, `Update ${property}`);
          if (!accepted) throw new Error(`${property} was rejected by the FieldDefinition contract`);
        } else throw new Error(`${property} is not valid for ${objectType}`);
      }
      return visible(`${property} updated`);
    },
  },
  {
    name: 'editor_set_content', description: 'Set content in a bounded text editor.',
    inputSchema: { type: 'object', properties: { property: { enum: ['playground-payload', 'import-example-json', 'schema-package-json'] }, content: { type: 'string', maxLength: 200000 } }, required: ['property', 'content'], additionalProperties: false },
    execute: ({ property, content }) => {
      const s = useSchemaStore.getState();
      if (property === 'playground-payload') s.setPlaygroundPayload(content);
      if (property === 'import-example-json') s.inferExample(content);
      if (property === 'schema-package-json') s.importPackage(content);
      return visible(`${property} content applied`);
    },
  },
  {
    name: 'editor_switch_mode', description: 'Switch the visible workbench mode.',
    inputSchema: { type: 'object', properties: { mode: { enum: MODES } }, required: ['mode'], additionalProperties: false },
    execute: ({ mode }) => { switchMode(mode); return visible(`${mode} mode visible`); },
  },
  {
    name: 'editor_preview', description: 'Open a live artifact preview without returning its contents.',
    inputSchema: { type: 'object', properties: { mode: { enum: MODES } }, required: ['mode'], additionalProperties: false },
    execute: ({ mode }) => { switchMode(mode); return visible(`${mode} preview opened`); },
  },
  {
    name: 'session_start', description: 'Start the visible validation run.',
    inputSchema: { type: 'object', properties: { demo: { const: 'validation-run' } }, required: ['demo'], additionalProperties: false },
    execute: () => { useSchemaStore.getState().startValidation(); return visible('Validation run started'); },
  },
  {
    name: 'session_pause', description: 'Pause the active validation run.', inputSchema: noArgs(),
    execute: () => { useSchemaStore.getState().pauseValidation(); return visible('Validation run paused'); },
  },
  {
    name: 'session_resume', description: 'Resume the active validation run.', inputSchema: noArgs(),
    execute: () => { useSchemaStore.getState().resumeValidation(); return visible('Validation run resumed'); },
  },
  {
    name: 'session_advance', description: 'Trigger a bounded session demo command.',
    inputSchema: { type: 'object', properties: { demo: { enum: ['regenerate-example', 'apply-import-draft'] } }, required: ['demo'], additionalProperties: false },
    execute: ({ demo }) => { const s = useSchemaStore.getState(); if (demo === 'regenerate-example') s.regenerateExample(); else s.applyImportDraft(); return visible(`${demo} triggered`); },
  },
  {
    name: 'entity_create', description: 'Create a blank schema library entity.',
    inputSchema: { type: 'object', properties: { entity: { const: 'schema' }, name: { type: 'string', minLength: 1, maxLength: 80 } }, required: ['entity', 'name'], additionalProperties: false },
    execute: ({ name }) => { useSchemaStore.getState().createSchema(name); return visible('Schema created and selected'); },
  },
  {
    name: 'entity_select', description: 'Select a schema library entity.',
    inputSchema: { type: 'object', properties: { entity: { const: 'schema' }, id: { type: 'string' } }, required: ['entity', 'id'], additionalProperties: false },
    execute: ({ id }) => { useSchemaStore.getState().selectSchema(id); return visible('Schema selected'); },
  },
  {
    name: 'entity_update', description: 'Update the bounded name field of a schema entity.',
    inputSchema: { type: 'object', properties: { entity: { const: 'schema' }, id: { type: 'string' }, field: { const: 'name' }, value: { type: 'string', minLength: 1, maxLength: 80 } }, required: ['entity', 'id', 'field', 'value'], additionalProperties: false },
    execute: ({ id, value }) => { const s = useSchemaStore.getState(); s.selectSchema(id); s.renameSchema(value); return visible('Schema name updated'); },
  },
  {
    name: 'entity_delete', description: 'Delete a schema entity after explicit confirmation.',
    inputSchema: { type: 'object', properties: { entity: { const: 'schema' }, id: { type: 'string' }, confirm: { const: true } }, required: ['entity', 'id', 'confirm'], additionalProperties: false },
    execute: ({ id, confirm }) => { if (!confirm) throw new Error('Delete requires confirm=true'); useSchemaStore.getState().deleteSchema(id); return visible('Schema deleted'); },
  },
  {
    name: 'artifact_export', description: 'Open the visible export preview for a supported format.',
    inputSchema: { type: 'object', properties: { format: { enum: FORMATS } }, required: ['format'], additionalProperties: false },
    execute: ({ format }) => { useSchemaStore.getState().setExportOpen(true); return visible(`${format} export preview opened`); },
  },
  {
    name: 'artifact_import', description: 'Open the visible import workflow without accepting raw artifact content.',
    inputSchema: { type: 'object', properties: { mode: { enum: ['example-json', 'schema-package'] } }, required: ['mode'], additionalProperties: false },
    execute: ({ mode }) => { if (mode === 'schema-package') useSchemaStore.getState().setImportPackageOpen(true); else { useSchemaStore.setState({ workflowPanel: 'import', workflowOpen: true }); } return visible(`${mode} import workflow opened`); },
  },
  {
    name: 'artifact_copy', description: 'Copy the selected live artifact through the same product command.',
    inputSchema: { type: 'object', properties: { format: { enum: FORMATS } }, required: ['format'], additionalProperties: false },
    execute: async ({ format }) => {
      const s = useSchemaStore.getState();
      const value = format === 'compiled-schema-json' ? s.compiledText() : format === 'schema-package-json' ? JSON.stringify(s.schemaPackage(), null, 2) : s.instruction();
      await navigator.clipboard.writeText(value); s.showToast('success', 'Artifact copied');
      return visible('Artifact copied; clipboard contents intentionally omitted');
    },
  },
];

function noArgs() { return { type: 'object', properties: {}, additionalProperties: false }; }
function visible(message) { return { content: [{ type: 'text', text: message }], visiblePostcondition: message }; }

function switchMode(mode) {
  const s = useSchemaStore.getState();
  if (mode === 'schema-text') s.setTab('schema');
  if (mode === 'example') s.setTab('example');
  if (mode === 'format-prompt') s.setTab('format');
  if (['diff', 'playground', 'import'].includes(mode)) useSchemaStore.setState({ workflowPanel: mode === 'diff' ? 'versions' : mode, workflowOpen: true });
}

function applyTemplate(id, name) {
  const templates = {
    'Email pattern': { type: 'string', pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', enumValues: undefined },
    'Percentage 0 to 100': { type: 'number', minimum: 0, maximum: 100 },
    'ISO date pattern': { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', enumValues: undefined },
    'Non-empty string': { type: 'string', pattern: '^.+$', enumValues: undefined },
    'Status enum': { type: 'string', enumValues: ['pending', 'running', 'complete'], pattern: undefined },
  };
  if (!templates[name]) throw new Error('constraint-template must be a seeded template name');
  useSchemaStore.getState().updateField(id, templates[name], `Apply ${name}`);
}

export function registerWebMCP() {
  const registry = new Map(specs.map((spec) => [spec.name, spec]));
  window.webmcp_session_info = () => ({ contractVersion: 'zto-webmcp-v1', modules: ['structured-editor-v1', 'command-session-v1', 'entity-collection-v1', 'artifact-transfer-v1'] });
  window.webmcp_list_tools = () => specs.map(({ execute, ...spec }) => spec);
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const spec = registry.get(name); if (!spec) throw new Error(`Unknown WebMCP tool: ${name}`);
    return spec.execute(args);
  };
  const modelContext = navigator.modelContext;
  if (modelContext?.registerTool) {
    specs.forEach((spec) => {
      try {
        modelContext.registerTool({ name: spec.name, description: spec.description, inputSchema: spec.inputSchema, execute: spec.execute });
      } catch {
        try { modelContext.registerTool(spec.name, { description: spec.description, inputSchema: spec.inputSchema }, spec.execute); } catch { /* host shim uses window bridge */ }
      }
    });
  }
}
