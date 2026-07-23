import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if (typeof window !== 'undefined') {
  ;(window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "structured-editor-v1", "command-session-v1", "artifact-transfer-v1"]
  });

  const tools = [
    ["entity.create", "entity-collection-v1", "Create a timeline instance from a bounded source range."],
    ["entity.select", "entity-collection-v1", "Select an existing timeline instance."],
    ["entity.update", "entity-collection-v1", "Update bounded timeline-instance fields."],
    ["entity.delete", "entity-collection-v1", "Delete a timeline instance with explicit confirmation."],
    ["entity.toggle", "entity-collection-v1", "Toggle a transcript token or approval state."],
    ["entity.reorder", "entity-collection-v1", "Move an instance by a bounded integer offset."],
    ["editor.select", "structured-editor-v1", "Select an editor object."],
    ["editor.add", "structured-editor-v1", "Add a timeline instance, citation, or branch cut."],
    ["editor.delete", "structured-editor-v1", "Delete a timeline instance."],
    ["editor.update_property", "structured-editor-v1", "Update a declared editor property."],
    ["editor.switch_mode", "structured-editor-v1", "Switch to a declared workspace mode."],
    ["editor.preview", "structured-editor-v1", "Preview the current cut package."],
    ["session.start", "command-session-v1", "Start the deterministic validation run on its visible branch checkpoint."],
    ["session.pause", "command-session-v1", "Pause is not available for deterministic fixture runs."],
    ["session.resume", "command-session-v1", "Resume is not available for deterministic fixture runs."],
    ["session.stop", "command-session-v1", "Stop is not available for deterministic fixture runs."],
    ["session.restart", "command-session-v1", "Restart the render workflow."],
    ["session.advance", "command-session-v1", "Advance or retry the render workflow."],
    ["artifact.export", "artifact-transfer-v1", "Export the current package in a declared format."],
    ["artifact.import", "artifact-transfer-v1", "Import canonical podcast package JSON."],
    ["artifact.copy", "artifact-transfer-v1", "Return canonical package JSON for the visible copy workflow."]
  ];
  ;(window as any).webmcp_list_tools = () => tools.map(([name, module, description]) => ({ name, module, description }));

  ;(window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = useStore.getState();
    try {
      switch (toolName) {
        case 'entity.create':
        case 'editor.add':
          store.insertInstance(String(args.sourceId), args.lane, Number(args.start));
          return { ok: true, operation: toolName, type: 'timeline-instance' };
        case 'entity.select':
        case 'editor.select':
          return { ok: store.instances.some(item => item.id === args.id), operation: toolName, id: args.id };
        case 'entity.update':
          store.updateInstance(String(args.id), args.updates || {});
          return { ok: true, operation: toolName, id: args.id };
        case 'editor.update_property':
          store.updateInstance(String(args.id), { [String(args.property)]: args.value });
          return { ok: true, operation: toolName, id: args.id, property: args.property };
        case 'entity.delete':
        case 'editor.delete':
          if (args.confirm !== true) return { ok: false, error: 'confirm=true is required' };
          store.deleteInstance(String(args.id));
          return { ok: true, operation: toolName, id: args.id };
        case 'entity.reorder':
          store.rippleMove(String(args.id), Number(args.offset));
          return { ok: true, operation: toolName, id: args.id };
        case 'entity.toggle':
          if (args.field === 'citation') store.fixCitation(String(args.id));
          else if (args.field === 'approval') store.approveCategory(args.category || 'master');
          else return { ok: false, error: 'field must be citation or approval' };
          return { ok: true, operation: toolName, field: args.field };
        case 'editor.switch_mode':
          return { ok: false, operation: toolName, error: 'Workspace tabs remain visible-control navigation' };
        case 'editor.preview':
        case 'artifact.export':
        case 'artifact.copy':
          store.generateExportOutputs();
          return { ok: true, operation: toolName, format: args.format || 'canonical-json', artifact: useStore.getState().exportDataOutputs.json };
        case 'artifact.import':
          if (args.mode !== 'canonical-json' || typeof args.data !== 'string') return { ok: false, error: 'mode canonical-json and string data are required' };
          store.importData(args.data);
          return { ok: true, operation: toolName, mode: args.mode };
        case 'session.start':
          store.branchCut('validation-run');
          return { ok: true, operation: toolName, branch: useStore.getState().branch };
        case 'session.restart':
          store.branchCut('main');
          store.render();
          return { ok: true, operation: toolName, branch: useStore.getState().branch, renderStatus: useStore.getState().renderPipeline.status };
        case 'session.advance':
          if (store.renderPipeline.status === 'failed') {
            store.retryRender();
          } else {
            store.render();
          }
          return { ok: true, operation: toolName, renderStatus: useStore.getState().renderPipeline.status };
        case 'session.pause':
        case 'session.resume':
        case 'session.stop':
          return { ok: false, operation: toolName, error: 'Deterministic fixture runs complete atomically' };
        default:
          return { ok: false, error: `Tool not found: ${toolName}` };
      }
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  };
}
