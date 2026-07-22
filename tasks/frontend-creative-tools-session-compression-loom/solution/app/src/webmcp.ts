import { state, setState } from './store';

declare global {
  interface Window {
    webmcp_session_info?: () => any;
    webmcp_list_tools?: () => any;
    webmcp_invoke_tool?: (tool: string, args: any) => any;
  }
}

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "artifact-transfer-v1"]
  });

  const tools = [
    {
      name: "editor_select",
      description: "Select a capsule in the editor",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      name: "editor_update_property",
      description: "Update a capsule property",
      parameters: { type: "object", properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } }, required: ["id", "property", "value"] }
    },
    {
      name: "editor_add",
      description: "Add a new capsule from selected range",
      parameters: { type: "object", properties: {}, required: [] }
    },
    {
      name: "editor_preview",
      description: "Preview the session",
      parameters: { type: "object", properties: {}, required: [] }
    },
    {
      name: "artifact_export",
      description: "Export the session pack",
      parameters: { type: "object", properties: {}, required: [] }
    },
    {
      name: "artifact_import",
      description: "Import a session pack",
      parameters: { type: "object", properties: { payload: { type: "object" } }, required: ["payload"] }
    }
  ];

  window.webmcp_list_tools = () => tools;

  window.webmcp_invoke_tool = (tool: string, args: any) => {
    switch (tool) {
      case "editor_select":
        setState('selectedCapsuleId', args.id);
        return { status: "success" };
      case "editor_update_property":
        if (args.property === 'title' || args.property === 'variant') {
           setState('capsules', (c) => c.id === args.id, args.property, args.value);
        }
        return { status: "success" };
      case "editor_add":
        if (state.selectedRange) {
          const newCapsule = {
            id: `capsule-${Date.now()}`,
            title: 'New Summary',
            startId: state.selectedRange.start,
            endId: state.selectedRange.end,
            variant: 'concise' as const,
            includedFacts: [],
            omittedFacts: [],
          };
          setState('capsules', (prev) => [...prev, newCapsule]);
          setState('selectedRange', null);
          return { status: "success", capsuleId: newCapsule.id };
        }
        return { status: "error", message: "No range selected" };
      case "editor_preview":
        return { status: "success", preview_state: "visible" };
      case "artifact_export":
        return {
          status: "success",
          artifact: {
            schemaVersion: "compressed-session-pack/v1",
            exportedAt: new Date().toISOString(),
            cap: state.cap,
            capsules: JSON.parse(JSON.stringify(state.capsules))
          }
        };
      case "artifact_import":
        if (args.payload?.schemaVersion === "compressed-session-pack/v1") {
          setState('capsules', args.payload.capsules || []);
          if (args.payload.cap) setState('cap', args.payload.cap);
          return { status: "success" };
        }
        return { status: "error", message: "Invalid schema" };
      default:
        return { status: "error", message: "Unknown tool" };
    }
  };
}
