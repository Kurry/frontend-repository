import { render } from 'solid-js/web';
import App from './App';
import './index.css';

window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: ["entity-collection-v1", "artifact-transfer-v1"]
});

window.webmcp_list_tools = () => [
  {
    name: "entity_create",
    description: "Create a new story node",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" }
      },
      required: ["title"]
    }
  },
  {
    name: "entity_select",
    description: "Select a story node",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "entity_update",
    description: "Update a story node",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        status: { type: "string", enum: ['empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'] }
      },
      required: ["id"]
    }
  },
  {
    name: "entity_delete",
    description: "Delete a story node",
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
    name: "artifact_export",
    description: "Export the artifact",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", enum: ["fiction-branches-v1-recovery-board.json"] }
      },
      required: ["format"]
    }
  },
  {
    name: "artifact_import",
    description: "Import the artifact",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["fiction-branches-v1-recovery-board.json"] },
        data: { type: "string" }
      },
      required: ["mode", "data"]
    }
  },
  {
    name: "artifact_copy",
    description: "Copy the artifact",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", enum: ["fiction-branches-v1-recovery-board.json"] }
      },
      required: ["format"]
    }
  }
];

window.webmcp_invoke_tool = async (name, args) => {
  if (name === "entity_create") {
     const id = Math.random().toString(36).substr(2, 9);
     const event = new CustomEvent('webmcp-entity-create', { detail: { ...args, id }});
     window.dispatchEvent(event);
     return { id, status: "created" };
  }
  if (name === "entity_select") {
     const event = new CustomEvent('webmcp-entity-select', { detail: args });
     window.dispatchEvent(event);
     return { status: "selected" };
  }
  if (name === "entity_update") {
     const event = new CustomEvent('webmcp-entity-update', { detail: args });
     window.dispatchEvent(event);
     return { status: "updated" };
  }
  if (name === "entity_delete") {
     const event = new CustomEvent('webmcp-entity-delete', { detail: args });
     window.dispatchEvent(event);
     return { status: "deleted" };
  }
  if (name === "artifact_export") {
     let resolveExport;
     const p = new Promise(r => resolveExport = r);
     const event = new CustomEvent('webmcp-artifact-export', { detail: { resolve: resolveExport }});
     window.dispatchEvent(event);
     const data = await p;
     return { status: "exported", data };
  }
  if (name === "artifact_import") {
     const event = new CustomEvent('webmcp-artifact-import', { detail: args });
     window.dispatchEvent(event);
     return { status: "imported" };
  }
  if (name === "artifact_copy") {
     return { status: "copied" };
  }
  throw new Error(`Tool not found: ${name}`);
};


render(() => <App />, document.getElementById('root'));
