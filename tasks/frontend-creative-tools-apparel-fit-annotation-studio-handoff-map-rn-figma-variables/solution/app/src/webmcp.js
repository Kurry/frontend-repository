import { useStore } from './store.js';

export function setupWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    {
      name: "entity_create",
      description: "Create a record",
      parameters: { type: "object", properties: { entity: { type: "string" }, name: { type: "string" } }, required: ["entity", "name"] }
    },
    {
      name: "entity_delete",
      description: "Delete a record",
      parameters: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" } }, required: ["entity", "id"] }
    },
    {
      name: "entity_update",
      description: "Connect a record to a handoff owner",
      parameters: { type: "object", properties: { entity: { type: "string" }, id: { type: "string" }, owner: { type: "string" } }, required: ["entity", "id", "owner"] }
    },
    {
      name: "artifact_export",
      description: "Export session",
      parameters: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
    },
    {
      name: "artifact_import",
      description: "Import session",
      parameters: { type: "object", properties: { format: { type: "string" }, data: { type: "object" } }, required: ["format", "data"] }
    }
  ];

  window.webmcp_invoke_tool = (name, args) => {
    const store = useStore.getState();
    if (name === "entity_create") {
      store.addRecord({ id: Date.now().toString(), name: args.name, status: 'draft', owner: null });
      return { status: "success", message: "Record created" };
    }
    if (name === "entity_delete") {
      store.deleteRecord(args.id);
      return { status: "success", message: "Record deleted" };
    }
    if (name === "entity_update") {
      store.connectRecord(args.id, args.owner);
      return { status: "success", message: "Record updated" };
    }
    if (name === "artifact_export") {
      return { status: "success", data: store.exportSession() };
    }
    if (name === "artifact_import") {
      store.importSession(args.data);
      return { status: "success", message: "Session imported" };
    }
    return { status: "error", message: "Tool not found" };
  };
}
