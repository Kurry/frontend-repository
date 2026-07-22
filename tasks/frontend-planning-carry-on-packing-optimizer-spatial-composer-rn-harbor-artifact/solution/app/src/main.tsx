import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { usePackingStore } from './store'

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any>;
    webmcp_invoke_tool: (req: any) => Promise<any>;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// WebMCP Contracts
window.webmcp_session_info = async () => {
  return {
    "task_id": "eval-intelligence/frontend-planning-carry-on-packing-optimizer-spatial-composer-rn-provenance-artifact",
    "version": "1.0.0",
    "capabilities": ["entity-collection-v1", "artifact-transfer-v1"]
  };
};

window.webmcp_list_tools = async () => {
  return {
    tools: [
      {
        name: "entity_create_record",
        description: "Creates a new packing item record",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            weight: { type: "number" },
            volume: { type: "number" },
            status: { type: "string" },
            placed: { type: "boolean" }
          },
          required: ["name", "weight", "volume", "status"]
        }
      },
      {
        name: "entity_update_record",
        description: "Updates a packing item record",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            weight: { type: "number" },
            volume: { type: "number" },
            status: { type: "string" },
            placed: { type: "boolean" },
            x: { type: "number" },
            y: { type: "number" }
          },
          required: ["id"]
        }
      },
      {
        name: "entity_delete_record",
        description: "Deletes a packing item record",
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
        description: "Exports the session artifact",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "artifact_import_session_json",
        description: "Imports a session artifact",
        inputSchema: {
          type: "object",
          properties: {
            artifact: {
              type: "object",
              properties: {
                schemaVersion: { type: "string" },
                exportedAt: { type: "string" },
                records: { type: "array" },
                derived: { type: "object" },
                history: { type: "array" }
              }
            }
          },
          required: ["artifact"]
        }
      }
    ]
  };
};

window.webmcp_invoke_tool = async (req: any) => {
  const store = usePackingStore.getState();

  try {
    switch (req.name) {
      case 'entity_create_record':
        store.addItem({
          name: req.arguments.name,
          weight: req.arguments.weight,
          volume: req.arguments.volume,
          status: req.arguments.status,
          placed: req.arguments.placed || false
        });
        return { success: true };

      case 'entity_update_record':
        store.updateItem(req.arguments.id, req.arguments);
        return { success: true };

      case 'entity_delete_record':
        if (req.arguments.confirm) {
          store.deleteItem(req.arguments.id);
          return { success: true };
        }
        return { success: false, error: "Deletion not confirmed" };

      case 'artifact_export_session_json':
        return {
          success: true,
          artifact: {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: store.items,
            derived: store.getDerivedState(),
            history: store.pastActions
          }
        };

      case 'artifact_import_session_json':
        // Minimal validation, ExportImport component does thorough validation
        if (req.arguments.artifact.schemaVersion === 'v1') {
          req.arguments.artifact.exportedAt = new Date().toISOString();
          store.importArtifact(req.arguments.artifact);
          return { success: true };
        }
        return { success: false, error: "Invalid artifact format" };

      default:
        return { success: false, error: `Unknown tool: ${req.name}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
