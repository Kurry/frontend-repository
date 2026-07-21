import { useStudioStore } from './store';

// Browser-side WebMCP surface (contract zto-webmcp-v1). The verifier bridge
// calls window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool on
// the live page; every handler below invokes the exact same store command the
// visible UI control uses, so automation and manual interaction share state.

const enumOf = (values, extra = {}) => ({ type: 'string', enum: values, ...extra });
const str = (extra = {}) => ({ type: 'string', ...extra });
const num = (extra = {}) => ({ type: 'number', ...extra });
const schema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false });

const ok = (result = {}) => ({ status: 'success', ...result });
const fail = (error) => { throw new Error(error); };

const store = () => useStudioStore.getState();

const requireItem = (itemId) => {
  if (!itemId || !store().items[itemId]) fail(`Unknown queue item: ${itemId}`);
  return store().items[itemId];
};

const SCORE_KEYS = ['Accuracy', 'Clarity', 'Relevance'];

const handlers = {
  // ---- entity-collection-v1 (entity: queue-item) ----
  entity_select: ({ entity, id }) => {
    if (entity === 'suite') {
      if (!store().suites.some((suite) => suite.id === id)) fail(`Unknown suite: ${id}`);
      store().selectSuite(id);
      return ok({ selected: id, entity });
    }
    requireItem(id);
    store().selectItem(id);
    return ok({ selected: id, entity: 'item' });
  },

  entity_update: ({ itemId, field, value }) => {
    requireItem(itemId);
    const state = store();
    if (field === 'rating') {
      if (!['up', 'down'].includes(value)) fail('rating must be up or down');
      state.updateDraft(itemId, { rating: value });
    } else if (field === 'scores') {
      if (typeof value !== 'object' || value === null) fail('scores must be an object keyed by Accuracy, Clarity, and Relevance');
      for (const key of SCORE_KEYS) {
        if (value[key] === undefined) continue;
        if (!Number.isInteger(value[key]) || value[key] < 1 || value[key] > 5) fail(`scores.${key} must be an integer from 1 to 5`);
        state.updateScore(itemId, key, value[key]);
      }
    } else if (field === 'comment') {
      if (typeof value !== 'string' || value.length > 500) fail('comment must be a string of at most 500 characters');
      state.updateDraft(itemId, { comment: value });
    } else if (field === 'metadata-values') {
      if (typeof value !== 'object' || value === null) fail('metadata-values must be an object keyed by metadata field name');
      const names = new Set(state.metadataFields.map((entry) => entry.name));
      for (const [name, fieldValue] of Object.entries(value)) {
        if (!names.has(name)) fail(`metadata field ${name} does not exist`);
        state.updateMetadataValue(itemId, name, fieldValue);
      }
    } else if (field === 'review_state') {
      if (!['unlabeled', 'labeled', 'reviewed', 'disputed'].includes(value)) fail('review_state must be unlabeled, labeled, reviewed, or disputed');
      if (value === 'disputed') {
        const reason = state.items[itemId].disputeReason || 'Disputed through the review workflow';
        state.setReviewState(itemId, 'disputed', { disputeReason: reason });
      } else {
        state.setReviewState(itemId, value);
      }
    } else if (field === 'dispute-reason') {
      const reason = String(value ?? '').trim();
      if (!reason || reason.length > 200 || /[\r\n]/.test(reason)) fail('reason must be a single line of 1 to 200 characters');
      state.setReviewState(itemId, 'disputed', { disputeReason: reason });
    } else if (field === 'resolved-rating') {
      if (!['up', 'down'].includes(value)) fail('resolved rating must be up or down');
      const result = state.resolveDispute(itemId, value);
      if (!result.ok) fail(result.error);
    } else if (field === 'suggested-rating-accept') {
      if (!state.items[itemId].suggested) fail('This item has no suggested rating to accept');
      state.acceptSuggestion(itemId);
    } else if (field === 'skip') {
      state.skipItems([itemId]);
    } else if (field === 'bulk-selection') {
      const selected = state.selected.includes(itemId);
      if (Boolean(value) !== selected) state.toggleSelected(itemId);
    } else {
      fail(`Unknown queue-item field: ${field}`);
    }
    return ok({ itemId, field, updated: true });
  },

  entity_toggle: ({ itemId }) => {
    requireItem(itemId);
    store().toggleSelected(itemId);
    return ok({ itemId, selected: store().selected.includes(itemId) });
  },

  entity_reorder: ({ itemId }) => {
    requireItem(itemId);
    store().skipItems([itemId]);
    return ok({ itemId, reordered: true, postcondition: 'Item moved to the end of its suite queue with a skipped badge' });
  },

  // ---- structured-editor-v1 (taxonomy-class, metadata-field, region) ----
  editor_select: ({ objectType, id, itemId }) => {
    if (objectType === 'taxonomy-class') {
      if (!store().taxonomy.some((entry) => entry.id === id)) fail(`Unknown taxonomy class: ${id}`);
      store().setView('taxonomy');
      window.setTimeout(() => document.getElementById(`taxonomy-${id}`)?.focus(), 40);
      return ok({ selected: id, objectType });
    }
    if (objectType === 'region') {
      store().selectRegion(id);
      return ok({ selected: id, objectType, itemId: itemId || null });
    }
    if (objectType === 'metadata-field') {
      if (!store().metadataFields.some((entry) => entry.id === id)) fail(`Unknown metadata field: ${id}`);
      store().setView('taxonomy');
      return ok({ selected: id, objectType });
    }
    fail(`Unknown editor object type: ${objectType}`);
  },

  editor_add: ({ objectType, itemId, value }) => {
    if (objectType === 'taxonomy-class') {
      const result = store().saveTaxonomyClass(value || {});
      if (!result.ok) fail(result.error);
      return ok({ added: 'taxonomy-class', id: result.id });
    }
    if (objectType === 'metadata-field') {
      const result = store().saveMetadataField(value || {});
      if (!result.ok) fail(result.error);
      return ok({ added: 'metadata-field', name: value?.name });
    }
    if (objectType === 'region') {
      requireItem(itemId);
      const result = store().addRegion(itemId, value || {});
      if (!result.ok) fail(result.error);
      return ok({ added: 'region', id: result.id, itemId });
    }
    fail(`Unknown editor object type: ${objectType}`);
  },

  editor_delete: ({ objectType, id, itemId, confirm }) => {
    if (confirm !== true) fail('confirm=true is required to delete');
    if (objectType === 'taxonomy-class') {
      if (!store().taxonomy.some((entry) => entry.id === id)) fail(`Unknown taxonomy class: ${id}`);
      store().deleteTaxonomyClass(id);
    } else if (objectType === 'metadata-field') {
      if (!store().metadataFields.some((entry) => entry.id === id)) fail(`Unknown metadata field: ${id}`);
      store().deleteMetadataField(id);
    } else if (objectType === 'region') {
      requireItem(itemId);
      store().deleteRegion(itemId, id);
    } else {
      fail(`Unknown editor object type: ${objectType}`);
    }
    return ok({ deleted: id, objectType });
  },

  editor_update_property: ({ objectType, itemId, id, property, value }) => {
    if (objectType === 'taxonomy-class') {
      const existing = store().taxonomy.find((entry) => entry.id === id);
      if (!existing) fail(`Unknown taxonomy class: ${id}`);
      const editable = ['name', 'color', 'icon', 'shortcut', 'attributes'];
      if (!editable.includes(property)) fail(`taxonomy-class property ${property} is not editable`);
      const result = store().saveTaxonomyClass({ ...existing, [property]: value }, id);
      if (!result.ok) fail(result.error);
      return ok({ updated: id, property });
    }
    if (objectType === 'metadata-field') {
      fail('Metadata fields are created or deleted; their definitions are not edited in place');
    }
    if (objectType === 'region') {
      requireItem(itemId);
      if (property === 'attribute-values') {
        if (typeof value !== 'object' || value === null) fail('attribute-values must be an object');
        store().updateRegionAttributes(itemId, id, value);
        return ok({ updated: id, property });
      }
      if (['x', 'y', 'w', 'h'].includes(property)) {
        if (typeof value !== 'number') fail(`${property} must be a number`);
        const result = store().updateRegionGeometry(itemId, id, { [property]: value });
        if (!result.ok) fail(result.error);
        return ok({ updated: id, property, value });
      }
      if (property === 'class-id') {
        const result = store().updateRegionGeometry(itemId, id, { classId: value });
        if (!result.ok) fail(result.error);
        return ok({ updated: id, property, value });
      }
      fail(`Unknown region property: ${property}`);
    }
    fail(`Unknown editor object type: ${objectType}`);
  },

  editor_switch_mode: ({ mode }) => {
    if (!['annotate', 'taxonomy', 'review-queue', 'agreement', 'history', 'export'].includes(mode)) {
      fail('mode must be annotate, taxonomy, review-queue, agreement, history, or export');
    }
    store().setView(mode);
    return ok({ mode, visiblePostcondition: `${mode} view is visible` });
  },

  editor_preview: ({ mode }) => {
    store().setView('export');
    if (mode === 'stats') store().setExportTab('stats');
    else store().setExportTab('labels');
    return ok({ mode: mode || 'export', visiblePostcondition: 'Live artifact preview is visible' });
  },

  // ---- command-session-v1 (assist-run demo) ----
  session_start: ({ suiteId }) => {
    if (!store().suites.some((suite) => suite.id === suiteId)) fail(`Unknown suite: ${suiteId}`);
    const result = store().startAssist(suiteId);
    if (!result.ok) fail(result.error);
    return ok({ suiteId, status: 'running', postcondition: 'Assist steps are visible in the queue sidebar' });
  },

  session_pause: ({ suiteId }) => {
    store().pauseAssist(suiteId);
    return ok({ suiteId, status: 'paused' });
  },

  session_resume: ({ suiteId }) => {
    store().resumeAssist(suiteId);
    return ok({ suiteId, status: 'running' });
  },

  // ---- artifact-transfer-v1 ----
  artifact_export: ({ format }) => {
    if (!['annotations-jsonl', 'labels-json', 'stats-summary-text'].includes(format)) {
      fail('format must be annotations-jsonl, labels-json, or stats-summary-text');
    }
    store().setView('export');
    store().setExportTab(format === 'stats-summary-text' ? 'stats' : 'labels');
    if (format === 'annotations-jsonl') store().downloadArtifact('annotations-jsonl');
    return ok({ format, visiblePostcondition: 'Export center is visible with the requested format' });
  },

  artifact_import: ({ mode }) => {
    if (mode && mode !== 'labels-json') fail('mode must be labels-json');
    store().setView('export');
    store().setExportTab('labels');
    store().setImportOpen(true);
    return ok({ mode: 'labels-json', visiblePostcondition: 'Labels JSON import dialog is open; paste or file-picker input happens in the visible UI' });
  },

  artifact_copy: ({ format }) => {
    if (!['labels-json', 'stats-summary-text', 'annotations-jsonl'].includes(format)) {
      fail('format must be labels-json, stats-summary-text, or annotations-jsonl');
    }
    store().setView('export');
    store().copyExport(format);
    return ok({ format, visiblePostcondition: 'Copy confirmation is visible in the export center' });
  },
};

