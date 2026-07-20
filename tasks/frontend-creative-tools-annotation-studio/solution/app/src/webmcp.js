import { compileJsonl, compileLabelsPackage, compileStats, useStudioStore } from './store';

const schema = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const string = (values) => values ? { type: 'string', enum: values } : { type: 'string', maxLength: 500 };

export function registerWebMCP() {
  const context = navigator.modelContext || window.webmcp;
  if (!context?.registerTool || window.__corvidWebMCPRegistered) return;
  window.__corvidWebMCPRegistered = true;
  const add = (name, description, inputSchema, handler) => {
    const config = { name, description, inputSchema, execute: async (args) => {
      try { return { content: [{ type: 'text', text: JSON.stringify(await handler(args || {})) }] }; }
      catch (error) { return { content: [{ type: 'text', text: error.message }], isError: true }; }
    } };
    try { context.registerTool(config); } catch { try { context.registerTool(config, config.execute); } catch { /* Browser does not expose WebMCP registration in ordinary sessions. */ } }
  };
  const store = () => useStudioStore.getState();

  add('entity_select_queue_item', 'Select a Corvid queue item or suite using the same navigation command as the visible queue.', schema({ entity: string(['item', 'suite']), id: string() }, ['entity', 'id']), ({ entity, id }) => {
    entity === 'suite' ? store().selectSuite(id) : store().selectItem(id); return { selected: id, entity };
  });
  add('entity_update_queue_item', 'Update one bounded queue-item annotation field through the visible application command.', schema({ itemId: string(), field: string(['rating', 'comment', 'review_state', 'dispute-reason', 'resolved-rating', 'suggested-rating-accept']), value: {} }, ['itemId', 'field']), ({ itemId, field, value }) => {
    if (field === 'rating') { if (!['up', 'down'].includes(value)) throw new Error('rating must be up or down'); store().updateDraft(itemId, { rating: value }); }
    else if (field === 'comment') { if (typeof value !== 'string' || value.length > 500) throw new Error('comment must be at most 500 characters'); store().updateDraft(itemId, { comment: value }); }
    else if (field === 'review_state') { if (!['unlabeled', 'labeled', 'reviewed', 'disputed'].includes(value)) throw new Error('invalid review_state'); store().setReviewState(itemId, value); }
    else if (field === 'resolved-rating') store().resolveDispute(itemId, value);
    else if (field === 'dispute-reason') store().setReviewState(itemId, 'disputed', { disputeReason: value });
    else if (field === 'suggested-rating-accept') store().acceptSuggestion(itemId);
    return { itemId, field, updated: true };
  });
  add('entity_toggle_queue_item', 'Toggle bounded bulk selection for a queue item.', schema({ itemId: string() }, ['itemId']), ({ itemId }) => { store().toggleSelected(itemId); return { itemId, selected: store().selected.includes(itemId) }; });
  add('entity_reorder_queue_item', 'Move one queue item to the end using the same Skip command as the visible UI.', schema({ itemId: string() }, ['itemId']), ({ itemId }) => { store().skipItems([itemId]); return { itemId, reordered: true }; });

  add('editor_select', 'Select a taxonomy class or region in the structured editor.', schema({ objectType: string(['taxonomy-class', 'region']), id: string() }, ['objectType', 'id']), ({ objectType, id }) => { if (objectType === 'region') store().selectRegion(id); else store().setView('taxonomy'); return { selected: id }; });
  add('editor_add', 'Add a validated taxonomy class, metadata field, or image region.', schema({ objectType: string(['taxonomy-class', 'metadata-field', 'region']), itemId: string(), value: {} }, ['objectType', 'value']), ({ objectType, itemId, value }) => {
    const result = objectType === 'taxonomy-class' ? store().saveTaxonomyClass(value) : objectType === 'metadata-field' ? store().saveMetadataField(value) : store().addRegion(itemId, value);
    if (!result?.ok) throw new Error(result?.error || 'Editor add failed'); return result;
  });
  add('editor_delete', 'Delete a structured editor object. Explicit confirmation is required.', schema({ objectType: string(['taxonomy-class', 'metadata-field', 'region']), id: string(), itemId: string(), confirm: { type: 'boolean' } }, ['objectType', 'id', 'confirm']), ({ objectType, id, itemId, confirm }) => { if (!confirm) throw new Error('confirm=true is required'); if (objectType === 'taxonomy-class') store().deleteTaxonomyClass(id); else if (objectType === 'metadata-field') store().deleteMetadataField(id); else store().deleteRegion(itemId, id); return { deleted: id }; });
  add('editor_update_property', 'Update a bounded region attribute or editor property.', schema({ objectType: string(['region']), itemId: string(), id: string(), property: string(['attribute-values']), value: {} }, ['objectType', 'itemId', 'id', 'property', 'value']), ({ itemId, id, value }) => { store().updateRegionAttributes(itemId, id, value); return { updated: id }; });
  add('editor_switch_mode', 'Switch among Corvid studio editor modes.', schema({ mode: string(['annotate', 'taxonomy', 'review-queue', 'agreement', 'history', 'export']) }, ['mode']), ({ mode }) => { store().setView(mode); return { mode }; });
  add('editor_preview', 'Open the live artifact preview without returning artifact contents.', schema({ mode: string(['export']) }, ['mode']), () => { store().setView('export'); return { visiblePostcondition: 'Export preview is visible' }; });

  add('session_start_assist_run', 'Start the simulated assist run for a suite.', schema({ suiteId: string() }, ['suiteId']), ({ suiteId }) => store().startAssist(suiteId));
  add('session_pause_assist_run', 'Pause a running assist session.', schema({ suiteId: string() }, ['suiteId']), ({ suiteId }) => { store().pauseAssist(suiteId); return { status: 'paused' }; });
  add('session_resume_assist_run', 'Resume a paused assist session.', schema({ suiteId: string() }, ['suiteId']), ({ suiteId }) => { store().resumeAssist(suiteId); return { status: 'running' }; });

  add('artifact_export', 'Open the export center for one supported format. Artifact contents are not returned.', schema({ format: string(['annotations-jsonl', 'labels-json', 'stats-summary-text']) }, ['format']), ({ format }) => { store().setView('export'); return { format, visiblePostcondition: 'Export center is visible' }; });
  add('artifact_import', 'Open the Labels JSON import dialog. Paste and file-picker mechanics remain in the visible UI.', schema({ mode: string(['labels-json']) }, ['mode']), () => { store().setView('export'); store().setImportOpen(true); return { visiblePostcondition: 'Labels JSON import workflow is available in Export' }; });
  add('artifact_copy', 'Copy the current live export without returning its contents.', schema({ format: string(['labels-json', 'stats-summary-text']) }, ['format']), async ({ format }) => { const state = store(); const text = format === 'labels-json' ? JSON.stringify(compileLabelsPackage(state), null, 2) : compileStats(state); await navigator.clipboard.writeText(text); return { copied: true, format }; });
}
