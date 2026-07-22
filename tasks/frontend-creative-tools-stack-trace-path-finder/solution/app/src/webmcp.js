import { useStore } from './store';

const sessionInfo = {
  schemaVersion: "stack-path-hypothesis/v1",
  tools: [
    {
      name: "editor_select",
      description: "Select an object",
      parameters: { type: "object", properties: { id: { type: "string" }, type: { type: "string" } } }
    },
    {
      name: "editor_update_property",
      description: "Update property",
      parameters: { type: "object", properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } } }
    },
    {
      name: "editor_preview",
      description: "Preview state",
      parameters: { type: "object", properties: {} }
    },
    {
      name: "editor_set_content",
      description: "Set content",
      parameters: { type: "object", properties: { content: { type: "string" } } }
    },
    {
      name: "entity_create",
      description: "Create hypothesis",
      parameters: { type: "object", properties: { name: { type: "string" } } }
    },
    {
      name: "entity_select",
      description: "Select hypothesis",
      parameters: { type: "object", properties: { id: { type: "string" } } }
    },
    {
      name: "entity_delete",
      description: "Delete hypothesis",
      parameters: { type: "object", properties: { id: { type: "string" } } }
    },
    {
      name: "artifact_export",
      description: "Export artifact",
      parameters: { type: "object", properties: { format: { type: "string" } } }
    },
    {
      name: "artifact_import",
      description: "Import artifact",
      parameters: { type: "object", properties: { data: { type: "object" } } }
    },
    {
      name: "artifact_copy",
      description: "Copy artifact",
      parameters: { type: "object", properties: { format: { type: "string" } } }
    }
  ]
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
        return { success: true };
      case 'editor_update_property':
        if (args.property === 'weights') {
          store.updateFrame(args.id, { weight: args.value });
        } else if (args.property === 'pinned') {
          store.mapCandidate(args.id, args.value);
        }
        return { success: true };
      case 'editor_preview':
        return { success: true, frames: store.frames, path: store.path, valid: store.valid };
      case 'editor_set_content':
        store.setRawTrace(args.content);
        return { success: true };
      case 'entity_create':
        store.saveHypothesis(args.name);
        return { success: true, id: store.activeHypothesisId };
      case 'entity_select':
        store.loadHypothesis(args.id);
        return { success: true };
      case 'entity_delete':
        store.deleteHypothesis(args.id);
        return { success: true };
      case 'artifact_export':
      case 'artifact_copy':
        return {
          schemaVersion: "stack-path-hypothesis/v1",
          exportedAt: new Date().toISOString(),
          rawTraceText: store.rawTrace,
          frames: store.frames,
          path: store.path,
          hypotheses: store.hypotheses,
        };
      case 'artifact_import':
        store.importSession(args.data);
        return { success: true };
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};
