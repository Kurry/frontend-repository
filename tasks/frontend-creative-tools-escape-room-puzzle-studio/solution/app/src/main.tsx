import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// WebMCP Contract Implementation
if (typeof window !== 'undefined') {
  (window as any).webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: [
      "structured-editor-v1",
      "entity-collection-v1",
      "artifact-transfer-v1"
    ]
  });

  (window as any).webmcp_list_tools = () => [
    {
      module: "structured-editor-v1",
      name: "editor_select",
      description: "Select an object.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      module: "structured-editor-v1",
      name: "editor_add",
      description: "Add an object.",
      parameters: { type: "object", properties: { type: { type: "string" } }, required: ["type"] }
    },
    {
      module: "structured-editor-v1",
      name: "editor_delete",
      description: "Delete an object.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      module: "structured-editor-v1",
      name: "editor_update_property",
      description: "Update property.",
      parameters: { type: "object", properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } }, required: ["id", "property", "value"] }
    },
    {
      module: "structured-editor-v1",
      name: "editor_switch_mode",
      description: "Switch editor mode.",
      parameters: { type: "object", properties: { mode: { type: "string" } }, required: ["mode"] }
    },
    {
      module: "entity-collection-v1",
      name: "entity_create",
      description: "Create an entity.",
      parameters: { type: "object", properties: { type: { type: "string" } }, required: ["type"] }
    },
    {
      module: "entity-collection-v1",
      name: "entity_select",
      description: "Select an entity.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    },
    {
      module: "artifact-transfer-v1",
      name: "artifact_export",
      description: "Export artifact.",
      parameters: { type: "object", properties: { format: { type: "string" } }, required: ["format"] }
    },
    {
      module: "artifact-transfer-v1",
      name: "artifact_import",
      description: "Import artifact.",
      parameters: { type: "object", properties: { content: { type: "string" }, format: { type: "string" } }, required: ["content", "format"] }
    }
  ];

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    console.log(`Invoking tool ${name} with args:`, args);
    return { success: true };
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
