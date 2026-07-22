import { useStore, SessionSchema } from './store';

window.webmcp_session_info = () => ({
  version: "zto-webmcp-v1",
  capabilities: {
    "structured-editor-v1": true,
    "entity-collection-v1": true,
    "artifact-transfer-v1": true
  }
});

const tools = [
  {
    name: "entity_create",
    description: "Create a new record",
    inputSchema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, capacity: { type: "number" } }, required: ["name"] }
  },
  {
    name: "entity_select",
    description: "Select a record",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
  },
  {
    name: "entity_update",
    description: "Update a record",
    inputSchema: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, capacity: { type: "number" }, status: { type: "string" } }, required: ["id"] }
  },
  {
    name: "entity_delete",
    description: "Delete a record",
    inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }
  },
  {
    name: "entity_toggle",
    description: "Toggle a record status",
    inputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" } }, required: ["id", "status"] }
  },
  {
    name: "editor_select",
    description: "Select a record in editor",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
  },
  {
    name: "editor_update_property",
    description: "Update property (position) of placed record",
    inputSchema: { type: "object", properties: { id: { type: "string" }, property: { type: "string", enum: ["position"] }, value: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] } }, required: ["id", "property", "value"] }
  },
  {
    name: "editor_switch_mode",
    description: "Switch mode",
    inputSchema: { type: "object", properties: { mode: { type: "string" } }, required: ["mode"] }
  },
  {
    name: "editor_set_content",
    description: "Set content",
    inputSchema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] }
  },
  {
    name: "editor_preview",
    description: "Preview derived state",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "artifact_export",
    description: "Export current session. Just clicks the download button.",
    inputSchema: { type: "object", properties: { format: { type: "string", enum: ["scenario-builder-v1-spatial-composer.json"] } }, required: ["format"] }
  },
  {
    name: "artifact_import",
    description: "Import session data.",
    inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["scenario-builder-v1-spatial-composer.json"] } }, required: ["mode"] }
  },
  {
    name: "artifact_copy",
    description: "Copy session data to clipboard.",
    inputSchema: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
  }
];

window.webmcp_list_tools = () => tools;

window.webmcp_invoke_tool = (toolName, args) => {
  const store = useStore.getState();

  switch (toolName) {
    case "entity_create":
      store.addRecord(args);
      return { success: true, result: store.records[store.records.length - 1] };

    case "entity_select":
    case "editor_select":
      store.selectRecord(args.id);
      return { success: true };

    case "entity_update":
      const { id, ...updates } = args;
      store.updateRecord(id, updates);
      return { success: true, result: store.records.find(r => r.id === id) };

    case "entity_delete":
      if (!args.confirm) return { success: false, error: "confirm=true required" };
      store.deleteRecord(args.id);
      return { success: true };

    case "entity_toggle":
      store.updateRecord(args.id, { status: args.status });
      return { success: true };

    case "editor_update_property":
      if (args.property === "position") {
        store.placeRecordInComposer(args.id, args.value);
        return { success: true, result: store.records.find(r => r.id === args.id) };
      }
      return { success: false, error: "Invalid property" };

    case "editor_switch_mode":
    case "editor_set_content":
      return { success: true }; // No-ops for these unused-but-declared operations

    case "editor_preview":
      return { success: true, result: store.getDerivedState() };

    case "artifact_export":
      const exportBtn = document.querySelector('button:has(svg.lucide-download)');
      if(exportBtn) exportBtn.click();
      return { success: true };

    case "artifact_import":
      const importBtn = document.querySelector('button:has(svg.lucide-upload)');
      if(importBtn) importBtn.click();
      return { success: true };

    case "artifact_copy":
      const sessionData = {
        schemaVersion: 'scenario-builder-v1',
        exportedAt: new Date().toISOString(),
        records: store.records,
        derived: store.getDerivedState(),
        history: store.history
      };

      const textarea = document.createElement('textarea');
      textarea.value = JSON.stringify(sessionData, null, 2);
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      return { success: true };

    default:
      return { success: false, error: "Tool not found" };
  }
};
