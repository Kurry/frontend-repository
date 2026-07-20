import { artifactForTab } from './artifacts.js';
import { studioActions, useStudioStore } from './store.js';

const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const stringEnum = (values) => ({ type: 'string', enum: values });

// Derive the same global version search results the UI renders so tool
// responses report real, visible postconditions.
function versionSearchResults(query) {
  const state = useStudioStore.getState();
  const q = String(query ?? '').trim().toLocaleLowerCase();
  if (!q) return [];
  const matches = [];
  state.prompts.forEach((prompt) => prompt.versions.forEach((version) => {
    if (version.text.toLocaleLowerCase().includes(q)) {
      matches.push({ promptId: prompt.id, promptTitle: prompt.title, versionId: version.versionId, versionNumber: version.versionNumber });
    }
  }));
  return matches;
}

function promptSearchResults(query) {
  const state = useStudioStore.getState();
  const q = String(query ?? '').trim().toLocaleLowerCase();
  if (!q) return state.prompts.map((prompt) => ({ promptId: prompt.id, title: prompt.title }));
  return state.prompts
    .filter((prompt) => prompt.title.toLocaleLowerCase().includes(q) || prompt.description.toLocaleLowerCase().includes(q))
    .map((prompt) => ({ promptId: prompt.id, title: prompt.title }));
}

let registered = false;

