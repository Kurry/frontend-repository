import {
  PlantRecord
} from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (tool_name: string, arguments_dict: any) => Promise<any>;
    __appState: any;
  }
}

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-data-tracking-indoor-plant-growth-journal-provenance-atlas-rn-slack-canvas",
  capabilities: {
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  }
});

window.webmcp_list_tools = async () => ({
  tools: [
    {
      name: "entity_create_record",
      description: "Create a new plant record",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          species: { type: "string" },
          status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
          heightCm: { type: "number" },
          sourceEvidence: { type: "string" }
        },
        required: ["name", "species"]
      }
    },
    {
      name: "entity_select_record",
      description: "Select a plant record in the Provenance Atlas",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an existing plant record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          species: { type: "string" },
          status: { type: "string", enum: ["empty", "draft", "ready", "changed", "archived"] },
          heightCm: { type: "number" },
          sourceEvidence: { type: "string" },
          quarantined: { type: "boolean" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_delete_record",
      description: "Delete a plant record",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          confirm: { type: "boolean" }
        },
        required: ["id", "confirm"]
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Export the session to JSON",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Import a session from JSON",
      inputSchema: {
        type: "object",
        properties: {
          session: {
            type: "object"
          }
        },
        required: ["session"]
      }
    }
  ]
});

window.webmcp_invoke_tool = async (tool_name: string, arguments_dict: any) => {
  const app = window.__appState;
  if (!app) {
    throw new Error("Application state not available");
  }

  switch (tool_name) {
    case "entity_create_record": {
      const newId = `REC-${Date.now().toString().slice(-4)}`;
      const record: PlantRecord = {
        id: newId,
        name: arguments_dict.name,
        species: arguments_dict.species,
        status: arguments_dict.status || 'draft',
        heightCm: arguments_dict.heightCm || 0,
        sourceEvidence: arguments_dict.sourceEvidence || '',
        quarantined: false,
        notes: ''
      };
      app.handleAddRecord(record);
      return { success: true, record };
    }

    case "entity_select_record": {
      app.setAtlasState({ selectedRecordId: arguments_dict.id, mode: arguments_dict.id ? 'selected' : 'idle' });
      return { success: true };
    }

    case "entity_update_record": {
      const existing = app.records.find((r: PlantRecord) => r.id === arguments_dict.id);
      if (!existing) throw new Error("Record not found");
      const record: PlantRecord = {
        ...existing,
        ...arguments_dict
      };
      app.handleEditRecord(record);
      return { success: true, record };
    }

    case "entity_delete_record": {
      if (!arguments_dict.confirm) throw new Error("confirm=true required");
      app.setRecords((prev: PlantRecord[]) => {
        const oldRecord = prev.find(r => r.id === arguments_dict.id);
        app.setHistory((h: any) => [...h, {
          id: `EVT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'delete',
          recordId: arguments_dict.id,
          previousState: oldRecord
        }]);
        return prev.filter(r => r.id !== arguments_dict.id);
      });
      if (app.atlasState.selectedRecordId === arguments_dict.id) {
        app.setAtlasState({ selectedRecordId: null, mode: 'idle' });
      }
      return { success: true };
    }

    case "artifact_export_session_json": {
      const session = app.handleExport();
      return { success: true, artifact: session };
    }

    case "artifact_import_session_json": {
      app.handleImport(arguments_dict.session);
      return { success: true };
    }

    default:
      throw new Error(`Unknown tool: ${tool_name}`);
  }
};
