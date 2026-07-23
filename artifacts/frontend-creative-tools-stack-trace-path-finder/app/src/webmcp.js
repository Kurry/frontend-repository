import { useStore } from './store';

const sessionInfo = {
  tools: [
    'editor_select', 'editor_update_property', 'editor_preview', 'editor_set_content',
    'entity_create', 'entity_select', 'entity_delete', 'artifact_export', 'artifact_import', 'artifact_copy',
  ].map((name) => ({ name, description: `Stack trace ${name.replaceAll('_', ' ')}`, parameters: { type: 'object', properties: {}, required: [] } })),
};

window.webmcp_session_info = () => {
  return { contract_version: "zto-webmcp-v1", modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"] };
};

window.webmcp_list_tools = () => {
  return sessionInfo.tools.map((tool) => ({
    ...tool,
    module: tool.name.startsWith('entity_') ? 'entity-collection-v1' : tool.name.startsWith('artifact_') ? 'artifact-transfer-v1' : 'structured-editor-v1',
  }));
};

window.webmcp_invoke_tool = (toolName, argsInput) => {
  const args = typeof argsInput === 'string' ? JSON.parse(argsInput) : (argsInput || {});
  const store = useStore.getState();

  try {
    switch (toolName) {
      case 'editor_select':
        store.select(args.id ? { type: args.objectType || 'frame', id: args.id } : null);
        return { success: true, selection: useStore.getState().selection };
      case 'editor_update_property':
        // Bound properties: weight, pinned-node, collapsed (same handlers as the UI).
        if (args.property === 'weight' || args.property === 'weights') {
          store.updateFrame(args.id, { weight: args.value });
        } else if (args.property === 'pinned-node' || args.property === 'pinned') {
          store.mapCandidate(args.id, args.value);
        } else if (args.property === 'collapsed') {
          store.updateFrame(args.id, { collapsed: !!args.value });
        } else {
          throw new Error(`Unknown property: ${args.property}`);
        }
        return { success: true };
      case 'editor_preview': {
        const s = useStore.getState();
        return {
          success: true,
          frames: s.frames,
          path: s.path,
          valid: s.valid,
          contradictions: s.contradictions.map((c) => c.message),
          unresolvedFrameIds: s.unresolved.map((f) => f.id),
          minimalLocus: s.minimalLocus,
        };
      }
      case 'editor_set_content':
        store.setRawTrace(args.content);
        return { success: true };
      case 'entity_create': {
        const ok = store.saveHypothesis(args.name);
        const s = useStore.getState();
        if (!ok) return { success: false, error: 'Hypothesis limit reached (max 2). Delete one first.' };
        const hyp = s.hypotheses.find((h) => h.id === s.activeHypothesisId);
        return {
          success: true,
          id: s.activeHypothesisId,
          name: hyp?.name,
          'frame-count': hyp ? hyp.frames.length : 0,
          'path-status': hyp?.valid ? 'valid' : 'invalid',
        };
      }
      case 'entity_select':
        store.loadHypothesis(args.id);
        return { success: true };
      case 'entity_delete':
        if (args.confirm !== true) return { success: false, error: 'Delete requires confirm=true.' };
        store.deleteHypothesis(args.id);
        return { success: true };
      case 'artifact_export':
      case 'artifact_copy': {
        const s = useStore.getState();
        return {
          schemaVersion: "stack-path-hypothesis/v1",
          exportedAt: new Date().toISOString(),
          rawTraceText: s.rawTrace,
          frames: s.frames,
          path: s.path,
          hypotheses: s.hypotheses,
          annotations: s.annotations,
          valid: s.valid,
          unresolvedFrameIds: s.unresolved.map((f) => f.id),
        };
      }
      case 'artifact_import': {
        const payload = args.data || args.pack || args;
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        store.importSession(data);
        const s = useStore.getState();
        return { success: true, frameCount: s.frames.length, valid: s.valid, path: s.path };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};
