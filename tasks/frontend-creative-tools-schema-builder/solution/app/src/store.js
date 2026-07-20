import { create } from 'zustand';
import Ajv from 'ajv';
import { seedSchemas } from './seeds';
import {
  compileSchema, diffFields, fieldToJsonSchema, findField, findParent, flattenFields,
  formatInstruction, generateExample, inferFields, mapField, packageFor, schemaPackageSchema,
  stripIds, validateSiblingKeys, withIds,
} from './domain';

const clone = (value) => structuredClone(value);
let nextId = 1000;
export const makeId = () => `node-${++nextId}`;
const schemaId = () => `schema-${Date.now()}-${++nextId}`;
const versionId = () => `version-${Date.now()}-${++nextId}`;
const initialSchemas = clone(seedSchemas);
const initialTree = clone(initialSchemas[0].fields);
const ajv = new Ajv({ allErrors: true, strict: false });
let runToken = 0;

function emptyValidation() {
  return { payloadText: '', payload: null, parseError: '', status: 'idle', paused: false, steps: [], timeline: [], annotations: {}, runId: 0 };
}

function historyBase(tree) {
  return { history: [{ label: 'Session opened', tree: clone(tree) }], historyIndex: 0 };
}

function findSchema(state) {
  return state.schemas.find((item) => item.id === state.activeSchemaId) || null;
}

function replaceActiveFields(state, fields) {
  return state.schemas.map((schema) => schema.id === state.activeSchemaId ? { ...schema, fields, importedExample: undefined, importedInstruction: undefined } : schema);
}

function recordMutation(state, label, mutator) {
  const active = findSchema(state);
  if (!active) return {};
  const nextTree = mutator(clone(active.fields));
  if (!nextTree) return {};
  const nextHistory = state.history.slice(0, state.historyIndex + 1);
  nextHistory.push({ label, tree: clone(nextTree) });
  return {
    schemas: replaceActiveFields(state, nextTree),
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
    validation: { ...state.validation, status: 'idle', steps: [], annotations: {}, timeline: [] },
  };
}

function removeNode(fields, id) {
  return fields.filter((field) => field.id !== id).map((field) => ({ ...field, children: field.children ? removeNode(field.children, id) : undefined }));
}

function removeNodes(fields, ids) {
  return fields.filter((field) => !ids.includes(field.id)).map((field) => ({ ...field, children: field.children ? removeNodes(field.children, ids) : undefined }));
}

function annotateAll(fields, required) {
  return fields.map((field) => ({ ...field, required, children: field.children ? annotateAll(field.children, required) : undefined }));
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function event(step, status, detail = '') {
  return { id: `${Date.now()}-${Math.random()}`, field: step.path, status, detail, time: nowTime() };
}

function errorMessage(field, error, missing) {
  if (missing) return `${field.key} is required`;
  if (!error) return '';
  const path = `${field.key}${error.instancePath?.replaceAll('/', '.') || ''}`;
  if (error.keyword === 'maximum') return `${path} must be at most ${error.params.limit} (maximum)`;
  if (error.keyword === 'minimum') return `${path} must be at least ${error.params.limit} (minimum)`;
  if (error.keyword === 'pattern') return `${path} must match pattern ${error.params.pattern}`;
  if (error.keyword === 'enum') return `${path} must be one of ${error.params.allowedValues.join(', ')} (enum)`;
  if (error.keyword === 'required') return `${path}.${error.params.missingProperty} is required`;
  if (error.keyword === 'type') return `${path} must be type ${error.params.type}`;
  return `${path} failed ${error.keyword}`;
}

function checkField(field, payload) {
  const missing = payload[field.key] === undefined;
  if (missing && field.required) return { pass: false, message: errorMessage(field, null, true) };
  if (missing) return { pass: true, message: '' };
  const validate = ajv.compile(fieldToJsonSchema(field));
  const pass = validate(payload[field.key]);
  return { pass, message: pass ? '' : errorMessage(field, validate.errors?.[0]) };
}

const sleepActive = async (ms, token) => {
  let elapsed = 0;
  while (elapsed < ms && token === runToken) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (!useSchemaStore.getState().validation.paused) elapsed += 100;
  }
};

