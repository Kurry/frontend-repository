import { artifactForTab } from './artifacts.js';
import { studioActions, useStudioStore } from './store.js';

const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const stringEnum = (values) => ({ type: 'string', enum: values });

let registered = false;

export function registerWebMCP() {
  if (registered || typeof window === 'undefined') return;
  registered = true;
  const tools = [
    {
      name: 'editor_select', description: 'Select a base or compare prompt version using the same picker handler as the UI.',
      inputSchema: schema({ objectType: stringEnum(['prompt-version']), property: stringEnum(['base-version', 'compare-version']), versionId: { type: 'string', minLength: 1 } }, ['objectType', 'property', 'versionId']),
      run: ({ property, versionId }) => { const actions = studioActions(); property === 'base-version' ? actions.setBaseVersion(versionId) : actions.setCompareVersion(versionId); return { selected: true, property, versionId }; },
    },
    {
      name: 'editor_add', description: 'Create a new restore or complete the open merge through the visible domain command.',
      inputSchema: schema({ objectType: stringEnum(['prompt-version']), action: stringEnum(['complete-merge', 'restore']), sourceVersionId: { type: 'string' }, changeNote: { type: 'string', maxLength: 200 } }, ['objectType', 'action']),
      run: ({ action, sourceVersionId, changeNote }) => { const actions = studioActions(); if (action === 'complete-merge') actions.completeMerge(); else actions.restoreVersion(sourceVersionId, changeNote); return { created: true, action }; },
    },
    {
      name: 'editor_update_property', description: 'Update a bounded merge-region property using the open merge session.',
      inputSchema: schema({ objectType: stringEnum(['merge-region']), regionId: { type: 'string', minLength: 1 }, property: stringEnum(['resolution', 'manual-text']), value: { type: 'string' } }, ['objectType', 'regionId', 'property', 'value']),
      run: ({ regionId, property, value }) => { const actions = studioActions(); property === 'resolution' ? actions.resolveMergeRegion(regionId, value) : actions.setManualMergeText(regionId, value); return { updated: true, regionId, property }; },
    },
    {
      name: 'editor_set_content', description: 'Set the manual text for a declared merge conflict region.',
      inputSchema: schema({ objectType: stringEnum(['merge-region']), regionId: { type: 'string', minLength: 1 }, content: { type: 'string' } }, ['objectType', 'regionId', 'content']),
      run: ({ regionId, content }) => { studioActions().setManualMergeText(regionId, content); return { updated: true, regionId }; },
    },
    {
      name: 'editor_switch_mode', description: 'Switch the visible studio or diff layout mode.',
      inputSchema: schema({ mode: stringEnum(['split', 'unified', 'diff', 'compare-branches', 'blame', 'graph']) }, ['mode']),
      run: ({ mode }) => { const actions = studioActions(); ['split', 'unified'].includes(mode) ? actions.setDiffView(mode) : actions.setActiveMode(mode); return { mode }; },
    },
    {
      name: 'editor_preview', description: 'Open the visible preview surface for a declared object type.',
      inputSchema: schema({ objectType: stringEnum(['prompt-version', 'merge-region', 'annotation-anchor']) }, ['objectType']),
      run: ({ objectType }) => ({ objectType, visible: true, mode: useStudioStore.getState().activeMode }),
    },
    {
      name: 'browse_open', description: 'Open a bounded studio destination with visible navigation state.',
      inputSchema: schema({ destination: stringEnum(['diff', 'compare-branches', 'blame', 'graph', 'history-list', 'export']) }, ['destination']),
      run: ({ destination }) => { const actions = studioActions(); if (destination === 'export') actions.setExportOpen(true); else if (['diff', 'compare-branches', 'blame', 'graph'].includes(destination)) actions.setActiveMode(destination); return { destination, visible: true }; },
    },
    {
      name: 'browse_search', description: 'Search the bounded prompt list or all live prompt versions.',
      inputSchema: schema({ filter: stringEnum(['prompt-search', 'global-version-search']), query: { type: 'string', maxLength: 500 } }, ['filter', 'query']),
      run: ({ filter, query }) => { const actions = studioActions(); filter === 'prompt-search' ? actions.setPromptQuery(query) : actions.setGlobalSearchQuery(query); return { filter, query, visible: true }; },
    },
    {
      name: 'browse_apply_filter', description: 'Apply a declared prompt or version search filter.',
      inputSchema: schema({ filter: stringEnum(['prompt-search', 'global-version-search']), value: { type: 'string', maxLength: 500 } }, ['filter', 'value']),
      run: ({ filter, value }) => { const actions = studioActions(); filter === 'prompt-search' ? actions.setPromptQuery(value) : actions.setGlobalSearchQuery(value); return { filter, applied: true }; },
    },
    {
      name: 'browse_clear_filter', description: 'Clear a declared prompt or version search filter.',
      inputSchema: schema({ filter: stringEnum(['prompt-search', 'global-version-search']) }, ['filter']),
      run: ({ filter }) => { const actions = studioActions(); filter === 'prompt-search' ? actions.setPromptQuery('') : actions.setGlobalSearchQuery(''); return { filter, cleared: true }; },
    },
    {
      name: 'entity_create', description: 'Create an annotation thread at an existing line-range anchor.',
      inputSchema: schema({ entity: stringEnum(['annotation-thread']), lineStart: { type: 'integer', minimum: 1 }, lineEnd: { type: 'integer', minimum: 1 }, bodyMarkdown: { type: 'string', minLength: 1, maxLength: 4000 }, author: { type: 'string', minLength: 1, maxLength: 80 } }, ['entity', 'lineStart', 'lineEnd', 'bodyMarkdown', 'author']),
      run: ({ lineStart, lineEnd, bodyMarkdown, author }) => { studioActions().postAnnotation({ lineStart, lineEnd, bodyMarkdown, author }); return { created: true, lineStart, lineEnd }; },
    },
    {
      name: 'entity_update', description: 'Append a reply to a declared annotation thread.',
      inputSchema: schema({ entity: stringEnum(['annotation-thread']), annotationId: { type: 'string', minLength: 1 }, field: stringEnum(['reply']), bodyMarkdown: { type: 'string', minLength: 1, maxLength: 4000 }, author: { type: 'string', minLength: 1, maxLength: 80 } }, ['entity', 'annotationId', 'field', 'bodyMarkdown', 'author']),
      run: ({ annotationId, bodyMarkdown, author }) => { studioActions().replyToAnnotation(annotationId, bodyMarkdown, author); return { updated: true, annotationId }; },
    },
    {
      name: 'entity_toggle', description: 'Toggle the resolved field for a declared annotation thread.',
      inputSchema: schema({ entity: stringEnum(['annotation-thread']), annotationId: { type: 'string', minLength: 1 }, field: stringEnum(['resolved']) }, ['entity', 'annotationId', 'field']),
      run: ({ annotationId }) => { studioActions().toggleAnnotationResolved(annotationId); return { toggled: true, annotationId }; },
    },
    {
      name: 'artifact_export', description: 'Open the visible export surface at a declared artifact format.',
      inputSchema: schema({ format: stringEnum(['version-history-report', 'version-package', 'merged-prompt-text']) }, ['format']),
      run: ({ format }) => { const actions = studioActions(); const tab = format === 'version-package' ? 'package' : format === 'merged-prompt-text' ? 'merged' : 'history'; actions.setExportTab(tab); actions.setExportOpen(true); return { format, previewVisible: true }; },
    },
    {
      name: 'artifact_copy', description: 'Copy the currently derived declared artifact through the same browser clipboard workflow as Copy.',
      inputSchema: schema({ format: stringEnum(['version-history-report', 'version-package', 'merged-prompt-text']) }, ['format']),
      run: async ({ format }) => { const state = useStudioStore.getState(); const tab = format === 'version-package' ? 'package' : format === 'merged-prompt-text' ? 'merged' : 'history'; await navigator.clipboard.writeText(artifactForTab(state, tab)); return { format, copied: true }; },
    },
  ];
  const byName = new Map(tools.map((tool) => [tool.name, tool]));
  window.webmcp_session_info = () => ({ contractVersion: 'zto-webmcp-v1', modules: ['structured-editor-v1', 'browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'], tools: tools.map((tool) => tool.name) });
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = byName.get(name); if (!tool) throw new Error(`Unknown registered WebMCP tool: ${name}`);
    return tool.run(args);
  };
}

