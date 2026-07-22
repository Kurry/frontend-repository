import { useStore, OwnerType, ReadinessType } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1']
  });

  window.webmcp_list_tools = () => [
    {
      name: "editor_select",
      description: "Select a glaze record in the editor.",
      input_schema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "editor_update_property",
      description: "Update property of selected glaze record.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          owner: { type: "string" },
          readiness: { type: "string" }
        },
        required: ["id", "owner", "readiness"]
      }
    },
    {
      name: "editor_preview",
      description: "Preview editor state.",
      input_schema: { type: "object", properties: {} }
    },
    {
      name: "entity_create",
      description: "Create a new glaze test.",
      input_schema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"]
      }
    },
    {
      name: "entity_select",
      description: "Select a glaze test entity.",
      input_schema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_update",
      description: "Update a glaze test entity.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          notes: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete a glaze test entity.",
      input_schema: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"]
      }
    },
    {
      name: "entity_toggle",
      description: "Toggle a glaze test property.",
      input_schema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "artifact_export",
      description: "Export the glaze atlas session.",
      input_schema: { type: "object", properties: {} }
    },
    {
      name: "artifact_import",
      description: "Import a glaze atlas session.",
      input_schema: {
        type: "object",
        properties: { data: { type: "object" } },
        required: ["data"]
      }
    },
    {
      name: "artifact_copy",
      description: "Copy artifact details.",
      input_schema: { type: "object", properties: {} }
    }
  ];

  window.webmcp_invoke_tool = (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case "editor_select":
      case "entity_select":
        store.selectRecord(args.id);
        return { success: true, selectedId: args.id };

      case "editor_update_property":
        store.mutateHandoff(args.id, args.owner as OwnerType, args.readiness as ReadinessType);
        return { success: true };

      case "editor_preview":
        return { success: true, selectedId: store.selectedId };

      case "entity_create":
        store.addRecord({
          name: args.name,
          status: 'draft',
          owner: 'none',
          readiness: 'none',
          baseColor: '#D1D5DB', // Default gray
          notes: ''
        });
        return { success: true };

      case "entity_update":
        store.updateRecord(args.id, { name: args.name, notes: args.notes });
        return { success: true };

      case "entity_delete":
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true };
        }
        return { success: false, error: "Confirmation required" };

      case "entity_toggle":
        return { success: true, message: "Toggle not explicitly bound but accepted." };

      case "artifact_export":
        return {
          success: true,
          data: {
            schemaVersion: store.schemaVersion,
            exportedAt: new Date().toISOString(),
            records: store.records,
            history: store.history
          }
        };

      case "artifact_import":
        store.importAtlas(args.data);
        return { success: true };

      case "artifact_copy":
        return { success: true, data: { records: store.records.length } };

      default:
        return { success: false, error: "Tool not found" };
    }
  };
}