async function executeValidation(token, startIndex = 0) {
  for (let index = startIndex; index < useSchemaStore.getState().validation.steps.length; index++) {
    if (token !== runToken) return;
    while (useSchemaStore.getState().validation.paused && token === runToken) await new Promise((resolve) => setTimeout(resolve, 100));
    const current = useSchemaStore.getState();
    const step = current.validation.steps[index];
    if (!step || step.status === 'complete') continue;
    useSchemaStore.setState((state) => ({ validation: {
      ...state.validation,
      status: 'running',
      steps: state.validation.steps.map((item, i) => i === index ? { ...item, status: 'running', attempts: item.attempts + 1 } : item),
      timeline: [...state.validation.timeline, event(step, 'running', `Attempt ${step.attempts + 1} of 3`)],
    }}));
    await sleepActive(260 + Math.random() * 260, token);
    if (token !== runToken) return;

    const refreshed = useSchemaStore.getState().validation.steps[index];
    if (index === 1 && refreshed.attempts === 1) {
      for (let countdown = 2; countdown >= 1; countdown--) {
        useSchemaStore.setState((state) => ({ validation: {
          ...state.validation,
          steps: state.validation.steps.map((item, i) => i === index ? { ...item, status: 'retrying', countdown } : item),
          timeline: countdown === 2 ? [...state.validation.timeline, event(itemAt(state, index), 'retrying', 'Waiting before retry 2 of 3')] : state.validation.timeline,
        }}));
        await sleepActive(500, token);
      }
      index -= 1;
      continue;
    }

    const state = useSchemaStore.getState();
    const active = findSchema(state);
    const field = active?.fields.find((item) => item.id === step.fieldId);
    if (!field) continue;
    const outcome = checkField(field, state.validation.payload);
    const status = outcome.pass ? 'complete' : 'failed';
    useSchemaStore.setState((latest) => ({ validation: {
      ...latest.validation,
      steps: latest.validation.steps.map((item, i) => i === index ? { ...item, status, message: outcome.message, countdown: 0 } : item),
      annotations: { ...latest.validation.annotations, [field.id]: { status: outcome.pass ? 'pass' : 'fail', message: outcome.message } },
      timeline: [...latest.validation.timeline, event(step, status, outcome.message || 'All checks passed')],
    }}));
  }
  if (token !== runToken) return;
  useSchemaStore.setState((state) => ({ validation: { ...state.validation, status: 'complete', paused: false } }));
}

const itemAt = (state, index) => state.validation.steps[index] || { path: 'field' };