export function registerWebMCP() {
  if (registered || typeof window === 'undefined') return;
  registered = true;
  const tools = [
    {
      name: 'editor_select', description: 'Select a base or compare prompt version through the same picker handler as the UI. Switches the prompt when the version belongs to another chain.',
      inputSchema: schema({ objectType: stringEnum(['prompt-version']), property: stringEnum(['base-version', 'compare-version']), versionId: { type: 'string', minLength: 1 } }, ['objectType', 'property', 'versionId']),
      run: ({ property, versionId }) => {
        const result = studioActions().selectVersionAnywhere(versionId, property);
        if (!result.ok) return result;
        const state = useStudioStore.getState();
        return { selected: true, property, versionId, promptId: result.promptId, versionNumber: result.versionNumber, baseVersionId: state.baseVersionId, compareVersionId: state.compareVersionId };
      },
    },
    {
      name: 'editor_add', description: 'Complete the open merge or create a restore head version through the same domain command as the visible Complete merge / Restore version controls.',
      inputSchema: schema({ objectType: stringEnum(['prompt-version']), action: stringEnum(['complete-merge', 'restore']), sourceVersionId: { type: 'string', minLength: 1 }, changeNote: { type: 'string', minLength: 1, maxLength: 200 } }, ['objectType', 'action']),
      run: ({ action, sourceVersionId, changeNote }) => {
        const actions = studioActions();
        if (action === 'complete-merge') {
          const ensured = actions.ensureMergeSession();
          if (!ensured.ok) return ensured;
          const result = actions.completeMerge();
          if (!result.ok) return result;
          const state = useStudioStore.getState();
          const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
          return { created: true, action, versionId: result.versionId, versionNumber: result.versionNumber, changeNote: result.changeNote, headVersionCount: prompt?.versions.length || 0 };
        }
        if (!sourceVersionId || !changeNote) return { ok: false, error: 'restore requires sourceVersionId and changeNote (1–200 characters, naming the restore source version).' };
        const result = actions.restoreVersion(sourceVersionId, changeNote);
        if (!result.ok) return result;
        const state = useStudioStore.getState();
        const prompt = state.prompts.find((item) => item.id === state.selectedPromptId);
        return { created: true, action, versionId: result.versionId, versionNumber: result.versionNumber, headVersionCount: prompt?.versions.length || 0 };
      },
    },
    {
      name: 'editor_update_property', description: 'Update a bounded merge-region property (resolution or manual-text) in the open merge session, mirroring the region choice cards.',
      inputSchema: schema({ objectType: stringEnum(['merge-region']), regionId: { type: 'string', minLength: 1 }, property: stringEnum(['resolution', 'manual-text']), value: { type: 'string' } }, ['objectType', 'regionId', 'property', 'value']),
      run: ({ regionId, property, value }) => {
        const actions = studioActions();
        const ensured = actions.ensureMergeSession();
        if (!ensured.ok) return ensured;
        const result = property === 'resolution' ? actions.resolveMergeRegion(regionId, value) : actions.setManualMergeText(regionId, value);
        if (!result.ok) return result;
        const session = useStudioStore.getState().mergeSession;
        const resolved = session?.regions.filter((region) => region.resolution).length || 0;
        return { updated: true, regionId, property, resolvedRegions: resolved, totalRegions: session?.regions.length || 0 };
      },
    },
    {
      name: 'editor_set_content', description: 'Set the manual merged text for a declared conflict region (switches the region to edit-manually).',
      inputSchema: schema({ objectType: stringEnum(['merge-region']), regionId: { type: 'string', minLength: 1 }, content: { type: 'string' } }, ['objectType', 'regionId', 'content']),
      run: ({ regionId, content }) => {
        const ensured = studioActions().ensureMergeSession();
        if (!ensured.ok) return ensured;
        const result = studioActions().setManualMergeText(regionId, content);
        return result.ok ? { updated: true, regionId } : result;
      },
    },
    {
      name: 'editor_switch_mode', description: 'Switch the visible studio mode (diff, compare-branches, blame, graph) or diff layout (split, unified).',
      inputSchema: schema({ mode: stringEnum(['split', 'unified', 'diff', 'compare-branches', 'blame', 'graph']) }, ['mode']),
      run: ({ mode }) => {
        const actions = studioActions();
        if (mode === 'split' || mode === 'unified') actions.setDiffView(mode);
        else actions.setActiveMode(mode);
        const state = useStudioStore.getState();
        return { mode, activeMode: state.activeMode, diffView: state.diffView };
      },
    },
    {
      name: 'editor_preview', description: 'Open the visible preview surface for a declared object type: the diff for a prompt version, the merge flow for a merge region, or the thread panel for an annotation anchor.',
      inputSchema: schema({ objectType: stringEnum(['prompt-version', 'merge-region', 'annotation-anchor']), lineStart: { type: 'integer', minimum: 1 } }, ['objectType']),
      run: ({ objectType, lineStart }) => {
        const actions = studioActions();
        const state = useStudioStore.getState();
        if (objectType === 'merge-region') {
          const ensured = actions.ensureMergeSession();
          if (!ensured.ok) return ensured;
          actions.setActiveMode('compare-branches');
          actions.setMergeFlowOpen(true);
          return { objectType, visible: true, surface: 'merge-flow' };
        }
        if (objectType === 'annotation-anchor') {
          const annotations = state.annotations[state.selectedPromptId] || [];
          const thread = annotations.find((item) => item.lineStart === lineStart) || annotations[0];
          if (!thread) return { ok: false, error: 'No annotation thread exists on the selected prompt to preview.' };
          actions.setThreadOpen(thread.annotationId);
          return { objectType, visible: true, surface: 'thread-panel', annotationId: thread.annotationId, lineStart: thread.lineStart, lineEnd: thread.lineEnd };
        }
        actions.setActiveMode('diff');
        return { objectType, visible: true, surface: 'diff', activeMode: useStudioStore.getState().activeMode };
      },
    },
    {
      name: 'browse_open', description: 'Open a bounded studio destination with visible navigation state: diff, compare-branches, blame, graph, history-list, or export.',
      inputSchema: schema({ destination: stringEnum(['diff', 'compare-branches', 'blame', 'graph', 'history-list', 'export']) }, ['destination']),
      run: ({ destination }) => {
        const actions = studioActions();
        if (destination === 'export') actions.setExportOpen(true);
        else if (destination === 'history-list') actions.setSidebarOpen(true);
        else actions.setActiveMode(destination);
        const state = useStudioStore.getState();
        return { destination, visible: true, activeMode: state.activeMode, exportOpen: state.exportOpen, sidebarOpen: state.sidebarOpen };
      },
    },
    {
      name: 'browse_search', description: 'Search the bounded prompt list (prompt-search) or every live prompt version (global-version-search) through the same handlers as the UI search fields.',
      inputSchema: schema({ filter: stringEnum(['prompt-search', 'global-version-search']), query: { type: 'string', maxLength: 500 } }, ['filter', 'query']),
      run: ({ filter, query }) => {
        const actions = studioActions();
        if (filter === 'prompt-search') {
          actions.setPromptQuery(query);
          const results = promptSearchResults(query);
          return { filter, query, visible: true, resultCount: results.length, results: results.slice(0, 10) };
        }
        actions.setGlobalSearchQuery(query);
        const results = versionSearchResults(query);
        return { filter, query, visible: true, resultCount: results.length, results: results.slice(0, 10) };
      },
    },
    {
      name: 'entity_create', description: 'Post an annotation thread (or extend an existing thread on the same line range) through the same AnnotationCreate handler as the composer.',
      inputSchema: schema({ entity: stringEnum(['annotation-thread']), lineStart: { type: 'integer', minimum: 1 }, lineEnd: { type: 'integer', minimum: 1 }, bodyMarkdown: { type: 'string', minLength: 1, maxLength: 4000 }, author: { type: 'string', minLength: 1, maxLength: 80 } }, ['entity', 'lineStart', 'lineEnd', 'bodyMarkdown', 'author']),
      run: ({ lineStart, lineEnd, bodyMarkdown, author }) => {
        if (Number(lineEnd) < Number(lineStart)) return { ok: false, error: 'lineEnd must be greater than or equal to lineStart.' };
        const result = studioActions().postAnnotation({ lineStart, lineEnd, bodyMarkdown, author });
        return result.ok ? { created: true, annotationId: result.annotationId, lineStart: result.lineStart, lineEnd: result.lineEnd, extendedExisting: result.extendedExisting } : result;
      },
    },
    {
      name: 'entity_update', description: 'Append an AnnotationReply to a declared annotation thread.',
      inputSchema: schema({ entity: stringEnum(['annotation-thread']), annotationId: { type: 'string', minLength: 1 }, field: stringEnum(['reply']), bodyMarkdown: { type: 'string', minLength: 1, maxLength: 4000 }, author: { type: 'string', minLength: 1, maxLength: 80 } }, ['entity', 'annotationId', 'field', 'bodyMarkdown']),
      run: ({ annotationId, bodyMarkdown, author }) => {
        const result = studioActions().replyToAnnotation(annotationId, bodyMarkdown, author || 'Mara Sol');
        return result.ok ? { updated: true, annotationId, replies: result.replies } : result;
      },
    },
    {
      name: 'entity_toggle', description: 'Toggle the resolved field of a declared annotation thread.',
      inputSchema: schema({ entity: stringEnum(['annotation-thread']), annotationId: { type: 'string', minLength: 1 }, field: stringEnum(['resolved']) }, ['entity', 'annotationId', 'field']),
      run: ({ annotationId }) => {
        const result = studioActions().toggleAnnotationResolved(annotationId);
        return result.ok ? { toggled: true, annotationId, resolved: result.resolved } : result;
      },
    },
    {
      name: 'artifact_export', description: 'Open the visible export surface at a declared artifact format.',
      inputSchema: schema({ format: stringEnum(['version-history-report', 'version-package', 'merged-prompt-text']) }, ['format']),
      run: ({ format }) => {
        const actions = studioActions();
        const tab = format === 'version-package' ? 'package' : format === 'merged-prompt-text' ? 'merged' : 'history';
        if (tab === 'merged' && !artifactForTab(useStudioStore.getState(), 'merged')) return { ok: false, error: 'merged-prompt-text is only available after a merge completes in this session.' };
        actions.setExportOpen(true);
        actions.setExportTab(tab);
        return { format, previewVisible: true, tab };
      },
    },
    {
      name: 'artifact_copy', description: 'Copy a declared artifact through the same browser clipboard workflow as the Copy button.',
      inputSchema: schema({ format: stringEnum(['version-history-report', 'version-package', 'merged-prompt-text']) }, ['format']),
      run: async ({ format }) => {
        const state = useStudioStore.getState();
        const tab = format === 'version-package' ? 'package' : format === 'merged-prompt-text' ? 'merged' : 'history';
        const content = artifactForTab(state, tab);
        if (tab === 'merged' && !content) return { ok: false, error: 'merged-prompt-text is only available after a merge completes in this session.' };
        try {
          await navigator.clipboard.writeText(content);
        } catch {
          const helper = document.createElement('textarea');
          helper.value = content; helper.style.position = 'fixed'; helper.style.opacity = '0';
          document.body.appendChild(helper); helper.select(); document.execCommand('copy'); helper.remove();
        }
        return { format, copied: true, bytes: new Blob([content]).size };
      },
    },
  ];
  const byName = new Map(tools.map((tool) => [tool.name, tool]));
  window.webmcp_session_info = () => ({
    contractVersion: 'zto-webmcp-v1',
    app: 'prompt-ledger-studio',
    modules: ['structured-editor-v1', 'browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
    editorObjectTypes: ['prompt-version', 'merge-region', 'annotation-anchor'],
    destinations: ['diff', 'compare-branches', 'blame', 'graph', 'history-list', 'export'],
    filters: ['prompt-search', 'global-version-search'],
    entity: 'annotation-thread',
    exportFormats: ['version-history-report', 'version-package', 'merged-prompt-text'],
    tools: tools.map((tool) => tool.name),
  });
  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = byName.get(name);
    if (!tool) return { ok: false, error: `Unknown WebMCP tool "${name}". Use webmcp_list_tools for the declared tool surface.` };
    try {
      return await tool.run(args || {});
    } catch (error) {
      return { ok: false, error: `${name} failed: ${error?.message || error}` };
    }
  };
}

// Register at module load so the contract surface exists even before React
// mounts (and survives any render-time error).
registerWebMCP();
