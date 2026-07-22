import { useStore } from './store';
import { exportArtifact, importArtifact } from './artifact';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (tool: string, args: any) => Promise<any>;
  }
}

export function initWebMCP() {
  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    task_id: "eval-intelligence/frontend-planning-emergency-drill-evacuation-planner-recovery-board-rn-canva-live-preview",
  });

  window.webmcp_list_tools = async () => {
    return [
      {
        name: "entity_create_record",
        description: "Create a new record",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            area: { type: "string" },
            description: { type: "string" }
          },
          required: ["title", "area"]
        }
      },
      {
        name: "entity_update_record",
        description: "Update an existing record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            area: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ['empty', 'draft', 'ready', 'changed', 'archived'] }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Delete an existing record",
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
        name: "entity_select_record",
        description: "Select a record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" }
          },
          required: ["id"]
        }
      },
      {
        name: "artifact_export_evacuation-drill-v1",
        description: "Export the session artifact",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "artifact_import_evacuation-drill-v1",
        description: "Import a session artifact",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "JSON string of the artifact" }
          },
          required: ["content"]
        }
      }
    ];
  };

  window.webmcp_invoke_tool = async (tool: string, args: any) => {
    const store = useStore.getState();

    switch (tool) {
      case "entity_create_record": {
        const { title, area, description } = args;
        store.createRecord({ title, area, description: description || '' });
        return { success: true };
      }

      case "entity_update_record": {
        const { id, title, area, description, status } = args;
        store.updateRecord(id, { title, area, description, status });
        return { success: true };
      }

      case "entity_delete_record": {
        const { id, confirm } = args;
        if (!confirm) return { success: false, error: 'Must pass confirm=true' };
        store.deleteRecord(id);
        return { success: true };
      }

      case "entity_select_record": {
        const { id } = args;
        store.selectForRecovery(id);
        return { success: true };
      }

      case "artifact_export_evacuation-drill-v1": {
        const json = exportArtifact();
        return { success: true, artifact: json };
      }

      case "artifact_import_evacuation-drill-v1": {
        const { content } = args;
        const res = importArtifact(content);
        return res;
      }

      default:
        throw new Error(`Unknown WebMCP tool: ${tool}`);
    }
  };
}