export const useSchemaStore = create((set, get) => ({
  schemas: initialSchemas,
  activeSchemaId: initialSchemas[0].id,
  selectedNodeId: null,
  selectedIds: [],
  collapsedIds: [],
  activeTab: 'schema',
  sidebarOpen: false,
  workflowPanel: 'versions',
  workflowOpen: true,
  exportOpen: false,
  importPackageOpen: false,
  promptDrawerOpen: false,
  promptDraft: '',
  toast: null,
  exampleNonce: 1,
  metadataFields: [
    { id: 'metadata-owner', label: 'Owner', type: 'text' },
    { id: 'metadata-stage', label: 'Stage', type: 'dropdown', options: ['Draft', 'Review', 'Production'] },
  ],
  versions: [
    { id: 'version-seed-a', schemaId: initialSchemas[0].id, name: 'Initial draft', timestamp: new Date(Date.now() - 86400000).toISOString(), fields: clone(initialSchemas[0].fields) },
    { id: 'version-seed-b', schemaId: initialSchemas[0].id, name: 'Published baseline', timestamp: new Date().toISOString(), fields: clone(initialSchemas[0].fields) },
  ],
  diffA: 'version-seed-a',
  diffB: 'version-seed-b',
  importDraft: null,
  importError: '',
  packageImportError: '',
  validation: emptyValidation(),
  ...historyBase(initialTree),

  activeSchema: () => findSchema(get()),
  compiledSchema: () => compileSchema(findSchema(get())?.fields || []),
  compiledText: () => JSON.stringify(compileSchema(findSchema(get())?.fields || []), null, 2),
  examplePayload: () => {
    const active = findSchema(get());
    return active?.importedExample ?? generateExample(active?.fields || [], get().exampleNonce);
  },
  instruction: () => {
    const active = findSchema(get());
    return active?.importedInstruction ?? formatInstruction(active?.fields || []);
  },
  schemaPackage: () => {
    const active = findSchema(get()) || { name: 'Untitled schema', fields: [], metadata: {} };
    const pkg = packageFor(active, get().metadataFields, get().exampleNonce);
    pkg.examplePayload = active.importedExample ?? pkg.examplePayload;
    pkg.formatInstruction = active.importedInstruction ?? pkg.formatInstruction;
    return pkg;
  },

  showToast: (kind, title, subtitle = '') => {
    set({ toast: { kind, title, subtitle, id: Date.now() } });
    setTimeout(() => { if (get().toast?.title === title) set({ toast: null }); }, 3200);
  },
  setTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setWorkflow: (workflowPanel) => set((state) => ({ workflowPanel, workflowOpen: state.workflowPanel === workflowPanel ? !state.workflowOpen : true })),
  setExportOpen: (exportOpen) => set({ exportOpen }),
  setImportPackageOpen: (importPackageOpen) => set({ importPackageOpen, packageImportError: '' }),
  setPromptDrawerOpen: (promptDrawerOpen) => set({ promptDrawerOpen }),
  setPromptDraft: (promptDraft) => set({ promptDraft }),
  insertPrompt: () => { set((state) => ({ promptDraft: `${state.promptDraft}${state.promptDraft ? '\n\n' : ''}${state.instruction()}`, promptDrawerOpen: true })); get().showToast('success', 'Format instruction inserted'); },
  regenerateExample: () => { set((state) => ({ exampleNonce: state.exampleNonce + 1, schemas: state.schemas.map((schema) => schema.id === state.activeSchemaId ? { ...schema, importedExample: undefined } : schema) })); get().showToast('success', 'Example regenerated'); },

  selectSchema: (id) => set((state) => {
    const schema = state.schemas.find((item) => item.id === id);
    if (!schema) return {};
    runToken++;
    return { activeSchemaId: id, selectedNodeId: null, selectedIds: [], validation: emptyValidation(), ...historyBase(schema.fields) };
  }),
  createSchema: (name = 'Untitled schema') => set((state) => {
    const created = { id: schemaId(), name, fields: [], metadata: {} };
    get().showToast('success', 'Blank schema created');
    return { schemas: [created, ...state.schemas], activeSchemaId: created.id, selectedNodeId: null, selectedIds: [], validation: emptyValidation(), ...historyBase([]) };
  }),
  duplicateSchema: (id) => set((state) => {
    const source = state.schemas.find((item) => item.id === id);
    if (!source) return {};
    const copy = { ...clone(source), id: schemaId(), name: `${source.name} copy`, fields: withIds(stripIds(source.fields), makeId) };
    get().showToast('success', 'Schema duplicated');
    return { schemas: [copy, ...state.schemas], activeSchemaId: copy.id, ...historyBase(copy.fields) };
  }),
  deleteSchema: (id) => set((state) => {
    const schemas = state.schemas.filter((item) => item.id !== id);
    const wasActive = state.activeSchemaId === id;
    get().showToast('success', 'Schema deleted');
    return { schemas, ...(wasActive ? { activeSchemaId: null, selectedNodeId: null, selectedIds: [], validation: emptyValidation(), ...historyBase([]) } : {}) };
  }),
  renameSchema: (name) => set((state) => ({ schemas: state.schemas.map((schema) => schema.id === state.activeSchemaId ? { ...schema, name } : schema) })),

  selectNode: (id) => set({ selectedNodeId: id }),
  toggleSelected: (id) => set((state) => ({ selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id] })),
  clearSelected: () => set({ selectedIds: [] }),
  toggleCollapsed: (id) => set((state) => ({ collapsedIds: state.collapsedIds.includes(id) ? state.collapsedIds.filter((item) => item !== id) : [...state.collapsedIds, id] })),

  addField: (parentId = null) => set((state) => recordMutation(state, 'Add field', (tree) => {
    const siblings = parentId ? findField(tree, parentId)?.children || [] : tree;
    let counter = siblings.length + 1;
    let key = `field_${counter}`;
    while (siblings.some((field) => field.key === key)) key = `field_${++counter}`;
    const created = { id: makeId(), key, type: 'string', required: false };
    setTimeout(() => set({ selectedNodeId: created.id }), 0);
    if (!parentId) return [...tree, created];
    return mapField(tree, parentId, (field) => ({ ...field, children: [...(field.children || []), created] }));
  })),
  deleteField: (id) => set((state) => ({ ...recordMutation(state, 'Delete field', (tree) => removeNode(tree, id)), selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId, selectedIds: state.selectedIds.filter((item) => item !== id) })),
  updateField: (id, patch, label = 'Update field') => {
    let accepted = false;
    set((state) => recordMutation(state, label, (tree) => {
      const info = findParent(tree, id);
      if (!info) return null;
      const candidate = { ...info.field, ...patch };
      if (patch.type && patch.type !== info.field.type) {
        if (patch.type !== 'string') { delete candidate.enumValues; delete candidate.pattern; }
        if (patch.type !== 'number') { delete candidate.minimum; delete candidate.maximum; }
        if (!['object', 'array'].includes(patch.type)) delete candidate.children;
        else candidate.children = candidate.children || [];
      }
      if (info.siblings.some((field) => field.id !== id && field.key === candidate.key)) return null;
      accepted = true;
      return mapField(tree, id, () => candidate);
    }));
    return accepted;
  },
  reorderField: (activeId, overId) => set((state) => recordMutation(state, 'Reorder field', (tree) => {
    const active = findParent(tree, activeId); const over = findParent(tree, overId);
    if (!active || !over || active.parent?.id !== over.parent?.id) return null;
    const ids = active.siblings.map((f) => f.id);
    const from = ids.indexOf(activeId); const to = ids.indexOf(overId);
    if (from === to) return null;
    const sorted = [...active.siblings]; const [moved] = sorted.splice(from, 1); sorted.splice(to, 0, moved);
    if (!active.parent) return sorted;
    return mapField(tree, active.parent.id, (field) => ({ ...field, children: sorted }));
  })),
  nestField: (id) => set((state) => recordMutation(state, 'Nest field', (tree) => {
    const info = findParent(tree, id); if (!info) return null;
    const index = info.siblings.findIndex((item) => item.id === id); const preceding = info.siblings[index - 1];
    if (!preceding || preceding.type !== 'object') return null;
    const without = removeNode(tree, id);
    return mapField(without, preceding.id, (field) => ({ ...field, children: [...(field.children || []), info.field] }));
  })),
  unnestField: (id) => set((state) => recordMutation(state, 'Un-nest field', (tree) => {
    const info = findParent(tree, id); if (!info?.parent) return null;
    const parentInfo = findParent(tree, info.parent.id); if (!parentInfo) return null;
    const without = removeNode(tree, id);
    const updatedParent = findParent(without, info.parent.id);
    if (!updatedParent) return null;
    const insertAt = updatedParent.siblings.findIndex((item) => item.id === info.parent.id) + 1;
    if (!updatedParent.parent) { const result = [...without]; result.splice(insertAt, 0, info.field); return result; }
    const siblings = [...updatedParent.siblings]; siblings.splice(insertAt, 0, info.field);
    return mapField(without, updatedParent.parent.id, (field) => ({ ...field, children: siblings }));
  })),
  bulkRequired: (required) => set((state) => ({ ...recordMutation(state, required ? 'Set required' : 'Clear required', (tree) => {
    const ids = state.selectedIds;
    const apply = (items) => items.map((field) => ({ ...field, required: ids.includes(field.id) ? required : field.required, children: field.children ? apply(field.children) : undefined }));
    return apply(tree);
  }), selectedIds: [] })),
  bulkDelete: () => set((state) => ({ ...recordMutation(state, `Delete ${state.selectedIds.length} fields`, (tree) => removeNodes(tree, state.selectedIds)), selectedIds: [], selectedNodeId: null })),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return {};
    const index = state.historyIndex - 1; return { historyIndex: index, schemas: replaceActiveFields(state, clone(state.history[index].tree)), selectedNodeId: null };
  }),
  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return {};
    const index = state.historyIndex + 1; return { historyIndex: index, schemas: replaceActiveFields(state, clone(state.history[index].tree)), selectedNodeId: null };
  }),
  scrubHistory: (index) => set((state) => {
    const bounded = Math.max(0, Math.min(index, state.history.length - 1));
    return { historyIndex: bounded, schemas: replaceActiveFields(state, clone(state.history[bounded].tree)), selectedNodeId: null };
  }),

  saveVersion: (payload) => {
    if (get().savingVersion) return;
    set({ savingVersion: true });
    const active = findSchema(get());
    if (active) {
      const version = { id: versionId(), schemaId: active.id, name: payload.name, timestamp: new Date().toISOString(), fields: clone(active.fields) };
      set((state) => ({ versions: [version, ...state.versions], diffA: state.diffA || version.id, diffB: version.id }));
      get().showToast('success', 'Version saved', payload.name);
    }
    setTimeout(() => set({ savingVersion: false }), 250);
  },
  setDiff: (side, id) => set(side === 'a' ? { diffA: id } : { diffB: id }),
  diffResults: () => {
    const a = get().versions.find((v) => v.id === get().diffA); const b = get().versions.find((v) => v.id === get().diffB);
    return a && b ? diffFields(a.fields, b.fields) : [];
  },

  addMetadataField: (payload) => set((state) => {
    const field = { ...payload, id: `metadata-${++nextId}` };
    get().showToast('success', 'Metadata field added');
    return { metadataFields: [...state.metadataFields, field] };
  }),
  setMetadataValue: (label, value) => set((state) => ({ schemas: state.schemas.map((schema) => schema.id === state.activeSchemaId ? { ...schema, metadata: { ...schema.metadata, [label]: String(value) } } : schema) })),

  inferExample: (text) => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Example must be a JSON object');
      const fields = inferFields(parsed, makeId);
      set({ importDraft: { text, fields, accepted: Object.fromEntries(fields.map((field) => [field.id, true])) }, importError: '' });
      return true;
    } catch (error) { set({ importDraft: null, importError: `Import example: ${error.message}` }); return false; }
  },
  toggleImportField: (id) => set((state) => ({ importDraft: { ...state.importDraft, accepted: { ...state.importDraft.accepted, [id]: !state.importDraft.accepted[id] } } })),
  applyImportDraft: () => set((state) => {
    if (!state.importDraft) return {};
    const fields = state.importDraft.fields.filter((field) => state.importDraft.accepted[field.id]);
    get().showToast('success', 'Example draft applied', `${fields.length} fields imported`);
    return { ...recordMutation(state, 'Import example', () => fields), importDraft: null };
  }),

  importPackage: (text) => {
    try {
      const parsedJson = JSON.parse(text);
      const parsed = schemaPackageSchema.safeParse(parsedJson);
      if (!parsed.success) { set({ packageImportError: `SchemaPackage.${parsed.error.issues[0].path.join('.')}: ${parsed.error.issues[0].message}` }); return false; }
      const siblingError = validateSiblingKeys(parsed.data.fields);
      if (siblingError) { set({ packageImportError: siblingError }); return false; }
      const fields = withIds(parsed.data.fields, makeId);
      const active = findSchema(get());
      if (active) set((state) => {
        const history = state.history.slice(0, state.historyIndex + 1);
        history.push({ label: 'Import SchemaPackage', tree: clone(fields) });
        return {
        schemas: state.schemas.map((schema) => schema.id === active.id ? { ...schema, name: parsed.data.name, fields, metadata: parsed.data.metadata, importedExample: parsed.data.examplePayload, importedInstruction: parsed.data.formatInstruction } : schema),
        exampleNonce: 1,
        importPackageOpen: false,
        packageImportError: '',
        selectedNodeId: null,
        history,
        historyIndex: history.length - 1,
      }});
      else {
        const created = { id: schemaId(), name: parsed.data.name, fields, metadata: parsed.data.metadata, importedExample: parsed.data.examplePayload, importedInstruction: parsed.data.formatInstruction };
        set((state) => ({ schemas: [created, ...state.schemas], activeSchemaId: created.id, ...historyBase(fields), importPackageOpen: false, packageImportError: '' }));
      }
      get().showToast('success', 'SchemaPackage imported', parsed.data.name);
      return true;
    } catch (error) { set({ packageImportError: `SchemaPackage JSON parse error: ${error.message}` }); return false; }
  },

  setPlaygroundPayload: (payloadText) => set((state) => ({ validation: { ...state.validation, payloadText, parseError: '' } })),
  startValidation: () => {
    const state = get();
    if (state.validation.status === 'running') return;
    let payload;
    try { payload = JSON.parse(state.validation.payloadText); }
    catch (error) { const match = error.message.match(/position\s+(\d+)/); set((s) => ({ validation: { ...s.validation, parseError: `Payload JSON parse error${match ? ` at position ${match[1]}` : ''}: ${error.message}` } })); return; }
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') { set((s) => ({ validation: { ...s.validation, parseError: 'Payload must be a JSON object' } })); return; }
    const active = findSchema(state); if (!active) return;
    const token = ++runToken;
    const steps = active.fields.map((field) => ({ fieldId: field.id, path: field.key, status: 'pending', attempts: 0, countdown: 0, message: '' }));
    set((s) => ({ validation: { payloadText: s.validation.payloadText, payload, parseError: '', status: 'running', paused: false, steps, timeline: [{ id: Date.now(), field: 'Run', status: 'running', detail: 'Validation started', time: nowTime() }], annotations: {}, runId: token } }));
    executeValidation(token);
  },
  pauseValidation: () => set((state) => state.validation.status === 'running' ? ({ validation: { ...state.validation, paused: true } }) : {}),
  resumeValidation: () => set((state) => state.validation.status === 'running' ? ({ validation: { ...state.validation, paused: false } }) : {}),
  retryValidation: (index) => {
    const state = get(); if (!state.validation.payload) return;
    const token = ++runToken;
    set((s) => ({ validation: { ...s.validation, status: 'running', paused: false, steps: s.validation.steps.map((step, i) => i === index ? { ...step, status: 'pending', message: '', attempts: 2 } : step), timeline: [...s.validation.timeline, event(s.validation.steps[index], 'running', 'Manual retry started')] } }));
    executeValidation(token, index);
  },
}));

const EMPTY_FIELDS = [];
// Must return a STABLE reference when there is no active schema — a fresh `[]`
// literal here is a new getSnapshot value every render and drives useSyncExternalStore
// into an infinite update loop (blank page) the moment the active schema is deleted.
export const getActiveFields = (state) => state.schemas.find((schema) => schema.id === state.activeSchemaId)?.fields || EMPTY_FIELDS;
export const getSelectedField = (state) => findField(getActiveFields(state), state.selectedNodeId);
export const getActiveSchema = (state) => state.schemas.find((schema) => schema.id === state.activeSchemaId) || null;
export const getRollup = (state) => ({
  checked: state.validation.steps.filter((step) => ['complete', 'failed'].includes(step.status)).length,
  total: state.validation.steps.length,
  failures: state.validation.steps.filter((step) => step.status === 'failed').length,
});
export const getVersions = (state) => state.versions.filter((version) => version.schemaId === state.activeSchemaId);
export { flattenFields, stripIds };
