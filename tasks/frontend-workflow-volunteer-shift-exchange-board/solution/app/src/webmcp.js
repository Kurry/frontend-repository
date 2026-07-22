import { store } from './store'
import { addEdge, removeEdge, sendProposal, setResponse, reviseProposal, approveAndCommit, rollback } from './store/exchangeSlice'

window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1"
});

window.webmcp_list_tools = () => {
  return [
    { id: "editor_select", module: "structured-editor-v1" },
    { id: "editor_add", module: "structured-editor-v1" },
    { id: "editor_delete", module: "structured-editor-v1" },
    { id: "editor_update_property", module: "structured-editor-v1" },
    { id: "editor_set_content", module: "structured-editor-v1" },
    { id: "editor_switch_mode", module: "structured-editor-v1" },
    { id: "editor_preview", module: "structured-editor-v1" },
    { id: "entity_create", module: "entity-collection-v1" },
    { id: "entity_select", module: "entity-collection-v1" },
    { id: "entity_update", module: "entity-collection-v1" },
    { id: "entity_delete", module: "entity-collection-v1" },
    { id: "entity_toggle", module: "entity-collection-v1" },
    { id: "artifact_export", module: "artifact-transfer-v1" },
    { id: "artifact_import", module: "artifact-transfer-v1" },
    { id: "artifact_copy", module: "artifact-transfer-v1" }
  ]
};

window.webmcp_invoke_tool = (toolId, args) => {
  try {
    if (toolId === "editor_add") {
      store.dispatch(addEdge(args));
      return { success: true };
    }
    if (toolId === "editor_delete") {
      store.dispatch(removeEdge(args.index));
      return { success: true };
    }
    if (toolId === "editor_switch_mode") {
      if (args.mode === 'sent') store.dispatch(sendProposal());
      else if (args.mode === 'draft') store.dispatch(reviseProposal());
      else if (args.mode === 'committed') store.dispatch(approveAndCommit({ simulateFailure: false }));
      else if (args.mode === 'failed') store.dispatch(approveAndCommit({ simulateFailure: true }));
      else if (args.mode === 'rolled-back') store.dispatch(rollback());
      return { success: true };
    }
    if (toolId === "editor_update_property") {
      if (args.property === 'response') {
         store.dispatch(setResponse(args.value));
         return { success: true };
      }
    }
    if (toolId === "artifact_export") {
      return { success: true, preview: store.getState().exchange.status };
    }

    return { success: true, note: "Tool registered but operation logic minimal for scope" };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
