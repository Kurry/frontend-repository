import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if (typeof window !== 'undefined') {
  ;(window as any).webmcp_session_info = () => ({
    name: "podcast-episode-assembly-board-webmcp",
    version: "1.0.0",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  ;(window as any).webmcp_list_tools = () => [
    { name: "insert_instance", description: "Insert a clip into timeline" },
    { name: "delete_instance", description: "Delete a clip from timeline" },
    { name: "approve", description: "Approve the cut" },
    { name: "export_data", description: "Export the cut payload" }
  ];

  ;(window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = useStore.getState();
    try {
      switch (toolName) {
        case 'insert_instance':
          store.insertInstance(args.sourceId, args.lane, args.start);
          return { status: "success", result: "Instance inserted" };
        case 'delete_instance':
          store.deleteInstance(args.id);
          return { status: "success", result: "Instance deleted" };
        case 'approve':
          store.approve();
          return { status: "success", result: "Approved" };
        case 'export_data':
          return { status: "success", result: store.exportData() };
        default:
          return { status: "error", message: `Tool not found: ${toolName}` };
      }
    } catch (e: any) {
      return { status: "error", message: e.message };
    }
  };
}
