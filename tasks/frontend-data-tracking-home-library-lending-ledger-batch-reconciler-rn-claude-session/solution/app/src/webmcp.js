import { useStore } from './store';

// window.webmcp_session_info
export function getSessionInfo() {
  return {
    contract_version: "zto-webmcp-v1",
    capabilities: {
      "structured-editor-v1": {
        "editor_object_types": ["batch-reconciler"],
        "editor_operations": ["select", "update_property", "set_content"]
      },
      "entity-collection-v1": {
        "entity": "book",
        "entity_operations": ["create", "select", "update", "delete", "toggle"]
      },
      "artifact-transfer-v1": {
        "artifact_operations": ["export", "import", "copy"]
      }
    }
  };
}

// window.webmcp_list_tools
export function listTools() {
  return [
    {
      name: "entity_create",
      description: "Create a new book",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          status: { type: "string" }
        },
        required: ["title"]
      }
    },
    {
      name: "entity_update",
      description: "Update a book",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          updates: { type: "object" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "entity_delete",
      description: "Delete a book",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "entity_toggle",
      description: "Toggle selection of a book",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    },
    {
      name: "editor_set_content",
      description: "Batch reconcile selected books to a target status or undo",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["reconcile", "undo"] },
          targetStatus: { type: "string" }
        },
        required: ["action"]
      }
    },
    {
      name: "artifact_export",
      description: "Export the current session artifact",
      parameters: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import",
      description: "Import a session artifact",
      parameters: {
        type: "object",
        properties: {
          artifact: { type: "object" }
        },
        required: ["artifact"]
      }
    }
  ];
}

// window.webmcp_invoke_tool
export async function invokeTool(name, args) {
  const store = useStore.getState();

  try {
    switch (name) {
      case "entity_create":
        store.addBook({ id: Date.now().toString(), ...args });
        return { success: true, books: useStore.getState().books };

      case "entity_update":
        store.updateBook(args.id, args.updates);
        return { success: true, books: useStore.getState().books };

      case "entity_delete":
        store.deleteBook(args.id);
        return { success: true, books: useStore.getState().books };

      case "entity_toggle":
        store.toggleSelection(args.id);
        return { success: true, selectedBookIds: useStore.getState().selectedBookIds };

      case "editor_set_content":
        if (args.action === 'reconcile') {
          store.reconcileBatch(args.targetStatus);
        } else if (args.action === 'undo') {
          store.undoReconcile();
        }
        return { success: true, state: useStore.getState().batchReconcilerState };

      case "artifact_export":
        return { success: true, artifact: store.exportArtifact() };

      case "artifact_import":
        store.importArtifact(args.artifact);
        return { success: true, books: useStore.getState().books };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function initWebMCP() {
  window.webmcp_session_info = getSessionInfo;
  window.webmcp_list_tools = listTools;
  window.webmcp_invoke_tool = invokeTool;
}