const TOOL_DEFS = [
  ['entity_select', 'Select a queue item or suite in the visible workspace (same command as clicking it).', schema({ entity: enumOf(['item', 'suite']), id: str() }, ['entity', 'id'])],
  ['entity_update', 'Update one bounded queue-item field through the same command the visible card uses.', schema({ itemId: str(), field: enumOf(['rating', 'scores', 'comment', 'metadata-values', 'review_state', 'dispute-reason', 'resolved-rating', 'suggested-rating-accept', 'skip', 'bulk-selection']), value: {} }, ['itemId', 'field'])],
  ['entity_toggle', 'Toggle a queue item in the bulk selection set.', schema({ itemId: str() }, ['itemId'])],
  ['entity_reorder', 'Move one queue item to the end of its suite queue (same Skip command as the visible UI).', schema({ itemId: str() }, ['itemId'])],
  ['editor_select', 'Select a taxonomy class, metadata field, or region in the structured editor.', schema({ objectType: enumOf(['taxonomy-class', 'metadata-field', 'region']), id: str(), itemId: str() }, ['objectType', 'id'])],
  ['editor_add', 'Add a validated taxonomy class, metadata field, or image region (same validation as the visible forms).', schema({ objectType: enumOf(['taxonomy-class', 'metadata-field', 'region']), itemId: str(), value: {} }, ['objectType', 'value'])],
  ['editor_delete', 'Delete a taxonomy class, metadata field, or region. Requires explicit confirm=true.', schema({ objectType: enumOf(['taxonomy-class', 'metadata-field', 'region']), id: str(), itemId: str(), confirm: { type: 'boolean' } }, ['objectType', 'id', 'confirm'])],
  ['editor_update_property', 'Update one bounded editor property (region geometry, region attribute values, or a taxonomy class field).', schema({ objectType: enumOf(['taxonomy-class', 'metadata-field', 'region']), itemId: str(), id: str(), property: enumOf(['name', 'color', 'icon', 'shortcut', 'attributes', 'attribute-values', 'class-id', 'x', 'y', 'w', 'h']), value: {} }, ['objectType', 'id', 'property', 'value'])],
  ['editor_switch_mode', 'Switch the editor among annotate, taxonomy, review-queue, agreement, history, and export modes.', schema({ mode: enumOf(['annotate', 'taxonomy', 'review-queue', 'agreement', 'history', 'export']) }, ['mode'])],
  ['editor_preview', 'Open the live artifact preview (export center) without returning artifact contents.', schema({ mode: enumOf(['export', 'stats']) }, [])],
  ['session_start', 'Start the simulated assist-run pass for a suite (one visible step per unannotated item).', schema({ suiteId: str() }, ['suiteId'])],
  ['session_pause', 'Pause a running assist pass; completed steps keep their outputs and timestamps.', schema({ suiteId: str() }, ['suiteId'])],
  ['session_resume', 'Resume a paused assist pass from exactly the frozen step.', schema({ suiteId: str() }, ['suiteId'])],
  ['artifact_export', 'Open the export center for one format; annotations-jsonl also triggers the JSONL download. Artifact contents are never returned here.', schema({ format: enumOf(['annotations-jsonl', 'labels-json', 'stats-summary-text']) }, ['format'])],
  ['artifact_import', 'Open the Labels JSON import workflow (mode labels-json); paste or file input stays in the visible UI.', schema({ mode: enumOf(['labels-json']) }, ['mode'])],
  ['artifact_copy', 'Copy the currently visible export through the same command as the Copy export button. Clipboard contents are not returned here.', schema({ format: enumOf(['labels-json', 'stats-summary-text', 'annotations-jsonl']) }, ['format'])],
];

export function registerWebMCP() {
  if (window.__corvidWebMCPRegistered) return;
  window.__corvidWebMCPRegistered = true;

  const tools = TOOL_DEFS.map(([name, description, inputSchema]) => ({ name, description, inputSchema }));
  const entitySelect = tools.find((tool) => tool.name === 'entity_select');
  const firstItemId = Object.keys(store().items)[0];
  if (entitySelect && firstItemId) entitySelect.inputSchema.properties.id.default = firstItemId;

  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'corvid-annotation-studio',
    modules: ['entity-collection-v1', 'structured-editor-v1', 'command-session-v1', 'artifact-transfer-v1'],
    tools: tools.map((tool) => tool.name),
  });

  window.webmcp_list_tools = () => ({ tools });

  window.webmcp_invoke_tool = async (name, args = {}) => {
    const handler = handlers[name];
    if (!handler) return { status: 'error', error: `Unsupported tool: ${name}` };
    try {
      return handler(args || {});
    } catch (error) {
      return { status: 'error', error: error?.message || String(error) };
    }
  };
}
