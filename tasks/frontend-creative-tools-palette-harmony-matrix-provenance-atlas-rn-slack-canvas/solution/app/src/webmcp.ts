import { useStore, SessionSchema } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolName: string, args: any) => any;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    // Entity Collection
    {
      name: "entity_create",
      description: "Create a new color record",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, colorValue: { type: "string" } },
        required: ["name", "colorValue"]
      }
    },
    {
      name: "entity_select",
      description: "Select a color record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_update",
      description: "Update a color record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, colorValue: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete a color record",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"]
      }
    },
    // Structured Editor (Provenance)
    {
      name: "editor_select",
      description: "Select node in provenance atlas",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    },
    {
      name: "editor_update_property",
      description: "Update property in provenance atlas (quarantine)",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "string" } },
        required: ["id", "property", "value"]
      }
    },
    // Artifact Transfer
    {
      name: "artifact_export",
      description: "Export the session artifact",
      parameters: {
        type: "object",
        properties: { format: { type: "string", enum: ["palette-harmony-v1.json"] } },
        required: ["format"]
      }
    },
    {
      name: "artifact_import",
      description: "Import the session artifact",
      parameters: {
        type: "object",
        properties: { data: { type: "object" }, mode: { type: "string", enum: ["palette-harmony-v1.json"] } },
        required: ["data", "mode"]
      }
    }
  ];

  window.webmcp_invoke_tool = (toolName: string, args: any) => {
    const store = useStore.getState();

    try {
      switch (toolName) {
        // Entity Collection
        case 'entity_create':
          store.createRecord({
            name: args.name,
            colorValue: args.colorValue,
            status: 'draft',
            evidence: 'WebMCP created',
            lineage: 'good'
          });
          return { success: true, message: `Created record ${args.name}` };

        case 'entity_select':
          store.selectRecord(args.id);
          return { success: true, message: `Selected record ${args.id}` };

        case 'entity_update':
          store.updateRecord(args.id, {
            ...(args.name && { name: args.name }),
            ...(args.colorValue && { colorValue: args.colorValue })
          });
          return { success: true, message: `Updated record ${args.id}` };

        case 'entity_delete':
          if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
          store.deleteRecord(args.id);
          return { success: true, message: `Deleted record ${args.id}` };

        // Structured Editor
        case 'editor_select':
          store.selectRecord(args.id);
          return { success: true, message: `Selected node ${args.id} in editor` };

        case 'editor_update_property':
          if (args.property === 'quarantine-state' && args.value === 'quarantined') {
            store.quarantineLineage(args.id);
            return { success: true, message: `Quarantined lineage for ${args.id}` };
          }
          throw new Error(`Unsupported property update: ${args.property}`);

        // Artifact Transfer
        case 'artifact_export':
          return { success: true, artifact: store.exportSession() };

        case 'artifact_import': {
          const result = SessionSchema.safeParse(args.data);
          if (!result.success) throw new Error("Malformed schema or invalid bounds in import file");
          const sessionToImport = {
            ...result.data,
            exportedAt: new Date().toISOString()
          };
          store.importSession(sessionToImport);
          return { success: true, message: "Session imported successfully" };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };
}
