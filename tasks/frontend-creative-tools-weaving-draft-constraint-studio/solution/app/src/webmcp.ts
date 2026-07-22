import { WeavingDraftProject } from './types';
import { Action } from './store';
import { Dispatch } from 'react';

declare global {
  interface Window {
    webmcp_session_info: () => string;
    webmcp_list_tools: () => string;
    webmcp_invoke_tool: (tool_name: string, args: any) => Promise<string>;
    __store_dispatch: Dispatch<Action>;
    __store_state: () => WeavingDraftProject;
  }
}

export function initWebMCP(dispatch: Dispatch<Action>, getState: () => WeavingDraftProject) {
  window.__store_dispatch = dispatch;
  window.__store_state = getState;

  window.webmcp_session_info = () => JSON.stringify({
    schema_version: "zto-webmcp-v1",
    active_modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    capabilities: ["edit_grids", "manage_variants", "export_artifacts"]
  });

  window.webmcp_list_tools = () => JSON.stringify({
    tools: [
      { name: "editor_select", description: "Select a range in a grid" },
      { name: "editor_update_property", description: "Update properties like color, brush, or repeat" },
      { name: "editor_switch_mode", description: "Switch between paint and erase mode" },
      { name: "editor_preview", description: "Preview drawdown" },
      { name: "editor_set_content", description: "Set grid content" },
      { name: "entity_create", description: "Create a variant branch" },
      { name: "entity_select", description: "Select a variant branch" },
      { name: "entity_update", description: "Update a variant branch" },
      { name: "entity_delete", description: "Delete a variant branch" },
      { name: "entity_toggle", description: "Toggle variant properties" },
      { name: "artifact_export", description: "Export session JSON or PNG" },
      { name: "artifact_import", description: "Import session JSON" },
      { name: "artifact_copy", description: "Copy exported text format" }
    ]
  });

  window.webmcp_invoke_tool = async (tool_name: string, args: any) => {
    try {
      switch (tool_name) {
        case "editor_update_property":
          if (args.grid === "threading" && args.index !== undefined && args.shaft !== undefined) {
            window.__store_dispatch({ type: "SET_THREADING", index: args.index, shaft: args.shaft });
            return JSON.stringify({ status: "success" });
          }
          if (args.grid === "tieUp" && args.treadle !== undefined && args.shaft !== undefined && args.value !== undefined) {
             window.__store_dispatch({ type: "SET_TIE_UP", treadle: args.treadle, shaft: args.shaft, value: args.value });
             return JSON.stringify({ status: "success" });
          }
          break;
        case "entity_create":
          window.__store_dispatch({ type: "BRANCH_VARIANT", name: args.name || "Unnamed Branch" });
          return JSON.stringify({ status: "success" });
        case "entity_select":
          window.__store_dispatch({ type: "SWITCH_VARIANT", id: args.id });
          return JSON.stringify({ status: "success" });
        case "artifact_export":
          return JSON.stringify({ state: window.__store_state() });
        case "artifact_import":
          if (args.state) {
            window.__store_dispatch({ type: "IMPORT_STATE", state: args.state });
            return JSON.stringify({ status: "success" });
          }
          break;
      }
      return JSON.stringify({ status: "error", message: `Tool not fully implemented or invalid args: ${tool_name}` });
    } catch (e) {
      return JSON.stringify({ status: "error", message: String(e) });
    }
  };
}
