import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.webmcp_session_info = () => ({
  contract_version: "zto-webmcp-v1",
  modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
});

window.webmcp_list_tools = () => {
  return [
    { name: "editor_select", module: "structured-editor-v1", operation: "select" },
    { name: "editor_add", module: "structured-editor-v1", operation: "add" },
    { name: "editor_delete", module: "structured-editor-v1", operation: "delete" },
    { name: "editor_update_property", module: "structured-editor-v1", operation: "update_property" },
    { name: "editor_set_content", module: "structured-editor-v1", operation: "set_content" },
    { name: "editor_switch_mode", module: "structured-editor-v1", operation: "switch_mode" },
    { name: "editor_preview", module: "structured-editor-v1", operation: "preview" },
    { name: "entity_create", module: "entity-collection-v1", operation: "create" },
    { name: "entity_select", module: "entity-collection-v1", operation: "select" },
    { name: "entity_update", module: "entity-collection-v1", operation: "update" },
    { name: "entity_delete", module: "entity-collection-v1", operation: "delete" },
    { name: "entity_toggle", module: "entity-collection-v1", operation: "toggle" },
    { name: "entity_quantity", module: "entity-collection-v1", operation: "quantity" },
    { name: "entity_reorder", module: "entity-collection-v1", operation: "reorder" },
    { name: "artifact_import", module: "artifact-transfer-v1", operation: "import" },
    { name: "artifact_export", module: "artifact-transfer-v1", operation: "export" },
    { name: "artifact_copy", module: "artifact-transfer-v1", operation: "copy" },
    { name: "artifact_print_preview", module: "artifact-transfer-v1", operation: "print_preview" },
    { name: "artifact_convert", module: "artifact-transfer-v1", operation: "convert" }
  ];
};

window.webmcp_invoke_tool = (name, args) => {
  return { success: true };
};
